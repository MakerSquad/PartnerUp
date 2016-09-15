exports.up = (knex, Promise) => Promise.all([
  knex.schema.createTableIfNotExists('roles', table => {
    table.increments('id');
    table.string('role_name');
  }),
  knex.schema.createTableIfNotExists('users', table => {
    table.increments('id');
    table.string('name');
  }),
  knex.schema.createTableIfNotExists('groups', table => {
    table.increments('id');
    table.string('name');
  }),
  knex.schema.createTableIfNotExists('user_group', table => {
    table.increments('id');
    table.integer('user_id');
    table.integer('group_id');
    table.integer('role_id');
  }),
  knex.schema.createTableIfNotExists('pairs', table => {
    table.increments('id');
    table.integer('user1_id');
    table.integer('user2_id');
    table.integer('group_id')
  })
]);

exports.down = (knex, Promise) => Promise.all([
  knex.schema.dropTableIfExists('users'),
  knex.schema.dropTableIfExists('groups'),
  knex.schema.dropTableIfExists('user_group'),
  knex.schema.dropTableIfExists('pairs'),
  knex.schema.dropTableIfExists('roles')
]);