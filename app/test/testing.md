# Testing

To test the backend, at the root of repo run:

```
npm run test
```

To isolate a single test, `.only` can be placed after a `describe()` or `it()` statement.  ex. `describe("crawl testing", ...)` can be: `describe.only("crawl testing", ...)`. 

`.skip` can be used to skip tests; or the describe and it keywords can be prefixed with an `x`, for instance, `it.skip("handles a simple get", ...)` or `xit("handles a simple get", ...)`.  ( Skipped, or x'd, tests will usually be listed as "pending" in the test results. )

Just don't forget to change things back before checking in!