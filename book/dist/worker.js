"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const amqp = require("amqplib/callback_api");
const Browser_1 = require("./Browser");
const book_1 = require("./book");
const wishes_1 = require("./wishes");
const me_json_1 = require("./me.json");
function worker() {
    let bro = null;
    amqp.connect(constants_1.RABBIT_MQ_URI, (errConnect, conn) => {
        if (!errConnect) {
            conn.createChannel((errChannel, ch) => {
                if (!errChannel) {
                    const q = constants_1.QUEUE_NAME;
                    ch.assertQueue(q, { durable: true });
                    ch.prefetch(1);
                    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
                    ch.consume(q, (msg) => {
                        console.log(" [x] Received %s", msg.content.toString());
                        const param = JSON.parse(msg.content.toString());
                        me_json_1.ME.mainJourney.origin.code = param.originCode;
                        me_json_1.ME.mainJourney.destination.code = param.destinationCode;
                        me_json_1.ME.schedule.outward = param.departureDateTime;
                        bro = new Browser_1.Browser(constants_1.BROWSERLESS.browserless_ip, constants_1.BROWSERLESS.browserless_port, null, "1366x768");
                        wishes_1.wishes(constants_1.WISHE_URL, me_json_1.ME).then((url) => {
                            book_1.book(url, bro).then((e) => {
                                ch.ack(msg);
                                console.log("done", book_1.Ebook[e]);
                            }).catch((e) => {
                                console.error(e);
                            });
                        });
                    }, {
                        noAck: false,
                    });
                }
            });
        }
    });
}
exports.worker = worker;
//# sourceMappingURL=worker.js.map