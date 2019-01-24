"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
class Browser {
    /**
     * Browser constructor
     * @param blessIp browserless ip
     * @param blessPort browserless port
     * @param proxy browserless proxy
     * @param dimScreen screen dimmension "1366x768"
     */
    constructor(blessIp, blessPort, proxy, dimScreen) {
        let line = "ws://" + blessIp + ":" + blessPort + "?";
        if (proxy) {
            line += "&--proxy-server=" + proxy;
        }
        if (dimScreen) {
            line += "&--window-size=" + dimScreen;
        }
        // '&--no-sandbox=true' +
        // '&--disable-setuid-sandbox=true' +
        // '&--disable-dev-shm-usage=true' +
        // '&--disable-accelerated-2d-canvas=true' +
        // '&--disable-gpu=true',
        this.browser = puppeteer_1.default.connect({
            browserWSEndpoint: line,
        });
        // this.browser = puppeteer.launch({ headless: false });
    }
    /**
     * Create a new browserless page
     * @param url page url
     * @param delay Waits for a certain amount of time before resolving in milliseconds
     * @param request requests rules for the page
     */
    page(url, delay, request) {
        return __awaiter(this, void 0, void 0, function* () {
            const brow = yield this.browser;
            const page = yield brow.newPage();
            if (request) {
                page.setRequestInterception(true);
                page.on("request", request);
            }
            yield page.goto(url, {
                waitUntil: "networkidle2",
            });
            if (delay) {
                yield page.waitFor(delay);
            }
            return page;
        });
    }
}
exports.Browser = Browser;
//# sourceMappingURL=Browser.js.map