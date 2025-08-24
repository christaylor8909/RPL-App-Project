const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rpl_portal',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database tables
async function initDatabase() {
  try {
    // Create clients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        company_name VARCHAR(255),
        webhook_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create agents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        webhook_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `);

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        agent_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        response TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      )
    `);

    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_username ON clients(username);
      CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
      CREATE INDEX IF NOT EXISTS idx_agents_client_id ON agents(client_id);
      CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
      CREATE INDEX IF NOT EXISTS idx_messages_agent_id ON messages(agent_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    `);

    // Insert default admin if not exists
    const adminCheck = await pool.query("SELECT * FROM admins WHERE username = $1", ['admin']);
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await pool.query(
        "INSERT INTO admins (username, email, password_hash) VALUES ($1, $2, $3)",
        ['admin', 'admin@rpl.com', hashedPassword]
      );
      console.log('Default admin user created');
    }

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Helper function to run queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function to get a single row
async function getRow(text, params) {
  const res = await query(text, params);
  return res.rows[0];
}

// Helper function to get multiple rows
async function getRows(text, params) {
  const res = await query(text, params);
  return res.rows;
}

module.exports = {
  pool,
  query,
  getRow,
  getRows,
  initDatabase
}; 