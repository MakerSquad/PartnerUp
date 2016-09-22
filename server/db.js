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
  if(sessionUid) {
    return Promise.resolve();
  } else {
    return Promise.reject();
  }
}
/* 
  params: uid = {
            name: (string)name
            uid: (string)id
          }
  return: object with user data or error
*/
knex.findOrCreateAdmin = (uid) => {
  return knex('users').where({uid: uid.uid}).returning("*").then((user) => {
    if(user.length) return user[0];
    return knex('users').insert({name: uid.name, uid: uid.uid}).returning('*')
      .then((user) => user[0])
      .catch((err) => console.log('error: ', err))
  }).catch((err) => console.log('error: ', err))
}

/**
  @params: group = {
    'name': (string)name,
    'groupId': (int)mksId
  }
  return: 'added student to group' or error
*/
knex.addGroups = (groups) => {
  var groupArray = [];
  var chunkSize;
  return getGroupIds()
    .then((dbGroupIds) => {
      for(let i = 0; i < groups.length; i++) 
        if(!dbGroupIds.includes(groups[i].uid)) 
          groupArray.push({name: groups[i].name, mks_id: groups[i].uid});
      chunkSize = groupArray.length;
      return knex.batchInsert('groups', groupArray, chunkSize)
        .returning('*')
        .then((groups) =>  groups)
        .catch((err) => console.log('error: ', err))
    }).catch((err) => console.log('error: ', err))
}

/**
  @params: pairData = ({
    'pairs': (array)[(user1_uid, user2_uid), (user1_uid, user2_uid), ...],
    'genTitle': (string)title,
    'groupSize': (integer)groupSize
  }, (string)groupName)
  return: 201 or error
*/

knex.addPairs = (pairData, groupName) => {
  var gId;
  return knex.getGroup({name: groupName})
    .then((group) => {
      console.log('group[0].id: ', group[0].id, 'groupName: ', groupName)
      gId = group[0].id
      return;
    })
    .catch((err) => console.log('error: ', err))
    .then(() => addGeneration({
        groupId: gId,
        genTitle: pairData.genTitle,
        groupSize: pairData.groupSize
      })
      .then((genId) => {
        console.log('genId: ', genId)
        var rows = [];
        for(var i = 0; i < pairData.pairs.length; i++){
          rows.push({
            user1_uid: pairData.pairs[i][0],
            user2_uid: pairData.pairs[i][1],
            group_id: gId,
            gen_id: genId
          })
        }
        var chunkSize = pairData.pairs.length;
        return knex.batchInsert('pairs', rows, chunkSize)
          .then(() => ('pairs added'))
          .catch((err) => console.log('error: ', err))
      })).catch((err) => console.log('error: ', err))
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
    return knex('groups').where('name', group.name).returning('*')
      .then((groupData) => groupData[0])
      .catch((err) => console.log('error: ', err))
  if(typeof group.id == 'integer')
    return knex('groups').where('id', group.id).returning('*')
      .then((groupData) => groupData[0])
      .catch((err) => console.log('error: ', err))
  return knex('groups').where({mks_id: group.mksId}).returning('*')
    .then((groupData) => {
      return groupData[0]})
    .catch((err) => console.log('error: ', err))  
}

/**
  @params: studentRay array of studentId objects 
  }
  return: 'same array with more student details
*/
knex.getStudentData = (studentRay) => {
  let ray = [];
  for(let i=0; i<studentRay.length; i++){
    ray.push(knex('users').where({uid: studentRay[i].user_uid}).returning("*")
    .then((group) =>  group))
  }
  return Promise.all(ray).then((groups) =>{
    var mergeGroup = [];
    for(let i=0; i<groups.length; i++){ 
      groups[i][0].role = studentRay[i].role_name;
      mergeGroup.push(groups[i][0]);
    }
    return mergeGroup
  }).catch((err) => console.log(err))
}

knex.getTables = () => {
  return knex('user_group').returning('*')
}

/**
  @params: groupId = (string) group uid, groupName = (string) the name of the group
  return: array of pairs of the group
*/
knex.getPairsForGroup = (groupId, groupName) => {
  var ray =[];
  return knex('pairs').where({'group_id': groupId}).returning('*')
    .then((pairsWithId) => pairsWithId)
    .catch((err) => console.log('error: ', err))
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
  console.log('genData: ', genData)
  return knex('generations').where({group_id: genData.groupId, title: genData.genTitle, group_size: genData.groupSize}).returning("*")
  .then((exist) => {
    console.log('exist: ', exist)
    if(!exist.length){
      knex('generations').where({group_id:genData.groupId}).returning("gen_id")
      .then((next) => knex('generations').insert({
          group_id:   genData.groupId,
          title:      genData.genTitle,
          gen_id:     next.length,
          group_size: genData.groupSize
        }).returning('id').then((id) => {
          console.log('id: ', id)
          return id[0]
        })
      ).catch((err) => console.log('error: ', err))
    }else return (exist[0].id)
  }).catch((err) => console.log('error: ', err))
}

/**
  @params: groupId = (int) genaration table id
  return: return {
    genId: (int) gen_id,
    groupSize: (int) group_size,
    groupTitle: (string) group_title 
  }
*/
knex.getGenarationsByGroup = (groupId) => {
  return knex('generations').where('group_id', groupId).returning("*")
  .then((gen) => gen)
  .catch((err) => console.log('error: ', err))
}

function getGroupIds() {
  return knex('groups').returning('mks_id')
    .then((ids) => ids)
    .catch((err) => console.log('error: ', err))
}


function findUserByID(ID) {
  return knex('users').where('uid', ID).returning("*")
    .then((user) => user[0])
    .catch((err) => console.log('error: ', err))
}

module.exports = knex;