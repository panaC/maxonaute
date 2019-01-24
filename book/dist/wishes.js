"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const wishesConfig = __importStar(require("./wishes.json"));
const constants_1 = require("./constants");
function wishes(url, json) {
    return new Promise((resolve, reject) => {
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
exports.wishes = wishes;
if (require.main === module) {
    wishes(constants_1.WISHE_URL, wishesConfig.default).then((data) => {
        console.log(data);
    }).catch((err) => {
        console.error(err);
    });
}
//# sourceMappingURL=wishes.js.map