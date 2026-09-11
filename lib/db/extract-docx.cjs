const mammoth = require('../../artifacts/api-server/node_modules/mammoth');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function extractAndUpdate() {
  const client = new Client({ connectionString: 'postgresql://postgres:KrestinMae08@localhost:5433/ELIBRARY_db' });
  await client.connect();

  // Find all books with docx file_url
  const res = await client.query(
    "SELECT id, title, file_url FROM books WHERE file_url LIKE '%.docx' OR file_url LIKE '%.doc'"
  );

  for (const row of res.rows) {
    const filePath = path.resolve(__dirname, '..', '..', 'artifacts', 'api-server', row.file_url.replace(/^\//, ''));
    console.log(`Processing [${row.id}] ${row.title} -> ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`  File not found: ${filePath}`);
      continue;
    }

    try {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.convertToHtml({ buffer });
      const text = result.value;
      
      if (text && text.trim().length > 0) {
        await client.query('UPDATE books SET content = $1 WHERE id = $2', [text, row.id]);
        console.log(`  Extracted ${text.length} characters and saved to database.`);
        console.log(`  Preview: ${text.substring(0, 200)}...`);
      } else {
        console.log('  No text extracted from file.');
      }
    } catch (err) {
      console.error(`  Error extracting text:`, err.message);
    }
  }

  await client.end();
  console.log('\nDone!');
}

extractAndUpdate().catch(console.error);
