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
 
AuthPort.on('auth', (req, res, data) => {
  // console.log("OAuth success! user logged:", data.user);
  // req.session.accessToken = data.token;
  // req.session.uid = data.data.user.uid;
  // req.session.user = data.data.user;
  db.addToken(data.token, data.data.user.uid)
    .then((e) => {
      // console.log("data in auth", data)
      res.send(data)
    })
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

app.get("/auth/:service", AuthPort.app);

app.get("/signout", (req, res) =>{
  req.session.destroy();
  res.redirect("/")
})

app.get("/currentUser", (req, res) =>{
  MP.me(req.cookies.token)
    .then((user) => {
      console.log('user: ', user);
      res.send(user)
    })
})

app.get("/myGroups", (req, res) => {  
  db.authenticate(req.cookies.token).then( (uid) => {
    MP.user.groups(uid.user_uid, req.cookies.token)    
    .then((data)=> { 
      db.addGroups(data)
        .then((groups) => res.send(groups))
        .catch((err) => {console.log("error:", err); res.status(500).send(err)})
    }).catch((err) => {res.status(401).send(err)})   
  }).catch((err) => {res.status(401).send(err)}) 
})


app.get("/:groupUid/recent", (req, res) => {  
  db.authenticate(req.cookies.token)
  .then(() => 
  db.getGroup({name: req.params.groupUid})
    .then((group) => 
      db.getNewGen(group.id)
      .then((newGen) => 
        res.send(newGen)
      ).catch((err) => {console.log("error:", err); res.status(500).send(err)})
    ).catch((err) => {console.log("error:", err); res.status(500).send(err)})
  ).catch((err) => {res.status(401).send(err)}) 
}

app.get('/:groupUid/generations', (req,res) => {
  db.authenticate(req.cookies.token)
  .then(() => db.getGroup({mks_id: req.params.groupUid})
    .then((group) => 
      db.getGenerationsByGroup(group.id)
      .then((generations) => {
          res.send(generations);
      }).catch((err) => {console.log("error:", err); res.status(500).send(err)})
    ).catch((err) => {console.log("error:", err); res.status(500).send(err)})
  ).catch((err) => {res.status(401).send(err)})
})

app.delete("/:groupUid/generation/:genId", (req, res) => {    
  db.authenticate(req.cookies.token)
  .then((userUid) => db.getGroup({mks_id: req.params.groupUid})
    .then((group) => 
      db.deleteGeneration(group.id, req.params.genId)
      .then((e) => {
          res.status(202).send(e);
      }).catch((err) => {console.log("error:", err); res.status(500).send(err)})
    ).catch((err) => {console.log("error:", err); res.status(500).send(err)})
  ).catch((err) => {res.status(401).send(err)})
})    

app.get("/:groupUid/members", (req, res) => {    
  db.authenticate(req.cookies.token)
  .then(() => {db.getGroup({mks_id: req.params.groupUid})
    .then((group) => {
      MP.memberships(group.mks_id, req.cookies.token)    
      .then((students) => {   
        res.send(students);   
      }).catch((err) => {console.log("error:", err); res.status(500).send(err)})
    }).catch((err) => {console.log("error:", err); res.status(500).send(err)})
  }).catch((err) => {res.status(401).send(err)})
})    

app.get('/:groupUid/pairs', (req,res) => {
  db.authenticate(req.cookies.token)
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
  db.authenticate(req.cookies.token)
  .then(() => {
    db.addPairs(req.body, req.params.groupUid).then(data => 
      res.status(201).send(data)
    ).catch((err) => {console.log("error:", err); res.status(500).send(err)})
  }).catch((err) => res.status(401).send(err))
})

app.delete('/:groupUid/deletePairs', (req, res) => {
  db.authenticate(req.cookies.token)
  .then(() => {
    db.getGroup({mks_id: req.params.groupUid})
      .then((groupData) => {
        console.log('hey looky looky ', groupData.id)
        db.resetPairs(groupData.id)
        .then((confirm) => res.status(202).send(confirm))
        .catch((err) => {console.log("error:", err); res.status(500).send(err)})
      }).catch((err) => {console.log("error:", err); res.status(500).send(err)})
  }).catch((err) => {console.log("error:", err); res.status(401).send(err)})
})
app.get('/test', (req, res) => {
  // console.log('session: ', req.session)
 db.addPairs(req.body.name)
  .then((d) => {
     res.send(d)
  }).catch((err) => res.status(401).send(err))
})

app.get('/test2', (req, res) => {
    db.getTables().then((d) => res.send(d))
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

