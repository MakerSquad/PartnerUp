exports.up = (knex, Promise) => Promise.all([
  knex.schema.createTableIfNotExists('auth', table => {
    table.increments('id');
    table.string('user_uid');
    table.string('token');
  }),
  knex.schema.createTableIfNotExists('groups', table => {
    table.increments('id');
    table.string('name');
    table.integer('group_size')
  }),
  knex.schema.createTableIfNotExists('pairs', table => {
    table.increments('id');
    table.string('user1_uid');
    table.string('user2_uid');
    table.integer('gen_table_id');
  }),
  knex.schema.createTableIfNotExists('generations', table => {
    table.increments('id');
    table.string('uid');
    table.integer('gen_id');
    table.string('title');
    table.integer('group_id');
    table.integer('group_size');
  }),
  knex.schema.createTableIfNotExists('group_membership', table => {
    table.increments('id');
    table.string('user_uid');
    table.integer('group_id');
    table.string('role');
  }),
])

exports.down = (knex, Promise) => Promise.all([
  knex.schema.dropTableIfExists('groups'),
  knex.schema.dropTableIfExists('pairs'),
  knex.schema.dropTableIfExists('generations'),
  knex.schema.dropTableIfExists('auth')
]);