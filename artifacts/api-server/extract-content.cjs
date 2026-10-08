const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function extractAndUpdate() {
  const client = new Client({ connectionString: 'postgresql://postgres:KrestinMae08@localhost:5433/ELIBRARY_db' });
  await client.connect();

  const res = await client.query(
    "SELECT id, title, file_url FROM books WHERE file_url IS NOT NULL AND file_url != ''"
  );

  for (const row of res.rows) {
    if (row.file_url.startsWith('http')) {
       console.log(`Skipping external URL for [${row.id}]: ${row.file_url}`);
       continue;
    }
    const filePath = path.resolve(__dirname, row.file_url.replace(/^\//, ''));
    console.log(`Processing [${row.id}] ${row.title} -> ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`  File not found: ${filePath}`);
      continue;
    }

    try {
      const buffer = fs.readFileSync(filePath);
      let text = '';
      
      if (filePath.toLowerCase().endsWith('.pdf')) {
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        text = data.text;
        await parser.destroy();
      } else if (filePath.toLowerCase().endsWith('.docx') || filePath.toLowerCase().endsWith('.doc')) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else {
        console.log(`  Unsupported file type: ${filePath}`);
        continue;
      }
      
      if (text && text.trim().length > 0) {
        await client.query('UPDATE books SET content = $1 WHERE id = $2', [text, row.id]);
        console.log(`  Extracted ${text.length} characters and saved to database.`);
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
