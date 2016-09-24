exports.up = (knex, Promise) => Promise.all([
  knex.schema.createTableIfNotExists('auth', table => {
    table.increments('id');
    table.string('user_uid');
    table.string('token');
  }),
  knex.schema.createTableIfNotExists('groups', table => {
    table.increments('id');
    table.string('name');
    table.string('mks_id')
  }),
  knex.schema.createTableIfNotExists('pairs', table => {
    table.increments('id');
    table.string('user1_uid');
    table.string('user2_uid');
    table.integer('group_id');
    table.integer('gen_table_id');
  }),
  knex.schema.createTableIfNotExists('generations', table => {
    table.increments('id');
    table.integer('gen_id')
    table.string('title');
    table.integer('group_id');
    table.integer('group_size');
  })
])

exports.down = (knex, Promise) => Promise.all([
  knex.schema.dropTableIfExists('groups'),
  knex.schema.dropTableIfExists('pairs'),
  knex.schema.dropTableIfExists('generations'),
  knex.schema.dropTableIfExists('auth')
]);