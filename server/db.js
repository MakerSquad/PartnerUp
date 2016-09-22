var pg = require('pg');
const config = require('../knexfile.js');
// const env = 'development';

const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'ec2-54-163-245-32.compute-1.amazonaws.com',
    user: 'hzhzhysgpursgg',
    password: 'Mkih7oW9Ek6dGdTSmyuVgxw3kr',
    database: 'dd9bnae9j8734d',
    ssl: true,
    port: 5432,
  }
});
"use strict";
knex.migrate.latest([config]);

knex.authenticate = (sessionUid) => {
  if(sessionUid || process.env.TEST_AUTH) {
    return Promise.resolve();
  } else {
    return Promise.reject("401 Unauthorized, please make sure you are logged in");
  }
}

/**
  @params: group = {
    'name': (string)name,
    'groupId': (int)mksId
  }
  return: 'added student to group' or error
*/
knex.addGroups = (groups) => {
  return getGroupIds()
    .then((dbGroupIds) => {
      var groupArray = [], oldGroups =[];
      // console.log("dbGroupIds", dbGroupIds)

      for(let i = 0; i < groups.length; i++){
        if(!dbGroupIds.includes(groups[i].uid)) 
          groupArray.push({name: groups[i].name, mks_id: groups[i].uid});
        else oldGroups.push({name: groups[i].name, mks_id: groups[i].uid});
      }
      // console.log("array:",groupArray)
      var chunkSize = groupArray.length;
      if(chunkSize){
        return knex.batchInsert('groups', groupArray, chunkSize)
          .returning('*')
          .then((groups) =>  groups)
          .catch((err) => {throw new Error("unable to add to group due to: ", err)})
      }
      else return Promise.resolve(oldGroups);
    }).catch((err) => {throw new Error("Unable to create genaration, ", err)})

}

/**
  @params: pairData = ({
    'pairs': (array)[(user1_uid, user2_uid), (user1_uid, user2_uid), ...],
    'genTitle': (string)title,
    'groupSize': (integer)groupSize
  }, (string)groupName)
  return: 201 or error
*/

knex.addPairs = (pairData, groupUid) => {
  var gId;
  return knex.getGroup({mks_id: groupUid})
  .then((group) => {
    gId = group.id;
    return;
  })
  .catch((err) => console.log('error: ', err))
  .then(() => {
    return addGeneration({groupId: gId, genTitle: pairData.genTitle, groupSize: pairData.groupSize})
    .then((genId) => {
      var rows = [];
      for(var i = 0; i < pairData.pairs.length; i++){
        rows.push({
          user1_uid: pairData.pairs[i][0],
          user2_uid: pairData.pairs[i][1],
          group_id: gId,
          gen_table_id: genId
        })
      }
      var chunkSize = pairData.pairs.length;
      return knex.batchInsert('pairs', rows, chunkSize)
        .then(() => ('pairs added'))
        .catch((err) => {throw new Error("Batch Inrest Failed due to: ", err)})
    }).catch((err) => {throw new Error("Unable to create genaration, ", err)})
  }).catch((err) => {throw new Error("Unable to find the group in database, ", err)})
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
    if(!exist.length){
      return knex('generations').where({group_id:genData.groupId}).returning("gen_id")
      .then((next) => knex('generations').insert({
          group_id:   genData.groupId,
          title:      genData.genTitle,
          gen_id:     next.length,
          group_size: genData.groupSize
        }).returning('id').then((id) => {
          console.log('id: ', id)
          return id[0]
        })
      ).catch((err) => {throw new Error("unable to create new generation,", err)})
    }else return (exist[0].id) // if exist it will just return old id
  }).catch((err) => {throw new Error("parems aren't correct when calling addGeneration, ", err)})
}

/* 
  params: 
    group = {
    'name': (string)name 
    } 
      OR
    group = {
    'mksId': (string)mksId
    } 
      OR
    group = {
    'id': (int)ID
    }
  return: Object with group information
*/
knex.getGroup = (group) => {
  if(typeof group.name == "string")
    return knex('groups').where('name', group.names).returning('*')
      .then((groupData) => groupData[0])
      .catch((err) => {throw new Error("incorrect format, ", err)})
  if(typeof group.id == 'integer')
    return knex('groups').where('id', group.id).returning('*')
      .then((groupData) => groupData[0])
      .catch((err) => {throw new Error("incorrect format, ", err)})
  return knex('groups').where({mks_id: group.mks_id}).returning('*')
    .then((groupData) => {
      return groupData[0]})
    .catch((err) => {throw new Error("incorrect format, ", err)})  
}

knex.getTables = () => {
  return knex('pairs').returning('*')
}

/**
  @params: groupId = (string) group uid, groupName = (string) the name of the group
  return: array of pairs of the group
*/
knex.getPairsForGroup = (groupId, groupName) => {
  var ray =[];
  return knex('pairs').where({'group_id': groupId}).returning('*')
    .then((pairsWithId) => pairsWithId)
    .catch((err) => {throw new Error("database off-line, ", err)})
}


/**
  @params: groupId = (int) genaration table id
  return: return {
    genId: (int) gen_id,
    groupSize: (int) group_size,
    groupTitle: (string) group_title 
  }
*/
knex.getGenerationsByGroup = (groupId) => {
  return knex('generations').where('group_id', groupId).returning("*")
  .then((gen) => gen)
  .catch((err) => {throw new Error("database off-line, ", err)})
}

function getGroupIds() {
  return knex('groups').select('mks_id')
    .then((ids) => {
      var mergeIds = []
      for(let i=0; i<ids.length; i++) mergeIds.push(ids[i].mks_id);
      return mergeIds
    })
    .catch((err) => {throw new Error("database off-line, ", err)})
}

module.exports = knex;
