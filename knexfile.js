// Update with your config settings.

module.exports = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      database: 'dd9bnae9j8734d',
      user:     'hzhzhysgpursgg',
      password: 'Mkih7oW9Ek6dGdTSmyuVgxw3kr'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      database: 'dd9bnae9j8734d',
      user:     'hzhzhysgpursgg',
      password: 'Mkih7oW9Ek6dGdTSmyuVgxw3kr'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
