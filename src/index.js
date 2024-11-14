"use strict";
/**
 * @namespace AsyncQueue
 */

export default class AsyncQueue {
    #queue = new Set();
    #running = 0;
    #maxConcurrency = 5;
    #promiseTimeout = 0;
    #retries = new WeakMap();
    #errorsOnRetries = new WeakMap();
    #maxRetries = 0;

    /**
     * Create a Queue
     *
     * @memberof AsyncQueue
     * @param {number=} [maxConcurrency] - The max amount of promises to run concurrently
     * @example
     *
     * //to define a queue with a default length of 5
     * const queue = new Queue()
     *
     * @example
     * //to define a queue with a specified length of 3
     * const queue = new Queue(3)
     */
    constructor(maxConcurrency) {
        AsyncQueue.#inputValidation(maxConcurrency, "number", false);
        if (maxConcurrency) this.#maxConcurrency = maxConcurrency;
    }

    /**
     * Set the max amount of promises to run concurrently after queue initialization
     *
     * @memberof AsyncQueue
     * @param {number} maxConcurrency - The max amount of promises to run concurrently
     */
    setMaxConcurrency(maxConcurrency) {
        AsyncQueue.#inputValidation(maxConcurrency, "number", true);
        this.#maxConcurrency = maxConcurrency;
    }

    /**
     * Set the max amount of times a promise can be retried after a failure
     * By default the queue will not retry a failed promise.
     *
     * @memberof AsyncQueue
     * @param {number} maxRetries - The max amount of promises to run concurrently
     *@example
     * const queue = new Queue()
     *
     * //setting retries to 3
     * queue.setRetries(3)
     *
     * const pets = () =>{
     *   return new Promise((resolve, reject) =>{
     *     setTimeout(reject('rejected'), 100)
     *   })
     * }
     *
     * const callback = (res, err) => {
     *   console.log(err.message) // output: 'max retries reached'
     *   console.log(err.cause) //  output: ['rejected', 'rejected', 'rejected']
     * }
     *
     * queue.add(pets, callback)
     */
    setRetries(maxRetries) {
        AsyncQueue.#inputValidation(maxRetries, "number", true);
        this.#maxRetries = maxRetries;
    }

    /**
     * Set the max amount of time a promise can take to settle
     * By default the queue will not monitor the promise time to settle
     *
     * @todo implement abort controller to kill promise when timeout is reached
     * @memberof AsyncQueue
     * @param {number} timeout - The max amount of time in ms a promise can take to settle
     * @example
     * const queue = new Queue()
     *
     * //setting timeout for promises to 100ms
     * queue.setPromiseTimeout(100)
     *
     * //function returns the promise we want to add to queue
     * const pets = () =>{
     *   return new Promise((resolve) =>{
     *     setTimeout(resolve, 500) //note that the timeout in the promise is larger than the set promise timeout
     *   })
     * }
     *
     * //the callback that is ran on the settlement of the promise
     * const callback = (res, err) => {
     * console.log(err) //output: "Request timed out"
     * }
     *
     * //Adding the promise to the queue
     * queue.add(pets, callback)
     */
    setPromiseTimeout(timeout) {
        AsyncQueue.#inputValidation(timeout, "number", true);
        this.#promiseTimeout = timeout;
    }

    /**
     * @callback callback
     *
     * @todo add support for array input
     * @param {Object} res - The response from the promise
     * @param {Object} err - The error that the promise threw.
     * @param {string=} [err.message] - When retry is enabled, it will return a message.
     * @param {Array=} [err.cause] - When retry is enabled, it will return an array of errors for each retry.
     * @example
     *
     * //setting retries to 3
     * queue.setRetries(3)
     *
     * const pets = () =>{
     *   return new Promise((resolve, reject) =>{
     *     setTimeout(reject('rejected'), 100)
     *   })
     * }
     *
     * const callback = (res, err) => {
     *   console.log(err.message) // output: 'max retries reached'
     *   console.log(err.cause) //  output: ['rejected', 'rejected', 'rejected']
     * }
     *
     * queue.add(pets, callback)
     */

    /**
     * @callback promiseFunction
     *
     * @returns {Promise<any>} The promise you want to add to the queue
     * @example
     * const pets = () =>{
     *   return new Promise((resolve) =>{
     *     setTimeout(resolve, 100)
     *   })
     * }
     */

    /**
     * Add an function to the queue
     * Takes in a function that returns a Promise
     *
     * @memberof AsyncQueue
     * @param {promiseFunction} fn - The function that returns a promise you want to add to the queue
     * @param {callback} callback - The function that is executed when the promise settles
     * @example
     * const queue = new Queue()
     *
     * //function returns the promise we want to add to queue
     * const pets = () =>{
     *   return new Promise((resolve) =>{
     *     setTimeout(resolve, 100)
     *   })
     * }
     *
     * //the callback that is ran on the settlement of the promise
     * const callback = (res, err) => {
     *   if(err){
     *     throw new error(err)
     *   }
     *   //do something with response
     * }
     *
     * //Adding the promise to the queue
     * queue.add(pets, callback)
     */
    add(fn, callback) {
        AsyncQueue.#inputValidation(fn, "function", true);
        AsyncQueue.#inputValidation(callback, "function", true);

        if (this.#running >= this.#maxConcurrency) {
            this.#queue.add(fn);
        } else {
            this.#running++;
            this.#promiseRunner(fn, callback);
        }
    }

    #promiseRunner(fn, callback) {
        const promise = this.#promiseBuilder(fn);
        Promise.race(promise)
            .then((res) => {
                callback(res, null);
            })
            .catch((err) => {
                this.#errorHandler(err, fn, callback);
            })
            .finally(() => {
                this.#running--;
                this.#runPromiseFromQueue(callback);
            });
    }

    #runPromiseFromQueue(callback) {
        if (this.#queue.size > 0) {
            const nextPromise = this.#queue.values().next().value;
            this.#queue.delete(nextPromise);
            this.add(nextPromise, callback);
        }
    }

    #promiseBuilder(fn) {
        const promise = new Array(this.#promiseTimeout > 0 ? 2 : 1);
        promise[0] = fn();

        if (this.#promiseTimeout > 0) {
            promise[1] = this.#timeoutHandler();
        }
        return promise;
    }

    #errorHandler(err, fn, callback) {
        if (this.#maxRetries > 0) {
            this.#errorsOnRetriesHandler(fn, err);
            this.#retryRunner(fn, callback);
        } else {
            callback(null, err);
        }
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
        const updatedErrorsList = AsyncQueue.#resizeArray(
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
        if (this.#maxRetries > this.#retries.get(fn)) {
            this.#setRetryTimeout(fn, callback).then(() => {
                this.#createRetry(fn, callback);
            });
        } else {
            callback(
                null,
                new Error("max retries reached", {
                    cause: this.#errorsOnRetries.get(fn),
                }),
            );
        }
    }

    #setRetryTimeout() {
        return new Promise((resolve) => {
            setTimeout(resolve, AsyncQueue.#getBackOffDelay(this.#retries));
        });
    }

    #createRetry(fn, callback) {
        const pastTries = this.#retries.get(fn);
        this.#retries.set(fn, pastTries + 1);
        this.add(fn, callback);
    }

    #timeoutHandler() {
        return new Promise((resolve, reject) => {
            setTimeout(reject, this.#promiseTimeout, "Request timed out");
        });
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

    static #inputValidation(input, type, required) {
        if (required && !input) {
            throw new Error("input is required");
        }
        if (input && typeof input !== type) {
            throw new Error(`input must be a ${type}`);
        }
    }
}
