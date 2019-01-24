import { Check } from "./check";

if (require.main === module) {
    const check = new Check();
    setInterval(() => {
        check.run().then(() => {
            console.log("check");
        }).catch((err) => {
            console.error(err);
        });
    }, 10 * 1000);
}
