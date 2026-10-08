const { Client } = require('pg');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash("sha256").update(password + "elibrary_salt").digest("hex");
}

const client = new Client({ connectionString: 'postgresql://postgres:KrestinMae08@localhost:5433/ELIBRARY_db' });

async function setupUsers() {
  await client.connect();

  const adminHash = hashPassword('Sacayan123');
  const krestinHash = hashPassword('KrestinMae08');

  // Insert or update admin
  await client.query(`
    INSERT INTO users (fullname, email, password_hash, phone, address, campus, role, is_approved)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (email) DO UPDATE SET 
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      is_approved = EXCLUDED.is_approved
  `, ['Admin', 'admin@zdspgc.edu.ph', adminHash, '0000000000', 'Admin Address', 'ZDSPGC-Dimataling Campus', 'admin', true]);

  // Insert or update krestin
  await client.query(`
    INSERT INTO users (fullname, email, password_hash, phone, address, campus, role, is_approved)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (email) DO UPDATE SET 
      password_hash = EXCLUDED.password_hash,
      is_approved = EXCLUDED.is_approved
  `, ['Krestin Mae', 'krestin@zdspgc.edu.ph', krestinHash, '0000000000', 'Address', 'ZDSPGC-Dimataling Campus', 'student', true]);

  console.log('Successfully registered admin and krestin users.');
  await client.end();
}

setupUsers().catch(console.error);
