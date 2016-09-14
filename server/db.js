var pg = require('pg');
const config = require('../knexfile');
const env = 'development';
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'ec2-54-163-245-32.compute-1.amazonaws.com',
    user: 'hzhzhysgpursgg',
    password: 'Mkih7oW9Ek6dGdTSmyuVgxw3kr',
    database: 'dd9bnae9j8734d',
    ssl: true
  }
});

knex.migrate.latest([config]);

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