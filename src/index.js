"use strict";
import RetryEngine from "./retryEngine";
import inputValidation from "./shared/inputValidation";
/**
 * @namespace AsyncQueue
 */

/**
 */
export const QUEUE_ERRORS = {
    ABORT: "Aborted",
    INPUT_REQUIRED: "input is required",
    MAX_RETRIES: "max retries reached",
};

export class Queue {
    #queue = new Set();
    #running = 0;
    #maxConcurrency = 0;
    #timeout = 0;
    /**
     * @type {RetryEngine| null}
     */
    #retryEngine = null;

    /**
     * Create a Queue
     *
     * @memberof AsyncQueue
     * @param {Object} [config] - the config for asyncrify
     * @param {number=} config.maxConcurrency - The max amount of promises to run concurrently
     * @param {number=} config.maxRetries - The max amount of promises to run concurrently
     * @param {number=} config.timeout - The max amount of time in ms a promise can take to settle
     * @example
     *
     * //to define a queue with a default length of 5
     * const queue = new Queue()
     *
     * @example
     * //to define a queue with a specified length of 3
     * const queue = new Queue({maxConcurrency: 3})
     */
    constructor(config) {
        inputValidation(config, "object", false);
        if (config) {
            inputValidation(config.maxConcurrency, "number", false);
            inputValidation(config.maxRetries, "number", false);
            inputValidation(config.timeout, "number", false);
            if (config.maxConcurrency) this.#maxConcurrency = config.maxConcurrency;
            if (config.maxRetries) {
                this.#retryEngine = new RetryEngine(config.maxRetries);
            }
            if (config.timeout) this.#timeout = config.timeout;
        }
    }

    /**
     * Set the max amount of promises to run concurrently after queue initialization
     *
     * @memberof AsyncQueue
     * @param {number} maxConcurrency - The max amount of promises to run concurrently
     */
    setMaxConcurrency(maxConcurrency) {
        inputValidation(maxConcurrency, "number", true);
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
     * const callback = (res) => {
     *   //do something with data
     * }
     *
     * const errCallback = ( err) => {
     *   console.log(err.message) // output: 'max retries reached'
     *   console.log(err.errors) //  output: list of errors
     * }
     *
     * queue.add(pets, callback, errCallback)
     */
    setMaxRetries(maxRetries) {
        inputValidation(maxRetries, "number", true);
        if (!this.#retryEngine) {
            this.#retryEngine = new RetryEngine(maxRetries);
        } else {
            this.#retryEngine.setRetries(maxRetries);
        }
    }

    /**
     * Set the max amount of time a promise can take to settle
     * By default the queue will not monitor the promise time to settle
     * a signal must be handled in the promise for the timeout to abort the promise
     *
     * @memberof AsyncQueue
     * @param {number} timeout - The max amount of time in ms a promise can take to settle
     * @todo implement abort controller to kill promise when timeout is reached
     * @example
     * const queue = new Queue()
     *
     * //setting timeout for promises to 100ms
     * queue.setPromiseTimeout(100)
     *
     * //function returns the promise we want to add to queue
     * const pets = (signal) =>{
     *   return new Promise((resolve, reject) =>{
     *   signal.addEventListener("abort", () => {
     *    reject("Aborted")
     *   }
     *     setTimeout(resolve, 500) //note that the timeout in the promise is larger than the set promise timeout
     *   })
     * }
     *
     * //the callback that is ran on the resolution of the promise
     * const callback = (res ) => {
     *   //do something with data
     * }
     *
     * //the callback that is ran on the rejection of the promise
     * const errCallback = (err) => {
     * console.log(err) //output: "Request timed out"
     * }
     *
     * //Adding the promise to the queue
     * queue.add(pets, callback, errCallback)
     */
    setPromiseTimeout(timeout) {
        inputValidation(timeout, "number", true);
        this.#timeout = timeout;
    }

    /**
     * @callback resCallback
     *
     * @param {Object} res - The response from the promise
     * @return {void}
     * @todo add support for array input
     * @example
     *
     *
     * const pets = () =>{
     *   return new Promise((resolve, reject) =>{
     *     setTimeout(resolve('finished'), 100)
     *   })
     * }
     *
     * const callback = (res) => {
     *  //do something with res
     * }
     *
     * queue.add(pets, callback)
     */

    /**
     * @callback errCallback
     *
     * @param {Error} err - The response from the promise
     * @return {void}
     * @todo add support for array input
     * @example
     *
     *
     * const pets = () =>{
     *   return new Promise((resolve, reject) =>{
     *     setTimeout(reject('rejected'), 100)
     *   })
     * }
     *
     * const callback = (res) => {
     *  //do something with res
     * }
     *
     * const errorCallback = (err) => {
     *  //do something with error
     * }
     *
     * queue.add(pets, callback, errorCallback)
     */

    /**
     * @callback promiseFunction
     *
     * @param {AbortSignal=} signal - The signal for the abort controller for the timeout to abort the promise
     * @returns {Promise<unknown>} The promise you want to add to the queue
     * @example
     * const pets = (signal) =>{
     *   return new Promise((resolve, reject) =>{
     *   signal.addEventListener("abort", () => {
     *    reject("Aborted")
     *   }
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
     * @param {resCallback} callback - The function that is executed when the promise resolves
     * @param {errCallback} callback - The function that is executed when the promise rejects
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
     * const callback = (res) => {
     *   //do something with response
     * }
     *
     * const error = (err) => {
     *   throw new Error(err)
     * }
     *
     * //Adding the promise to the queue
     * queue.add(pets, callback, error)
     */
    add(fn, callback, err) {
        inputValidation(err, "function", false);
        inputValidation(fn, "function", true);
        inputValidation(callback, "function", true);

        if (this.#maxConcurrency !== 0 && this.#running >= this.#maxConcurrency) {
            this.#queue.add(fn);
        } else {
            this.#running++;
            this.#promiseRunner(fn, callback, err);
        }
    }

    #promiseRunner(fn, callback, errorCallback) {
        const promise = fn(
            this.#timeout > 0 ? AbortSignal.timeout(this.#timeout) : null,
        );
        promise
            .then(callback)
            .catch((err) => {
                this.#errorHandler(err, fn, errorCallback, callback);
            })
            .finally(() => {
                this.#running--;
                this.#runPromiseFromQueue(callback, errorCallback);
            });
    }

    #runPromiseFromQueue(callback, errorCallback) {
        if (this.#queue.size > 0) {
            const nextPromise = this.#queue.values().next().value;
            this.#queue.delete(nextPromise);
            this.add(nextPromise, callback, errorCallback);
        }
    }

    #errorHandler(err, fn, errCallback, callback) {
        if (this.#retryEngine && this.#retryEngine.maxRetries > 0) {
            this.#retryEngine.handleErrorWithRetryEngine(fn, err, (maxRetriesErr) => {
                if (maxRetriesErr && errCallback) {
                    errCallback(maxRetriesErr);
                } else {
                    this.add(fn, callback, errCallback);
                }
            });
        } else if (errCallback) {
            errCallback(err);
        }
    }
}

/**
 * abort handler for handling aborts in your promise
 * @param {AbortSignal} signal - the reject function of the promise
 * @param {RejectFunction} reject - the reject function of the promise
 * @example
 *
 * const promise = (signal) => {
 *  return new Promise((resolve, reject) => {
 *      abortHandler(signal, reject);
 *
 *      setTimeout(resolve, 5000, "resolved");
 *  });
 * };
 *
 * const callback = (res) {
 *   // handle res here
 * }
 * const errHandler = (err) {
 *   console.log(err.message) //output: "Aborted"
 * }
 *
 * queue.add(promise, callback, errHandler)
 */
export const abortHandler = (signal, reject) => {
    if (signal.aborted) {
        return reject(new Error("Aborted"));
    }
    const abortHandler = () => {
        reject(new Error("Aborted"));
        signal.removeEventListener("abort", abortHandler);
    };
    signal.addEventListener("abort", abortHandler);
};

export default Queue;
