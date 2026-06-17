import pg from "pg";

const { Client } = pg;

async function update() {
  const connectionString = "postgresql://postgres:KrestinMae08@localhost:5433/ELIBRARY_db";
  
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const resBooks = await client.query("UPDATE books SET campus = 'ZDSPGC-Dimataling Campus'");
    console.log(`Updated ${resBooks.rowCount} books.`);
  } catch (err) {
    console.error("Error updating database:", err);
  } finally {
    await client.end();
  }
}

update();
