const mammoth = require('../../artifacts/api-server/node_modules/mammoth');
const fs = require('fs');
const path = require('path');

async function testHtml() {
  const filePath = path.resolve(__dirname, '..', '..', 'artifacts', 'api-server', 'uploads', 'files', 'file_1789084660532_g2tycb.docx');
  console.log(`Processing ${filePath}`);

  try {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;
    
    console.log(`Extracted HTML preview:`);
    console.log(html.substring(0, 1000));
  } catch (err) {
    console.error(`Error:`, err.message);
  }
}

testHtml().catch(console.error);
