/**
 * migrate-to-neon.mjs  (v2)
 * 1. Creates schema in Neon (from local DB structure)
 * 2. Migrates all data in FK-safe order
 */
import pg from "pg";
const { Client } = pg;

const LOCAL_URL = "postgresql://postgres:KrestinMae08@localhost:5433/ELIBRARY_db";
const NEON_URL  = "postgresql://neondb_owner:npg_GfdNbUB2AzE7@ep-bitter-king-ak45wfpd-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require";

// FK-safe order (parents before children)
const TABLE_ORDER = [
  "activity_log",
  "books",
  "users",
  "authorized_users",
  "borrow_records",
  "downloads",
  "my_list",
  "reservations",
];

async function main() {
  console.log("🔌 Connecting...");
  const local = new Client({ connectionString: LOCAL_URL });
  await local.connect();

  const neon = new Client({ connectionString: NEON_URL, ssl: { rejectUnauthorized: false } });
  await neon.connect();

  // ── Step 1: Create schema in Neon from local ──────────────────────────────
  console.log("\n🏗️  Creating schema in Neon...");
  
  // Get CREATE TABLE statements from local information_schema
  const createSQL = `
    -- activity_log
    CREATE TABLE IF NOT EXISTS activity_log (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      user_name TEXT,
      campus TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- books
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT,
      category TEXT,
      campus TEXT,
      description TEXT,
      cover_url TEXT,
      file_url TEXT,
      file_text TEXT,
      available INTEGER NOT NULL DEFAULT 1,
      total INTEGER NOT NULL DEFAULT 1,
      publisher TEXT,
      year TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- users
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      fullname TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      campus TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      student_number TEXT,
      course TEXT,
      year TEXT,
      section TEXT,
      photo_url TEXT,
      is_approved BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- authorized_users
    CREATE TABLE IF NOT EXISTS authorized_users (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      school_id TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'student',
      campus TEXT,
      course TEXT,
      year TEXT,
      section TEXT,
      linked_user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- borrow_records
    CREATE TABLE IF NOT EXISTS borrow_records (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      book_id INTEGER NOT NULL REFERENCES books(id),
      borrowed_at TIMESTAMP NOT NULL DEFAULT NOW(),
      due_date TIMESTAMP NOT NULL,
      returned_at TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'borrowed'
    );

    -- downloads
    CREATE TABLE IF NOT EXISTS downloads (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      book_id INTEGER NOT NULL REFERENCES books(id),
      downloaded_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- my_list
    CREATE TABLE IF NOT EXISTS my_list (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      book_id INTEGER NOT NULL REFERENCES books(id),
      added_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- reservations
    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      book_id INTEGER NOT NULL REFERENCES books(id),
      status TEXT NOT NULL DEFAULT 'pending',
      reserved_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await neon.query(createSQL);
  console.log("   ✓ Schema ready");

  // ── Step 2: Clear any existing data ──────────────────────────────────────
  console.log("\n🗑️  Clearing existing data...");
  const reverseOrder = [...TABLE_ORDER].reverse();
  for (const table of reverseOrder) {
    try {
      await neon.query(`TRUNCATE "${table}" RESTART IDENTITY CASCADE`);
      console.log(`   ✓ Cleared ${table}`);
    } catch (e) {
      console.log(`   ⚠ ${table}: ${e.message}`);
    }
  }

  // ── Step 3: Migrate data ──────────────────────────────────────────────────
  console.log("\n📦 Migrating data...");
  for (const table of TABLE_ORDER) {
    try {
      const { rows, fields } = await local.query(`SELECT * FROM "${table}" ORDER BY id`);
      if (rows.length === 0) {
        console.log(`   ⏭  ${table}: empty`);
        continue;
      }

      const cols = fields.map(f => `"${f.name}"`).join(", ");
      let ok = 0, skip = 0;

      for (const row of rows) {
        const values = fields.map(f => row[f.name]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
        try {
          await neon.query(
            `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
          ok++;
        } catch (e) {
          if (e.code === "23503") {
            console.log(`   ⚠ FK skip ${table}#${row.id}: ${e.detail}`);
          }
          skip++;
        }
      }

      // Sync sequence to local max
      try {
        const seq = await local.query(`SELECT last_value FROM "${table}_id_seq"`);
        if (seq.rows[0]) {
          await neon.query(`SELECT setval('"${table}_id_seq"', ${seq.rows[0].last_value}, true)`);
        }
      } catch (_) {}

      console.log(`   ✓ ${table}: ${ok} rows inserted${skip ? `, ${skip} skipped` : ""}`);
    } catch (e) {
      console.error(`   ❌ ${table}: ${e.message}`);
    }
  }

  await local.end();
  await neon.end();
  console.log("\n✅ Done! All data migrated to Neon.");
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
