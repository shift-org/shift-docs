Node js port of the 2023 Shift Calendar php backend. Only includes code actively in use; excludes all legacy code.

# Node Packages

* **dayjs**: for date and time handling
* **express**: process http requests for individual endpoints.
* **knex**: sql statement generator.
* **multer**: handles multi-part forms and file uploading.
* **mysql2**: a mysql driver ( for knex ).
* **nodemailer**: communicates with sendmail ( can also interact with aws directly and could be used for html emails, and calendar ical attachments. )
* **nunjucks**: template engine for generating html, mail, and ical output.
* **validator**: helper to validate and sanitize user input.
* **wordwrapjs**: wrap text at a given width.

```
shift@1.0.0
├── dayjs@1.11.7
├─┬ express@4.18.2
│ ├─┬ accepts@1.3.8
│ │ ├─┬ mime-types@2.1.35
│ │ │ └── mime-db@1.52.0
│ │ └── negotiator@0.6.3
│ ├── array-flatten@1.1.1
│ ├─┬ body-parser@1.20.1
│ │ ├── bytes@3.1.2
│ │ ├── content-type@1.0.5 deduped
│ │ ├── debug@2.6.9 deduped
│ │ ├── depd@2.0.0 deduped
│ │ ├── destroy@1.2.0
│ │ ├── http-errors@2.0.0 deduped
│ │ ├─┬ iconv-lite@0.4.24
│ │ │ └── safer-buffer@2.1.2 deduped
│ │ ├── on-finished@2.4.1 deduped
│ │ ├── qs@6.11.0 deduped
│ │ ├─┬ raw-body@2.5.1
│ │ │ ├── bytes@3.1.2 deduped
│ │ │ ├── http-errors@2.0.0 deduped
│ │ │ ├── iconv-lite@0.4.24 deduped
│ │ │ └── unpipe@1.0.0 deduped
│ │ ├── type-is@1.6.18 deduped
│ │ └── unpipe@1.0.0
│ ├─┬ content-disposition@0.5.4
│ │ └── safe-buffer@5.2.1 deduped
│ ├── content-type@1.0.5
│ ├── cookie-signature@1.0.6
│ ├── cookie@0.5.0
│ ├─┬ debug@2.6.9
│ │ └── ms@2.0.0
│ ├── depd@2.0.0
│ ├── encodeurl@1.0.2
│ ├── escape-html@1.0.3
│ ├── etag@1.8.1
│ ├─┬ finalhandler@1.2.0
│ │ ├── debug@2.6.9 deduped
│ │ ├── encodeurl@1.0.2 deduped
│ │ ├── escape-html@1.0.3 deduped
│ │ ├── on-finished@2.4.1 deduped
│ │ ├── parseurl@1.3.3 deduped
│ │ ├── statuses@2.0.1 deduped
│ │ └── unpipe@1.0.0 deduped
│ ├── fresh@0.5.2
│ ├─┬ http-errors@2.0.0
│ │ ├── depd@2.0.0 deduped
│ │ ├── inherits@2.0.4
│ │ ├── setprototypeof@1.2.0 deduped
│ │ ├── statuses@2.0.1 deduped
│ │ └── toidentifier@1.0.1
│ ├── merge-descriptors@1.0.1
│ ├── methods@1.1.2
│ ├─┬ on-finished@2.4.1
│ │ └── ee-first@1.1.1
│ ├── parseurl@1.3.3
│ ├── path-to-regexp@0.1.7
│ ├─┬ proxy-addr@2.0.7
│ │ ├── forwarded@0.2.0
│ │ └── ipaddr.js@1.9.1
│ ├─┬ qs@6.11.0
│ │ └─┬ side-channel@1.0.4
│ │   ├─┬ call-bind@1.0.2
│ │   │ ├── function-bind@1.1.1
│ │   │ └── get-intrinsic@1.2.0 deduped
│ │   ├─┬ get-intrinsic@1.2.0
│ │   │ ├── function-bind@1.1.1 deduped
│ │   │ ├── has-symbols@1.0.3
│ │   │ └─┬ has@1.0.3
│ │   │   └── function-bind@1.1.1 deduped
│ │   └── object-inspect@1.12.3
│ ├── range-parser@1.2.1
│ ├── safe-buffer@5.2.1
│ ├─┬ send@0.18.0
│ │ ├── debug@2.6.9 deduped
│ │ ├── depd@2.0.0 deduped
│ │ ├── destroy@1.2.0 deduped
│ │ ├── encodeurl@1.0.2 deduped
│ │ ├── escape-html@1.0.3 deduped
│ │ ├── etag@1.8.1 deduped
│ │ ├── fresh@0.5.2 deduped
│ │ ├── http-errors@2.0.0 deduped
│ │ ├── mime@1.6.0
│ │ ├── ms@2.1.3
│ │ ├── on-finished@2.4.1 deduped
│ │ ├── range-parser@1.2.1 deduped
│ │ └── statuses@2.0.1 deduped
│ ├─┬ serve-static@1.15.0
│ │ ├── encodeurl@1.0.2 deduped
│ │ ├── escape-html@1.0.3 deduped
│ │ ├── parseurl@1.3.3 deduped
│ │ └── send@0.18.0 deduped
│ ├── setprototypeof@1.2.0
│ ├── statuses@2.0.1
│ ├─┬ type-is@1.6.18
│ │ ├── media-typer@0.3.0
│ │ └── mime-types@2.1.35 deduped
│ ├── utils-merge@1.0.1
│ └── vary@1.1.2
├─┬ knex@2.4.2
│ ├── colorette@2.0.19
│ ├── commander@9.5.0
│ ├─┬ debug@4.3.4
│ │ └── ms@2.1.2
│ ├── escalade@3.1.1
│ ├── esm@3.2.25
│ ├── get-package-type@0.1.0
│ ├── getopts@2.3.0
│ ├── interpret@2.2.0
│ ├── lodash@4.17.21
│ ├── pg-connection-string@2.5.0
│ ├─┬ rechoir@0.8.0
│ │ └─┬ resolve@1.22.1
│ │   ├─┬ is-core-module@2.11.0
│ │   │ └── has@1.0.3 deduped
│ │   ├── path-parse@1.0.7
│ │   └── supports-preserve-symlinks-flag@1.0.0
│ ├── resolve-from@5.0.0
│ ├── tarn@3.0.2
│ └── tildify@2.0.0
├─┬ multer@1.4.5-lts.1
│ ├── append-field@1.0.0
│ ├─┬ busboy@1.6.0
│ │ └── streamsearch@1.1.0
│ ├─┬ concat-stream@1.6.2
│ │ ├── buffer-from@1.1.2
│ │ ├── inherits@2.0.4 deduped
│ │ ├─┬ readable-stream@2.3.8
│ │ │ ├── core-util-is@1.0.3
│ │ │ ├── inherits@2.0.4 deduped
│ │ │ ├── isarray@1.0.0
│ │ │ ├── process-nextick-args@2.0.1
│ │ │ ├── safe-buffer@5.1.2
│ │ │ ├─┬ string_decoder@1.1.1
│ │ │ │ └── safe-buffer@5.1.2
│ │ │ └── util-deprecate@1.0.2
│ │ └── typedarray@0.0.6
│ ├─┬ mkdirp@0.5.6
│ │ └── minimist@1.2.8
│ ├── object-assign@4.1.1
│ ├── type-is@1.6.18 deduped
│ └── xtend@4.0.2
├─┬ mysql2@3.2.0
│ ├── denque@2.1.0
│ ├─┬ generate-function@2.3.1
│ │ └── is-property@1.0.2
│ ├─┬ iconv-lite@0.6.3
│ │ └── safer-buffer@2.1.2
│ ├── long@5.2.1
│ ├── lru-cache@7.18.3
│ ├─┬ named-placeholders@1.1.3
│ │ └── lru-cache@7.18.3 deduped
│ ├── seq-queue@0.0.5
│ └── sqlstring@2.3.3
├── nodemailer@6.9.1
├─┬ nunjucks@3.2.3
│ ├── a-sync-waterfall@1.0.1
│ ├── asap@2.0.6
│ ├─┬ chokidar@3.5.3
│ │ ├─┬ anymatch@3.1.3
│ │ │ ├── normalize-path@3.0.0 deduped
│ │ │ └── picomatch@2.3.1
│ │ ├─┬ braces@3.0.2
│ │ │ └─┬ fill-range@7.0.1
│ │ │   └─┬ to-regex-range@5.0.1
│ │ │     └── is-number@7.0.0
│ │ ├── fsevents@2.3.2
│ │ ├─┬ glob-parent@5.1.2
│ │ │ └── is-glob@4.0.3 deduped
│ │ ├─┬ is-binary-path@2.1.0
│ │ │ └── binary-extensions@2.2.0
│ │ ├─┬ is-glob@4.0.3
│ │ │ └── is-extglob@2.1.1
│ │ ├── normalize-path@3.0.0
│ │ └─┬ readdirp@3.6.0
│ │   └── picomatch@2.3.1 deduped
│ └── commander@5.1.0
├── validator@13.9.0
└── wordwrapjs@5.1.0
```