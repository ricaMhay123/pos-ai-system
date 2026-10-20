const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
};
const targetDb = process.env.DATABASE_NAME || 'pos_db';

async function main() {
  console.log(`Connecting to PostgreSQL as "${config.user}" to verify database "${targetDb}"...`);
  
  // 1. Connect to default 'postgres' database to check/create target database
  const defaultClient = new Client({
    ...config,
    database: 'postgres',
  });

  try {
    await defaultClient.connect();
    console.log('✓ Successfully connected to default postgres maintenance database.');

    const checkRes = await defaultClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );

    if (checkRes.rows.length === 0) {
      console.log(`Database "${targetDb}" does not exist. Creating...`);
      await defaultClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`✓ Database "${targetDb}" created successfully.`);
    } else {
      console.log(`✓ Database "${targetDb}" already exists.`);
    }
  } catch (err) {
    console.error(`Error checking/creating database:`, err.message);
    throw err;
  } finally {
    await defaultClient.end();
  }

  // 2. Connect to the target database and execute migrations & seed
  const appClient = new Client({
    ...config,
    database: targetDb,
  });

  try {
    await appClient.connect();
    console.log(`✓ Connected directly to "${targetDb}". Applying schema migrations...`);

    const migrationFile = path.join(__dirname, '..', 'packages', 'database', 'migrations', '001_initial_pos_and_inventory_schema.sql');
    if (fs.existsSync(migrationFile)) {
      const sql = fs.readFileSync(migrationFile, 'utf8');
      await appClient.query(sql);
      console.log(`✓ Migration 001_initial_pos_and_inventory_schema.sql applied successfully.`);
    }

    const migration002File = path.join(__dirname, '..', 'packages', 'database', 'migrations', '002_create_inventory_recommendations.sql');
    if (fs.existsSync(migration002File)) {
      const sql = fs.readFileSync(migration002File, 'utf8');
      await appClient.query(sql);
      console.log(`✓ Migration 002_create_inventory_recommendations.sql applied successfully.`);
    }

    const seedFile = path.join(__dirname, '..', 'packages', 'database', 'seeds', '001_seed_initial_data.sql');
    if (fs.existsSync(seedFile)) {
      const sql = fs.readFileSync(seedFile, 'utf8');
      await appClient.query(sql);
      console.log(`✓ Seed 001_seed_initial_data.sql applied successfully.`);
    }

    const historyFile = path.join(__dirname, '..', 'packages', 'database', 'seeds', '002_historical_sales_6months.sql');
    if (fs.existsSync(historyFile)) {
      const txnCount = await appClient.query('SELECT count(*) FROM sales_transactions');
      if (parseInt(txnCount.rows[0].count, 10) < 50) {
        console.log('Populating 6 months of historical transactions for demand forecasting...');
        const sql = fs.readFileSync(historyFile, 'utf8');
        await appClient.query(sql);
        console.log(`✓ Seed 002_historical_sales_6months.sql applied successfully.`);
      }
    }

    // Diagnostics: check counts
    const userCount = await appClient.query('SELECT count(*) FROM users');
    const prodCount = await appClient.query('SELECT count(*) FROM products');
    const catCount = await appClient.query('SELECT count(*) FROM categories');
    const storeCount = await appClient.query('SELECT count(*) FROM stores');

    console.log('\n--- PostgreSQL POS Database Status ---');
    console.log(`Stores: ${storeCount.rows[0].count}`);
    console.log(`Users: ${userCount.rows[0].count}`);
    console.log(`Categories: ${catCount.rows[0].count}`);
    console.log(`Products: ${prodCount.rows[0].count}`);
    console.log('-------------------------------------\n');
    console.log('✅ PostgreSQL database setup and migration completed successfully!');
  } catch (err) {
    console.error(`Error during migration or seed:`, err.message);
    throw err;
  } finally {
    await appClient.end();
  }
}

main().catch((err) => {
  console.error('Fatal database setup error:', err);
  process.exit(1);
});
