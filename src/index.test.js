import AsyncQueue, { abortHandler } from "./index.js";

const enums = {
    RESOLVED: "resolved",
    REJECTED: "rejected",
    ABORT: "Aborted",
    INPUTREQUIRED: "input is required",
    MAXRETRIES: "max retries reached",
};

const typeErrMessage = (type, passedType) =>
    `input must be a ${type}, but got ${passedType}`;

const maxConcurrentRuns = 3;
let concurrentRuns = 0;
let queue;

const testAsync = (
    shouldResolve,
    callback,
    shouldUseSignal = false,
    promiseCallback,
) => {
    return async (signal) => {
        concurrentRuns++;
        if (callback) {
            callback();
        }
        return new Promise((resolve, reject) => {
            if (shouldUseSignal) {
                abortHandler(signal, reject);
            }
            if (promiseCallback) {
                promiseCallback(resolve, reject);
            }

            setTimeout(
                shouldResolve ? resolve : reject,
                100,
                shouldResolve ? enums.RESOLVED : enums.REJECTED,
            );
        });
    };
};
const beforeFunc = () => {
    queue = new AsyncQueue();
    concurrentRuns = 0;
};
const afterFunc = () => {
    queue = null;
};

describe("AsyncQueue class", () => {
    beforeEach(beforeFunc);
    afterEach(afterFunc);

    test("should throw Type error when wrong type is passed to config", () => {
        const typeErr = () => {
            return new AsyncQueue({ maxConcurrency: "dsf" });
        };
        expect(typeErr).toThrow(TypeError);
        expect(typeErr).toThrow(typeErrMessage("number", "string"));
    });

    test("should throw Type error when wrong type is passed to constructor", () => {
        const typeErr = () => {
            return new AsyncQueue("dsf");
        };
        expect(typeErr).toThrow(TypeError);
        expect(typeErr).toThrow(typeErrMessage("object", "string"));
    });

    test("should return resolution for successful promise resolution", (done) => {
        queue.add(
            testAsync(true),
            async (res) => {
                try {
                    expect(res).toEqual(enums.RESOLVED);
                    done();
                } catch (err) {
                    done(err);
                }
            },
            async (err) => {
                done(new Error(err));
            },
        );
    });

    test("should return rejection for unsuccessful promise resolution", (done) => {
        queue.add(
            testAsync(false),
            async (res) => {
                done(new Error(res));
            },
            (err) => {
                expect(err).toEqual(enums.REJECTED);
                done();
            },
        );
    });
});

describe("retry on error", () => {
    beforeEach(beforeFunc);
    afterEach(afterFunc);

    test("should return an error when input is wrong type or no input is provided to setMaxRetries", () => {
        const typeErr = () => {
            queue.setMaxRetries("sdf");
        };
        const noInputErr = () => {
            queue.setMaxRetries();
        };
        expect(typeErr).toThrow(TypeError);
        expect(typeErr).toThrow(typeErrMessage("number", "string"));
        expect(noInputErr).toThrow(SyntaxError);
        expect(noInputErr).toThrow(enums.INPUTREQUIRED);
    });

    test("should not retry on error if maxRetries are not specified", (done) => {
        let runCount = 0;
        const counter = () => {
            runCount++;
        };
        queue.add(
            testAsync(false, counter),
            (res) => {
                done(new Error(res));
            },
            (err) => {
                try {
                    expect(runCount).toEqual(1);
                    expect(err).toEqual(enums.REJECTED);
                    done();
                } catch (err) {
                    done(err);
                }
            },
        );
    });

    test("should retry on error if maxRetries are specified for the specified amount of times", (done) => {
        let runCount = 0;
        const retries = 3;
        queue.setMaxRetries(retries);
        const counter = () => {
            runCount++;
        };
        queue.add(
            testAsync(false, counter),
            (res) => {
                done(new Error(res));
            },
            (err) => {
                try {
                    expect(runCount).toEqual(retries);
                    expect(err).toBeInstanceOf(AggregateError);
                    expect(err.message).toEqual(enums.MAXRETRIES);
                    expect(err.errors).toEqual([
                        enums.REJECTED,
                        enums.REJECTED,
                        enums.REJECTED,
                    ]);
                    done();
                } catch (err) {
                    done(err);
                }
            },
        );
    });

    test("should retry on error if maxRetries are specified and return if it resolved on a retry ", (done) => {
        let runCount = 0;
        const retries = 3;
        let resolvedRetry = 2;

        queue.setMaxRetries(retries);
        const counter = () => {
            runCount++;
        };
        const promiseCallback = (res) => {
            if (runCount === resolvedRetry) {
                res(enums.RESOLVED);
            }
        };
        const create = (fn) => {
            queue.add(
                testAsync(false, counter, false, promiseCallback),
                (res) => {
                    try {
                        expect(runCount).toEqual(resolvedRetry);
                        expect(res).toEqual(enums.RESOLVED);
                        resolvedRetry = 3;
                        if (fn) {
                            fn();
                        } else {
                            done();
                        }
                    } catch (err) {
                        done(err);
                    }
                },
                (err) => {
                    done(err);
                },
            );
        };

        create(create);
    });

    test("should retry on error if maxRetries are specified for the specified amount of times and the errors are aborts", (done) => {
        let runCount = 0;
        const retries = 3;
        queue.setPromiseTimeout(50);
        queue.setMaxRetries(retries);
        const counter = () => {
            runCount++;
        };
        queue.add(
            testAsync(true, counter, true),
            (res) => {
                done(new Error(res));
            },
            (err) => {
                try {
                    expect(runCount).toEqual(retries);
                    expect(err.message).toEqual(enums.MAXRETRIES);
                    for (const error of err.errors) {
                        expect(error).toBeInstanceOf(Error);
                        expect(error.message).toEqual(enums.ABORT);
                    }
                    done();
                } catch (err) {
                    done(err);
                }
            },
        );
    });
});

describe("concurrency", () => {
    beforeEach(beforeFunc);
    afterEach(afterFunc);

    test("should return an error when input is wrong type or no input is provided to setMaxConcurrency", () => {
        const typeErr = () => {
            queue.setMaxConcurrency("sdf");
        };
        const noInputErr = () => {
            queue.setMaxConcurrency();
        };
        expect(typeErr).toThrow(TypeError);
        expect(typeErr).toThrow(typeErrMessage("number", "string"));
        expect(noInputErr).toThrow(SyntaxError);
        expect(noInputErr).toThrow(enums.INPUTREQUIRED);
    });

    test(`should throttle promises by default`, (done) => {
        const testruncount = 10;

        for (let i = 0; i < testruncount; i++) {
            queue.add(
                testAsync(true),
                () => {
                    concurrentRuns--;
                    try {
                        expect(concurrentRuns).toBeLessThan(testruncount);
                        done();
                    } catch (err) {
                        done(err);
                    }
                },
                (err) => {
                    done(new Error(err));
                },
            );
        }
    });

    test(`should only run ${maxConcurrentRuns} max concurrent promises by when specified from constructor`, (done) => {
        const testruncount = 7;
        queue = new AsyncQueue({ maxConcurrency: maxConcurrentRuns });

        for (let i = 0; i < testruncount; i++) {
            queue.add(
                testAsync(true),
                () => {
                    concurrentRuns--;
                    try {
                        expect(concurrentRuns).toBeLessThan(maxConcurrentRuns);
                        done();
                    } catch (err) {
                        done(err);
                    }
                },
                (err) => {
                    done(new Error(err));
                },
            );
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

describe("Timeout", () => {
    beforeEach(beforeFunc);
    afterEach(afterFunc);

    test("should return an error when input is wrong type or no input is provided to setPromiseTimeout", () => {
        const typeErr = () => {
            queue.setPromiseTimeout("sdf");
        };
        const noInputErr = () => {
            queue.setPromiseTimeout();
        };
        expect(typeErr).toThrow(TypeError);
        expect(typeErr).toThrow(typeErrMessage("number", "string"));
        expect(noInputErr).toThrow(SyntaxError);
        expect(noInputErr).toThrow(enums.INPUTREQUIRED);
    });

    test("should return an abort error if a timeout is set and promise took longer than timeout", (done) => {
        queue.setPromiseTimeout(50);

        queue.add(
            testAsync(true, () => { }, true),
            async (res) => {
                done(new Error(res));
            },
            (err) => {
                try {
                    expect(err).toBeInstanceOf(Error);
                    expect(err.message).toEqual(enums.ABORT);
                    done();
                } catch (err) {
                    done(err);
                }
            },
        );
    });

    test("should resolve if a timeout is set and promise resolved before timeout", (done) => {
        queue.setPromiseTimeout(400);

        queue.add(
            testAsync(true),
            async (res) => {
                try {
                    expect(res).toEqual(enums.RESOLVED);
                    done();
                } catch (err) {
                    done(err);
                }
            },
            (err) => {
                done(new Error(err));
            },
        );
    });
});
