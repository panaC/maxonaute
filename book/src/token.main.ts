import { Check } from "./check/check";

if (require.main === module) {
    const check = new Check();
    check.getToken().then((data) => {
        console.log(data);
    }).catch((err) => {
        console.error(err);
    });
}
