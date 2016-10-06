// 
// Setup 
// 
var AuthPort = require('authport');
var MakerpassService = require('authport-makerpass');
var LESS = require('node-less-endpoint');

// if (! process.env.MAKERPASS_CLIENT_ID || ! process.env.MAKERPASS_CLIENT_SECRET) {
//   throw new Error("Please set MAKERPASS_CLIENT_ID and MAKERPASS_CLIENT_SECRET")
// }

AuthPort.registerService('makerpass', MakerpassService);

AuthPort.createServer({
  service: 'makerpass',
  id: process.env.MAKERPASS_CLIENT_ID || 'd125322e59940ae2554e017b1bde13259f187bfd2e58c7dc24eed0ec52d980cf',
  secret: process.env.MAKERPASS_CLIENT_SECRET || '6a2324fd5414ab9f68bf8cad62a4e387090b03c8393b5c6e022ece6357bbc06b',
  callbackURL: process.env.HOST + '/auth/makerpass',
})

AuthPort.on('auth', (req, res, data) => {
  var token = hash(data.token);
  MP.user.groups(data.data.user.uid, data.token)    
  .then((groups) => {
    for(var i=0, admin=false; i<groups.length; i++) 
      if(groups[i].user_role !== 'student'){
        admin = true;
        break;
      }
    db.addToken(token, data.data.user.uid, admin) // adds token to db
    .then((e) => {
      console.log('OAuth success! user logged:', data.data.user); // tell server when someone logs in
      res.send(data);
    }).catch((err) => {console.log('auth error:', err); res.status(500).send('' +err);});
  }) .catch((err) => {res.status(401).send('' +err);});
});
 
AuthPort.on('error', (req, res, data) => {
  console.log('OAuth failed.', data);
  console.log('error:', data.err);
  res.status(500).send({ error: 'oauth_failed' });
});

var cookieParser = require('cookie-parser');
var express = require('express');
var session = require('express-session');
var app = express();
var MP = require('node-makerpass');
var path = require('path');
var db = require('./db');
var bodyParser = require('body-parser');
var hash = require('string-hash');

app.use(bodyParser.json());
app.use(session({secret: 'funnyGilby'}));
app.use(express.static(path.join(__dirname, '../client'))); 
app.use(express.static(path.join(__dirname, '../client/app')));
app.use(express.static(path.join(__dirname, '../bower_components')));
app.use(cookieParser());

app.get('/vendor.css', LESS.serve('./client/style/reactorcore/index.less'));
app.get('/style.css', LESS.serve('./client/style/index.less'));

app.get('/auth/:service', AuthPort.app);

app.get('/signout', (req, res) =>{
  req.session.destroy(); // clears session on logout
  res.redirect('/');
});

app.get('/currentUser', (req, res) =>{
  MP.me(req.cookies.token) // MakerPass call to get personal data based on token
    .then((user) => res.send(user)); // sends user object
});

app.get('/cohorts', (req, res) => { // done
  db.authenticate(req.cookies.token)
    .then((uid) => 
      MP.user.groups(uid, req.cookies.token)    
      .then((data) => {
        res.send(data);
      })
    .catch((err) => {res.status(401).send('' +err);})   
    )
    .catch((err) => {res.status(401).send('' +err);}); 
});

app.get('/cohort/:groupUid', (req, res) => {
  db.authenticate(req.cookies.token).then( (uid) => 
    MP.memberships(req.params.groupUid,  req.cookies.token)    
    .then((students) => {
      res.send(students);
    })
    .catch((err) => {res.status(500).send('' +err);})
  ).catch((err) => {res.status(401).send('' +err);});
});

app.get('/groups', (req, res) => { 
  db.authenticate(req.cookies.token).then((uid) => {
    console.log("uid: ", uid)
    db.getGroups(uid)
    .then((groups) => res.send(groups))
    .catch((err) => {res.status(500).send('' +err);});
  }).catch((err) => {res.status(401).send('' +err);}); 
});

app.get('/group/:groupId', (req, res) => { 
  db.authenticate(req.cookies.token, req.params.groupId).then((uid) => {
    db.getGroup(req.params.groupId)
    .then((group) => res.send(group))
    .catch((err) => {res.status(500).send('' +err);});
  }).catch((err) => {res.status(401).send('' +err);}); 
});

app.post('/group', (req, res) => {
  db.authenticate(req.cookies.token).then((uid) => {
    db.addGroup(req.body, uid)
    .then((id) => {
      res.send(''+id);
    }).catch((err) => {res.status(500).send('' +err);});
  }).catch((err) => {res.status(401).send('' +err);}); 
});

app.delete('/group/:groupId', (req, res) => {
  db.authenticateAdmin(req.cookies.token, req.params.groupId).then((uid) => {
    db.deleteGroup(req.params.groupId)
    .then((resp) => {
      res.send(resp);
    }).catch((err) => {res.status(500).send('' +err);});
  }).catch((err) => {res.status(401).send('' +err);}); 
});

app.get('/group/:groupId/recent', (req, res) => { // done
  db.authenticate(req.cookies.token, req.params.groupId).then((uid) => 
      db.getNewGen(req.params.groupId)
      .then((newGen) => res.send(newGen))
      .catch((err) => {res.status(500).send('' +err);})
  ).catch((err) => {res.status(401).send('' +err);}); 
});

app.get('/cancreate', (req, res) => { // done
  db.authenticate(req.cookies.token).then((uid) => 
      db.canCreateGroup(uid)
      .then((resp) => res.send(resp))
      .catch((err) => {res.status(500).send('' +err);})
  ).catch((err) => {res.status(401).send('' +err);}); 
});

app.get('/group/:groupId/generations', (req,res) => { // done
  db.authenticate(req.cookies.token, req.params.groupId).then((uid) => 
      db.getGenerationsByGroup(req.params.groupId)
      .then((generations) => res.send(generations))
      .catch((err) => {res.status(500).send('' +err);})
  ).catch((err) => {res.status(401).send('' +err);});
});    

app.delete('/group/:groupId/generation/:id', (req, res) => {
  db.authenticateAdmin(req.cookies.token, req.params.groupId).then((uid) => 
      db.deleteGeneration(req.params.id)
      .then((resp) => res.send(resp))
      .catch((err) => {res.status(500).send(err);})
  ).catch((err) => {res.status(401).send(err);}); 
});

app.get('/group/:groupId/members', (req, res) => {  // done  
  db.authenticate(req.cookies.token, req.params.groupId)
  .then((uid) => 
    db.getMemberships(req.params.groupId)
    .then((students) => {
      for(var i= 0, people =''; i<students.length; i++) {
        people += students[i].user_uid + '+';
      }
      MP.Memberships.get('/users/'+people.substring(0,people.length-1), req.cookies.token)
        .then((users)=> {
          var usersSeen = {};
          for(let i=0; i < users.length; i++)  usersSeen[users[i].uid] = users[i];
          for(let i=0; i < students.length; i++) students[i].user = usersSeen[students[i].user_uid];
          res.send(students);
        }).catch((err) => res.status(500).send('' +err));
    }).catch((err) => {res.status(500).send('' +err);})
  ).catch((err) => {res.status(401).send('' +err);});
});    

app.get('/group/:groupId/pairs', (req,res) => { // done
  db.authenticate(req.cookies.token, req.params.groupId)
  .then((uid) => db.getPairsForGroup(req.params.groupId)
      .then((pairs) => res.send(pairs))
      .catch((err) => {res.status(500).send('' +err);})
  ).catch((err) => res.status(401).send('' +err));
});

app.post('/group/:groupId/pairs', (req, res) => { // done
  db.authenticateAdmin(req.cookies.token, req.params.groupId)
  .then((uid) => 
    db.addPairs(req.body, req.params.groupId).then(data =>
      res.status(201).send(data)
    ).catch((err) => {res.status(500).send('' +err);})
  ).catch((err) => res.status(401).send('' +err));
});

app.get('/user/:uid', (req, res) => { // done
  db.getUserData(req.params.uid)
  .then((dataArray) => {
    for(var i=0, studentsUid = []; i<dataArray.length; i++){
      if(!studentsUid.includes(dataArray[i].user1_uid)){
       studentsUid.push(dataArray[i].user1_uid);
      }
      if(!studentsUid.includes(dataArray[i].user2_uid)){
        studentsUid.push(dataArray[i].user2_uid);
      }
    }
    MP.Memberships.get('/users/'+studentsUid.join('+'), req.cookies.token)
      .then((users)=> {
        for(var i=0; i<dataArray.length; i++){
          for(var j=0; j<users.length; j++){
            if(dataArray[i].user1_uid == users[j].uid){ 
              dataArray[i].user1 = users[j];
            }
            if(dataArray[i].user2_uid == users[j].uid){
             dataArray[i].user2 = users[j];
            }
          }
        }
        res.send(dataArray);
      }).catch((err) => {res.status(500).send('' +err);});
  }).catch((err) => {res.status(500).send('' +err);});
});


app.get('/test2', (req, res) => {
  db.getTables2().then((d) => res.send(d))
    .catch((err) => res.send('' +err));
});

app.get('/test1', (req, res) => {
  db.getTables().then((d) => res.send(d))
    .catch((err) => res.send('' +err));
});


var port = process.env.PORT || 4000;
app.listen(port);
console.log('listening on port ' + port);
module.exports = app;

