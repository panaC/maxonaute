"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Browser_1 = require("./Browser");
const config = __importStar(require("./config.json"));
if (require.main === module) {
    // tslint:disable-next-line:no-console
    const conf = config.puppeteer;
    const bro = new Browser_1.Browser(conf.browserless_ip, conf.browserless_port, null, "1366x768");
    const page = bro.page("https://www.google.fr", 1000);
    try {
        page.then((pagePromise) => {
            pagePromise.emulateMedia("screen").then(() => {
                pagePromise.pdf({ path: "page.pdf" }).then(() => {
                    pagePromise.close();
                }).catch((e) => {
                    console.error(e);
                });
            }).catch((e) => {
                console.error(e);
            });
        }).catch((e) => {
            console.error(e);
        });
    }
    catch (e) {
        console.error(e);
    }
}
//# sourceMappingURL=index.js.map