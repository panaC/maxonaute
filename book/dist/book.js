"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_ = require("url");
const Browser_1 = require("./Browser");
const config = __importStar(require("./config.json"));
const wishes_1 = require("./wishes");
const constants_1 = require("./constants");
const wishJson = __importStar(require("./wishes.json"));
var Ebook;
(function (Ebook) {
    Ebook[Ebook["booked"] = 0] = "booked";
    Ebook[Ebook["alreadyBooked"] = 1] = "alreadyBooked";
    Ebook[Ebook["noTgvmaxAvailable"] = 2] = "noTgvmaxAvailable";
    Ebook[Ebook["error"] = 3] = "error";
})(Ebook = exports.Ebook || (exports.Ebook = {}));
function book(id, bro) {
    return __awaiter(this, void 0, void 0, function* () {
        // const url: string = (config as any).proposition.url;
        const url = "https://www.oui.sncf/proposition/?wishId=";
        try {
            const page = yield bro.page(url + id + "#!/", null, (request) => {
                const state = url_.parse(request.url(), true).host.includes("oui.sncf");
                if ((request.resourceType() === "xhr" && state) ||
                    (request.resourceType() === "script" && state) ||
                    (request.resourceType() === "fetch" && state) ||
                    (request.resourceType() === "other" && state) ||
                    request.resourceType() === "document" && state) {
                    request.continue();
                }
                else {
                    request.abort();
                }
            });
            yield page.waitForSelector("div.popContent", { timeout: 3000 });
            yield page.$eval("div.popContent", (el) => {
                el.outerHTML = "";
            });
            yield page.waitForSelector("div.proposal.has-tgvmax", { timeout: 3000 });
            const select = yield page.$$eval("div.proposal.has-tgvmax", (el) => {
                // select the right tgv-max in the list
                // select only the first because the departure time of train wished is set at departureTime in the search
                if (el.length) {
                    el[0].querySelector("button").click();
                    return true;
                    // in the futur check if the time is right
                }
                else {
                    // throw new Error("No tgvmax available");
                    return false;
                }
            });
            if (!select) {
                return Ebook.noTgvmaxAvailable;
            }
            yield page.waitForSelector("div.proposal-details", { timeout: 3000 });
            yield page.waitForSelector("div.proposal-details div.submit-col button", { timeout: 3000 });
            yield page.$eval("div.proposal-details div.submit-col", (el) => {
                el.querySelector("button").click();
            });
            try {
                yield page.waitForSelector("div.notificationsArea span", { timeout: 3000 });
                const notif = yield page.$eval("div.notificationsArea", (el) => {
                    if (el.innerText && el.innerText !== "") {
                        return true;
                    }
                    return false;
                });
                if (notif) {
                    // error already booked trip
                    return Ebook.alreadyBooked;
                }
            }
            catch (_a) {
                page.waitFor(3000);
                // mettre au panier
                yield page.waitForSelector("div.services-card__button button", { timeout: 3000 });
                yield page.$eval("div.services-card__button", (el) => {
                    el.querySelector("button").click();
                });
                page.waitFor(3000);
                // confirmer
                yield page.waitForSelector("div.cart-page__cta button", { timeout: 3000 });
                yield page.$eval("div.cart-page__cta button", (el) => {
                    el.click();
                });
                page.waitFor(10000);
                // fill the information field only if not fill
                yield page.waitForSelector("div.vsf-form__button button", { timeout: 30000 });
                yield page.$eval("div.vsf-form__button button", (el) => {
                    el.click();
                });
                page.waitFor(3000);
                // reserved ticket
                yield page.screenshot({ path: "resa.png", fullPage: true });
                yield page.close();
            }
        }
        catch (e) {
            console.error(e);
        }
        return Ebook.booked;
    });
}
exports.book = book;
if (require.main === module) {
    const conf = config.puppeteer;
    const bro = new Browser_1.Browser(conf.browserless_ip, conf.browserless_port, null, "1366x768");
    wishes_1.wishes(constants_1.WISHE_URL, wishJson.default).then((url) => {
        book(url, bro).then((e) => {
            console.log("done", Ebook[e]);
        }).catch((e) => {
            console.error(e);
        });
    });
}
//# sourceMappingURL=book.js.map