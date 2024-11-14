## Objects

<dl>
<dt><a href="#AsyncQueue">AsyncQueue</a> : <code>object</code></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#returnCallback">returnCallback</a> ⇒ <code>void</code></dt>
<dd></dd>
<dt><a href="#promiseFunction">promiseFunction</a> ⇒ <code>Promise.&lt;any&gt;</code></dt>
<dd></dd>
</dl>

<a name="AsyncQueue"></a>

## AsyncQueue : <code>object</code>
**Kind**: global namespace  

* [AsyncQueue](#AsyncQueue) : <code>object</code>
    * [.module.exports](#AsyncQueue.module.exports)
        * [new module.exports([maxConcurrency])](#new_AsyncQueue.module.exports_new)
    * [.setMaxConcurrency(maxConcurrency)](#AsyncQueue.setMaxConcurrency)
    * [.setRetries(maxRetries)](#AsyncQueue.setRetries)
    * [.setPromiseTimeout(timeout)](#AsyncQueue.setPromiseTimeout)
    * [.add(fn, callback)](#AsyncQueue.add)

<a name="AsyncQueue.module.exports"></a>

### AsyncQueue.module.exports
**Kind**: static class of [<code>AsyncQueue</code>](#AsyncQueue)  
<a name="new_AsyncQueue.module.exports_new"></a>

#### new module.exports([maxConcurrency])
Create a Queue


| Param | Type | Description |
| --- | --- | --- |
| [maxConcurrency] | <code>number</code> | The max amount of promises to run concurrently |

**Example**  
```js
//to define a queue with a default length of 5
const queue = new Queue()
```
**Example**  
```js
//to define a queue with a specified length of 3
const queue = new Queue(3)
```
<a name="AsyncQueue.setMaxConcurrency"></a>

### AsyncQueue.setMaxConcurrency(maxConcurrency)
Set the max amount of promises to run concurrently after queue initialization

**Kind**: static method of [<code>AsyncQueue</code>](#AsyncQueue)  

| Param | Type | Description |
| --- | --- | --- |
| maxConcurrency | <code>number</code> | The max amount of promises to run concurrently |

<a name="AsyncQueue.setRetries"></a>

### AsyncQueue.setRetries(maxRetries)
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

const callback = (res, err) => {
  console.log(err.message) // output: 'max retries reached'
  console.log(err.cause) //  output: ['rejected', 'rejected', 'rejected']
}

queue.add(pets, callback)
```
<a name="AsyncQueue.setPromiseTimeout"></a>

### AsyncQueue.setPromiseTimeout(timeout)
Set the max amount of time a promise can take to settle
By default the queue will not monitor the promise time to settle

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
const pets = () =>{
  return new Promise((resolve) =>{
    setTimeout(resolve, 500) //note that the timeout in the promise is larger than the set promise timeout
  })
}

//the callback that is ran on the settlement of the promise
const callback = (res, err) => {
console.log(err) //output: "Request timed out"
}

//Adding the promise to the queue
queue.add(pets, callback)
```
<a name="AsyncQueue.add"></a>

### AsyncQueue.add(fn, callback)
Add an function to the queue
Takes in a function that returns a Promise

**Kind**: static method of [<code>AsyncQueue</code>](#AsyncQueue)  

| Param | Type | Description |
| --- | --- | --- |
| fn | [<code>promiseFunction</code>](#promiseFunction) | The function that returns a promise you want to add to the queue |
| callback | [<code>returnCallback</code>](#returnCallback) | The function that is executed when the promise settles |

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
const callback = (res, err) => {
  if(err){
    throw new error(err)
  }
  //do something with response
}

//Adding the promise to the queue
queue.add(pets, callback)
```
<a name="returnCallback"></a>

## returnCallback ⇒ <code>void</code>
**Kind**: global typedef  
**Todo**

- [ ] add support for array input


| Param | Type | Description |
| --- | --- | --- |
| res | <code>Object</code> | The response from the promise |
| err | <code>Object</code> | The error that the promise threw. |

**Example**  
```js
//setting retries to 3
queue.setRetries(3)

const pets = () =>{
  return new Promise((resolve, reject) =>{
    setTimeout(reject('rejected'), 100)
  })
}

const callback = (res, err) => {
  console.log(err.message) // output: 'max retries reached'
  console.log(err.cause) //  output: ['rejected', 'rejected', 'rejected']
}

queue.add(pets, callback)
```
<a name="promiseFunction"></a>

## promiseFunction ⇒ <code>Promise.&lt;any&gt;</code>
**Kind**: global typedef  
**Returns**: <code>Promise.&lt;any&gt;</code> - The promise you want to add to the queue  
**Example**  
```js
const pets = () =>{
  return new Promise((resolve) =>{
    setTimeout(resolve, 100)
  })
}
```
