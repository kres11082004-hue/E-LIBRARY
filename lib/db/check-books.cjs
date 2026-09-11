const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:KrestinMae08@localhost:5433/ELIBRARY_db' });
client.connect().then(async () => {
  const res = await client.query("SELECT id, title, file_url, LEFT(content, 200) as content_preview FROM books WHERE file_url IS NOT NULL AND file_url != ''");
  res.rows.forEach(r => {
    console.log(`[${r.id}] ${r.title}`);
    console.log(`  file_url: ${r.file_url}`);
    console.log(`  content: ${r.content_preview ? r.content_preview.substring(0, 120) + '...' : '(empty)'}`);
  });
  await client.end();
}).catch(console.error);
