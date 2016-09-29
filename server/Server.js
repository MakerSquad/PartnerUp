// 
// Setup 
// 
var AuthPort = require('authport')
var MakerpassService = require('authport-makerpass')
var LESS = require('node-less-endpoint')

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
 
AuthPort.on('auth', (req, res, data) => {
  db.addToken(data.token, data.data.user.uid) // adds token to db
    .then((e) => {
      console.log("OAuth success! user logged:", data.data.user); // tell server when someone logs in
      res.send(data)
    }).catch((err) => {console.log("auth error:", err); res.status(500).send(err)})
})
 
AuthPort.on('error', (req, res, data) => {
  console.log("OAuth failed.", data)
  console.log("error:", data.err);
  res.status(500).send({ error: 'oauth_failed' })
})

var cookieParser = require('cookie-parser')
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
app.use(cookieParser());

app.get('/vendor.css', LESS.serve('./client/style/reactorcore/index.less'))
app.get('/style.css', LESS.serve('./client/style/index.less'))

app.get("/auth/:service", AuthPort.app);

app.get("/signout", (req, res) =>{
  req.session.destroy(); // clears session on logout
  res.redirect("/");
})

app.get("/currentUser", (req, res) =>{
  MP.me(req.cookies.token) // MakerPass call to get personal data based on token
    .then((user) => res.send(user)) // sends user object
})

app.get("/cohorts", (req, res) => { // done
  db.authenticate(req.cookies.token).then( (uid) => {
    MP.user.groups(uid.user_uid, req.cookies.token)    
    .then((data) => res.send(data))
    .catch((err) => {res.status(401).send(err)})   
  }).catch((err) => {res.status(401).send(err)}) 
})

app.get("/cohort/:groupUid", (req, res) => {
  MP.memberships(req.params.groupUid, req.cookies.token)    
  .then((students) => res.send(students))
  .catch((err) => {console.log("error:", err); res.status(500).send(err)})
})

app.get("/groups", (req, res) => { 
  db.authenticate(req.cookies.token).then((uid) => {
    db.getGroups(uid)
    .then((groups) => res.send(groups))
    .catch((err) => {console.log("error:", err); res.status(500).send(err)})
  }).catch((err) => {res.status(401).send(err)}) 
})

app.get("/group/:groupId", (req, res) => { 
  // db.authenticate(req.cookies.token).then((uid) => {
    db.getGroup(req.params.groupId)
    .then((group) => res.send(group))
    .catch((err) => {console.log("error:", err); res.status(500).send(err)})
  // }).catch((err) => {res.status(401).send(err)}) 
})

app.post("/group", (req, res) => {
  db.authenticate(req.cookies.token).then((uid) => {
    db.addGroup(req.body)
    .then((id) => {
      res.send(id)
    }).catch((err) => {console.log("error:", err); res.status(500).send(err)})
  }).catch((err) => {res.status(401).send(err)}) 
})

app.delete("/group/:groupId", (req, res) => {
   db.authenticate(req.cookies.token).then((uid) => {
    db.deleteGroup(req.params.groupId)
    .then((resp) => {
      res.send(resp)
    }).catch((err) => {console.log("error:", err); res.status(500).send(err)})
  }).catch((err) => {res.status(401).send(err)}) 
})

app.get("/group/:groupId/recent", (req, res) => { // done
  db.authenticate(req.cookies.token).then((uid) => 
      db.getNewGen(req.params.groupId)
      .then((newGen) => res.send(newGen))
      .catch((err) => {console.log("error:", err); res.status(500).send(err)})
  ).catch((err) => {res.status(401).send(err)}) 
})

app.get('/group/:groupId/generations', (req,res) => { // done
  db.authenticate(req.cookies.token).then(() => 
      db.getGenerationsByGroup(group.id)
      .then((generations) => res.send(generations))
      .catch((err) => {console.log("error:", err); res.status(500).send(err)})
  ).catch((err) => {res.status(401).send(err)})
})

// app.delete("/:groupUid/generation/:genId", (req, res) => {    
//   db.authenticate(req.cookies.token)
//   .then((userUid) => db.getGroup({mks_id: req.params.groupUid})
//     .then((group) => 
//       db.deleteGeneration(group.id, req.params.genId)
//       .then((e) => {
//           res.status(202).send(e);
//       }).catch((err) => {console.log("error:", err); res.status(500).send(err)})
//     ).catch((err) => {console.log("error:", err); res.status(500).send(err)})
//   ).catch((err) => {res.status(401).send(err)})
// })    

app.get("/group/:groupId/members", (req, res) => {  // done  
  db.authenticate(req.cookies.token)
  .then((uid) => 
    db.getMemberships(req.params.groupId)
    .then((students) => {
      for(var i=0, people =''; i<students.length; i++) people += (students[i].user_uid + "+");
      MP.Memberships.get('/users/'+people.substring(0,people.length-1), req.cookies.token)
        .then((users)=> {
          for(let i=0; i<students.length; i++) students[i].user = users[i];
          res.send(students)
        }).catch((err) => res.status(500).send(err))
    }).catch((err) => {console.log("error:", err); res.status(500).send(err)})
  ).catch((err) => {res.status(401).send(err)})
})    

app.get('/group/:groupId/pairs', (req,res) => { // done
  db.authenticate(req.cookies.token)
  .then((uid) => db.getPairsForGroup(req.params.groupId)
      .then((pairs) => res.send(pairs))
      .catch((err) => {console.log("error:", err); res.status(500).send(err)})
  ).catch((err) => res.status(401).send(err))
})

app.post('/group/:groupId/pairs', (req, res) => { // done
  db.authenticate(req.cookies.token)
  .then((uid) => 
    db.addPairs(req.body, req.params.groupId).then(data =>
      res.status(201).send(data)
    ).catch((err) => {console.log("error:", err); res.status(500).send(err)})
  ).catch((err) => res.status(401).send(err))
})

// app.delete('/:groupUid/pairs', (req, res) => {
//   db.authenticate(req.cookies.token)
//   .then(() => {
//     db.getGroup({mks_id: req.params.groupUid})
//       .then((groupData) => {
//         console.log('hey looky looky ', groupData.id)
//         db.resetPairs(groupData.id)
//         .then((confirm) => res.status(202).send(confirm))
//         .catch((err) => {console.log("error:", err); res.status(500).send(err)})
//       }).catch((err) => {console.log("error:", err); res.status(500).send(err)})
//   }).catch((err) => {console.log("error:", err); res.status(401).send(err)})
// })

app.get('/generation/:uid', (req, res) => { // done
  db.getGenerationByUid(req.params.uid)
  .then((resp) => res.send(resp))
  .catch((err) => {console.log("error:", err); res.status(500).send(err)})
})

app.get('/user/:uid', (req, res) => { // done
  db.getUserData(req.params.uid)
  .then((resp) => res.send(resp))
  .catch((err) => {console.log("error:", err); res.status(500).send(err)})
})

app.post('/test', (req, res) => {
  console.log('body: ', req.body)
  MP.Memberships.get('/users/ab2bc0473a48+bfc5a48d77ae', req.body.token)
  .then((e)=> res.send(e))
  .catch((err) => res.status(500).send(err))
})

app.get('/test2', (req, res) => {
    db.getTables2().then((d) => res.send(d))
    .catch((err) => res.send(err));
})

app.post('/test1', (req, res) => {
  db.getTables().then((d) => res.send(d))
  .catch((err) => res.send(err));
})

var port = process.env.PORT || 4000
app.listen(port)
console.log('listening on port ' + port)
module.exports = app

