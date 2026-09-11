const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:KrestinMae08@localhost:5433/ELIBRARY_db' });
client.connect().then(async () => {
  const res = await client.query('SELECT id, title, author, category, "coverUrl", "fileUrl" FROM books ORDER BY id');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}).catch(console.error);
