import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function update() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not defined in the environment.");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const resBooks = await client.query("UPDATE books SET campus = 'ZDSPGC-Dimataling Campus' WHERE campus = 'ZDSPGC-Aurora Campus'");
    console.log(`Updated ${resBooks.rowCount} books.`);

    const resUsers = await client.query("UPDATE users SET campus = 'ZDSPGC-Dimataling Campus' WHERE campus = 'ZDSPGC-Aurora Campus'");
    console.log(`Updated ${resUsers.rowCount} users.`);
    
    const resBorrow = await client.query("UPDATE borrow_records SET campus = 'ZDSPGC-Dimataling Campus' WHERE campus = 'ZDSPGC-Aurora Campus'").catch(() => ({ rowCount: 0 }));
    console.log(`Updated ${resBorrow.rowCount} borrow records.`);

  } catch (err) {
    console.error("Error updating database:", err);
  } finally {
    await client.end();
  }
}

update();
