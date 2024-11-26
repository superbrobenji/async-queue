import { abortHandler, default as AsyncQueue } from ".";

const queue = new AsyncQueue(3, 0, 3000);

const promise = (signal) => {
    return new Promise((resolve, reject) => {
        abortHandler(signal, reject);

        setTimeout(resolve, 5000, "resolved");
    });
};

queue.add(
    promise,
    (res) => console.log("res", res),
    (err) => console.log("err", err),
);
