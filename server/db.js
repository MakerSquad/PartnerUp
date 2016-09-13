var pg = require('pg');

pg.defaults.ssl = true;
var database = process.env.DATABASE_URL || 'postgres://zjfcgmhjqmyjxr:Xl1eC5t0hNY8_f9kk5fU6I11qX@ec2-174-129-4-75.compute-1.amazonaws.com:5432/dcjevoin17mflh';

pg.connect(database, function(err, client) {
  if (err) throw err;

  console.log('Connected to postgres! Getting schemas...');

  client
    .query('SELECT table_schema,table_name FROM information_schema.tables;')
    .on('row', function(row) {
      console.log(JSON.stringify(row));
    });
});
