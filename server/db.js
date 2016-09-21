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
knex.addGroup = (group) => {
  return knex('groups').where({mks_id:group.groupId}).returning("*").then( (exist) =>{
    if(!exist.length){
      return knex('groups').insert({name: group.name, mks_id: group.groupId}).returning('id')
      .then((id) => id[0]).catch((err) => console.log('error: ', err))
    }
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
      }))
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
      .then((groupData) => groupData)
      .catch((err) => console.log('error: ', err))
  if(typeof group.id == 'integer')
    return knex('groups').where('id', group.id).returning('*')
      .then((groupData) => groupData)
      .catch((err) => console.log('error: ', err))
  return knex('groups').where({mks_id: group.mksId}).returning('*')
    .then((groupData) => {
      return groupData})
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
  return knex('generations').returning('*')
}

/* 
  adds or updates student 
  params: student = {
  "group_uid": "774f8e8ef2b7",
  "user_uid": "b3d187b37eb6",
  "role": "student",
  "user": {
    "name": "Akul Aggarwal",
    "uid": "b3d187b37eb6",
    "avatar_url": url
    }
  }
  return: 'added student to group' or error
*/
knex.addStudents = (students) => {
    var promiseRay =[]
  for(let i = 0; i < students.length; i++){
    promiseRay.push(knex('user_group').where({user_uid: students[i].user_uid, group_id: students[i].group_uid}).returning("*")
    .then((data) => {
      if(!data.length){
        knex('users').where('uid', students[i].user_uid).returning('uid')
          .then((id) => {
            if(id.length){
              knex('user_group').insert({
                user_uid: id[0].uid,
                group_id: students[i].group_uid,
                role_name: students[i].role
              }).then((id) => 'added student to group')
                .catch((err) => console.log('error found user: ', err))
            } else {
              knex('users').insert({name: students[i].user.name, uid: students[i].user_uid, avatar_pic: students[i].user.avatar_url}).returning('uid')
                .then((id) => {
                  knex('user_group').insert({
                    user_uid: id[0],
                    group_id: students[i].group_uid,
                    role_name: students[i].role
                  }).then((id) => 'added student to group')
                    .catch((err) => console.log('error join table: ', err))
                }).catch((err) => console.log('error no user: ', err))
            }
          }).catch((err) => console.log('error ', err))
        }
        else {
          knex('user_group').where({user_uid: students[i].user_uid, group_id: students[i].group_uid})
          .update({role_name: students[i].role})
          .then((id) => console.log('updated'))
          .catch((err) => console.log('error no user: ', err))
        }
    }))
  }
  return Promise.all(promiseRay).then(data => "done");
}
/**
  @params: mksId = (string)mks-UID
  return: [groups] or error

*/
knex.getGroupsForStudent = (mksId) => {
  let ray = [];
  return knex('user_group').where('user_uid', mksId).returning('*')
    .then((student) => {
      console.log('student', student.length)
      for(let i=0; i<student.length; i++){
        ray.push(knex('groups').where({mks_id: student[i].group_id}).returning("*")
          .then((group) => group))
      } 
      return Promise.all(ray).then((groups) => groups).catch((err) => console.log(err))
    })
    .catch((err) => console.log(err))
}

/**
  @params: data = {
    mksId: (string)mksId
  }
  return: 'users in that group' or error
*/
knex.getStudentsByGroup = (mksId) => {
  return knex('user_group').where('group_id', mksId).returning('*')
    .then((students) => students)
    .catch((err) => console.log(err))
}

/**
  @params: data = {
    student1Id: (int)id
    groupId: (string)id
  }
  return: array of pairs the student was in
*/
knex.getPairsForStudent = (student) => {
  return knex('pairs').where({'group_id': student.groupId, 'user1_id': student.studentId}).orWhere({'group_id': groupId, 'user2_id': studentId}).returning('*')
    .then((pairs) => pairs )
    .catch((err) => console.log('error: ', err))
}

/**
  @params: groupId = (string) group uid, groupName = (string) the name of the group
  return: array of pairs of the group
*/
knex.getPairsForGroup = (groupId, groupName) => {
  var ray =[];
  return knex('pairs').where({'group_id': groupId}).returning('*')
    .then((pairsWithId) => {
      //[{user1_id: 4, user2_id:30, group_id:1, genId},{user1_id: 42, user2_id:3, group_id:1}]
      console.log('pair with id: ', pairsWithId)
      for(let i=0; i<pairsWithId.length; i++){
        ray.push(
          findUserByID(pairsWithId[i].user1_id).then(user => {
            pairsWithId.user1_id=user    
          }).catch((err) => console.log('error 1: ', err)),
          findUserByID(pairsWithId[i].user2_id).then(user => {
            pairsWithId.user1_id=user
          }).catch((err) => console.log('error 2: ', err)),
          getGenwithId(pairsWithId[i].gen_id).then((genData) =>{
            pairsWithId.gen_id = genData[0]; 
          }).catch((err) => console.log('error genData: ', err))
        )
      }
      return Promise.all(ray).then((done) => {
        console.log(pairsWithId);
        return pairsWithId})
      .catch((err) => console.log('error: ', err))
    })
    .catch((err) => console.log('error: ', err))
}

knex.removeStudentFromGroup = (student) => {
  return knex('user_group').where({'group_id': student.groupId, 'user1_id': student.studentId}).orWhere({'group_id': student.groupId, 'user2_id': student.studentId}).del()
    .then(() => {
      return 'deleted'
    })
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
  @params: id = (int) genaration table id
  return: return {
    genId: (int) gen_id,
    groupSize: (int) group_size,
    groupTitle: (string) group_title 
  }
*/
function getGenwithId(id) {
  return knex('generation').where('id', id).returning("*")
  .then((gen) => gen[0])
  .catch((err) => console.log('error: ', err))
}

function findUserByID(ID) {
  return knex('users').where('uid', ID).returning("*")
    .then((user) => user[0])
    .catch((err) => console.log('error: ', err))
}

knex.deleteUser = (userId) => {
  return knex('users').where('id', userId).del()
    .then((bool) => {
      knex('user_group').where('user_id', userId).del()
        .then(() => {
          knex('pairs').where('user1_id', userId).orWhere('user2_id', userId).del()
            .then((bool) => ('user deleted: ', userId))
            .catch((err) => console.log('error: ', err))
        }).catch((err) => console.log('error: ', err))
    }).catch((err) => console.log('error: ', err))
}

knex.deleteGroup = (groupId) => {
  return knex('groups').where('id', groupId).del()
    .then((bool) => {
      knex('user_group').where('group_id', groupId).del()
        .then((bool) => {
          knex('pairs').where('group_id', groupId).del()
            .then((bool) => ('group deleted: ', groupId))
            .catch((err) => console.log('error: ', err))
        }).catch((err) => console.log('error: ', err))
    }).catch((err) => console.log('error: ', err))
}

module.exports = knex;