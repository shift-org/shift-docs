# Testing

To test the backend, at the root of repo run: `npm test`.


All tests use the [Node Test runner](https://nodejs.org/docs/latest/api/test.html#test-runner), with [supertest](https://github.com/forwardemail/supertest) for making (local) http requests.

## Isolating tests:

Tests can be identified by name: ex. `npm test -- --test-name-pattern="ical feed"`

Or, temporarily can be marked with 'only' in the code. For example: `describe.only()`, and then selected with: `npm test -- --test-only```

By default tests use sqlite, you can test against mysql as well:  `npm test -db=mysql`. It launches a standalone docker container for the tests. Additionally, `npm test -db_debug` will log queries to the db.

# Test Data

fakeData.js generates the following events:

* http://localhost:3080/addevent/edit-23204-supersecret
   "The Tracks of My Tears" with 1 days starting on Thu, Aug 1st
* http://localhost:3080/addevent/edit-23205-supersecret
   "Knock On Wood" with 1 days starting on Tue, Aug 20th
* http://localhost:3080/addevent/edit-23206-supersecret
   "Tonight's the Night (Gonna Be Alright)" with 2 days starting on Fri, Aug 2nd
* http://localhost:3080/addevent/edit-23207-supersecret
   "One" with 2 days starting on Fri, Aug 2nd
* http://localhost:3080/addevent/edit-23208-supersecret
   "Whip It" with 4 days starting on Fri, Aug 16th
* http://localhost:3080/addevent/edit-23209-supersecret
   "Losing My Religion" with 5 days starting on Thu, Aug 22nd
* http://localhost:3080/addevent/edit-23210-supersecret
   "I'm a Believer" with 1 days starting on Tue, Aug 20th
* http://localhost:3080/addevent/edit-23211-supersecret
   "Hips don't lie" with 1 days starting on Wed, Aug 28th
* http://localhost:3080/addevent/edit-23212-supersecret
   "Living For the City" with 1 days starting on Thu, Aug 1st
* http://localhost:3080/addevent/edit-23213-supersecret
   "Shake Down" with 1 days starting on Thu, Aug 8th
* http://localhost:3080/addevent/edit-23214-supersecret
   "Wicked Game" with 3 days starting on Mon, Aug 19th
* http://localhost:3080/addevent/edit-23215-supersecret
   "Jive Talkin'" with 2 days starting on Wed, Aug 28th
* http://localhost:3080/addevent/edit-23216-supersecret
   "Wheel of Fortune" with 3 days starting on Sat, Aug 17th
* http://localhost:3080/addevent/edit-23217-supersecret
   "Travellin' Band" with 1 days starting on Fri, Aug 9th
* http://localhost:3080/addevent/edit-23218-supersecret
   "Bye" with 1 days starting on Wed, Aug 7th
* http://localhost:3080/addevent/edit-23219-supersecret
   "The Girl From Ipanema" with 2 days starting on Mon, Aug 26th
* http://localhost:3080/addevent/edit-23220-supersecret
   "If (They Made Me a King)" with 2 days starting on Thu, Aug 15th
* http://localhost:3080/addevent/edit-23221-supersecret
   "This Used to Be My Playground" with 2 days starting on Fri, Aug 16th
* http://localhost:3080/addevent/edit-23222-supersecret
   "Crying" with 5 days starting on Tue, Aug 27th
* http://localhost:3080/addevent/edit-23223-supersecret
   "Na Na Hey Hey (Kiss Him Goodbye)" with 2 days starting on Tue, Aug 13th
* http://localhost:3080/addevent/edit-23224-supersecret
   "Upside Down" with 1 days starting on Wed, Aug 28th
* http://localhost:3080/addevent/edit-23225-supersecret
   "Love Me Do" with 4 days starting on Tue, Aug 20th
* http://localhost:3080/addevent/edit-23226-supersecret
   "Breathe" with 5 days starting on Fri, Aug 9th
* http://localhost:3080/addevent/edit-23227-supersecret
   "Brandy (You're A Fine Girl)" with 2 days starting on Fri, Aug 23rd
* http://localhost:3080/addevent/edit-23228-supersecret
   "Swanee" with 2 days starting on Fri, Aug 16th
* http://localhost:3080/addevent/edit-23229-supersecret
   "Earth Angel" with 1 days starting on Fri, Aug 16th
* http://localhost:3080/addevent/edit-23230-supersecret
   "Let's Get it On" with 1 days starting on Sun, Aug 25th
* http://localhost:3080/addevent/edit-23231-supersecret
   "Arthur's Theme (Best That You Can Do)" with 1 days starting on Thu, Aug 8th
* http://localhost:3080/addevent/edit-23232-supersecret
   "Sunday" with 1 days starting on Sun, Aug 25th
* http://localhost:3080/addevent/edit-23233-supersecret
   "Nothing's Gonna Stop Us Now" with 2 days starting on Sun, Aug 25th
* http://localhost:3080/addevent/edit-23234-supersecret
   "Change the World" with 4 days starting on Thu, Aug 1st
* http://localhost:3080/addevent/edit-23235-supersecret
   "Tammy" with 2 days starting on Sat, Aug 10th
* http://localhost:3080/addevent/edit-23236-supersecret
   "Come Together" with 2 days starting on Sat, Aug 10th
* http://localhost:3080/addevent/edit-23237-supersecret
   "Take On Me" with 2 days starting on Sat, Aug 3rd
* http://localhost:3080/addevent/edit-23238-supersecret
   "Fantasy" with 1 days starting on Sat, Aug 10th
* http://localhost:3080/addevent/edit-23239-supersecret
   "Centerfold" with 5 days starting on Fri, Aug 2nd
* http://localhost:3080/addevent/edit-23240-supersecret
   "I Gotta Feeling" with 2 days starting on Sun, Aug 18th
* http://localhost:3080/addevent/edit-23241-supersecret
   "I Can't Get Started" with 2 days starting on Mon, Aug 19th
* http://localhost:3080/addevent/edit-23242-supersecret
   "Only The Lonely (Know The Way I Feel)" with 2 days starting on Tue, Aug 27th
* http://localhost:3080/addevent/edit-23243-supersecret
   "Escape (The Pina Colada Song)" with 1 days starting on Wed, Aug 7th
* http://localhost:3080/addevent/edit-23244-supersecret
   "(Ghost) Riders in the Sky" with 2 days starting on Sun, Aug 4th
* http://localhost:3080/addevent/edit-23245-supersecret
   "When a Man Loves a Woman" with 3 days starting on Sat, Aug 24th
* http://localhost:3080/addevent/edit-23246-supersecret
   "Dreamlover" with 1 days starting on Tue, Aug 27th
* http://localhost:3080/addevent/edit-23247-supersecret
   "Brown Eyed Girl" with 3 days starting on Tue, Aug 20th
* http://localhost:3080/addevent/edit-23248-supersecret
   "(They Long to Be) Close to You" with 1 days starting on Sat, Aug 17th
* http://localhost:3080/addevent/edit-23249-supersecret
   "Rock With You" with 1 days starting on Sat, Aug 24th
