import AsyncQueue from "./index.js";

const enums = {
    RESOLVED: "resolved",
    REJECTED: "rejected",
    TIMEOUT: "Request timed out",
    INPUTREQUIRED: "input is required",
    MAXRETRIES: "max retries reached",
};
const typeErrMessage = (type) => `input must be a ${type}`;

const maxConcurrentRuns = 3;
const defaultMaxConcurrentRuns = 5;
let concurrentRuns = 0;
let queue;

const testAsync = (shouldResolve, callback) => {
    return async () => {
        concurrentRuns++;
        if (callback) {
            callback();
        }
        return new Promise((resolve, reject) => {
            setTimeout(
                shouldResolve ? resolve : reject,
                200,
                shouldResolve ? enums.RESOLVED : enums.REJECTED,
            );
        });
    };
};

describe("AsyncQueue class", () => {
    beforeEach(() => {
        queue = new AsyncQueue();
        concurrentRuns = 0;
    });
    afterEach(() => {
        queue = null;
    });

    test("should throw Type error when wrong type is passed to constructor", () => {
        const typeErr = () => {
            new AsyncQueue("dsf");
        };
        expect(typeErr).toThrow(typeErrMessage("number"));
    });

    test("should return resolution for successful promise resolution", (done) => {
        queue.add(testAsync(true), async (res, err) => {
            try {
                expect(res).toEqual(enums.RESOLVED);
                expect(err).toBeNull();
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    test("should return rejection for unsuccessful promise resolution", (done) => {
        queue.add(testAsync(false), async (res, err) => {
            try {
                expect(err).toEqual(enums.REJECTED);
                expect(res).toBeNull();
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    describe("timeout", () => {
        test("should return an error when input is wrong type or no input is provided to setPromiseTimeout", () => {
            const typeErr = () => {
                queue.setPromiseTimeout("sdf");
            };
            const noInputErr = () => {
                queue.setPromiseTimeout();
            };
            expect(typeErr).toThrow(typeErrMessage("number"));
            expect(noInputErr).toThrow(enums.INPUTREQUIRED);
        });

        test("should return a timeout error if a timeout is set and promise took longer than timeout", (done) => {
            queue.setPromiseTimeout(100);

            queue.add(testAsync(true), async (res, err) => {
                try {
                    expect(err).toEqual(enums.TIMEOUT);
                    expect(res).toBeNull();
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });

        test("should resolve if a timeout is set and promise resolved before timeout", (done) => {
            queue.setPromiseTimeout(400);

            queue.add(testAsync(true), async (res, err) => {
                try {
                    expect(res).toEqual(enums.RESOLVED);
                    expect(err).toBeNull();
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });

    describe("concurrency", () => {
        test("should return an error when input is wrong type or no input is provided to setMaxConcurrency", () => {
            const typeErr = () => {
                queue.setMaxConcurrency("sdf");
            };
            const noInputErr = () => {
                queue.setMaxConcurrency();
            };
            expect(typeErr).toThrow(typeErrMessage("number"));
            expect(noInputErr).toThrow(enums.INPUTREQUIRED);
        });

        test(`should only run ${defaultMaxConcurrentRuns} max concurrent promises by default`, (done) => {
            const testruncount = 10;

            for (let i = 0; i < testruncount; i++) {
                queue.add(testAsync(true), () => {
                    concurrentRuns--;
                    try {
                        expect(concurrentRuns).toBeLessThan(defaultMaxConcurrentRuns);
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            }
        });

        test(`should only run ${maxConcurrentRuns} max concurrent promises by when specified from constructor`, (done) => {
            const testruncount = 7;
            queue = new AsyncQueue(maxConcurrentRuns);

            for (let i = 0; i < testruncount; i++) {
                queue.add(testAsync(true), () => {
                    concurrentRuns--;
                    try {
                        expect(concurrentRuns).toBeLessThan(maxConcurrentRuns);
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            }
        });

        test(`should only run ${maxConcurrentRuns} max concurrent promises by when specified`, (done) => {
            const testruncount = 7;
            queue.setMaxConcurrency(maxConcurrentRuns);

            for (let i = 0; i < testruncount; i++) {
                queue.add(testAsync(true), () => {
                    concurrentRuns--;
                    try {
                        expect(concurrentRuns).toBeLessThan(maxConcurrentRuns);
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            }
        });
    });
    describe("retry on error", () => {
        test("should return an error when input is wrong type or no input is provided to setMaxRetries", () => {
            const typeErr = () => {
                queue.setRetries("sdf");
            };
            const noInputErr = () => {
                queue.setRetries();
            };
            expect(typeErr).toThrow(typeErrMessage("number"));
            expect(noInputErr).toThrow(enums.INPUTREQUIRED);
        });

        test("should not retry on error if maxRetries are not specified", (done) => {
            let runCount = 0;
            const counter = () => {
                runCount++;
            };
            queue.add(testAsync(false, counter), (res, err) => {
                try {
                    expect(runCount).toEqual(1);
                    expect(err).toEqual(enums.REJECTED);
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });

        test("should retry on error if maxRetries are specified for the specified amount of times", (done) => {
            let runCount = 0;
            const retries = 3;
            queue.setRetries(retries);
            const counter = () => {
                runCount++;
            };
            queue.add(testAsync(false, counter), (res, err) => {
                console.log(err);
                try {
                    expect(res).toBeNull();
                    expect(runCount).toEqual(retries);
                    expect(err.message).toEqual(enums.MAXRETRIES);
                    expect(err.cause).toEqual([
                        enums.REJECTED,
                        enums.REJECTED,
                        enums.REJECTED,
                    ]);
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });
});
