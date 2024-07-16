# Frontend development with Netlify

This page is archived from the main readme. Running locally with Netlify is no longer a core supported configuration. Netlify does however still run the production frontend. So this information might be useful.

While creating a pull request does automatically deploy a preview of the frontend to Netlify, you can also create previews manually: this could help you do things like theme development in your own repository before submitting your pr.

1. [fork repo](https://help.github.com/articles/fork-a-repo/)
2. read the comments in the netlify.toml file around changing the build command in the `[context.production]` section and make changes if needed.
2. [deploy on Netlify](https://app.netlify.com/start) by linking your forked repo.  Included configuration file `netlify.toml` should mean 0 additional configuration required to get the site running.  If you get a build failure around access denied for ssh, you probably need the advice in step 2 just above this!

If you have trouble with it please [file an issue](https://github.com/shift-org/shift-docs/issues/new) to let us know what you tried and what happened when you did.
