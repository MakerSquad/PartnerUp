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

knex.addGroup = (name) => {
  return knex('groups').insert({name: name}).returning('id')
    .then((id) => {
      console.log(id[0])
      return id[0]
    })
    .catch((err) => console.log('error: ', err))
}

knex.getTables = () => {
  return knex('users').returning('*')
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
    knex('users').where('name', students[i].user.name).returning('id')
      .then((id) => {
        console.log('id: ', id.length);
        if(id.length){
          knex('user_group').insert({
            user_id: id[0].id,
            user_name: students[i].user.name,
            group_id: students[i].group_uid,
            role_name: students[i].role
          }).then((id) => 'added student to group')
            .catch((err) => console.log('error found user: ', err))
        } else {
          knex('users').insert({name: students[i].user.name}).returning('id')
            .then((id) => {
              console.log('inside else: ', id[0], 'student: ', students[i])
              knex('user_group').insert({
                user_id: id[0],
                user_name: students[i].user.name,
                group_id: students[i].group_uid,
                role_name: students[i].role
              }).then((id) => 'added student to group')
                .catch((err) => console.log('error join table: ', err))
            }).catch((err) => console.log('error no user: ', err))
        }
      }).catch((err) => console.log('error ', err))
  }
}

knex.getPairs = (studentId) => {
  return knex('pairs').where('user1_id', studentId).orWhere('user2_id', studentId)
    .then((pairs) => pairs )
    .catch((err) => console.log('error: ', err))
}

/* 
  params: student = {
    name: (string)user-name
    groupId: (int)id
    role: (string)title
  }
  return: 'added student to group' or error
*/
knex.addPairs = () => {

}

knex.removeStudentFromGroup = (studentId, groupId) => {
  return knex('user_group').where({'group_id': groupId, 'user1_id': studentId}).orWhere({'group_id': groupId, 'user2_id': studentId}).del().returning('id')
    .then(() => {
      knex('pairs').where('group_id', groupId).orWhere('user1_id', studentId)
    })
}

knex.getGroupData = (groupId) => {
  return knex('user_group').where('group_id', groupId)
    .then((groupData) => groupData)
    .catch((err) => console.log('error: ', err))
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
