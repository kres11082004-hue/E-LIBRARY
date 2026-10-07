const { Client } = require('pg');
const crypto = require('crypto');

const hash = crypto.createHash('sha256').update('admin123elibrary_salt').digest('hex');
const client = new Client({ connectionString: 'postgresql://postgres:KrestinMae08@localhost:5433/ELIBRARY_db' });

client.connect().then(async () => {
  await client.query('UPDATE users SET password_hash = $1', [hash]);
  console.log('Successfully updated all passwords to admin123! Hash:', hash);
  await client.end();
}).catch(console.error);
