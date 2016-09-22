require('../test-helper.js') // <--- This must be at the top of every test file.

var request = require('supertest-as-promised')
var routes = require(__server + '/Server.js')
describe("The Server", function() {
  it("passes a test", function(){

    expect(true).to.equal(true);
  })
  var testUser = {"uid":"3a9137d82c2b","name":"Elliot Cheung","email":"elliotccheung@yahoo.com","avatar_url":"https://avatars.githubusercontent.com/u/9095159?v=3"}
  var app = TestHelper.createApp();
  app.use('/', routes);
  app.testReady()

  it_("can get to the default endpoint", function * () {

    //
    // Notice how we're in a generator function (indicated by the the *)
    // See test/test-helper.js for details of why this works.
    //
    yield request(app)
      .get('/')
      .expect(200)
  })

  it_("will 404 on a bad request", function * (){
    yield request(app)
      .get('/notarealendpoint')
      .expect(404)

    yield request(app)
      .post('/alsonotanendpoint')
      .expect(404)
  })

  describe("The past pair endpoints", function(){
    it_("can retrieve pairs for a given class", function * (){
      process.env.TEST_AUTH = true;
      yield request(app)
        .get('/MKS43/pairs')
        .expect(200)
        .expect(function(response){
          expect(Array.isArray(response.body)).to.equal(true);
        })
    })
  })
})
