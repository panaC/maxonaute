import request = require("request");
import { WISHE_URL } from "../constants";
import { ME } from "./me.json";

export function wishes(url: string, json: any) {
  return new Promise<string>((resolve, reject) => {
    request.post(url, {
      method: "post",
      body: JSON.stringify(json),
      headers: {
        "Content-Type": "application/json",
      },
    }, (err, rep, body) => {
      if (err) {
        reject(err);
      }
      if (typeof JSON.parse(body).id === "string") {
        resolve(JSON.parse(body).id);
      }
      reject("error id returned, " + body);
    });
  });
}

if (require.main === module) {
  const spec = ME;
  spec.mainJourney.origin.code = "CODE";
  spec.mainJourney.destination.code = "CODE";
  spec.schedule.outward = "DATE";
  spec.passengers[0].discountCard.number = "HCCODE";
  spec.passengers[0].discountCard.dateOfBirth = "01/01/2001";
  wishes(WISHE_URL, spec).then((data) => {
    console.log(data);
  }).catch((err) => {
    console.error(err);
  });
}
