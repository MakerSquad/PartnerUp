exports.up = (knex, Promise) => Promise.all([
  knex.schema.createTableIfNotExists('users', table => {
    table.increments('id');
    table.string('name');
    table.string('uid');
    table.string('avatar_pic');
  }),
  knex.schema.createTableIfNotExists('groups', table => {
    table.increments('id');
    table.string('name');
    table.string('mks_id')
  }),
  knex.schema.createTableIfNotExists('user_group', table => {
    table.increments('id');
    table.string('user_uid');
    table.string('group_id');
    table.string('role_name');
  }),
  knex.schema.createTableIfNotExists('pairs', table => {
    table.increments('id');
    table.string('user1_uid');
    table.string('user2_uid');
    table.integer('group_id');
    table.integer('gen_id');
  }),
  knex.schema.createTableIfNotExists('generations', table => {
    table.increments('id');
    table.integer('gen_id')
    table.string('title');
    table.integer('group_id');
    table.integer('group_size');
  }),
  knex.schema.createTableIfNotExists('ignore', table => {
    table.increments('id');
    table.integer('user_id');
    table.integer('group_id');
  })
])

exports.down = (knex, Promise) => Promise.all([
  knex.schema.dropTableIfExists('users'),
  knex.schema.dropTableIfExists('groups'),
  knex.schema.dropTableIfExists('user_group'),
  knex.schema.dropTableIfExists('pairs'),
  knex.schema.dropTableIfExists('ignore'),
  knex.schema.dropTableIfExists('generations')
]);