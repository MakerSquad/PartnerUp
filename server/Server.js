// 
// Setup 
// 
var AuthPort = require('authport')
var MakerpassService = require('authport-makerpass')

// if (! process.env.MAKERPASS_CLIENT_ID || ! process.env.MAKERPASS_CLIENT_SECRET) {
//   throw new Error("Please set MAKERPASS_CLIENT_ID and MAKERPASS_CLIENT_SECRET")
// }
 
AuthPort.registerService('makerpass', MakerpassService)
 
AuthPort.createServer({
  service: 'makerpass',
  id: process.env.MAKERPASS_CLIENT_ID || 'd125322e59940ae2554e017b1bde13259f187bfd2e58c7dc24eed0ec52d980cf',
  secret: process.env.MAKERPASS_CLIENT_SECRET || '6a2324fd5414ab9f68bf8cad62a4e387090b03c8393b5c6e022ece6357bbc06b',
  callbackURL: process.env.HOST + '/auth/makerpass',
})
 
AuthPort.on('auth', function(req, res, data) {
  // console.log("OAuth success! user logged:", data.user);
  // req.session.accessToken = data.token;
  // req.session.uid = data.data.user.uid;
  // req.session.user = data.data.user;
  db.addToken(data.token, data.data.user.uid)
    .then((dbData) => {
      res.send(data.token)
    })
})
 
AuthPort.on('error', function(req, res, data) {
  console.log("OAuth failed.", data)
  console.log("error:", data.err);
  res.status(500).send({ error: 'oauth_failed' })
})

var express = require('express')
var session = require('express-session')
var app = express()
var MP = require('node-makerpass');
var path = require('path');
var db = require('./db');
var bodyParser = require('body-parser');

app.use(bodyParser.json());

app.use(session({secret: "funnyGilby"}));
app.use(express.static(path.join(__dirname, '../client'))); 
app.use(express.static(path.join(__dirname, '../client/app')));
app.use(express.static(path.join(__dirname, '../bower_components')));
app.get("/auth/:service", AuthPort.app);

app.get("/signout", function(req, res){
  req.session.destroy();
  res.redirect("/")
})

app.get("/currentUser", function(req, res){
  console.log('header: ', req.headers)
  db.authenticate(req.headers.token)
    .then((uid) => {
      res.send(uid);
    })
})

app.get("/myGroups", function(req, res){    
  MP.user.groups(req.session.uid, req.session.accessToken)    
  .then(function(data){ 
    db.addGroups(data)
      .then((groups) => res.send(groups))
      .catch((err) => {console.log("error:", err); res.status(500).send(err)})
  }).catch((err) => {res.status(401).send(err)})    
})

app.get('/:groupUid/generations', (req,res) => {
  db.authenticate(req.headers.token)
  .then(() => db.getGroup({mks_id: req.params.groupUid})
    .then((data) => 
      db.getGenerationsByGroup(data.id)
      .then((generations) => {
          res.send(generations);
      }).catch((err) => {console.log("error:", err); res.status(500).send(err)})
    ).catch((err) => {console.log("error:", err); res.status(500).send(err)})
  ).catch((err) => {res.status(401).send(err)})
})

app.get("/:groupUid/members", function(req, res){    
  db.authenticate(req.headers.token)
  .then(() => {db.getGroup({mks_id: req.params.groupUid})
    .then((group) => {
      MP.memberships(group.mks_id, req.session.accessToken)    
      .then(function(students){   
        res.send(students);   
      }).catch((err) => {console.log("error:", err); res.status(500).send(err)})
    }).catch((err) => {console.log("error:", err); res.status(500).send(err)})
  }).catch((err) => {res.status(401).send(err)})
})    

app.get('/:groupUid/pairs', (req,res) => {
  db.authenticate(req.headers.token)
  .then(() => {
    console.log(req.params.groupUid)
    db.getGroup({mks_id: req.params.groupUid})
    .then(data => {
      db.getPairsForGroup(data.id, req.params.groupName)
      .then((pairs) => res.send(pairs))
      .catch((err) => {console.log("error:", err); res.status(500).send(err)})
    }).catch((err) => {console.log("error:", err); res.status(500).send(err)})
  }).catch((err) => res.status(401).send(err))
})

app.post('/:groupUid/pairs', (req, res) => {
  db.authenticate(req.headers.token)
  .then(() => {
    db.addPairs(req.body, req.params.groupUid).then(data => 
      res.status(201).send(data)
    ).catch((err) => {console.log("error:", err); res.status(500).send(err)})
  }).catch((err) => res.status(401).send(err))
})

app.get('/test', (req, res) => {
  // console.log('session: ', req.session)
  db.getTables().then( (d) => res.send(d))
  .catch((err) => res.send(err));
})

app.post('/test1', (req, res) => {
  // console.log('session: ', req.session)
  db.addToken(req.body.user, req.body.token).then( (d) => res.send(d))
  .catch((err) => res.send(err));
})

var port = process.env.PORT || 4000
app.listen(port)
console.log('listening on port ' + port)
module.exports = app

