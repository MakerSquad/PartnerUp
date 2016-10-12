# PartnerUp
By [MakerSquad](https://github.com/makersquad)

[**_PartnerUp_**](http://partnerup.makerpass.com) is an app built for [**Hack Reactor Software Engineering Immersive**](http://www.hackreactor.com), aimed at automating the process of creating student groups for coding exercises, whiteboarding, large projects, etc., with a few base goals in mind:

  - Students who have previously worked together should not be paired together again until it is necessary
  - The history of past groupings should be recorded and should be accessible both for whole classes, and for individual students.
  - Instructors should have _full control_ over the groupings, able to manually move students around and overwrite the automated groupings any way they desire
  - Students should also be able to create groups for people in their classes for personal study sessions, hackathons, or even just recreational tournaments outside of programming

PartnerUp is fully integrated with Hack Reactor's _MakerPass_, allowing for smooth implementation into the existing course administration and structure. Thus, in its current state, PartnerUp is not usable without a MakerPass account (although there is a neat demo you can play around with :slightly_smiling_face:)

## Setup
To continue the development of PartnerUp, there are a few steps you'll need to take after cloning the repo:

Install dependencies:
```js
$ npm install
```
The npm install script will also run a bower install to download client-side dependencies

Set up local databases:
```js
# Set up database
$ createdb partner_up_dev
$ createdb partner_up_test
$ npm run migrate
$ NODE_ENV=test npm run migrate
```
PartnerUp connects to a remote database in production, but will use local databases in the development and test environments.

Fill in Makerpass Client Information:

The Makerpass App information is not pushed up to Github and will need to be retrieved from a Makerpass administrator

Find the TOFILLOUT_makerpassInfo.js file in server/:
  ```js
  //  TODO: Fill this out with the makerpass information
  //  Save as a new file "makerpassInfo.js" in this same folder

  module.exports = {
    id: MAKERPASS_CLIENT_ID,
    secret: MAKERPASS_CLIENT_SECRET
  };
  ```

Fill in this file with the app's information and save it as a new file "makerpassInfo.js" in the server folder

That's it! You're now ready to partner up with the PartnerUp team!

## Terminal Commands for Development
To start the server:
```js 
# Start server
$ npm start
```

To run tests:
```js
# Endpoint tests (Back-end)
$ npm test

# Front-end Unit Tests
$ npm run frontendTest
```

## Built With
PartnerUp's production tech stack employs:
  - AngularJS 1
  - Express.js
  - Node.js
  - PostgreSQL
  - AuthPort (OAuth)

And for testing:
  - Karma
  - Jasmine
  - Mocha

## Authors
- [Ryan Walter](https://github.com/rwalter215)
- [Elliot Cheung](https://github.com/ezcheung)
- [Kathryn Hansen](https://github.com/kathrynmhansen)
- [Iliya Svirsky](https://github.com/iliyasvirsky)

## Acknowledgements
- [Gilbert Garza](https://github.com/mindeavor) and [Jamie Sowder](https://github.com/knowrat) for serving as both our clients and our mentors; hopefully PartnerUp will help you teach future classes to build bigger and better things 

## Licensing
PartnerUp is licensed under the MIT license