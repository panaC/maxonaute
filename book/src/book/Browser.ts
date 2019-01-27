import puppeteer from "puppeteer";

export class Browser {
  private browser: Promise<puppeteer.Browser>;
  /**
   * Browser constructor
   * @param blessIp browserless ip
   * @param blessPort browserless port
   * @param proxy browserless proxy
   * @param dimScreen screen dimmension "1366x768"
   */
  constructor(blessIp: string, blessPort: string, proxy?: string, dimScreen?: string) {
    let line: string = "ws://" + blessIp + ":" + blessPort + "?";
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
    // this.browser = puppeteer.connect({
    //   browserWSEndpoint: line,
    // });
    this.browser = puppeteer.launch({ headless: true });
  }
  /**
   * Create a new browserless page
   * @param url page url
   * @param delay Waits for a certain amount of time before resolving in milliseconds
   * @param request requests rules for the page
   */
  public async page(url: string, delay?: number, request?: (request: puppeteer.Request) => void) {
    const brow = await this.browser;
    const page = await brow.newPage();
    if (request) {
      page.setRequestInterception(true);
      page.on("request", request);
    }
    await page.goto(url, {
      waitUntil: "networkidle2",
    });
    if (delay) {
      await page.waitFor(delay);
    }
    return page;
  }
}
