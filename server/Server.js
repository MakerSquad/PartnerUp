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
  console.log("OAuth success! user logged:", data.user);
  req.session.accessToken = data.token;
  req.session.uid = data.data.user.uid;
  req.session.user = data.data.user;
  res.redirect('/')
})
 
AuthPort.on('error', function(req, res, data) {
  console.log("OAuth failed.", data)
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
  res.send(req.session.user);
})

app.get("/myGroups", function(req, res){    
  MP.user.groups(req.session.uid, req.session.accessToken)    
  .then(function(data){ 
    db.addGroups(data)
      .then((groups) => {
        console.log("Makerpass groups data: ", groups);   
        res.send(groups);   
      })
  })    
})

app.get('/:groupName/generations', (req,res) => {
  db.authenticate(req.session.uid)
  .then(() => 
    db.getGroup({name: req.params.groupName})
    .then((data) => 
      db.getGenarationsByGroup(data[0].id)
      .then((genarations) => {
          res.send(genarations);
      }).catch((err) => res.status(500).send(err))
    ).catch((err) => res.status(500).send(err))
  ).catch((err) => {
      console.log('errror: ', err)
      res.status(401).redirect("/")
    })
})

app.get("/:groupName/members", function(req, res){    
  db.authenticate(req.session.uid)
  .then(() => {
    db.getGroup({name: req.params.groupName})
    .then((group) => {
      MP.memberships(group.mks_id, req.session.accessToken)    
      .then(function(students){      
        res.send(students);   
      }).catch((err) => res.status(500).send(err))
    }).catch((err) => res.status(500).send(err))
  }).catch((err) => {
      res.status(401).redirect("/")
    })    
})

app.get('/:groupName/pairs', (req,res) => {
  db.authenticate(req.session.uid)
  .then(() =>
    db.getGroup({name: req.params.groupName})
    .then(data => {
      db.getPairsForGroup(data.id, req.params.groupName)
      .then((pairs) => {
        res.send(pairs)
      })
    })
  ).catch((err) => {
      console.log('errror: ', err)
      res.status(401).redirect("/")
    })
})

app.post('/:groupName/pairs', (req, res) => {
  db.authenticate(req.session.uid)
  .then(() => 
    res.send(db.addPairs(req.body, req.params.groupName))
  ).catch((err) => {
      console.log('errror: ', err)
      res.status(401).redirect("/")
    })
})

app.get('/test', (req, res) => {
  console.log('session: ', req.session)
  db.authenticate(req.session.uid)
    .then((data) => {
      res.status(200).send(data)
    })
     .catch((err) => {
      res.status(401).redirect("/")
    })
})

var port = process.env.PORT || 4000
app.listen(port)
console.log('listening on port ' + port)
module.exports = app

