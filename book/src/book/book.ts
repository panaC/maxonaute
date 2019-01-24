import url_ = require("url");
import { BOOK_URL, BROWSERLESS, WISHE_URL } from "../constants";
import { Browser } from "./Browser";
import { ME } from "./me.json";
import { wishes } from "./wishes";

export enum Ebook {
  booked,
  alreadyBooked,
  noTgvmaxAvailable,
  error,
}

export async function book(id: string, bro: Browser): Promise<Ebook> {
  // const url: string = (config as any).proposition.url;
  const url: string = BOOK_URL;
  try {
    const page = await bro.page(url + id + "#!/", null, (request) => {
      const state = url_.parse(request.url(), true).host.includes("oui.sncf");
      if ((request.resourceType() === "xhr" && state) ||
        (request.resourceType() === "script" && state) ||
        (request.resourceType() === "fetch" && state) ||
        (request.resourceType() === "other" && state) ||
        request.resourceType() === "document" && state) {
        request.continue();
      } else {
        request.abort();
      }
    });
    await page.waitForSelector("div.popContent", { timeout: 3000 });
    await page.$eval("div.popContent", (el) => {
      el.outerHTML = "";
    });
    await page.waitForSelector("div.proposal.has-tgvmax", { timeout: 3000 });
    const select = await page.$$eval("div.proposal.has-tgvmax", (el) => {
      // select the right tgv-max in the list
      // select only the first because the departure time of train wished is set at departureTime in the search
      if (el.length) {
        el[0].querySelector("button").click();
        return true;
        // in the futur check if the time is right
      } else {
        // throw new Error("No tgvmax available");
        return false;
      }
    });
    if (!select) {
      return Ebook.noTgvmaxAvailable;
    }
    await page.waitForSelector("div.proposal-details", { timeout: 3000 });
    await page.waitForSelector("div.proposal-details div.submit-col button", { timeout: 3000 });
    await page.$eval("div.proposal-details div.submit-col", (el) => {
      el.querySelector("button").click();
    });
    try {
      await page.waitForSelector("div.notificationsArea span", { timeout: 3000 });
      const notif = await page.$eval("div.notificationsArea", (el) => {
        if (el.innerText && el.innerText !== "") {
          return true;
        }
        return false;
      });
      if (notif) {
        // error already booked trip
        return Ebook.alreadyBooked;
      }
    } catch {
      page.waitFor(3000);
      // mettre au panier
      await page.waitForSelector("div.services-card__button button", { timeout: 3000 });
      await page.$eval("div.services-card__button", (el) => {
        el.querySelector("button").click();
      });
      page.waitFor(3000);
      // confirmer
      await page.waitForSelector("div.cart-page__cta button", { timeout: 3000 });
      await page.$eval("div.cart-page__cta button", (el) => {
        el.click();
      });
      page.waitFor(10000);
      // fill the information field only if not fill
      await page.waitForSelector("div.vsf-form__button button", { timeout: 30000 });
      await page.$eval("div.vsf-form__button button", (el) => {
        el.click();
      });
      page.waitFor(3000);
      // reserved ticket
      await page.screenshot({ path: "resa.png", fullPage: true });
      await page.close();
    }
  } catch (e) {
    console.error(e);
  }
  return Ebook.booked;
}

if (require.main === module) {
  const bro = new Browser(BROWSERLESS.browserless_ip, BROWSERLESS.browserless_port, null, "1366x768");
  const spec = ME;
  spec.mainJourney.origin.code = "CODE";
  spec.mainJourney.destination.code = "CODE";
  spec.schedule.outward = "DATE";
  spec.passengers[0].discountCard.number = "HCCODE";
  spec.passengers[0].discountCard.dateOfBirth = "01/01/2001";
  wishes(WISHE_URL, spec).then((url) => {
    book(url, bro).then((e) => {
      console.log("done", Ebook[e]);
    }).catch((e) => {
      console.error(e);
    });
  });
}
