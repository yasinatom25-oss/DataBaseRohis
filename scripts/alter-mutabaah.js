const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
});
client.connect()
  .then(() => client.query('ALTER TABLE mutabaah_logs ADD COLUMN IF NOT EXISTS param_13_val INTEGER DEFAULT 0;'))
  .then(() => console.log('Successfully added param_13_val!'))
  .catch(e => console.error(e))
  .finally(() => client.end());
