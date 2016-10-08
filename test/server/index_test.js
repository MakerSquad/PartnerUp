require('../test-helper.js'); // <--- This must be at the top of every test file.
var request = require('supertest-as-promised');
var routes = require(__server + '/Server.js');
var db = require;

describe("The Server", function() {
  //  beforeEach(function() {
  //   return db.deleteEverything()
  // });
  var testUser = {"uid": "3a9137d82c2b", "name": "Elliot Cheung", "email": "elliotccheung@yahoo.com", "avatar_url": "https://avatars.githubusercontent.com/u/9095159?v=3"};
  var app = TestHelper.createApp();
  app.use('/', routes);
  app.testReady();

  describe("Basic endpoint requirements", function() {
    it_("can get to the default endpoint", function * () {
      yield request(app)
        .get('/')
        .expect(200);
    });

    it_("will 404 on a bad request", function * () {
      yield request(app)
        .get('/notarealendpoint')
        .expect(404);

      yield request(app)
        .post('/alsonotanendpoint')
        .expect(404);

      yield request(app)
        .delete('/definitelynotanendpoint')
        .expect(404);
    });
  });

  describe("Authorization", function() {
    it_("will give 401 when tring to get/edit/delete group data without session", function * () {
      yield request(app)
        .get('/group/1')
        .expect(401);

      yield request(app)
        .post('/group')
        .expect(401);

      yield request(app)
        .get('/groups')
        .expect(401);

      yield request(app)
        .delete('/group/1')
        .expect(401);
    });

    it_("will give 401 when tring to get/edit/delete pair data without session", function * () {
      yield request(app)
        .get('/group/1/generations')
        .expect(401);

      yield request(app)
        .get('/group/1/recent')
        .expect(401);

      yield request(app)
        .get('/group/1/members')
        .expect(401);

      yield request(app)
        .get('/group/1/pairs')
        .expect(401);

      yield request(app)
        .post('/group')
        .send({
          members: [{
            user_uid: '3a9137d82c2b',
            role: 'student'
          }],
          groupData: {
            name: 'test1',
            group_size: 2
          }
        })
        .expect(401);

      yield request(app)
      .delete('/group/1/generations/1')
      .expect(401);
    });
  });

  describe("The group endpoints", function() {
    it_("can post and retrieve a group", function * () {
      process.env.TEST_AUTH = true;

      yield request(app)
        .post('/group')
        .send({
          members: [{
            user_uid: '3a9137d82c2b',
            role: 'student'
          }],
          groupData: {
            name: 'test1',
            group_size: 2
          }
        })
        .expect(201);

      yield request(app)
        .get('/group/1')
        .expect(200)
        .expect(function(response) {
          expect(response.body.id).to.not.be.null;
        });
    });

    it_("can retrieve a user's groups and respond with a 200 status", function * () {
      process.env.TEST_AUTH = true;

      yield request(app)
        .get('/groups')
        .expect(200)
        .expect(function(response) {
          expect(response.body[0].id).to.not.be.null;
        });
    });

    it_("can delete a group and respond with a 200 status", function * () {
      process.env.TEST_AUTH = true;

      yield request(app)
        .delete('/group/2')
        .expect(200);
    });

    it_("will respond with a 500 status when sent invalid data", function * () {
      process.env.TEST_AUTH = true;

      yield request(app)
        .post('/group')
        .send({
          members: [{
            uid: 'notaUID',
            hobby: 5
          }],
          Data: {
            name: 'notvalid',
            size: 100
          }
        })
        .expect(500);

      yield request(app)
        .delete('/group/200000000')
        .expect(500);
    });
  });

  describe("The past pair endpoints", function() {
    it_("can post and retrieve pairs for a given class", function * () {
      process.env.TEST_AUTH = true;

      yield request(app)
        .post('/group/1/pairs')
        .send({
          "pairs": [["ddad747d5fab", "77955d3eb662"], ["06df31cdd4bf", "90b72025841d"]],
          "genTitle": "testtesttest",
          "groupSize": 2
        })
        .expect(201);

      yield request(app)
        .get('/group/1/pairs')
        .expect(200)
        .expect(function(response) {
          expect(response.body.length).to.not.be.null;
        });
    });

    it_("will respond with a 500 status when sent invalid data", function * () {
      process.env.TEST_AUTH = true;

      yield request(app)
        .post('/group/1/pairs')
        .send({
          "pairs": [[5, 7], [3, 9]],
          "genTitle": "testtesttest",
          "groupSize": 2
        })
        .expect(500);
    });
  });

  describe("The generations endpoints", function() {
    it_("can get the generations for a group", function * () {
      process.env.TEST_AUTH = true;

      yield request(app)
        .get('/group/1/generations')
        .expect(200)
        .expect(function(response) {
          expect(response.body.length).to.not.be.null;
        });
    });

    it_("can delete the generations of a group", function * () {
      process.env.TEST_AUTH = true;

      yield request(app)
        .delete('/group/1/generation/1')
        .expect(200);
    });

    it_("will respond with 500 status when sent an invalid delete request", function * () {
      process.env.TEST_AUTH = true;

      yield request(app)
        .delete('/group/1/generation/10000')
        .expect(500);
    });
  });
});
