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

knex.migrate.latest([config]);

/* 
  params: group = {
    'name': (string)name,
    'groupId': (int)mksId
  }
  return: 'added student to group' or error
*/
knex.addGroup = (group) => {
  return knex('groups').insert({name: group.name, mks_id: group.mksId}).returning('id')
    .then((id) => {
      console.log(id[0])
      return id[0]
    })
    .catch((err) => console.log('error: ', err))
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
  if(group.name)
    return knex('groups').where('name', group.name).returning('*')
      .then((groupData) => groupData[0])
      .catch((err) => console.log('error: ', err))
  if(group.id)
    return knex('groups').where('id', group.id).returning('*')
      .then((groupData) => groupData[0])
      .catch((err) => console.log('error: ', err))
  return knex('groups').where('mks_id', group.mksId).returning('*')
    .then((groupData) => groupData[0])
    .catch((err) => console.log('error: ', err))  
}

knex.getTables = () => {
  return knex('user_group').returning('*')
}

/* 
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
  for(let i = 0; i < students.length; i++){
    knex('users').where('uid', students[i].user_uid).returning('uid')
      .then((id) => {
        console.log('id: ', id.length);
        if(id.length){
          knex('user_group').insert({
            user_uid: id[0].uid,
            group_id: students[i].group_uid,
            role_name: students[i].role
          }).then((id) => 'added student to group')
            .catch((err) => console.log('error found user: ', err))
        } else {
          knex('users').insert({name: students[i].user.name, uid: students[i].user_uid}).returning('uid')
            .then((id) => {
              console.log('inside else: ', id[0], 'student: ', students[i])
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
}
/**
  @params: data = {
    mksId: (string)mksId
  }
  return: 'added pair' or error
*/

knex.getStudentsByGroup = (mksId) => {
  return knex('user_group').where('group_id', mksId).returning('*')
    .then((students) => students)
}

/**
  @params: data = {
    student1Id: (int)id
    student2Id: (int)id
    groupId: (string)id
  }
  return: 'added pair' or error
*/
knex.addPairs = (pair) => {
  if(pair.student1Id > pair.student2Id) {
    var temp = pair.student1Id;
    pair.student1Id = pair.student2Id;
    pair.student2Id = temp; 
  }
  return knex('pairs').where({'user1_id': pair.student1Id, 'user2_id': pair.student2Id, 'group_id': pair.groupId}).returning('id')
    .then((id) => {
      console.log('pair ', pair)
      if(!id.length) {
        return knex('pairs').insert({
          group_id: pair.groupId,
          user1_id: pair.student1Id, 
          user2_id: pair.student2Id
        }).returning('id')
          .then((id) => {return 'pair added'})
          .catch((err) => console.log('error: ', err))
      } return 'pair exists'
    }).catch((err) => console.log('error: ', err))
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


knex.removeStudentFromGroup = (student) => {
  return knex('user_group').where({'group_id': student.groupId, 'user1_id': student.studentId}).orWhere({'group_id': student.groupId, 'user2_id': student.studentId}).del()
    .then(() => {
      return 'deleted'
    })
}


knex.findGroupByName = (groupName) => {
  return knex('groups').where('name', groupName)
    .then((id) => id)
    .catch((err) => console.log('error: ', err))
}

knex.findUserByName = (userName) => {
  return knex('users').where('name', userName)
    .then((id) => id)
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
// knex.addTest = () => {
//   console.log('inside addTest')
//   return knex('users').insert([
//     { name: 'Ryan'}
//   ])
// }


// knex.getTest = () => {
//   console.log('inside getTest')
//   return knex('users')
//     .then((users) => {
//       console.log('users: ', users)
//     })
//     .catch((err) => console.log('errror: ', err))
// }

// knex.initDB = () => Promise.all([
//   knex('users').insert([
//     { name: 'Joe' },
//     { name: 'Frank' },
//     { name: 'Rob' },
//     { name: 'Ryan' },
//     { name: 'Gilbert' },
//   ]),
//   knex('groups').insert([
//     { url: 'OMflBAXJJKc', channel_id: 1 },
//     { url: 'x76VEPXYaI0', channel_id: 1 },
//     { url: 'evj6y2xZCnM', channel_id: 1 },
//     { url: '5XpU5M0ZCKM', channel_id: 2 },
//     { url: '-hfKtUT4ISs', channel_id: 2 },
//     { url: 'JYYsAxC0Dic', channel_id: 2 },
//     { url: 'rbFvzRsDBN4', channel_id: 3 },
//     { url: '-C_jPcUkVrM', channel_id: 3 },
//     { url: 'FHtvDA0W34I', channel_id: 3 },
//   ]),
//   knex('JoinTable').insert([]),
// ]);
module.exports = knex;