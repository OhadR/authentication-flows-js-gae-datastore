# <img src="images/favicon.ico" alt="logo" height="40"/> <img src="images/google_appengine_logo.png" alt="logo" height="40"/>  authentication-flows-js-gae-datastore

[![npm Package](https://img.shields.io/npm/v/authentication-flows-js-gae-datastore.svg?style=flat-square)](https://www.npmjs.org/package/authentication-flows-js-gae-datastore)

This project is a **Google AppEngine Datastore implementation** for `AuthenticationAccountRepository` of 
[authentication-flows-js](https://github.com/OhadR/authentication-flows-js).


## environment variables

none!


### deploy to Google AppEngine

the app (note: the hosting app, not this package!) is deployed on Google's PaaS, AppEngine. A sample app is at:
https://github.com/OhadR/authentication-flows-js-app/tree/gae-impl (note the `gae-impl` branch)

to deploy to GAE:

    gcloud app deploy
