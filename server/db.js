var pg = require('pg');
var config = require('../knexfile.js');
var env = process.env.NODE_ENV || 'production';
/**
  @class database
*/
var knex = require('knex')(config[env]);
var hash = require('string-hash');

'use strict';
knex.migrate.latest([config[env]]);

const maxForStudent = 2; // Change this verible to set how many groups a student can create!
const adminRoles = ['instructor', 'fellow', 'memberAdmin']; // admin roles

/** ***************************************************** Authentication *******************************************************/

/**
  Authenticates a user, can change modify if admin rights needed or group if group is needed,
  also allows to check rights for a group
  @memberof database

  @param {String} token Session we get from MakerPass,
  @param {Int} [groupId=null] extra to see if user has acess to group,
  @param {Bool} [needData=false] return changed to object if true (full data (like admin bool etc...))
  @param {Bool} [modify=false] if needs to modify group user must have rights there

  @return {String|Object} throws promise.reject if users doesnt exist
*/
knex.authenticate = (token = 'null', groupId = null, needData = false, modify = false) => {
  // return Promise.resolve("3a9137d82c2b"); //for easy testing
  if (process.env.TEST_AUTH) return Promise.resolve("3a9137d82c2b"); // for test env
  var encToken = hash(token);
  return knex('auth').where('token', encToken) // check for token in auth
    .then(userUid => { // userUid is an array
      if (userUid.length) { // if userUID.length checks if users exist at all
        if (groupId) { // test if need to test the group
          return knex('group_membership').where({user_uid: userUid[0].user_uid, group_id: groupId})
          .returning('*')
          .then(userDataForGroup => { // userDataForGroup is array of 1 of info for the group
            if (userDataForGroup.length) { // test if there is anything there at all
              // test if user has any of the admin rights and if they are needed (modify)
              console.log("role", adminRoles.includes(userDataForGroup[0].role));
              if (adminRoles.includes(userDataForGroup[0].role) && modify) {
                return Promise.resolve(userUid[0]);
              }
              // test if the rest of the data is needed and not need to modify
              if (needData && !modify) {
                return Promise.resolve(userUid[0]);
              }
              // if you just need basic data and not to modify
              if (!modify) {
                return Promise.resolve(userUid[0].user_uid);
              }
              return Promise.resolve(userUid[0]);
            }
            // if you didnt pass any of the auth things you get regected
            return Promise.reject('sorry you are not in that group');
          }).catch(err => {
            throw new Error(err + '\n Unable to authenticate user');
          }); // throw error if something went horribly wrong
        }
        // if need data but group doesnt matter
        if (needData) {
          return Promise.resolve(userUid[0]);
        }
        // if doesnt need data and group is doesnt matter
        return Promise.resolve(userUid[0].user_uid);
      } // if user exist then resolve
      return Promise.reject('401 Unauthorized, please make sure you are logged in'); // else send a 401 error
    }).catch(err => {
      throw new Error(err + '\n Unable to authenticate user');
    }); // throw error if something went horribly wrong
};

/**
  adds a token to auth table
  @memberof database

  @param {String} userToken adds the token to auth table,
  @param {String} userUid assosiates UID to token,
  @param {String} adminStatus to see acess user is allowed to have

  @return {String} throws 401 if no session or user UID if there is
*/
knex.addToken = (userToken, userUid, adminStatus) => {
  return knex('auth').where('user_uid', userUid).returning('user_uid') // check if user exist
  .then(uid => { // array with MakerPass uid
    if (uid.length) // if user exist update it
      return knex('auth').where({user_uid: userUid}).update({token: userToken, admin: adminStatus}).returning('*')
      .then(authData => authData[0]) // return the updated token with user
      .catch(err => {
        throw new Error('Unable to add token, ' + err);
      }); // throw error if something went horribly wrong
     // add user to auth table
    return knex('auth').insert({user_uid: userUid, token: userToken, admin: adminStatus}).returning('*') // add token and token to auth table
      .then(authData => authData[0]) // return the new token with user
      .catch(err => {
        throw new Error(err + '\n Unable to add token');
      });// throw error if something went horribly wrong
  }).catch(err => {
    throw new Error(err + '\n Unable to find token');
  }); // throw error if something went horribly wrong
};

/** ************************************************** Groups insert/del/get ****************************************************/

/**
  gives an array of group objects from group and memberships
  @memberof database

  @param {String} userUid user_uid in the database

  @typeof {Object} groupArray

  @property {Int}     groupArray.id         - join table id(gets delted right after),
  @property {String}  groupArray.user_uid   - MKS user uid,
  @property {Int}     groupArray.group_id   - group,
  @property {String}  groupArray.role       - the role of the user,
  @property {String}  groupArray.name       - group name,
  @property {Int}     groupArray.size       - size of the group,
  @property {String}  groupArray.creator    - MKS user that created table uid,
  @property {date}    groupArray.created_at - created date

  @return {groupArray} arrayOfgroupArrays
*/
knex.getGroups = userUid => {
  var groupArray = knex('group_membership').where("user_uid", userUid)
    .join('groups', 'groups.id', "=", "group_membership.group_id")
    .select('*', "*") // join table to get groups for a user and the memeberships for the group
    .then(groupData => {
      for (let i = 0; i < groupData.length; i++) {
        groupData[i].size = groupData[i].group_size; // remodeled for front end
        delete groupData[i].group_size;
      }
      return groupData;
    }).catch(err => {
      throw new Error(err + '\n error getting data from groups');
    }); // throw error if something went horribly wrong

  return groupArray;
};

/**
  gets a specific group object
  @memberof database

  @param {String} groupId group id in the database

  @typeof {Object} group

  @property {Int}     group.groupId         - group data base id (as as param),
  @property {String}  groupArray.name       - group name,
  @property {Int}     groupArray.size       - size of the group,
  @property {String}  groupArray.creator    - MKS user that created table uid,
  @property {date}    groupArray.created_at - created date

  @return {group} groupObject

*/
knex.getGroup = groupId => {
  return knex('groups').where('id', groupId)
  .returning('*')
  .then(group => group[0]) // returns the group as an object
  .catch(err => {
    throw new Error(err + '\n cannot access groups, ');
  }); // throw error if something went horribly wrong
};

/**
  adds group with members to the database
  @memberof database

  @typeof {Object} groupData

  @property {String}  groupArray.name       - group name,
  @property {Int}     groupArray.size       - size of the group,
  @property {String}  groupArray.creator    - MKS user that created table uid,

  @typeof {Object} member

  @property {Int}     member.id    - join table id(gets delted right after),
  @property {String}  member.role  - role of the user,

  @param {Object} group array of members and groupData
  @param {String} creator the Uid of the creator

  @return {int} id Id of the new cleated group
*/
knex.addGroup = (group, creator) => {
  return knex.canCreateGroup(creator) // checks if non admin user reached limit
  .then(canCreate => {
    if (!canCreate) { // if limit is reached
      return Promise.reject('sorry you reached your limit');
    }
    return knex('groups').where('name', group.groupData.name)
    .returning('id')
    .then(id => { // checks if group exist with the same naem
      if (id.length === 0) {
        // inserts new group to the groups table to get an id
        return knex('groups').insert({
          name: group.groupData.name,               // the name given in params
          group_size: group.groupData.group_size,   // the size given in params
          creator: creator                          // the creator given in params
        })
        .returning('id')
        .then(groupId => { // group id for new group
          var rows = []; // rows set for batch insert
          for (let i = 0; i < group.members.length; i++) {
            rows.push({
              user_uid: group.members[i].user_uid,    // goes and adds each user to the group
              group_id: groupId[0],                  // the group id which returned from creation
              role: group.members[i].role             // the role given in params
            });
          }
          // adds all group connections in table
          return knex.batchInsert('group_membership', rows, rows.length)
          .then(resp => groupId[0]) // returns the group id
          .catch(err => {
            throw new Error(err + '\n Batch Insert Failed due to: ');
          }); // throw error if something went horribly wrong
        })
        .catch(err => {
          throw new Error(err + '\n Failed to add to groups');
        }); // throw error if something went horribly wrong
      } // if !exist
      return id[0]; // returns the group if it exist
    })
    .catch(err => {
      throw new Error(err + '\n Failed to authenticate create groups');
    }); // throw error if something went horribly wrong
  })
  .catch(err => {
    throw new Error(err + '\n Failed to authenticate create groups');
  }); // throw error if something went horribly wrong
};

/**
  checks if student and if so checks if user can create table
  change maxForStudent for how many groups a student can create

  @memberof database

  @param {String} creator the person who attemping to create the group,

  @return {Bool} creatingGroup if user can create group
*/
knex.canCreateGroup = creator => {
  return knex('auth').where('user_uid', creator)
    .returning('admin')
    .then(status => {
      // checks if user has admin rights (if adminRoles but not adminMember)
      if (status[0].admin) {
        return true; // if so there is no limit on groups
      }
      return knex('groups').where('creator', creator)
      .returning('*')
      .then(groups => {
        // checks if user reached limit for amount of groups created
        if (groups.length < maxForStudent) { // change maxForStudent varible to set how many groups students can create
          return true; // returns true if user can create more pools
        }
        return false; // if user reached limit
      })
      .catch(err => {
        throw new Error(err + '\n cant creat group');
      });
    })
    .catch(err => {
      throw new Error(err + '\n cant access auth table');
    });
};

/**
  Deletes everything related to a group
  @memberof database
  @param {Int} groupId the id of the group that needs to be deleted,

  @return {String} 'pairs deleted' if user can create group
*/
knex.deleteGroup = groupId => {
  // delete from group talbe
  return knex('groups').where('id', groupId)
  .del()
  .then(e => { // e for even
    // delete from join table
    return knex('group_membership').where('group_id', groupId)
    .del()
    .then(e => { // e for even
      // delete from generations talbe
      return knex('generations').where('group_id', groupId)
      .del()
      .returning('*')
      .then(genData => { // everthing deleted
        var genIds = []; // all generation ids that were deleted
        for (var i = 0; i < genData.length; i++) {
          genIds.push(genData[0].id);
        }
        // delete all pairs with from the generaions that were deleted
        return knex('pairs').whereIn('gen_table_id', genIds)
        .del()
        .then(() => 'group deleted')
        .catch(err => {
          throw new Error(err + '\n cannot delete pairs from pairs table');
        });  // throw error if something went horribly wrong
      })
      .catch(err => {
        throw new Error(err + '\n cannot delete generations from generations table');
      });  // throw error if something went horribly wrong
    })
    .catch(err => {
      throw new Error(err + '\n cannot delete users from group membership table');
    });  // throw error if something went horribly wrong
  })
  .catch(err => {
    throw new Error(err + '\n cannot delete group from groups table');
  });  // throw error if something went horribly wrong
};

/**
  gets all memberts for a group
  @typeof {Object} member
  @memberof database getMemberships
  @property {Int}     member.UserUid  - uid of the users,
  @property {String}  member.role     - role of the user,

  @param {Int} [groupId] the id of the group that needs to get members of,

  @return {member} members Array of member objects
*/
knex.getMemberships = groupId => {
  return knex('group_membership').where('group_id', groupId).returning('*')
  .then(students => students)
  .catch(err => {
    throw new Error(err + '\n cannot get membeships for that group');
  }); // throw error if something went horribly wrong
};

/** ********************************************* Pairs and Generations insert/del/get ***********************************************/

/**
  function that adds all pairs to database and creates generation
  @memberof database
  @typeof {Array} pairs - array of tuples (2 varible array) of 2 uids [(user1_uid, user2_uid), (user1_uid, user2_uid), ...]

  @typeof {Object} pairData
  @property {pairs}  pairData.pairs      - pairs array (tuples),
  @property {string} pairData.genTitle   - title of the pairs generation,
  @property {Int}    pairData.groupSize  - size of the group for history,

  @param {pairData} pairData data of all the pairs
  @param {String}   groupId the group id that pairs are added to

  @return {String} 'pairs added' if everything worked
*/
knex.addPairs = (pairData, groupId) => {
  return addGeneration({ // private functions that returns the id
    groupId: groupId,
    genTitle: pairData.genTitle,
    groupSize: pairData.groupSize
  }) // adds or finds generation for group
  .then(genId => { // gets the generation Id for each pair
    // i for index and row for each pair
    var rows = [];
    // format it for vatchInsert
    for (let i = 0; i < pairData.pairs.length; i++) {
      rows.push({ // row for batch insert
        user1_uid: pairData.pairs[i][0], // user 1
        user2_uid: pairData.pairs[i][1], // user 2
        gen_table_id: genId // generation id on database
      });
    }
    return knex.batchInsert('pairs', rows, pairData.pairs.length) // insert all the pairs into database for history
    .then(e => ('pairs added')) // returns string for client that pair is added
    .catch(err => {
      throw new Error(err + '\n Batch Inrest Failed');
    }); // throw error if something went horribly wrong
  }).catch(err => {
    throw new Error(err + '\n Unable to create generation');
  }); // throw error if something went horribly wrong
};

/**
  Private function (in db.js) to add generation when new group is created
  @access private
  @memberof database

  @typeof {Object} genData
  @property {pairs}  genData.pairs    - pairs array (tuples),
  @property {string} genData.genTitle - title of the pairs generation,
  @property {Int}    genData.groupId  - size of the group for history,

  @param {genData} genData data of all the pairs
  @param {String}   groupId the group id that pairs are added to

  @return {Int} generation Id
*/
function addGeneration(genData) {
  // test if SAME generation exist
  return knex('generations').where({
    group_id: genData.groupId,
    title: genData.genTitle,
    group_size: genData.groupSize
  })
  .returning('*')
  .then(exist => {
    if (!exist.length) { // if array is empty
      return knex('generations').where({group_id: genData.groupId})
      .returning('*')
      .then(next => {
        return knex('generations').insert({
          group_id: genData.groupId, // adds the group
          title: genData.genTitle, // adds the title
          group_size: genData.groupSize// group size for better history
        }).returning('id').then(id => id[0]);// returns the id
      })
      .catch(err => {
        throw new Error(err + '\n unable to create new generation');
      }); // throw error if something went horribly wrong
    }
    return exist[0].id; // if exist it will just return old generation id
  })
  .catch(err => {
    throw new Error(err + '\n parems aren\'t correct when calling addGeneration');
  }); // throw error if something went horribly wrong
}

/**
  Deletes everything related to a group
  @memberof database

  @param {Int} id the id of the generation that needs to be deleted,

  @return {String} 'generation deleted' once deleted
*/
knex.deleteGeneration = id => {
  // delete generation from gen table
  return knex('generations').where('id', id)
  .del()
  .then(resp => {
    // deletes generation from pairs
    return knex('pairs').where('gen_table_id', id)
    .del()
    .then(resp => 'generation deleted')
    .catch(err => {
      throw new Error(err + '\n cannot delete pairs from pair table');
    });
  })
  .catch(err => {
    throw new Error(err + '\n cannot delete group from groups table');
  });  // throw error if something went horribly wrong
};

/**
  getPairs will return all the pairs for a group in a specific format
  @memberof database

  @typeof {Array} groupPairs an array of pairs with generations
  @property {pair}       groupPairs.pairs    - an array of pair object,
  @property {generation} groupPairs.generation - title of the pairs generation,

  @typeof {Object} pair a single pair with generation id
  @property {String} pair.user1_uid - Users Uid,
  @property {string} pair.user2_uid - Users Uid,
  @property {Int} pair.gen_table_id - ID of the pairs generation,

  @typeof {Object} generation a single pair with generation id
  @property {String} generation.group_id - id of the group assosiated with,
  @property {string} generation.title    - title of the generation,
  @property {Int} generation.group_size  - the size of the pairs (or you 3+ poeple),
  @property {date} generation.created_at - the date when generation was created,

  @param {Int}   groupId the group id that pairs needed from to

  @return {groupPairs} groupPairs its an array that contain pair data and generation data for entries with group id
*/
knex.getPairs = groupId => {
  return knex('generations').where("group_id", groupId)
        .join('pairs', 'pairs.gen_table_id', "=", "generations.id")
        .select('*', "*")
        // by default they dont exist
        .then(info => { // gets all generations and pairs that are togather
          // throw error if no pairs for that generation
          var pairsData = []; // format the data/info for the front end
          for (let i = 0; i < info.length; i++) {
            // in case data is changed to null
            if (!info[i]) {
              continue;
            }
            // add a new generationData
            pairsData.push({
              // data organized for front-end
              generationData: {
                id: info[i].gen_table_id,         // generation id
                title: info[i].title,             // title or name of generation
                group_id: info[i].group_id,       // id of the group *will always be the same
                group_size: info[i].group_size,   // size of the groups
                created_at: info[i].created_at    // the date of creation
              },
              pairs: [] // creating the pairs array to push things into later
            });
            // adds all the pairs to generations
            for (let j = 0; j < info.length; j++) {
              // in case data is changed to null
              if (!info[j]) {
                continue;
              }
              // checks if pair matches a new generation
              if (pairsData[pairsData.length - 1].generationData.id === info[j].gen_table_id) {
                pairsData[pairsData.length - 1].pairs.push({
                  user1_uid: info[j].user1_uid,       // users uid
                  user2_uid: info[j].user2_uid,       // another user uid
                  gen_table_id: info[j].gen_table_id  // id of the generation
                });
                info[j] = null; // remove it so i dont add a pair twice
              }
            }
          }
          // pairsData as an array of objects for front end
          return pairsData;
        })
        .catch(err => {
          throw new Error(err + '\n cannot get join pairs and gen table');
        });  // throw error if something went horribly wrong
};

/**
  getGenerationsByGroup will return all the generations for a group
  @memberof database

  @typeof {Array} generationData an array of pairs with generations
  @property {generation} generationData.generation - generation data,

  @typeof {Object} generation a single pair with generation id
  @property {String} generation.group_id - id of the group assosiated with,
  @property {string} generation.title    - title of the generation,
  @property {int} generation.group_size  - the size of the pairs (or you 3+ poeple),
  @property {date} generation.created_at - the date when generation was created,

  @param {int} groupId the group id that pairs needed from to

  @return {generationData} generationData its an array that contain pair data and generation data for entries with group id
*/
knex.getGenerationsByGroup = groupId => {
  return knex('generations').where('group_id', groupId)
  .returning('*')
  .then(gen => gen) // returns all gens for id
  .catch(err => {
    throw new Error(err + '\n cannot get generation by group');
  }); // throw error if something went horribly wrong
};

/**
  getNewGen will return all the newest pairs for a group with generation in a specific format
  @memberof database

  @typeof {Object} groupPairs is the generation and pair data
  @property {pair}       groupPairs.pairs    - an array of pair object,
  @property {generation} groupPairs.generation - title of the pairs generation,

  @typeof {Object} pair a single pair with generation id
  @property {String} pair.user1_uid - Users Uid,
  @property {string} pair.user2_uid - Users Uid,
  @property {Int} pair.gen_table_id - ID of the pairs generation,

  @typeof {Object} generationData a single pair with generation id
  @property {String} generationData.group_id - id of the group assosiated with,
  @property {string} generationData.title    - title of the generation,
  @property {Int} generationData.group_size  - the size of the pairs (or you 3+ poeple),
  @property {date} generation.created_at - the date when generation was created,

  @param {Int} groupId the group id that pairs needed from to

  @return {groupPairs} groupPairs its an array that contain pair data and generation data for entries with group id
*/
knex.getNewGen = groupId => {
  return knex('generations').where('group_id', groupId)
  .returning('*')
  .then(next => {
    // checks for latest creation
    var maxIndex = 0; // latest generation
    for (let i = 0; i < next.length; i++) {
      if (next[i].id > maxIndex) {
        maxIndex = i; // if id is later will change to it (only for updated)
      }
    }
    return knex('pairs').where('gen_table_id', next[maxIndex].id).returning('*')
    .then(pairs => {
      return {
        generationData: next[maxIndex],
        pairs: pairs
      };
    })
    .catch(err => {
      throw new Error(err + '\n cannot find pairs, ');
    }); // throw error if something went horribly wrong
  }).catch(err => {
    throw new Error(err + '\n cannot find gen_id, ');
  }); // throw error if something went horribly wrong
};

/** ***************************************************** Misc (user things) *******************************************************/

/**
  Gets all the data(history) for a single user in a very specific format
  @memberof database

  @typeof {Object} UserData is the generation and pair data
  @property {String} pair.user1_uid           - Users Uid,
  @property {string} pair.user2_uid           - Users Uid,
  @property {generation} UserData.generation  - data of the generation for the pair,
  @property {generation} UserData.group       - all group data for the pair,

  @typeof {Object} generationData a single pair with generation id
  @property {String} generationData.group_id - id of the group assosiated with,
  @property {string} generationData.title    - title of the generation,
  @property {Int} generationData.group_size  - the size of the pairs (or you 3+ poeple),

  @typeof {Object} group data for a single pairing
  @property {String} group.id            - id of the group,
  @property {string} group.name          - name of the group,
  @property {Int} group.group_size       - the size of the pairings
  @property {date} generation.creator    - the Uid of the user that created the group
  @property {date} generation.created_at - creating data

  @param {String} userUid Users uid the need history for

  @return {UserData} UserData its an array that contain pair data and generation data and groupData for single user

*/
knex.getUserData = userUid => {
  return knex('pairs').where('user1_uid', userUid)
  .orWhere('user2_uid', userUid)
  .join('generations', 'pairs.gen_table_id', "=", "generations.id")
  .select('*', "*")
  .join('groups', 'groups.id', "=", "generations.group_id")
  .select('*', "*")
  .then(data => {
    var fullHistory = []; // for the front end formatting
    for (let i = 0; i < data.length; i++) {
      fullHistory.push({
        user1_uid: data[i].user1_uid,     // user uid
        user2_uid: data[i].user2_uid,     // user uid
        generations: {                    // all the generation data (exept for created at)
          id: data[i].gen_table_id,       // gen id
          title: data[i].title,           // title/name
          group_id: data[i].group_id,     // id of group (also in group)
          group_size: data[i].group_size  // size of the group (also in group)
        },
        group: { // all group data including created at
          id: data[i].group_id,           // id of the group (also in gen)
          name: data[i].name,             // group name
          group_size: data[i].group_size, // size of the group (also in gen)
          creator: data[i].creator,       // user who created the group
          created_at: data[i].created_at  // when it was created
        }
      });
    }
    // returns an array of objects
    return fullHistory;
  })
  .catch(err => {
    throw new Error('cannot get join table for history because, ' + err);
  }); // throw error if something went horribly wrong
};

module.exports = knex;
