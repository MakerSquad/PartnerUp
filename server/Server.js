var AuthPort = require('authport');
var MakerpassService = require('authport-makerpass');
var LESS = require('node-less-endpoint');
var cookieParser = require('cookie-parser');
var express = require('express');
var session = require('express-session');
var app = express();
var MP = require('node-makerpass');
var path = require('path');
var db = require('./db');
var bodyParser = require('body-parser');
var hash = require('string-hash');

AuthPort.registerService('makerpass', MakerpassService);

AuthPort.createServer({
  service: 'makerpass',
  id: process.env.MAKERPASS_CLIENT_ID || 'd125322e59940ae2554e017b1bde13259f187bfd2e58c7dc24eed0ec52d980cf',
  secret: process.env.MAKERPASS_CLIENT_SECRET || '6a2324fd5414ab9f68bf8cad62a4e387090b03c8393b5c6e022ece6357bbc06b',
  callbackURL: process.env.HOST + '/auth/makerpass'
});

AuthPort.on('auth', (req, res, data) => {
  var token = hash(data.token);
  MP.user.groups(data.data.user.uid, data.token)
  .then(groups => {
    var admin = false;
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].user_role !== 'student') {
        admin = true;
        break;
      }
    }
    db.addToken(token, data.data.user.uid, admin) // adds token to db
    .then(e => {
      console.log('OAuth success! user logged:', data.data.user); // tell server when someone logs in
      res.send(data);
    }).catch(err => {
      res.status(500).send(String(err));
    });
  }).catch(err => {
    res.status(401).send(String(err));
  });
});

AuthPort.on('error', (req, res, data) => {
  console.log('error:', data.err);
  res.status(500).send({error: 'oauth_failed'});
});

app.use(bodyParser.json());
app.use(session({secret: 'funnyGilby'}));
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.static(path.join(__dirname, '../client/app')));
app.use(express.static(path.join(__dirname, '../bower_components')));
app.use(cookieParser());

app.get('/vendor.css', LESS.serve('./client/style/reactorcore/index.less'));
app.get('/style.css', LESS.serve('./client/style/index.less'));

app.get('/auth/:service', AuthPort.app);

/**
Clears session and redirects to root
*/
app.get('/signout', (req, res) => {
  req.session.destroy(); // clears session on logout
  res.redirect('/'); //
});

/**
returns an object with the current user's info
*/
app.get('/currentUser', (req, res) => {
  db.authenticate(req.cookies.token, null, true)
  .then(userData => {
    MP.me(req.cookies.token) // MakerPass call to get personal data
      .then(user => {
        user.admin = userData.admin;
        res.send(user); // sends user object
      }).catch(err => {
        res.status(401).send(String(err));
      });
  })
  .catch(err => {
    res.status(401).send(String(err));
  });
});

/**
returns the cohorts that the current user is a member or administator of
*/
app.get('/cohorts', (req, res) => {
  db.authenticate(req.cookies.token)
    .then(uid => {
      MP.user.groups(uid, req.cookies.token) // MakerPass call to get user group data
      .then(data => {
        res.send(data); // sends an array of cohort objects
      })
      .catch(err => {
        res.status(401).send(String(err));
      });
    })
    .catch(err => {
      res.status(401).send(String(err));
    });
});

/**
returns the students that are members of a particular cohort
*/
app.get('/cohort/:groupUid', (req, res) => {
  db.authenticate(req.cookies.token).then(uid => {
    MP.memberships(req.params.groupUid, req.cookies.token) // MakerPass call to student info for cohort
    .then(students => {
      res.send(students); // sends an array of student objects
    })
    .catch(err => {
      res.status(401).send(String(err));
    });
  })
  .catch(err => {
    res.status(401).send(String(err));
  });
});

/**
returns the pools that the current user is a member or administator of
*/
app.get('/groups', (req, res) => {
  db.authenticate(req.cookies.token).then(uid => {
    db.getGroups(uid)
    .then(groups => {
      res.send(groups); // sends an array of pools
    })
    .catch(err => {
      res.status(500).send(String(err));
    });
  })
  .catch(err => {
    res.status(401).send(String(err));
  });
});

/**
returns the information for a particular pool
*/
app.get('/group/:groupId', (req, res) => {
  db.authenticate(req.cookies.token, req.params.groupId)
  .then(uid => {
    db.getGroup(req.params.groupId)
    .then(group => {
      MP.user(group.creator, req.cookies.token) // MakerPass call to get user data
      .then(userData => {
        group.user = userData;
        res.send(group); // sends an object with the pool's info
      })
      .catch(err => {
        res.status(500).send(String(err));
      });
    })
    .catch(err => {
      res.status(500).send(String(err));
    });
  })
  .catch(err => {
    res.status(401).send(String(err));
  });
});

/**
creates a pool in the database, and adds members to the pool
*/
app.post('/group', (req, res) => {
  db.authenticate(req.cookies.token).then(uid => {
    db.addGroup(req.body, uid)
    .then(id => {
      res.send(String(id)); // sends the id of the pool in the groups table
    })
    .catch(err => {
      res.status(500).send(String(err));
    });
  })
  .catch(err => {
    res.status(401).send(String(err));
  });
});

/**

*/
app.delete('/group/:groupId', (req, res) => {
  db.authenticateAdmin(req.cookies.token, req.params.groupId)
  .then(uid => {
    db.deleteGroup(req.params.groupId)
    .then(resp => {
      res.send(resp);
    })
    .catch(err => {
      res.status(500).send(String(err));
    });
  })
  .catch(err => {
    res.status(401).send(String(err));
  });
});

/**

*/
app.get('/group/:groupId/recent', (req, res) => { // done
  db.authenticate(req.cookies.token, req.params.groupId)
  .then(uid => {
    db.getNewGen(req.params.groupId)
      .then(newGen => res.send(newGen))
      .catch(err => {
        res.status(500).send(String(err));
      });
  })
  .catch(err => {
    res.status(401).send(String(err));
  });
});

/**

*/
app.get('/cancreate', (req, res) => { // done
  db.authenticate(req.cookies.token)
  .then(uid => {
    db.canCreateGroup(uid)
      .then(resp => res.send(resp))
      .catch(err => {
        res.status(500).send(String(err));
      });
  })
  .catch(err => {
    res.status(401).send(String(err));
  });
});

/**

*/
app.get('/group/:groupId/generations', (req, res) => { // done
  db.authenticate(req.cookies.token, req.params.groupId)
  .then(uid => {
    db.getGenerationsByGroup(req.params.groupId)
      .then(generations => res.send(generations))
      .catch(err => {
        res.status(500).send(String(err));
      });
  })
  .catch(err => {
    res.status(401).send(String(err));
  });
});

/**

*/
app.delete('/group/:groupId/generation/:id', (req, res) => {
  db.authenticateAdmin(req.cookies.token, req.params.groupId)
  .then(uid => {
    db.deleteGeneration(req.params.id)
      .then(resp => res.send(resp))
      .catch(err => {
        res.status(500).send(err);
      });
  })
  .catch(err => {
    res.status(401).send(err);
  });
});

/**

*/
app.get('/group/:groupId/members', (req, res) => {  // done
  db.authenticate(req.cookies.token, req.params.groupId)
  .then(uid => {
    db.getMemberships(req.params.groupId)
    .then(students => {
      var people = ''; // string
      for (var i = 0; i < students.length; i++) {
        people += students[i].user_uid + '+';
      }
      MP.Memberships.get('/users/' + people.substring(0, people.length - 1), req.cookies.token)
        .then(users => {
          var usersSeen = {};
          for (let i = 0; i < users.length; i++) {
            usersSeen[users[i].uid] = users[i];
          }
          for (let i = 0; i < students.length; i++) {
            students[i].user = usersSeen[students[i].user_uid];
          }
          res.send(students);
        })
        .catch(err => {
          res.status(500).send(String(err));
        });
    })
    .catch(err => {
      res.status(500).send(String(err));
    });
  })
  .catch(err => {
    res.status(401).send(String(err));
  });
});

/**

*/
app.get('/group/:groupId/pairs', (req, res) => { // done
  db.authenticate(req.cookies.token, req.params.groupId)
  .then(uid => {
    db.getPairsForGroup(req.params.groupId)
      .then(pairs => res.send(pairs))
      .catch(err => {
        res.status(500).send(String(err));
      });
  })
  .catch(err => {
    res.status(401).send(String(err));
  });
});

/**

*/
app.post('/group/:groupId/pairs', (req, res) => { // done
  db.authenticateAdmin(req.cookies.token, req.params.groupId)
  .then(uid => {
    db.addPairs(req.body, req.params.groupId)
    .then(data => {
      res.status(201).send(data);
    })
    .catch(err => {
      res.status(500).send(String(err));
    });
  })
  .catch(err => {
    res.status(401).send(String(err));
  });
});

/**

*/
app.get('/user/:uid', (req, res) => { // done
  db.authenticate(req.cookies.token, null, true)
  .then(userAuthData => {
    if (userAuthData.user_uid !== req.params.uid && !userAuthData.admin) {
      res.status(401).send("you may only acess your own history, make sure you are logged in");
    } else {
      db.getUserData(req.params.uid)
      .then(dataArray => {
        var studentsUid = [];
        for (let i = 0; i < dataArray.length; i++) {
          if (!studentsUid.includes(dataArray[i].user1_uid)) {
            studentsUid.push(dataArray[i].user1_uid);
          }
          if (!studentsUid.includes(dataArray[i].user2_uid)) {
            studentsUid.push(dataArray[i].user2_uid);
          }
        }
        MP.Memberships.get('/users/' + studentsUid.join('+'), req.cookies.token)
          .then(users => {
            for (var i = 0; i < dataArray.length; i++) {
              for (var j = 0; j < users.length; j++) {
                if (dataArray[i].user1_uid === users[j].uid) {
                  dataArray[i].user1 = users[j];
                }
                if (dataArray[i].user2_uid === users[j].uid) {
                  dataArray[i].user2 = users[j];
                }
              }
            }
            res.send(dataArray);
          })
          .catch(err => {
            res.status(500).send(String(err));
          });
      })
      .catch(err => {
        res.status(500).send(String(err));
      });
    }
  }).catch(err => res.status(401).send(String(err)));
});

var port = process.env.PORT || 4000;
app.listen(port);
console.log('listening on port ' + port);
module.exports = app;

