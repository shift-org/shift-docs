# DNS migration notes

----

# What?

Removing the final dependency on our old hosting provider hostpapa, which is
distributing email to our various aliases as configured here:  [https://c101.servername.online:2083/cpsess6411994227/frontend/jupiter/mail/fwds.html](https://c101.servername.online:2083/cpsess6411994227/frontend/jupiter/mail/fwds.html).  This work is not intended to affect sending emails, only receiving and forwarding.  We don't need to remove or reconfigure anything at hostpapa so I won't snapshot settings there as there is nothing to change **within their service's dashviard**.

We'll move to mxroute.com, specifically changing DNS Configuration at netlify [https://app.netlify.com/teams/fool/dns/shift2bikes.org](https://app.netlify.com/teams/fool/dns/shift2bikes.org) from the details targeting hostpapa and adding details targeting mxroute.  We'll write down everything to be changed here so we can revert in case of trouble.

## Old records / settings until 6 May 2024

- (changing) MX  10 mail.shift2bikes.org
- (changing) `TXT @ v=spf1 +a +mx +ip4:44.231.45.51 ~all`
- (untouched; now unnecessary ; can later be removed: `IN A mail.shift2bikes.org 204.44.192.74`)

## New records / settings including mxroute details

- TXT: add `include:mxlogin.com` to existing SPF, `TXT @ v=spf1 +a +mx +ip4:44.231.45.51 include:mxlogin.com ~all`
- TXT add x._domainkey.shift2bikes.org value `"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsCPBpO3ANNX+4KwUI1laAD0dyKlpNt+GMLnrOlMc29q0z/O0zlUr74xDiMwRYJhE40xqX6OCOJAdR+57plC4csThAt2IZjk0YTVL9NBNvB7AeBP0shaBw2NJcxZMP5RI8x773ZKNeMuqRctIuR4UDVYhY9XTCcANoVYyew0TfJOuyQzZk/hQj+lUbjbQVAv9WbS5b6me6TDxWATgqwOnTEdbx2W0PKKZx7TPzE7F8CD5mFWrrjFQZZztvqyPj2XysAglDVIvBHDE90dN5t6MAfMcKuB1IDW13SdQpOhoYMt0Vv585J5pLJDbyCJYRmGJ8FjFT7jBLXVehAUb/ERU7QIDAQAB"`
- MX: 
```
taylor.mxrouting.net (Priority 10)
taylor-relay.mxrouting.net (Priority 20)
```
-



## forwarders created at mxroute (https://taylor.mxrouting.net:2222/evo/user/email/forwarders)

- bikecal@ (4 person dev team)

- bikeracks@ (emee)

- board@shift2bikes.org   shift-bod

- bod@shift2bikes.org     shift-bod

- comm@shift2bikes.org    shift-bod-comm
- communications@shift2bikes.org  shift-bod-comm

- conduct@shift2bikes.org shift-conduct2

- movebybike@shift2bikes.org me
