var path = require('path');

module.exports = { 
    production : {
      client: 'pg',
      connection: {
        host: 'ec2-54-163-245-32.compute-1.amazonaws.com',
        user: 'hzhzhysgpursgg',
        password: 'Mkih7oW9Ek6dGdTSmyuVgxw3kr',
        database: 'dd9bnae9j8734d',
        ssl: true,
        port: 5432,
      },
      migrations: {
        tableName: 'knex_migrations'
      }
    },
    test :{ 
      client: 'pg',
      connection: {
       database: 'partner_up_test'
      },
      migrations: {
        tableName: 'knex_migrations'
      }
    }
}
