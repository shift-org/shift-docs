# Versioning

## Version scheme

### General

The project uses a calendar-based scheme for the combined backend & frontend, e.g. `v25.9.1`.

This is abbreviated as `YY.M.rev` below: 
* `YY` = 2 digit year
* `M` = 1 or 2 digit month (i.e. no leading zero)
* `rev` = revision; start with 1, increment to 2, 3, 4 etc as needed within the month


### API

The API follows semantic versioning, e.g. `v3.59.0`. This follows standard `major.minor.patch` conventions.

See `CALENDAR_API.md` for the API changelog.


## Tags

To create an annotated tag in git, enter the following on the command line from within the repo: 

    GIT_COMMITTER_DATE="{YYYY-MM-DDTHH:MM}" git tag -a v{YY.M.rev} {commit}

* `YYYY-MM-DDTHH:MM` = Timestamp for the release; note that you can backdate. (I arbitrarily use 23:00 as the time of day, but if there's only 1 tag for a given day then it doesn't really matter.)
* `YY.M.rev` = calendar-based version number, as described above
* `commit` = sha for the target commit

For the release notes, enter the following: 

    YYYY-MM-DD
    
    * Change 1
    * Change 2
    * Change 3
    * etc.
    * (if API changes) API v{major.minor.patch}

Be as detailed (or not) as you feel like. I generally summarize any significant changes since the prior version, but it doesn't have to be exhaustive. See past release notes for examples.

When you're done, press `:x` to save and quit. 

Then push the tag to remote: 

    git push origin --tags

If you're working from a fork, push it upstream as well: 

    git push upstream --tags


## Releases

To create a release in GitHub: 

1. Go to our [releases page](https://github.com/shift-org/shift-docs/releases) and choose "Draft a new release."
2. Choose the newly-created tag
3. Enter the same `YY.M.rev` version number as the release name
4. Enter the same release notes
5. Un-check "Set as the latest release" if you're backfilling an old version; otherwise leave it checked
6. Publish
