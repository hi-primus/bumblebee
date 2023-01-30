# Blurr 👋

![Version](https://img.shields.io/badge/version-0.0.1-blue.svg?cacheSeconds=2592000)

## Install

```bash
# Using yarn:
$ yarn add @hi-primus/blurr
```

```javascript
import { Blurr } from "blurr";
```

## Initialize

```javascript
const blurr = Blurr();
```

If initialization does not work properly on built projects:

```javascript
const blurr = Blurr({
  serverOptions: {
    scriptURL: "https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js",
  },
});
```

## Create Request

```javascript
const df = await blurr.createDataframe({
  dict: { test: ["Abc", "def", "ghi", "jkl"] },
});

const display = await df.columsSample();
```

### Result

```json
[{ "test": "Abc" }, { "test": "def" }, { "test": "ghi" }, { "test": "jkl" }]
```

