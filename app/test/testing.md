# Testing

To test the backend, at the root of repo run:

```
npm test
```

All tests use the [Node Test runner](https://nodejs.org/docs/latest/api/test.html#test-runner), with [supertest](https://github.com/forwardemail/supertest) for making http testing requests.

Isolating tests:

Tests can be identified by name:

```
npm test -- --test-name-pattern="ical feed"
```

Or, temporarily can be marked with 'only' in the code. For example: `describe.only()`, and then selected with:

```
npm test -- --test-only
```

# Test Data

fakeData.js generates the following events:

* "The Tracks of My Tears" with 1 days starting on 2002-08-01
 http://localhost:3080/addevent/edit-1-supersecret
* "Knock On Wood" with 1 days starting on 2002-08-20
 http://localhost:3080/addevent/edit-2-supersecret
* "Tonight's the Night (Gonna Be Alright)" with 2 days starting on 2002-08-02
 http://localhost:3080/addevent/edit-3-supersecret
* "One" with 2 days starting on 2002-08-02
 http://localhost:3080/addevent/edit-4-supersecret
* "Whip It" with 4 days starting on 2002-08-16
 http://localhost:3080/addevent/edit-5-supersecret
* "Losing My Religion" with 5 days starting on 2002-08-22
 http://localhost:3080/addevent/edit-6-supersecret
* "I'm a Believer" with 1 days starting on 2002-08-20
 http://localhost:3080/addevent/edit-7-supersecret
* "Hips don't lie" with 1 days starting on 2002-08-28
 http://localhost:3080/addevent/edit-8-supersecret
* "Living For the City" with 1 days starting on 2002-08-01
 http://localhost:3080/addevent/edit-9-supersecret
* "Shake Down" with 1 days starting on 2002-08-08
 http://localhost:3080/addevent/edit-10-supersecret
* "Wicked Game" with 3 days starting on 2002-08-19
 http://localhost:3080/addevent/edit-11-supersecret
* "Jive Talkin'" with 2 days starting on 2002-08-28
 http://localhost:3080/addevent/edit-12-supersecret
* "Wheel of Fortune" with 3 days starting on 2002-08-17
 http://localhost:3080/addevent/edit-13-supersecret
* "Travellin' Band" with 1 days starting on 2002-08-09
 http://localhost:3080/addevent/edit-14-supersecret
* "Bye" with 1 days starting on 2002-08-07
 http://localhost:3080/addevent/edit-15-supersecret
* "The Girl From Ipanema" with 2 days starting on 2002-08-26
 http://localhost:3080/addevent/edit-16-supersecret
* "If (They Made Me a King)" with 2 days starting on 2002-08-15
 http://localhost:3080/addevent/edit-17-supersecret
* "This Used to Be My Playground" with 2 days starting on 2002-08-16
 http://localhost:3080/addevent/edit-18-supersecret
* "Crying" with 5 days starting on 2002-08-27
 http://localhost:3080/addevent/edit-19-supersecret
* "Na Na Hey Hey (Kiss Him Goodbye)" with 2 days starting on 2002-08-13
 http://localhost:3080/addevent/edit-20-supersecret
* "Upside Down" with 1 days starting on 2002-08-28
 http://localhost:3080/addevent/edit-21-supersecret
* "Love Me Do" with 4 days starting on 2002-08-20
 http://localhost:3080/addevent/edit-22-supersecret
* "Breathe" with 5 days starting on 2002-08-09
 http://localhost:3080/addevent/edit-23-supersecret
* "Brandy (You're A Fine Girl)" with 2 days starting on 2002-08-23
 http://localhost:3080/addevent/edit-24-supersecret
* "Swanee" with 2 days starting on 2002-08-16
 http://localhost:3080/addevent/edit-25-supersecret
* "Earth Angel" with 1 days starting on 2002-08-16
 http://localhost:3080/addevent/edit-26-supersecret
* "Let's Get it On" with 1 days starting on 2002-08-25
 http://localhost:3080/addevent/edit-27-supersecret
* "Arthur's Theme (Best That You Can Do)" with 1 days starting on 2002-08-08
 http://localhost:3080/addevent/edit-28-supersecret
* "Sunday" with 1 days starting on 2002-08-25
 http://localhost:3080/addevent/edit-29-supersecret
* "Nothing's Gonna Stop Us Now" with 2 days starting on 2002-08-25
 http://localhost:3080/addevent/edit-30-supersecret
* "Change the World" with 4 days starting on 2002-08-01
 http://localhost:3080/addevent/edit-31-supersecret
* "Tammy" with 2 days starting on 2002-08-10
 http://localhost:3080/addevent/edit-32-supersecret
* "Come Together" with 2 days starting on 2002-08-10
 http://localhost:3080/addevent/edit-33-supersecret
* "Take On Me" with 2 days starting on 2002-08-03
 http://localhost:3080/addevent/edit-34-supersecret
* "Fantasy" with 1 days starting on 2002-08-10
 http://localhost:3080/addevent/edit-35-supersecret
* "Centerfold" with 5 days starting on 2002-08-02
 http://localhost:3080/addevent/edit-36-supersecret
* "I Gotta Feeling" with 2 days starting on 2002-08-18
 http://localhost:3080/addevent/edit-37-supersecret
* "I Can't Get Started" with 2 days starting on 2002-08-19
 http://localhost:3080/addevent/edit-38-supersecret
* "Only The Lonely (Know The Way I Feel)" with 2 days starting on 2002-08-27
 http://localhost:3080/addevent/edit-39-supersecret
* "Escape (The Pina Colada Song)" with 1 days starting on 2002-08-07
 http://localhost:3080/addevent/edit-40-supersecret
* "(Ghost) Riders in the Sky" with 2 days starting on 2002-08-04
 http://localhost:3080/addevent/edit-41-supersecret
* "When a Man Loves a Woman" with 3 days starting on 2002-08-24
 http://localhost:3080/addevent/edit-42-supersecret
* "Dreamlover" with 1 days starting on 2002-08-27
 http://localhost:3080/addevent/edit-43-supersecret
* "Brown Eyed Girl" with 3 days starting on 2002-08-20
 http://localhost:3080/addevent/edit-44-supersecret
* "(They Long to Be) Close to You" with 1 days starting on 2002-08-17
 http://localhost:3080/addevent/edit-45-supersecret
* "Rock With You" with 1 days starting on 2002-08-24
 http://localhost:3080/addevent/edit-46-supersecret