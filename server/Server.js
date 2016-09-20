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
  // console.log("OAuth success!", data);
  req.session.accessToken = data.token;
  req.session.uid = data.data.user.uid;
  req.session.user = data.data.user;
  res.redirect('/database/updateGroups')
})
 
AuthPort.on('error', function(req, res, data) {
  console.log("OAuth failed.", data)
  res.status(500).send({ error: 'oauth_failed' })
})
 
 
// 
// Adding to your express app 
// 
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

app.get("/myGroups", function(req, res){
  MP.user.groups(req.session.uid, req.session.accessToken)
  .then(function(data){
    console.log("Makerpass groups data: ", data);
    res.send(data);
  })
})

app.get("/currentUser", function(req, res){
  res.send(req.session.user);
})

app.get("/groups/:nameId", function(req, res){
  MP.group(req.params.nameId, req.session.accessToken)
  .then(function(data){
    console.log("Data for this group: ", data);
    res.send(data);
  })
})

app.get("/groups/:nameId/memberships", function(req, res){
  MP.memberships(req.params.nameId, req.session.accessToken)
  .then(function(data){
    console.log("Data for members: ", data);
    res.send(data);
  })
})

app.get('/database/myGroups', (req, res) =>{
  db.getGroupsForStudent(req.session.uid).then((groups) =>{
    var mergeGroup = [];
    for(let i=0; i<groups.length; i++) mergeGroup.push(groups[i][0])
    res.send(mergeGroup)
  })

})

app.get('/database/updateGroups', (req, res) => {
    var promiseArray = []
    MP.user.groups(req.session.uid, req.session.accessToken)
      .then(function(data){
        for(let i=0; i<data.length; i++){
        promiseArray.push(db.addGroup({name: data[i].name, groupId:data[i].uid}).then((e) => {
           MP.memberships(data[i].name_id, req.session.accessToken)
            .then(function(members){
              db.addStudents(members)
            }).catch((err) => {console.log("error: ",err); res.status(500).send(err)})
          }).catch((err) => {console.log("error: ",err); res.status(500).send(err)}))
        }
        Promise.all(promiseArray).then((e)=>{res.redirect("/")})
        .catch((err) => {console.log("error at promise.all: ",err); res.status(500).send(err)})
      }).catch((err) => {console.log("error: ",err); res.status(500).send(err)})

})
app.get('/database/:groupName/members', (req,res) => {

  db.getGroup({name: req.params.groupName})
  .then((data) => {
    db.getStudentsByGroup(data[0].mks_id)
    .then((data) => {
      db.getStudentData(data).then((students) => {
      res.send(students);
      }).catch((err) => res.status(500).send(err))
    })
    .catch((err) => res.status(500).send(err))
  })
  .catch((err) => res.status(500).send(err));
})

app.get('/database/:groupName/pairs', (req,res) => {
  db.getGroup({name: req.params.groupName})
  .then(data => {
    db.getPairsForGroup(data[0].id, req.params.groupName)
    .then((pairs) => {
      res.send(pairs)
    })
  })


})

app.get('/database/getUsersPartOfSameGroup', (req, res) => {
  db.findOrCreateAdmin({uid: req.session.uid, name: req.session.name}).then((id) => {
    console.log("id", id)
      db.getStudentsByGroup(id.uid).then((groups) => {
        res.send(groups) // send back an array with students that have groups that you can control over
      }).catch((err) => res.status(500).send(err)) // error probably db is down or something elsrong
  }).catch((err) => {
   console.log("error: ", err);
   res.status(401).send("error", err)
  })
})


app.get('/test', (req, res) => {
  db.getTables()
    .then((data) => {
      res.status(200).send(data)
    })
     .catch((err) => {
      console.log('errror: ', err)
      res.status(404).send()
    })
})

var port = process.env.PORT || 4000
app.listen(port)
console.log('listening on port ' + port)