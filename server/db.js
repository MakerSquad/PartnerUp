var pg = require('pg');
var config = require('../knexfile.js');
var env = process.env.NODE_ENV || 'production';
var knex = require('knex')(config[env]);
var hash = require('string-hash');

'use strict';
knex.migrate.latest([config[env]]);


const maxForStudent = 2; // Change this verible to set how many groups a student can create!
const adminRoles = ['instructor', 'fellow', 'memberAdmin']; // admin roles

/******************************************************* Authentication *******************************************************/

/**
  @params: token = (string) Session we get from MakerPass, 
           group = (int)to see if perosn is in the group,
           needData = (bool) check if need full data(like admin etc/.)
  return: throws 401 if no session or user UID if there is
*/
knex.authenticate = (token = 'null', groupId = null, needData = false) => {
  // return Promise.resolve("3a9137d82c2b"); //for easy testing
  if(process.env.TEST_AUTH) return Promise.resolve("3a9137d82c2b"); // for test env
  var encToken = hash(token);
  return knex('auth').where('token', encToken) // check for token in auth 
    .then((userUid) => { // userUid is an array
        if(userUid.length){ // if userUID.length checks if something 
            if(groupId){
              return knex('group_membership').where({user_uid: userUid[0].user_uid, group_id:groupId})
              .returning('*')
              .then((info) => {
                if(info.length){
                  if(needData){
                    return Promise.resolve(userUid[0]);
                  }
                  return Promise.resolve(userUid[0].user_uid);
                } 
                else {
                  return Promise.reject('sorry you are not in that group');
               }
              }).catch((err) => {throw new Error('Unable to authenticate user, '+ err);}); // throw error if something went horribly wrong
            } 
            else {
              if(needData){
                return Promise.resolve(userUid[0]);
              }
              return Promise.resolve(userUid[0].user_uid);
            }
        } // if user exist then resolve
        else return Promise.reject('401 Unauthorized, please make sure you are logged in'); // else send a 401 error   
    }).catch((err) => {throw new Error('Unable to authenticate user, '+ err);}); // throw error if something went horribly wrong
};

knex.authenticateAdmin = (token = 'null', groupId = null) => {
  // return Promise.resolve("3a9137d82c2b"); //for easy testing
  if(process.env.TEST_AUTH) return Promise.resolve("3a9137d82c2b"); // for test env
  var encToken = hash(token)
  return knex('auth').where('token', encToken) // check for token in auth 
    .then((userUid) => { // userUid is an array
        if(userUid.length) {
            return knex('group_membership').where('user_uid', userUid[0].user_uid).andWhere('group_id', groupId)
        .then((admin) => {
          if(adminRoles.includes(admin[0].role)){
              return Promise.resolve(userUid[0].user_uid); // if user exist then resolve
          }
          return Promise.reject('401 Unauthorized, only administrators for this group can add pairs'); // else send a 401 error 
        });
        }
        else return Promise.reject('401 Unauthorized, please make sure you are logged in'); // else send a 401 error   
    }).catch((err) => {throw new Error('Unable to authenticate user, '+ err);}); // throw error if something went horribly wrong
};

knex.addToken = (userToken, userUid, adminStatus) => {
    return knex('auth').where('user_uid', userUid).returning('user_uid') // check if user exist
    .then((uid) => { // array with MakerPass uid
        if(uid.length) // if user exist update it
            return knex('auth').where({user_uid: userUid}).update({token: userToken, admin:adminStatus}).returning('*')
          .then((authData) => authData[0]) // return the updated token with user
          .catch((err) => {throw new Error('Unable to add token, '+ err);}); // throw error if something went horribly wrong
        else // else add user to auth table
        return knex('auth').insert({user_uid: userUid, token: userToken, admin:adminStatus}).returning('*') // add token and token to auth table 
          .then((authData) => authData[0]) // return the new token with user
          .catch((err) => {throw new Error('Unable to add token, '+ err);});// throw error if something went horribly wrong
    }).catch((err) => {throw new Error('Unable to find token, '+ err);}); // throw error if something went horribly wrong
};

/**
  @params: groupId = (string) user_uid
  return: return { an array of group objects from group and memberships
    "id": (int) join table id(gets delted right after),
    "user_uid": (string) MKS user uid,
    "group_id": (int) group,
    "role": (string) the role of the user,
    "name": (string) group name,
    "size": (int) size,
    "creator": (string) MKS user that created table uid,
    "created_at": (date)
  }
*/

/**************************************************** Groups insert/del/get ****************************************************/

knex.getGroups = (userUid) => {
  var groupArray = knex('group_membership').where("user_uid", userUid)
    .join('groups', 'groups.id', "=" ,"group_membership.group_id")
    .select('*',"*")
    .then((data) => {
      for(let i =0; i<data.length; i++){
        data[i].size = data[i].group_size; // remodeled for front end
        delete data[i].group_size;
      }
      return data
    }).catch((err) => {
      throw new Error(err + '\n error getting data from groups');
    }); // throw error if something went horribly wrong

  return groupArray
};

/**
  @params: groupId = (string) group id
  return: return { 
    groupId: (int) id,
    groupName: (string) name
    group_size: (int) the size
    }
*/

knex.getGroup = (groupId) =>{
    return knex('groups').where('id', groupId)
    .returning('*')
    .then((group) => group[0])
    .catch((err) => {throw new Error('cannot access groups, '+ err);}); // throw error if something went horribly wrong
};
/**
  @params:group= {members: [{
    user_uid: (string)
    role: (string)
  }],
    groupData: {
      name: (string)
      group_size: (int)
    }
  },
  creator : (string) user UID that created group
  return: 'added groups to group table' or error
*/

knex.addGroup = (group, creator) => {
    return knex.canCreateGroup(creator)
  .then( (canCreate) => {
      if(!canCreate) {
        throw new Error('sorry you reached your limit');
      }
      return knex('groups').where('name', group.groupData.name)
      .returning('id')
      .then((id) => {
        if(id.length === 0) {
            return knex('groups').insert({name: group.groupData.name, group_size: group.groupData.group_size, creator: creator}).returning('id')
        .then((groupsId) => {
            for(var i = 0, rows = []; i < group.members.length; i++) {
                rows.push({
                    user_uid: group.members[i].user_uid,
                    group_id: groupsId[0],
                    role: group.members[i].role
                });
            }
            return knex.batchInsert('group_membership', rows, rows.length)
            .then((resp) => groupsId[0])
            .catch((err) => {throw new Error('Batch Insert Failed due to: '+ err);}); // throw error if something went horribly wrong
        }).catch((err) => {throw new Error('Failed to add to groups due to: '+ err);}); // throw error if something went horribly wrong
        }
        else {
          return id[0];
        }
    }).catch((err) => {throw new Error('Failed to add to groups due to: '+ err);}); // throw error if something went horribly wrong
  }).catch((err) => {throw new Error(err);}); // throw error if something went horribly wrong
};

/**
  Private fucntion to check if user can create group
  P.S change  maxForStudent up top for how many groups a student can create

  @params uid = (string) mks_uid
  returns (boolean) can create a group if student
*/
knex.canCreateGroup = (creator) => {
    return knex('auth').where('user_uid', creator)
    .returning('admin')
    .then((status) =>{
      if(status[0].admin){ 
        return true;
      }
      return knex('groups').where('creator', creator)
      .returning('*')
      .then((groups) => {
          if(groups.length <maxForStudent) { // change maxForStudent varible to set how many groups students can create
            return true;
          }
          else return false;
      }).catch((err) => {throw new Error('(1) cant creat group:' +err);});
  }).catch((err) => {throw new Error('(2) cant creat group:' +err);});
}

/**
  Deletes everything related to a group
  @params id = (int) group id in the db
  returns (string) 'pairs deleted'
*/
knex.deleteGroup = (groupId) => {
    return knex('groups').where('id', groupId)
    .del()
    .then(() => {
      return knex('group_membership').where('group_id', groupId)
      .del()
      .then(() => {
        return knex('generations').where('group_id', groupId)
        .del()
        .returning('*')
        .then((genData) => {
          for(var i = 0, genIds = []; i < genData.length; i++) {
              genIds.push(genData[0].id);
          } 
          return knex('pairs').whereIn('gen_table_id', genIds).del()
        .then(() => 'group deleted')
        .catch((err) => {throw new Error('cannot delete pairs from pairs table,'+ err);});  // throw error if something went horribly wrong 
      }).catch((err) => {throw new Error('cannot delete generations from generations table, '+ err);});  // throw error if something went horribly wrong 
    }).catch((err) => {throw new Error('cannot delete users from group membership table, '+ err);});  // throw error if something went horribly wrong 
  }).catch((err) => {throw new Error('cannot delete group from groups table, '+ err);});  // throw error if something went horribly wrong 
};

/**
  gets all memberts for a group
  @params: groupId = (int) group id
  return: return { an array of these students for group
    Role: (string) role (admin or member)
    UserUid: (string) user uid from makerpass 
  }
*/
knex.getMemberships = (groupId) => {
    return knex('group_membership').where('group_id', groupId).returning('*')
  .then((students) => students)
  .catch((err) => {throw new Error('cannot get membeships for that group, '+ err);}); // throw error if something went horribly wrong
};

/*********************************************** Pairs and Generations insert/del/get ***********************************************/

/**
  @params: pairData = ({
    'pairs': (array)       [(user1_uid, user2_uid), (user1_uid, user2_uid), ...] array of 2 user ids in order,
    'genTitle': (string)   title of the genaration,
    'groupSize': (integer) size of the group for history
  }),
  groupUid = (string) Makerpass UID
  return: 201(if added pairs) or error
*/
knex.addPairs = (pairData, groupId) => {
    return addGeneration({ // private functions that returns the id 
      groupId: groupId, 
      genTitle: pairData.genTitle, 
      groupSize: pairData.groupSize
    }) //adds or finds generation for group
    .then((genId) => { // gets the generation Id for each pair 
      // i for index and row for each pair
      // format it for vatchInsert
        for(var i = 0, rows = []; i < pairData.pairs.length; i++) 
            rows.push({ // row for batch insert
                user1_uid: pairData.pairs[i][0], // user 1
                user2_uid: pairData.pairs[i][1], // user 2
                gen_table_id: genId // generation id on database
            });
        return knex.batchInsert('pairs', rows, pairData.pairs.length) // insert all the pairs into database for history 
        .then((e) => ('pairs added')) // returns string for client that pair is added
        .catch((err) => {throw new Error('Batch Inrest Failed due to: '+ err);}); // throw error if something went horribly wrong
    }).catch((err) => {throw new Error('Unable to create generation, '+ err);}); // throw error if something went horribly wrong
};

/**
  Private function to add generation when new group is created
  @params: genData = {
            groupId: (integer)id,
            genTitle: (string)genTitle,
            groupSize: (integer)groupSize
          }

  return: return id 
*/
function addGeneration(genData) {
    return knex('generations').where({group_id: genData.groupId, title: genData.genTitle, group_size: genData.groupSize}).returning('*')
  .then((exist) => {
      if(!exist.length){ // if array is empty  
          return knex('generations').where({group_id:genData.groupId}).returning('*')
      .then((next) => {
          return knex('generations').insert({ 
              group_id:   genData.groupId, // adds the group
              title:      genData.genTitle,// adds the title
              group_size: genData.groupSize// group size for better history 
          }).returning('id').then((id) => id[0]);// returns the id
      }).catch((err) => {throw new Error('unable to create new generation,'+ err);}); // throw error if something went horribly wrong
      }else return (exist[0].id); // if exist it will just return old generation id
  }).catch((err) => {throw new Error('parems aren\'t correct when calling addGeneration, '+ err);}); // throw error if something went horribly wrong
}

knex.deleteGeneration = (id) => {
    return knex('generations').where('id', id).del()
    .then((resp) => {
        return knex('pairs').where('gen_table_id', id).del()
        .then((resp) => 'generation deleted');
    }).catch((err) => {throw new Error('cannot delete group from groups table, '+ err);});  // throw error if something went horribly wrong
};

/**
  @params: groupId = (string) group id
  return: [{array of that contain pair data and generation data for entries with group id
        pairs: (array) 
    [{ 
      user1_uid : (string),
      user2_uid : (string),
      gen_table_id : (int)
    }], 
    generationData: {
      group_id : (string) group id,
      title : (string) title,
      group_size: (int),
      created_at: (date)
    } ... ]
*/
knex.getPairsForGroup = (groupId) => {
  return knex('generations').where("group_id", groupId) 
        .join('pairs', 'pairs.gen_table_id', "=" ,"generations.id")
        .select('*',"*")
        .then((info = null) => { // gets all generations and pairs that are togather
          //throw error if no pairs for that generation
          if(info == null) {
            throw new Error("sorry no data in the dataBase was found");
          } 

          var pairsData = []; // format the data/info for the front end
          for(let i=0; i<info.length; i++){
            // in case data is changed to null  
            if(!info[i]){
             continue;
            }
            // add a new generationData
            pairsData.push({    
              generationData: {
                id         : info[i].gen_table_id,
                title      : info[i].title,
                group_id   : info[i].group_id,
                group_size : info[i].group_size,
                created_at : info[i].created_at
              },
              pairs: []
            });
            // adds all the pairs to generations
            for(let j=0; j<info.length; j++){
              //in case data is changed to null
              if(!info[j]){
                continue;
              }
              // checks if pair matches a new generation 
              if(pairsData[pairsData.length-1].generationData.id === info[j].gen_table_id){
                pairsData[pairsData.length-1].pairs.push({
                  user1_uid    : info[j].user1_uid,
                  user2_uid    : info[j].user2_uid,
                  gen_table_id : info[j].gen_table_id
                });
                info[j] = null; // remove it so i dont add a pair twice
              } 
            }
          }
          return pairsData
        })
        .catch((err) => {throw new Error('cannot get join pairs and gen table, '+ err);});  // throw error if something went horribly wrong 
};

/**
  @params: groupId = (int) group_id
  return: return [{
    groupSize: (int) group_size,
    groupTitle: (string) group_title 
  }]
*/
knex.getGenerationsByGroup = (groupId) => {
  return knex('generations').where('group_id', groupId)
  .returning('*')
  .then((gen) => gen) // returns all gens for id
  .catch((err) => {throw new Error('database off-line, '+ err);}); // throw error if something went horribly wrong
};

/**
  @params: groupId = (int) group id
  return: return { object for most current generation
    pairs: (array) [ { 
      user1_uid : (string),
      user2_uid : (string),
      gen_table_id : (int)
    }]
    generationData: {
      id : (int) generation id
      uid : (string) generation uid,
      title : (string),
      group_size: (int)
    } 
  }
*/
knex.getNewGen = (groupId) => { 
    return knex('generations').where('group_id', groupId)
    .returning('*')
    .then((next) => {
      // checks for latest creation
      for(var i=0, maxIndex =0; i<next.length;i++){
        if(next[i].id > maxIndex){
          maxIndex = i; // if id is later will change to it (only for updated)
        }
      }
      return knex('pairs').where('gen_table_id', next[maxIndex].id).returning('*')
      .then((pairs) => {
        return {
          generationData:next[maxIndex], 
          pairs:pairs 
        };
      })
      .catch((err) => {throw new Error(err + '\n cannot find pairs, ');}); // throw error if something went horribly wrong
  }).catch((err) => {throw new Error(err + '\n cannot find gen_id, ');}); // throw error if something went horribly wrong
};

/******************************************************* Misc (user things) *******************************************************/

/**
  Gets all the data for a single user
  @params: userUid = (string) User mks uid
  return: return an array of these students for group
  {
    "user1_uid": "bfc5a48d77ae",
    "user2_uid": "-0",
    "generations": {
      "id": 1,
      "title": "abc",
      "group_id": 1,
      "group_size": 2,
    },
    "group": {
      "id": 1,
      "name": "SearchBarTest",
      "group_size": 2,
      "creator": "3a9137d82c2b",
      "created_at": "2016-10-04T19:40:55.012Z"
    } 
  }
*/
knex.getUserData = (userUid) => {
  return knex('pairs').where('user1_uid', userUid)
  .orWhere('user2_uid', userUid)
  .join('generations', 'pairs.gen_table_id', "=" ,"generations.id")
  .select('*',"*")
  .join('groups', 'groups.id', "=" ,"generations.group_id")
  .select('*',"*")
  .then( (data) => {
    var fullHistory =[] // for the front end formatting
    for(let i=0; i<data.length; i++){
      fullHistory.push({
        user1_uid  : data[i].user1_uid, // user uid 
        user2_uid  : data[i].user2_uid, // user uid
        generations : { // all the generation data (exept for created at)
          id        : data[i].gen_table_id, // gen id
          title     : data[i].title,        // title/name
          group_id  : data[i].group_id,     // id of group (also in group)
          group_size: data[i].group_size,   // size of the group (also in group)
        },
        group: { //all group data including created at)
          id          : data[i].group_id,   // id of the group (also in gen)
          name        : data[i].name,       // group name
          group_size  : data[i].group_size, // size of the group (also in gen)
          creator     : data[i].creator,    // user who created the group
          created_at  : data[i].created_at  // when it was created
        }
      })
    }
    return fullHistory
  })
  .catch((err) => {throw new Error('cannot get join table for history because, '+ err);}); // throw error if something went horribly wrong
};

module.exports = knex;

