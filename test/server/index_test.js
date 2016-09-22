require('../test-helper.js') // <--- This must be at the top of every test file.

var request = require('supertest-as-promised')
var routes = require(__server + '/Server.js')
describe("The Server", function() {
  it("passes a test", function(){

    expect(true).to.equal(true);
  })
  var app = TestHelper.createApp()
  app.use('/', routes)
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
})
