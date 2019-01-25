// here check new tgv max in function of request

// request "https://simulateur.tgvmax.fr/VSC/#/1/ANGERS%20ST%20LAUD/PARIS%20(intramuros)"
// set the origin and destination -> no needed
// get the token with regexp `input id=\”hiddenToken`
// request with post
// https://sncf-simulateur-api-prod.azurewebsites.net/api/RailAvailability/Search/ANGERS%20ST%20LAUD/PARIS%20(intramuros)/2018-12-09T00:00:00/2018-12-09T23:59:59
// set the origin and destination and date-time
// check if for the right time this train is available to tgvmax
// When is available send a message to message queue "RabbitMQ"

// Loop on this sequence every 60secondes

// Input1 : Request the own api to get all ticket has checked
// Input1 : Loop on each ticket line and extract json information like Origin and destination and departureDate
// Input to checkers : The line exctract bellow with Origin and destination string and date of departure Date
// Output : Send to message queue the available ticket

import amqp = require("amqplib/callback_api");
import request = require("request");
import { API_URL, AUTH_PASS_API, QUEUE_NAME, RABBIT_MQ_URI, TGV_MAX_API, TOKEN_URL } from "../constants";
import toISOStringLocal from "../date";

interface ITicket {
    origin: string;
    originCode: string;
    destination: string;
    destinationCode: string;
    departureDateTime: Date;
    hccode: string;
    dateOfBirth: string;
}

interface Itrain {
    "originCode": string;
    "originName": string;
    "destinationCode": string;
    "destinationName": string;
    "departureDateTime": string;
    "arrivalDateTime": string;
    "train": string;
    "availableSeatsCount": number;
}

// Check class : Polling the MAX API and seek for an available sitting place.
export class Check {
    private qName: string;
    private mq: Promise<amqp.Channel>;
    private token: string;

    //
    // Create the RabbitMq Channel and create connection
    constructor() {
        this.qName = QUEUE_NAME;
        this.mq = new Promise<amqp.Channel>((resolve, reject) => {
            amqp.connect(RABBIT_MQ_URI, (errCo, connection) => {
                if (errCo === null && connection) {
                    connection.createChannel((errCh, channel) => {
                        if (errCh === null && channel) {
                            resolve(channel);
                        } else {
                            reject("Error channel RabbitMq");
                        }
                    });
                } else {
                    reject("Error connection RabbitMq");
                }
            });
        });
    }

    // public fct
    // Launch the API polling and spread to compute fct to ticket check
    public run(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            request.get(`${API_URL}?credential=${AUTH_PASS_API}`, {
                headers: {},
            }, (err, rep, body) => {
                if (err === null && rep && rep.statusCode === 200) {
                    this.compute(body).then(() => {
                        resolve();
                    }).catch((errCa) => {
                        reject(errCa);
                    });
                } else {
                    if (err) { reject("run error " + JSON.stringify(err)); } else {
                        reject("run error " + rep.statusCode);
                    }
                }
            });
        });
    }

    // public fct
    // Get the specific token generate in HTML
    // you have needeed of this token for call the API MAX
    public getToken(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            request(TOKEN_URL, (err, rep, body) => {
                if (err === null && rep && rep.statusCode === 200) {
                    if (/input.*id="hiddenToken".*value=\"(.*)\"/g.exec(body)) {
                        resolve(/input.*id="hiddenToken".*value=\"(.*)\"/g.exec(body)[1]);
                    }
                } else {
                    if (err) { reject("getToken error " + JSON.stringify(err)); } else {
                        reject("getToken error " + rep.statusCode);
                    }
                }
            });
        });
    }

    // private fct
    // For each tickets books on the application back-end, check the max API for seek an available sitting place
    private async compute(body: any) {
        const data: ITicket[] = JSON.parse(body);
        // let train: Itrain = null;
        console.log(data);
        
        if (data.length) {
            try {
                this.token = await this.getToken();
                await data.forEach(async (element, index) => {
                    try {
                        // element.departureDate = new Date(element.departureDate);
                        // train = await this.seatCount(element);
                        if (await this.seatCount(element)) {
                            console.log("seat available");
                            await this.setTask(element);
                            await this.delTask(element);
                            // console.log(train);
                        }
                    } catch (e) {
                        console.error("Error in ticket handle", e);
                    }
                });
            } catch (e) {
                // throw new Error("Compute error " + e);
                console.error("Computer error", e);
            }
        }
    }

    // private fct
    // when the place is available : send spec to MQ channel for booking the ticket on SNCF website
    private setTask(data: ITicket): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.mq.then((channel) => {
                channel.assertQueue(this.qName, { durable: true });
                channel.sendToQueue(this.qName, Buffer.from(JSON.stringify(data)), { persistent: true });
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }


    // private fct
    // When the ticket spec is send to MQ, we can delete on the apllication API Back-end, this ticket in waiting to book
    private delTask(data: ITicket): Promise<void> {
        return new Promise((resolve, reject) => {
            request.del(`${API_URL}?credential=${AUTH_PASS_API}`, {
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }, (err, rep) => {
                if (err === null && rep && rep.statusCode === 200) {
                    resolve();
                } else {
                    if (err) { reject("delTask error " + JSON.stringify(err)); } else {
                        reject("delTask error " + rep.statusCode);
                    }
                }
            });
        });
    }


    // private fct
    // Call the MAX API with the right ticket spec for checking if a sitting place is available to book
    private seatCount(data: ITicket): Promise<boolean> {
        const url = TGV_MAX_API +
                encodeURI(data.origin) + "/" +
                encodeURI(data.destination) + "/" +
                toISOStringLocal(new Date(data.departureDateTime)) + "/" +
                toISOStringLocal(new Date(data.departureDateTime));
                console.log(url);
                
        return new Promise((resolve, reject) => {
            request.get(url, {
                    headers: {
                        "ValidityToken": this.token,
                        "Content-Type": "application/json",
                    },
                }, (err, rep, body) => {
                    if (err === null && rep && rep.statusCode === 200) {
                        const extract: Itrain[] = JSON.parse(body);
                        console.log(extract);
                        for (const el of extract) {
                            if (el.availableSeatsCount) {
                                resolve(true);
                            }
                        }
                        resolve(false);
                    } else {
                        if (err) { reject("seatCount error " + JSON.stringify(err)); } else {
                            reject("seatCount error " + rep.statusCode);
                        }
                    }
                });
        });
    }

    // private fct
    // Convert date to UTC format
    private dateConvert(date: string): string {
        const d = new Date(date);
        console.log(date, d);
        return new Date(Date.UTC(d.getFullYear(),
            d.getMonth(),
            d.getDay(),
            d.getHours(),
            d.getMinutes(),
            d.getSeconds())).toISOString();
    }

}

// Check Main for test only, see check.main.ts
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
