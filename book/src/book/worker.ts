import amqp = require("amqplib/callback_api");
import { BROWSERLESS, QUEUE_NAME, RABBIT_MQ_URI, WISHE_URL } from "../constants";
import { book, Ebook } from "./book";
import { Browser } from "./Browser";
import { ME } from "./me.json";
import { wishes } from "./wishes";
import toISOStringLocal from "../date";

export function worker(): void {
    let bro: Browser = null;
    amqp.connect(RABBIT_MQ_URI, (errConnect, conn) => {
        if (!errConnect) {
            conn.createChannel((errChannel, ch) => {
                if (!errChannel) {
                    const q = QUEUE_NAME;
                    ch.assertQueue(q, { durable: true });
                    ch.prefetch(1);
                    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
                    ch.consume(q, (msg) => {
                        console.log(" [x] Received %s", msg.content.toString());
                        const param = JSON.parse(msg.content.toString());
                        const spec = ME;
                        spec.mainJourney.origin.code = param.originCode;
                        spec.mainJourney.destination.code = param.destinationCode;
                        spec.schedule.outward = toISOStringLocal(new Date(param.departureDateTime)).split(".")[0];
                        spec.passengers[0].discountCard.number = param.hccode;
                        spec.passengers[0].discountCard.dateOfBirth = param.dateOfBirth;
                        bro = new Browser(BROWSERLESS.browserless_ip, BROWSERLESS.browserless_port, null, "1366x768");
                        wishes(WISHE_URL, spec).then((url) => {
                          book(url, bro).then((e) => {
                            ch.ack(msg);
                            console.log("done", Ebook[e]);
                          }).catch((e) => {
                            console.error(e);
                          });
                        }).catch((err) => {
                            throw new Error(err);
                        });
                    }, {
                        noAck: false,
                    });
                }
            });
        }
    });
}
