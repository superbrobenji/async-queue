<h1 align="center">Welcome to asyncrify 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/asyncrify" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/asyncrify.svg">
  </a>
  <a href="https://superbrobenji.github.io/async-queue/" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/superbrobenji/async-queue/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/superbrobenji/async-queue/blob/main/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/superbrobenji/async-queue" />
  </a>
  <a href="https://twitter.com/superbrobenji" target="_blank">
    <img alt="Twitter: superbrobenji" src="https://img.shields.io/twitter/follow/superbrobenji.svg?style=social" />
  </a>
</p>

> A simple queue for executing promises concurrently. You can set timeouts, max concurrency as well as retry

### 🏠 [Homepage](https://superbrobenji.github.io/async-queue/index.html)

## Install

```sh
npm i asyncrify
```

## Usage

```sh
import Queue from 'asyncrify'
const queue = new Queue()
queue.add(() => new Promise(
  (resolve) => setTimeout(resolve, 200)),
  (res) => {
    //handle result
  },
  (err) => {
    //handle err
  })
```

## Run tests

```sh
npm run test
```

## author

👤 **Benjamin Swanepoel**

- Twitter: [@superbrobenji](https://twitter.com/superbrobenji)
- Github: [@superbrobenji](https://github.com/superbrobenji)
- LinkedIn: [@benjamin-swanepoel](https://linkedin.com/in/benjamin-swanepoel)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/superbrobenji/async-queue/issues). You can also take a look at the [contributing guide](https://github.com/superbrobenji/async-queue/blob/main/CONTRIBUTING.md).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2024 [benjamin swanepoel](https://github.com/superbrobenji).<br />
This project is [MIT](https://github.com/superbrobenji/async-queue/blob/main/LICENSE) licensed.

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
