"use strict";
// here check new tgv max in function of request
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
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
// ToDo :
//
// Remplacer toute ces fct par une classe unique
// Faire des fct de test
const amqp = require("amqplib/callback_api");
const request = require("request");
const constants_1 = require("./constants");
class Check {
    constructor() {
        this.qName = constants_1.QUEUE_NAME;
        this.mq = new Promise((resolve, reject) => {
            amqp.connect(constants_1.RABBIT_MQ_URI, (err, connection) => {
                if (err === null && connection) {
                    connection.createChannel((err, channel) => {
                        if (err === null && channel) {
                            resolve(channel);
                        }
                        else {
                            reject("Error channel RabbitMq");
                        }
                    });
                }
                else {
                    reject("Error connection RabbitMq");
                }
            });
        });
    }
    run() {
        return new Promise((resolve, reject) => {
            request.get(constants_1.API_URL, {
                headers: {},
            }, (err, rep, body) => {
                if (err === null && rep && rep.statusCode === 200) {
                    this.compute(body).then(() => {
                        resolve();
                    }).catch((err) => {
                        reject(err);
                    });
                }
                else {
                    if (err) {
                        reject("run error " + JSON.stringify(err));
                    }
                    else {
                        reject("run error " + rep.statusCode);
                    }
                }
            });
        });
    }
    getToken() {
        return new Promise((resolve, reject) => {
            request(constants_1.TOKEN_URL, (err, rep, body) => {
                if (err === null && rep && rep.statusCode === 200) {
                    if (/input.*id="hiddenToken".*value=\"(.*)\"/g.exec(body)) {
                        resolve(/input.*id="hiddenToken".*value=\"(.*)\"/g.exec(body)[1]);
                    }
                }
                else {
                    if (err) {
                        reject("getToken error " + JSON.stringify(err));
                    }
                    else {
                        reject("getToken error " + rep.statusCode);
                    }
                }
            });
        });
    }
    compute(body) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = JSON.parse(body);
            let train = null;
            if (data.length) {
                try {
                    this.token = yield this.getToken();
                    yield data.forEach((element, index) => __awaiter(this, void 0, void 0, function* () {
                        try {
                            element.departureDate = new Date(element.departureDate);
                            train = yield this.seatCount(element);
                            if (train !== null) {
                                yield this.setTask(train);
                                yield this.delTask(train);
                                console.log(train);
                            }
                        }
                        catch (e) {
                            console.error("Error in ticket handle", e);
                        }
                    }));
                }
                catch (e) {
                    // throw new Error("Compute error " + e);
                    console.error("Computer error", e);
                }
            }
        });
    }
    setTask(data) {
        return new Promise((resolve, reject) => {
            this.mq.then((channel) => {
                channel.assertQueue(this.qName, { durable: true });
                channel.sendToQueue(this.qName, Buffer.from(JSON.stringify(data)), { persistent: true });
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }
    delTask(data) {
        console.log(this.dateConvert(data.departureDateTime), new Date(this.dateConvert(data.departureDateTime)).toISOString(), data.departureDateTime);
        return new Promise((resolve, reject) => {
            request.del(constants_1.API_URL, {
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    origin: encodeURI(data.originName),
                    destination: encodeURI(data.destinationName),
                    departureDate: new Date(this.dateConvert(data.departureDateTime)).toISOString(),
                }),
            }, (err, rep) => {
                if (err === null && rep && rep.statusCode === 200) {
                    resolve();
                }
                else {
                    if (err) {
                        reject("delTask error " + JSON.stringify(err));
                    }
                    else {
                        reject("delTask error " + rep.statusCode);
                    }
                }
            });
        });
    }
    seatCount(data) {
        let ret = null;
        return new Promise((resolve, reject) => {
            request.get(constants_1.TGV_MAX_API +
                data.origin + "/" +
                data.destination + "/" +
                data.departureDate.toISOString() + "/" +
                data.departureDate.toISOString(), {
                headers: {
                    "ValidityToken": this.token,
                    "Content-Type": "application/json",
                },
            }, (err, rep, body) => {
                if (err === null && rep && rep.statusCode === 200) {
                    const extract = JSON.parse(body);
                    resolve(((arr) => {
                        if (arr.length) {
                            arr.forEach((element) => {
                                if (element.availableSeatsCount) {
                                    ret = element;
                                }
                            });
                        }
                        return ret;
                    })(extract));
                }
                else {
                    if (err) {
                        reject("seatCount error " + JSON.stringify(err));
                    }
                    else {
                        reject("seatCount error " + rep.statusCode);
                    }
                }
            });
        });
    }
    dateConvert(date) {
        const d = new Date(date);
        console.log(date, d);
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDay(), d.getHours(), d.getMinutes(), d.getSeconds())).toISOString();
    }
}
exports.Check = Check;
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
/*
export function bookTicket(qName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        request.get(API_URL, {
            headers: {},
        }, (err, rep, body) => {
            if (err) {
                reject(err);
            }
            if (rep && rep.statusCode === 200) {
                const data: Iticket[] = JSON.parse(body);
                if (data.length) {
                    getToken().then((token) => {
                        data.forEach((element, index) => {
                            availableSeatCount(
                                element.origin,
                                element.destination,
                                new Date(element.departureDate),
                                token).then((train) => {
                                    if (train !== null) {
                                        setTask(train, qName).then(() => {
                                            delTask(train).then(() => {
                                                if (index === data.length - 1) {
                                                    resolve();
                                                }
                                            }).catch((errDel) => {
                                                console.error(errDel);
                                            });
                                        }).catch((errTask) => {
                                            console.error(errTask);
                                        });
                                    } else {
                                        // train not available to booking
                                        resolve();
                                    }
                                }).catch((errSeatCount) => {
                                    console.error(errSeatCount);
                                });
                        });
                    }).catch((errToken) => {
                        console.error(errToken);
                    });
                } else {
                    resolve();
                }
            }
        });
    });
}

export function getToken(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        request(TOKEN_URL, (err, rep, body) => {
            if (err) {
                reject(err);
            }
            if (rep && rep.statusCode === 200) {
                if (/input.*id="hiddenToken".*value=\"(.*)\"/g.exec(body)) {
                    resolve(/input.*id="hiddenToken".*value=\"(.*)\"/g.exec(body)[1]);
                }
            }
            reject("bad statusCode " + rep.statusCode);
        });
    });
}

export function availableSeatCount(origin: string, destination: string, date: Date, token: string): Promise<Itrain> {
    return new Promise((resolve, reject) => {
        request.get(TGV_MAX_API +
            origin + "/" + destination + "/" + date.toISOString() + "/" + date.toISOString(), {
                headers: {
                    "ValidityToken": token,
                    "Content-Type": "application/json",
                },
            }, (err, rep, body) => {
                if (err) {
                    reject(err);
                }
                if (rep && rep.statusCode === 200) {
                    const data: Itrain[] = JSON.parse(body);
                    if (data.length) {
                        data.forEach((element) => {
                            if (element.availableSeatsCount) {
                                resolve(element);
                            }
                        });
                    }
                    resolve(null);
                }
                reject("bad status code " + rep.statusCode);
            });
    });
}

export function setTask(data: Itrain, qName: string): Promise<void> {

    return new Promise((resolve, reject) => {
        amqp.connect(RABBIT_MQ_URI, (errConnect, conn) => {
            if (!errConnect) {
                conn.createChannel((errChannel, ch) => {
                    if (!errChannel) {
                        ch.assertQueue(qName, { durable: true });
                        ch.sendToQueue(qName, Buffer.from(JSON.stringify(data)) { persistent: true });
                        resolve();
                    } else {
                        reject("Error channel " + errChannel);
                    }
                });
            } else {
                reject("Error connect " + errConnect);
            }
        });
    });
}

export function delTask(data: Itrain): Promise<void> {
    return new Promise((resolve, reject) => {
        request.del(API_URL, {
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                origin: encodeURI(data.originName),
                destination: encodeURI(data.destinationName),
                departureDate: new Date(data.departureDateTime + "Z").toISOString(),
            }),
        }, (err, rep) => {
            if (err === null && rep && rep.statusCode === 200) {
                resolve();
            }
            if (err === )
                reject("delTask error");
        });
    });
}

*/
/*
if (require.main === module) {
    setInterval(() => {
        bookTicket(QUEUE_NAME).then((data) => {
            console.log(data);
        }).catch((err) => {
            console.error(err);
        });
    }, INTERVAL * 1000);
}
*/
//# sourceMappingURL=check.js.map