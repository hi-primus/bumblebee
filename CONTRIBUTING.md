# Contributing to Blurr

## Importing as a link using yarn for your demo or testing environment

In `packages/your-demo/package.json`:

```json
{
  "devDependencies": {
    "blurr": "link:../blurr"
  }
}
```

Use `yarn install` since `npm` has a different support for links.

## Running demos

```bash
$ cd packages
$ cd [demo-name]
$ yarn install
$ yarn dev
```

## Running tests

```bash
$ cd packages
$ cd blurr
$ yarn test
```

For verbose unit tests:

```bash
$ cd packages
$ cd blurr
$ yarn unit-tests
```
## Limitations

Currently passing a result to another variable will mutate the original source (in Pyodide)

```js
df = blurr.readFile("my_file.csv");
df2 = df.dropCols("id"); // df2 and df both have the same columns since they are the same variable in python
```

Workaround:

```js
df = blurr.readFile("my_file.csv");
df2 = blurr.dropCols({ source: df, target: "df2", cols: "id" })
```

This may be fixed using proxies instead of variable names