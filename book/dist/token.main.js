"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const check_1 = require("./check");
if (require.main === module) {
    const check = new check_1.Check();
    check.getToken().then((data) => {
        console.log(data);
    }).catch((err) => {
        console.error(err);
    });
}
//# sourceMappingURL=token.main.js.map