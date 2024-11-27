## Objects

<dl>
<dt><a href="#AsyncQueue">AsyncQueue</a> : <code>object</code></dt>
<dd></dd>
</dl>

## Constants

<dl>
<dt><a href="#QUEUE_ERRORS">QUEUE_ERRORS</a></dt>
<dd></dd>
<dt><a href="#abortHandler">abortHandler</a></dt>
<dd><p>abort handler for handling aborts in your promise</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#resCallback">resCallback</a> ⇒ <code>void</code></dt>
<dd></dd>
<dt><a href="#errCallback">errCallback</a> ⇒ <code>void</code></dt>
<dd></dd>
<dt><a href="#promiseFunction">promiseFunction</a> ⇒ <code>Promise.&lt;unknown&gt;</code></dt>
<dd></dd>
</dl>

<a name="AsyncQueue"></a>

## AsyncQueue : <code>object</code>
**Kind**: global namespace  

* [AsyncQueue](#AsyncQueue) : <code>object</code>
    * [.module.exports](#AsyncQueue.module.exports)
        * [new module.exports([config])](#new_AsyncQueue.module.exports_new)
    * [.setMaxConcurrency(maxConcurrency)](#AsyncQueue.setMaxConcurrency)
    * [.setMaxRetries(maxRetries)](#AsyncQueue.setMaxRetries)
    * [.setPromiseTimeout(timeout)](#AsyncQueue.setPromiseTimeout)
    * [.add(fn, callback, callback)](#AsyncQueue.add)

<a name="AsyncQueue.module.exports"></a>

### AsyncQueue.module.exports
**Kind**: static class of [<code>AsyncQueue</code>](#AsyncQueue)  
<a name="new_AsyncQueue.module.exports_new"></a>

#### new module.exports([config])
Create a Queue


| Param | Type | Description |
| --- | --- | --- |
| [config] | <code>Object</code> | the config for asyncrify |
| [config.maxConcurrency] | <code>number</code> | The max amount of promises to run concurrently |
| [config.maxRetries] | <code>number</code> | The max amount of promises to run concurrently |
| [config.timeout] | <code>number</code> | The max amount of time in ms a promise can take to settle |

**Example**  
```js
//to define a queue with a default length of 5
const queue = new Queue()
```
**Example**  
```js
//to define a queue with a specified length of 3
const queue = new Queue({maxConcurrency: 3})
```
<a name="AsyncQueue.setMaxConcurrency"></a>

### AsyncQueue.setMaxConcurrency(maxConcurrency)
Set the max amount of promises to run concurrently after queue initialization

**Kind**: static method of [<code>AsyncQueue</code>](#AsyncQueue)  

| Param | Type | Description |
| --- | --- | --- |
| maxConcurrency | <code>number</code> | The max amount of promises to run concurrently |

<a name="AsyncQueue.setMaxRetries"></a>

### AsyncQueue.setMaxRetries(maxRetries)
Set the max amount of times a promise can be retried after a failure
By default the queue will not retry a failed promise.

**Kind**: static method of [<code>AsyncQueue</code>](#AsyncQueue)  

| Param | Type | Description |
| --- | --- | --- |
| maxRetries | <code>number</code> | The max amount of promises to run concurrently |

**Example**  
```js
const queue = new Queue()

//setting retries to 3
queue.setRetries(3)

const pets = () =>{
  return new Promise((resolve, reject) =>{
    setTimeout(reject('rejected'), 100)
  })
}

const callback = (res) => {
  //do something with data
}

const errCallback = ( err) => {
  console.log(err.message) // output: 'max retries reached'
  console.log(err.errors) //  output: list of errors
}

queue.add(pets, callback, errCallback)
```
<a name="AsyncQueue.setPromiseTimeout"></a>

### AsyncQueue.setPromiseTimeout(timeout)
Set the max amount of time a promise can take to settle
By default the queue will not monitor the promise time to settle
a signal must be handled in the promise for the timeout to abort the promise

**Kind**: static method of [<code>AsyncQueue</code>](#AsyncQueue)  
**Todo**

- [ ] implement abort controller to kill promise when timeout is reached


| Param | Type | Description |
| --- | --- | --- |
| timeout | <code>number</code> | The max amount of time in ms a promise can take to settle |

**Example**  
```js
const queue = new Queue()

//setting timeout for promises to 100ms
queue.setPromiseTimeout(100)

//function returns the promise we want to add to queue
const pets = (signal) =>{
  return new Promise((resolve, reject) =>{
  signal.addEventListener("abort", () => {
   reject("Aborted")
  }
    setTimeout(resolve, 500) //note that the timeout in the promise is larger than the set promise timeout
  })
}

//the callback that is ran on the resolution of the promise
const callback = (res ) => {
  //do something with data
}

//the callback that is ran on the rejection of the promise
const errCallback = (err) => {
console.log(err) //output: "Request timed out"
}

//Adding the promise to the queue
queue.add(pets, callback, errCallback)
```
<a name="AsyncQueue.add"></a>

### AsyncQueue.add(fn, callback, callback)
Add an function to the queue
Takes in a function that returns a Promise

**Kind**: static method of [<code>AsyncQueue</code>](#AsyncQueue)  

| Param | Type | Description |
| --- | --- | --- |
| fn | [<code>promiseFunction</code>](#promiseFunction) | The function that returns a promise you want to add to the queue |
| callback | [<code>resCallback</code>](#resCallback) | The function that is executed when the promise resolves |
| callback | [<code>errCallback</code>](#errCallback) | The function that is executed when the promise rejects |

**Example**  
```js
const queue = new Queue()

//function returns the promise we want to add to queue
const pets = () =>{
  return new Promise((resolve) =>{
    setTimeout(resolve, 100)
  })
}

//the callback that is ran on the settlement of the promise
const callback = (res) => {
  //do something with response
}

const error = (err) => {
  throw new Error(err)
}

//Adding the promise to the queue
queue.add(pets, callback, error)
```
<a name="QUEUE_ERRORS"></a>

## QUEUE\_ERRORS
**Kind**: global constant  
<a name="abortHandler"></a>

## abortHandler
abort handler for handling aborts in your promise

**Kind**: global constant  

| Param | Type | Description |
| --- | --- | --- |
| reject | <code>RejectFunction</code> | the reject function of the promise |

**Example**  
```js
const promise = (signal) => {
 return new Promise((resolve, reject) => {
     abortHandler(signal, reject);

     setTimeout(resolve, 5000, "resolved");
 });
};

const callback = (res) {
  // handle res here
}
const errHandler = (err) {
  console.log(err.message) //output: "Aborted"
}

queue.add(promise, callback, errHandler)
```
<a name="resCallback"></a>

## resCallback ⇒ <code>void</code>
**Kind**: global typedef  
**Todo**

- [ ] add support for array input


| Param | Type | Description |
| --- | --- | --- |
| res | <code>Object</code> | The response from the promise |

**Example**  
```js
const pets = () =>{
  return new Promise((resolve, reject) =>{
    setTimeout(resolve('finished'), 100)
  })
}

const callback = (res) => {
 //do something with res
}

queue.add(pets, callback)
```
<a name="errCallback"></a>

## errCallback ⇒ <code>void</code>
**Kind**: global typedef  
**Todo**

- [ ] add support for array input


| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> | The response from the promise |

**Example**  
```js
const pets = () =>{
  return new Promise((resolve, reject) =>{
    setTimeout(reject('rejected'), 100)
  })
}

const callback = (res) => {
 //do something with res
}

const errorCallback = (err) => {
 //do something with error
}

queue.add(pets, callback, errorCallback)
```
<a name="promiseFunction"></a>

## promiseFunction ⇒ <code>Promise.&lt;unknown&gt;</code>
**Kind**: global typedef  
**Returns**: <code>Promise.&lt;unknown&gt;</code> - The promise you want to add to the queue  

| Param | Type | Description |
| --- | --- | --- |
| [signal] | <code>AbortSignal</code> | The signal for the abort controller for the timeout to abort the promise |

**Example**  
```js
const pets = (signal) =>{
  return new Promise((resolve, reject) =>{
  signal.addEventListener("abort", () => {
   reject("Aborted")
  }
    setTimeout(resolve, 100)
  })
}
```
