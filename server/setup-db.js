const { Client } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  console.log('Setting up PostgreSQL database for RPL Client Portal...\n');

  // First, connect to the default 'postgres' database to create our database
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Connect to default database first
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');

    // Check if our database exists
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'rpl_portal']
    );

    if (dbCheck.rows.length === 0) {
      // Create the database
      console.log(`Creating database: ${process.env.DB_NAME || 'rpl_portal'}`);
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'rpl_portal'}`);
      console.log('Database created successfully');
    } else {
      console.log(`Database ${process.env.DB_NAME || 'rpl_portal'} already exists`);
    }

    await client.end();

    // Now connect to our database and create tables
    const { initDatabase } = require('./database');
    await initDatabase();

    console.log('\n✅ Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Access the admin portal: http://localhost:3000/admin/login');
    console.log('3. Login with: admin / admin123');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your database credentials in server/.env');
    console.log('3. Ensure the postgres user has permission to create databases');
    console.log('4. Try running: createdb rpl_portal (if you have createdb command)');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nConnection refused - PostgreSQL might not be running');
      console.log('Start PostgreSQL service and try again');
    }
    
    if (error.code === '28P01') {
      console.log('\nAuthentication failed - check your DB_PASSWORD in server/.env');
    }
    
    process.exit(1);
  }
}

// Run the setup
setupDatabase(); 