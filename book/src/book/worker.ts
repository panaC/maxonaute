import amqp = require("amqplib/callback_api");
import { BROWSERLESS, QUEUE_NAME, RABBIT_MQ_URI, WISHE_URL } from "../constants";
import { book, Ebook } from "./book";
import { Browser } from "./Browser";
import { ME } from "./me.json";
import { wishes } from "./wishes";

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
                        ME.mainJourney.origin.code = param.originCode;
                        ME.mainJourney.destination.code = param.destinationCode;
                        ME.schedule.outward = param.departureDateTime;

                        bro = new Browser(BROWSERLESS.browserless_ip, BROWSERLESS.browserless_port, null, "1366x768");
                        wishes(WISHE_URL, ME).then((url) => {
                          book(url, bro).then((e) => {
                            ch.ack(msg);
                            console.log("done", Ebook[e]);
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
