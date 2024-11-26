"use strict";
import inputValidation from "../shared/inputValidation";
/**
 * @namespace RetryEngine
 */

export default class RetryEngine {
    #retries = new WeakMap();
    #errorsOnRetries = new WeakMap();
    maxRetries = 0;

    /**
     * Create a retry engine
     *
     * @memberof RetryEngine
     * @param {number} [maxRetries] - The max amount of retries that needs to be attempted
     */
    constructor(maxRetries) {
        inputValidation(maxRetries, "number", true);
        this.maxRetries = maxRetries;
    }

    /**
     * Set the max amount of times a promise can be retried after a failure
     * By default the queue will not retry a failed promise.
     *
     * @memberof RetryEngine
     * @param {number} maxRetries - The max amount of promises to run concurrently
     */
    setRetries(maxRetries) {
        inputValidation(maxRetries, "number", true);
        this.maxRetries = maxRetries;
    }
    /**
     * @callback retryCallback
     * @param {Error} maxReachedErr err returned when the max retries have been reached
     *
     */

    /**
     * handleErrorWithRetryEngine
     *
     * @memberof RetryEngine
     * @param {Function} fn The fn that retruns the promise added by user
     * @param {unknown} err The error that the promise returned
     * @param {retryCallback} callback the callback that the engine runs on completion
     *
     */
    handleErrorWithRetryEngine(fn, err, callback) {
        this.#errorsOnRetriesHandler(fn, err);
        this.#retryRunner(fn, callback);
    }

    #errorsOnRetriesHandler(fn, err) {
        if (this.#errorsOnRetries.has(fn)) {
            this.#updateErrorsOnRetriesMap(fn, err);
        } else {
            this.#errorsOnRetries.set(fn, [err]);
        }
    }

    #updateErrorsOnRetriesMap(fn, err) {
        const pastErrors = this.#errorsOnRetries.get(fn);
        const updatedErrorsList = RetryEngine.#resizeArray(
            pastErrors,
            pastErrors.length + 1,
        );
        updatedErrorsList[pastErrors.length] = err;
        this.#errorsOnRetries.set(fn, updatedErrorsList);
    }

    #retryRunner(fn, callback) {
        if (!this.#retries.has(fn)) {
            this.#retries.set(fn, 1);
        }
        if (this.maxRetries > this.#retries.get(fn)) {
            this.#setRetryTimeout().then(() => {
                this.#createRetry(fn, callback);
            });
        } else {
            callback(
                new AggregateError(
                    this.#errorsOnRetries.get(fn),
                    "max retries reached",
                ),
            );
        }
    }

    #setRetryTimeout() {
        return new Promise((resolve) => {
            setTimeout(resolve, RetryEngine.#getBackOffDelay(this.#retries));
        });
    }

    #createRetry(fn, callback) {
        const pastTries = this.#retries.get(fn);
        this.#retries.set(fn, pastTries + 1);
        callback();
    }

    static #resizeArray(oldArray, newArrayLength) {
        const newArray = new Array(newArrayLength);
        for (let i = 0; i < newArrayLength; i++) {
            newArray[i] = oldArray[i];
        }
        return newArray;
    }

    static #getBackOffDelay(retries) {
        const baseDelayMs = 300;
        return baseDelayMs * 2 ** retries;
    }
}
