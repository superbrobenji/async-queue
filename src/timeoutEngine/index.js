"use strict";
import inputValidation from "../shared/inputValidation";
/**
 * @namespace TimeoutEngine
 */

export default class TimeoutEngine {
    #promiseTimeout = 0;

    /**
     * Create a Queue
     *
     * @memberof TimeoutEngine
     * @param {number} timeout - The max amount of time in ms a promise can take to settle
     * @example
     *
     * //to define a queue with a default length of 5
     * const queue = new Queue()
     *
     * @example
     * //to define a queue with a specified length of 3
     * const queue = new Queue(3)
     */
    constructor(timeout) {
        inputValidation(timeout, "number", false);
        if (timeout) this.#promiseTimeout = timeout;
    }

    /**
     * Set the max amount of time a promise can take to settle
     * By default the queue will not monitor the promise time to settle
     *
     * @memberof TimeoutEngine
     * @param {number} timeout - The max amount of time in ms a promise can take to settle
     */
    setPromiseTimeout(timeout) {
        inputValidation(timeout, "number", true);
        this.#promiseTimeout = timeout;
    }

    /**
     * Create the promise with timeout
     *
     * @memberof TimeoutEngine
     * @param {Function} fn - The function that returns a promise
     * @returns {Promise<unknown>[]}
     */
    promiseBuilder(fn) {
        inputValidation(fn, "function", true);
        const promises = new Array(this.#promiseTimeout > 0 ? 2 : 1);
        promises[0] = fn();

        if (this.#promiseTimeout > 0) {
            promises[1] = this.#timeoutHandler();
        }
        return promises;
    }

    #timeoutHandler() {
        return new Promise((_, reject) => {
            setTimeout(reject, this.#promiseTimeout, "Request timed out");
        });
    }
}
