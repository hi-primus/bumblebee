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
