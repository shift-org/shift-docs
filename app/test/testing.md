# Testing

To test the backend, at the root of repo run:

```
npm run test
```

To isolate a single test, `.only` can be placed after a `describe()` or `it()` statement.  ex. `describe("crawl testing", ...)` can be: `describe.only("crawl testing", ...)`. 

`.skip` can be used to skip tests; or the describe and it keywords can be prefixed with an `x`, for instance, `it.skip("handles a simple get", ...)` or `xit("handles a simple get", ...)`.  ( Skipped, or x'd, tests will usually be listed as "pending" in the test results. )

Just don't forget to change things back before checking in!

# Chai 

The unit test framework, chai, supports two styles of tests:

1. promise based, using `return`, `then()`
2. calling, using `end()`, `done()`

Promises should probably be preferred, but the code does use both ways.

## promises:

```
  it("tests with promises", function() {
    return chai.request( app )
      .get( endpoint )
      .then(res => {
        // if failure is expected:
        // we can assert we're not supposed to be here
        // chai.assert(false);
      })
      .catch(err => {
        // if success is expected:
        // we can assert we're not supposed to be here
        // chai.assert(false); 
      });
```

## without promises:

```
  it("tests without promises", function(done) {
    chai.request( app )
      .get( endpoint )
      .end((err, res) => {
        // if failure is expected:
        expect(err).not.to.be.null;

        // if success is expected:
        expect(err).to.be.null;

        done();
      });
```

# Docker and MySQL

If you change the `command` in node `docker-compose.yml` to `command: sleep 9999`you can get a command line terminal that you can run tests on.

WARNING: the tests drop the tables(!)

TODO: determine the right steps for running a mysql server outside of docker for testing.

## Test Data

* "The Tracks of My Tears" with 1 days ( from Thu, 01 Aug 2002 07:00 ) 
 http://localhost:3080/addevent/edit-1-supersecret
* "Red Red Wine" with 1 days ( from Sun, 04 Aug 2002 09:57 ) 
 http://localhost:3080/addevent/edit-2-supersecret
* "Rhapsody in Blue" with 1 days ( from Mon, 05 Aug 2002 02:00 ) 
 http://localhost:3080/addevent/edit-3-supersecret
* "Let's Groove" with 2 days ( from Sun, 04 Aug 2002 11:22 ) 
 http://localhost:3080/addevent/edit-4-supersecret
* "Don't Stop 'Til You Get Enough" with 2 days ( from Fri, 23 Aug 2002 08:43 ) 
 http://localhost:3080/addevent/edit-5-supersecret
* "Apologize" with 4 days ( from Wed, 14 Aug 2002 21:04 ) 
 http://localhost:3080/addevent/edit-6-supersecret
* "Heartbreak Hotel" with 1 days ( from Thu, 29 Aug 2002 23:09 ) 
 http://localhost:3080/addevent/edit-7-supersecret
* "I Can't Go For That (No Can Do)" with 2 days ( from Fri, 23 Aug 2002 07:48 ) 
 http://localhost:3080/addevent/edit-8-supersecret
* "Brother" with 3 days ( from Wed, 28 Aug 2002 18:48 ) 
 http://localhost:3080/addevent/edit-9-supersecret
* "Music" with 4 days ( from Thu, 15 Aug 2002 11:26 ) 
 http://localhost:3080/addevent/edit-10-supersecret
* "The Rose" with 3 days ( from Sat, 24 Aug 2002 01:14 ) 
 http://localhost:3080/addevent/edit-11-supersecret
* "One of These Nights" with 4 days ( from Sun, 25 Aug 2002 17:55 ) 
 http://localhost:3080/addevent/edit-12-supersecret
* "Ballerina" with 1 days ( from Sat, 17 Aug 2002 19:06 ) 
 http://localhost:3080/addevent/edit-13-supersecret
* "A Whole New World (Aladdin's Theme)" with 3 days ( from Sun, 18 Aug 2002 09:10 ) 
 http://localhost:3080/addevent/edit-14-supersecret
* "People Got to Be Free" with 1 days ( from Sun, 11 Aug 2002 11:53 ) 
 http://localhost:3080/addevent/edit-15-supersecret
* "Say It Right" with 4 days ( from Sat, 10 Aug 2002 13:13 ) 
 http://localhost:3080/addevent/edit-16-supersecret
* "Disco Lady" with 2 days ( from Sat, 10 Aug 2002 22:24 ) 
 http://localhost:3080/addevent/edit-17-supersecret
* "Let's Dance" with 4 days ( from Sat, 17 Aug 2002 12:27 ) 
 http://localhost:3080/addevent/edit-18-supersecret
* "Turn! Turn! Turn! (To Everything There is a Season)" with 2 days ( from Wed, 28 Aug 2002 01:09 ) 
 http://localhost:3080/addevent/edit-19-supersecret
* "Wake Me Up Before You Go Go" with 1 days ( from Sun, 04 Aug 2002 20:42 ) 
 http://localhost:3080/addevent/edit-20-supersecret
* "Green Tambourine" with 2 days ( from Sun, 11 Aug 2002 05:31 ) 
 http://localhost:3080/addevent/edit-21-supersecret
* "Harbour Lights" with 1 days ( from Thu, 01 Aug 2002 13:53 ) 
 http://localhost:3080/addevent/edit-22-supersecret
* "ABC" with 2 days ( from Thu, 08 Aug 2002 15:52 ) 
 http://localhost:3080/addevent/edit-23-supersecret
* "War" with 2 days ( from Sun, 25 Aug 2002 08:50 ) 
 http://localhost:3080/addevent/edit-24-supersecret
* "Like a Prayer" with 2 days ( from Fri, 30 Aug 2002 10:36 ) 
 http://localhost:3080/addevent/edit-25-supersecret
* "Na Na Hey Hey (Kiss Him Goodbye)" with 3 days ( from Mon, 19 Aug 2002 05:35 ) 
 http://localhost:3080/addevent/edit-26-supersecret
* "Tequila" with 1 days ( from Fri, 16 Aug 2002 12:46 ) 
 http://localhost:3080/addevent/edit-27-supersecret
* "Moonlight Serenade" with 2 days ( from Fri, 09 Aug 2002 13:58 ) 
 http://localhost:3080/addevent/edit-28-supersecret
* "Mony Mony" with 1 days ( from Sat, 03 Aug 2002 07:11 ) 
 http://localhost:3080/addevent/edit-29-supersecret
* "Just Dance" with 1 days ( from Fri, 09 Aug 2002 20:06 ) 
 http://localhost:3080/addevent/edit-30-supersecret
* "On the Atchison" with 2 days ( from Wed, 14 Aug 2002 09:10 ) 
 http://localhost:3080/addevent/edit-31-supersecret
* "Sh-Boom (Life Could Be a Dream)" with 1 days ( from Sat, 31 Aug 2002 01:59 ) 
 http://localhost:3080/addevent/edit-32-supersecret
* "Leaving" with 3 days ( from Wed, 14 Aug 2002 05:25 ) 
 http://localhost:3080/addevent/edit-33-supersecret
* "Memories Are Made of This" with 3 days ( from Wed, 21 Aug 2002 22:10 ) 
 http://localhost:3080/addevent/edit-34-supersecret
* "Here Without You" with 1 days ( from Fri, 09 Aug 2002 11:04 ) 
 http://localhost:3080/addevent/edit-35-supersecret
* "Single Ladies (Put A Ring On It)" with 1 days ( from Fri, 30 Aug 2002 17:27 ) 
 http://localhost:3080/addevent/edit-36-supersecret
* "House of the Rising Sun" with 1 days ( from Fri, 02 Aug 2002 00:43 ) 
 http://localhost:3080/addevent/edit-37-supersecret
* "Daydream Believer" with 3 days ( from Tue, 27 Aug 2002 23:07 ) 
 http://localhost:3080/addevent/edit-38-supersecret
* "One More Try" with 1 days ( from Sun, 11 Aug 2002 12:16 ) 
 http://localhost:3080/addevent/edit-39-supersecret
* "Please Mr Postman" with 1 days ( from Wed, 21 Aug 2002 19:02 ) 
 http://localhost:3080/addevent/edit-40-supersecret
* "Stars & Stripes Forever" with 2 days ( from Thu, 29 Aug 2002 08:31 ) 
 http://localhost:3080/addevent/edit-41-supersecret
* "Hello Dolly" with 1 days ( from Thu, 08 Aug 2002 03:55 ) 
 http://localhost:3080/addevent/edit-42-supersecret
* "Venus" with 1 days ( from Sat, 03 Aug 2002 04:12 ) 
 http://localhost:3080/addevent/edit-43-supersecret
* "Twist & Shout" with 1 days ( from Tue, 20 Aug 2002 06:10 ) 
 http://localhost:3080/addevent/edit-44-supersecret
* "Respect" with 2 days ( from Thu, 29 Aug 2002 00:19 ) 
 http://localhost:3080/addevent/edit-45-supersecret
* "Mr Brightside" with 3 days ( from Fri, 16 Aug 2002 06:15 ) 
 http://localhost:3080/addevent/edit-46-supersecret
