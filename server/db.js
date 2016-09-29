var pg = require('pg');
var config = require('../knexfile.js')
var env = process.env.NODE_ENV || 'production';
var knex = require('knex')(config[env]);
var uuid = require('uuid');

"use strict";
knex.migrate.latest([config[env]]);


/**
  @params: token = (string) Session we get from MakerPass
  return: throws 401 if no session or user UID if there is
*/
knex.authenticate = (token) => {
  if(process.env.TEST_AUTH) return Promise.resolve(); // for test env
  return knex('auth').where('token', token).returning('user_uid') // check for token in auth 
    .then((userUid) => { // userUid is an array
      console.log('userUid: ', userUid[0].user_uid)
      if(userUid.length) return Promise.resolve(userUid[0].user_uid); // if user exist then resolve
      else return Promise.reject("401 Unauthorized, please make sure you are logged in"); // else send a 401 error   
    }).catch((err) => {throw new Error("Unable to authenticate user, "+ err)}) // throw error if something went horribly wrong
}

knex.addToken = (userToken, userUid) => {
  return knex('auth').where('user_uid', userUid).returning('user_uid') // check if user exist
    .then((uid) => { // array with MakerPass uid
      if(uid.length) // if user exist update it
        return knex('auth').where({user_uid: userUid}).update("token", userToken).returning('*')
          .then((authData) => authData[0]) // return the updated token with user
          .catch((err) => {console.log("error in updateToken:",err); throw new Error("Unable to add token, "+ err)}); // throw error if something went horribly wrong
      else // else add user to auth table
        return knex('auth').insert({user_uid: userUid, token: userToken}).returning('*') // add token and token to auth table 
          .then((authData) => authData[0]) // return the new token with user
          .catch((err) => {console.log("Error in addToken:",err); throw new Error("Unable to add token, "+ err)});// throw error if something went horribly wrong
    }).catch((err) => {console.log("error before addToken:",err); throw new Error("Unable to find token, "+ err)}) // throw error if something went horribly wrong
}

/**
  @params: groupId = (string) user_uid
  return: return { an array of these group objects from group and memberships
    groupId: (int) id,
    groupName: (string) name
    Role: (string) 
  }
*/
knex.getGroups = (userUid) => {
  return knex('group_membership').where('user_uid', userUid)
  .then((memData) => {
    for(var i=0, data = []; i<memData.length;i++) data.push(memData[i].group_id);
    return knex('groups').whereIn("id", data).returning("*")
    .then((resp) => {
      for(var i=0, fullData =[], newObj = {}; i<resp.length; i++) {
        fullData.push({
          id : resp[i].id,
          name : resp[i].name,
          role : memData[i].role,
          size : resp[i].group_size
        })
      }
      return fullData
    }).catch((err) => {throw new Error("where in is broken at get groups, "+ err)}) // throw error if something went horribly wrong
  }).catch((err) => {throw new Error("cannot access group_membership, "+ err)}) // throw error if something went horribly wrong
}

knex.getGroup = (groupId) =>{
  return knex('groups').where("id", groupId).returning("*")
  .then((group) => group[0])
  .catch((err) => {throw new Error("cannot access groups, "+ err)}) // throw error if something went horribly wrong
}
/**
  @params:group= {members: [{
    user_uid: (string)
    role: (string)
  }],
    groupData: {
      name: (string)
      group_size: (int)
    }
  }
  return: 'added groups to group table' or error
*/
knex.addGroup = (group) => {
  return knex('groups').where('name', group.groupData.name).returning('id')
  .then((id) => {
    if(id.length === 0) {
      return knex('groups').insert({name: group.groupData.name, group_size: group.groupData.group_size}).returning('id')
      .then((id) => {
        for(var i = 0, rows = []; i < group.members.length; i++) {
          rows.push({
            user_uid: group.members[i].user_uid,
            group_id: id[0],
            role: group.members[i].role
          })
        }
        return knex.batchInsert('group_membership', rows, rows.length)
          .then((resp) => 'group added')
          .catch((err) => {throw new Error("Batch Insert Failed due to: "+ err)}) // throw error if something went horribly wrong
      })
    }
    else return id[0]
  })
}

knex.deleteGroup = (groupId) => {
  // return knex('groups').where('id', groupId).del()
  // .then(() => {
  //   return knex('group_membership').where('group_id', groupId).del()
  //   .then(() => {
  //     return knex('generations').where('group_id', groupId).returning('gen_id')
  //     .then((genIds) => {
  //       for(var i = 0, )
  //       return 
  //     })
  //   })
  // })
}


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
    return addGeneration({groupId: groupId, genTitle: pairData.genTitle, groupSize: pairData.groupSize}) //adds or finds generation for group
    .then((genId) => { // gets the generation Id for each pair 
      // i for index and row for each pair
      for(var i = 0, rows = []; i < pairData.pairs.length; i++) 
        rows.push({ // row for batch insert
          user1_uid: pairData.pairs[i][0], // user 1
          user2_uid: pairData.pairs[i][1], // user 2
          gen_table_id: genId // generation id on database
        });
      return knex.batchInsert('pairs', rows, pairData.pairs.length) // insert all the pairs into database for history 
        .then((e) => ('pairs added')) // returns string for client that pair is added
        .catch((err) => {throw new Error("Batch Inrest Failed due to: "+ err)}) // throw error if something went horribly wrong
    }).catch((err) => {throw new Error("Unable to create generation, "+ err)}) // throw error if something went horribly wrong
}

/**
  @params: pairData = ({
    'pairs': (array)[(user1_uid, user2_uid), (user1_uid, user2_uid), ...],
    'genTitle': (string)title,
    'groupSize': (integer)groupSize
  }, (string)groupName)
  return: 201 or error
*/
knex.addBadPairs = (pairData, GroupUid) => {
  //return knex('bad_pairs').insert({})
}

/**
  @params: pairData = ({
    'pairs': (array)[(user1_uid, user2_uid), (user1_uid, user2_uid), ...],
    'genTitle': (string)title,
    'groupSize': (integer)groupSize
  }, (string)groupName)
  return: 201 or error
*/
knex.addBadPairs = (pairData, GroupUid) => {
  //return knex('bad_pairs').insert({})
}

/**
  @params: pairData = uid (string) generation uid
   
  return: {
    pairs: [pairs]
    generationData: generation data
  }
*/
knex.getGenerationByUid = (uid) => {
  return knex('generations').where('uid', uid).returning("*")
  .then((gens) => 
    knex('pairs').where('gen_table_id', gens[0].id).returning("*")
    .then((pairs) => {return {generationData: gens[0],pairs: pairs}})
    .catch((err) => {throw new Error("Unable to get uid from gens, "+ err)}) // throw error if something went horribly wrong
  ).catch((err) => {throw new Error("Unable to find pairs with gens id, "+ err)}) // throw error if something went horribly wrong
} 

/**
  @params: genData = {
            groupId: (integer)id,
            genTitle: (string)genTitle,
            groupSize: (integer)groupSize
          }

  return: return id 
*/
function addGeneration(genData) {
  return knex('generations').where({group_id: genData.groupId, title: genData.genTitle, group_size: genData.groupSize}).returning("*")
  .then((exist) => {
    if(!exist.length){ // if array is empty  
      return knex('generations').where({group_id:genData.groupId}).returning("gen_id")
      .then((next) => {
        var uid = uuid.v4()
        for(var i=0, max =0; i<next.length;i++) if(next[i].gen_id > max) max = next[i].gen_id;
        return knex('generations').insert({
          uid:        uid, // uuid genarated for links 
          group_id:   genData.groupId, // adds the group
          title:      genData.genTitle,// adds the title
          gen_id:     max+1,     // adds the generation by finding how many generation were before
          group_size: genData.groupSize// group size for better history 
        }).returning('id').then((id) => id[0])// returns the id
      }).catch((err) => {throw new Error("unable to create new generation,"+ err)}) // throw error if something went horribly wrong
    }else return (exist[0].id) // if exist it will just return old generation id
  }).catch((err) => {throw new Error("parems aren't correct when calling addGeneration, "+ err)}) // throw error if something went horribly wrong
}


knex.getTables = () => {
  return knex('group_membership').returning('*')
}
knex.getTables2 = () => {
  return knex('auth').returning('*')
}

/**
  @params: groupId = (string) group id
  return: [{array of that contain pair data and generation data for entries with group id
        pairs: (array) [ { 
      user1_uid : (string),
      user2_uid : (string),
      gen_table_id : (int)
    }], 
    generationData: {
      id : (int) generation id
      uid : (string) generation uid,
      title : (string),
      gen_id : (int) the generation number,
      group_size: (int)
    } ... ]
*/
knex.getPairsForGroup = (groupId) => {
  //go to generations 
  return knex('generations').where({'group_id': groupId}).returning('*')
    .then((gens) => {                        
      for(var i=0, genIds =[]; i<gens.length;i++) genIds.push(gens[i].id);
      return knex('pairs').whereIn('gen_table_id', genIds)
        .then((pairs) => {
          for(var i=0, data = []; i<gens.length; i++){
              data.push({generationData: gens[i], pairs: [] })
              for(var j=0; j<pairs.length; j++){
                if(pairs[j].gen_table_id) data[i].pairs.push(pairs[j]);
              }
          }
          return data
        }).catch((err) => {throw new Error("cannot find pairs for those gens, "+ err)})  // throw error if something went horribly wrong 
    }).catch((err) => {throw new Error("problem finding generation with group, "+ err)}) // throw error if something went horribly wrong
}

/**
  @params: groupId = (int) group_id
  return: return [{
    genId: (int) gen_id,
    groupSize: (int) group_size,
    groupTitle: (string) group_title 
    uid: (string) generation uid
  }]
*/
knex.getGenerationsByGroup = (groupId) => {
  return knex('generations').where('group_id', groupId).returning("*")
  .then((gen) => gen) // returns all gens for id
  .catch((err) => {throw new Error("database off-line, "+ err)}) // throw error if something went horribly wrong
}

/**
  @params: groupId = (int) group id
  return: return { an array of these students for group
    Role: (string) role (admin or member)
    UserUid: (string) user uid from makerpass 
  }
*/
knex.getMemberships = (groupId) => {
  return knex('group_membership').where('group_id', groupId).returning("*")
  .then((students) => students)
  .catch((err) => {throw new Error("cannot get membeships for that group, "+ err)}) // throw error if something went horribly wrong
}

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
      gen_id : (int) the generation number,
      group_size: (int)
    } 
  }
*/
knex.getNewGen = (groupId) => { 
  return knex('generations').where('group_id', groupId).returning("*")
  .then((next) => {
    for(var i=0, max =0; i<next.length;i++) if(next[i].gen_id > max) max = i;
    return knex('pairs').where("gen_table_id", next[max].id).returning("*")
    .then((pairs) => {return {pairs:pairs, generationData:next[max]}})
    .catch((err) => {throw new Error("cannot find pairs, "+ err)}) // throw error if something went horribly wrong
  }).catch((err) => {throw new Error("cannot find gen_id, "+ err)}) // throw error if something went horribly wrong
}

/**
  @params: groupId = (int) group id
  return: return { an array of these students for group
    Role: (string) role (admin or member)
    UserUid: (string) user uid from makerpass 
  }
*/
knex.getUserData = (userUid) => {
  return knex('pairs').where('user1_uid', userUid).orWhere('user2_uid', userUid).returning("*")
  .then((students) => students)
  .catch((err) => {throw new Error("cannot get membeships for that group, "+ err)}) // throw error if something went horribly wrong
}
module.exports = knex;

