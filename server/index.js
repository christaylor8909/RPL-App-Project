const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { query, getRow, getRows, initDatabase } = require('./database');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize database
async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = user;
    next();
  });
};

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const client = await getRow("SELECT * FROM clients WHERE username = $1", [username]);
    
    if (!client) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, client.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: client.id, username: client.username, role: 'client' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: client.id,
        username: client.username,
        email: client.email,
        company_name: client.company_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/auth/admin/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const admin = await getRow("SELECT * FROM admins WHERE username = $1", [username]);
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Client registration (admin only)
app.post('/api/clients', authenticateAdmin, async (req, res) => {
  const { username, email, password, company_name, webhook_url } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      "INSERT INTO clients (username, email, password_hash, company_name, webhook_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, company_name, webhook_url",
      [username, email, hashedPassword, company_name, webhook_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Client creation error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all clients (admin only)
app.get('/api/clients', authenticateAdmin, async (req, res) => {
  try {
    const clients = await getRows("SELECT id, username, email, company_name, webhook_url, created_at FROM clients ORDER BY created_at DESC");
    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update client webhook (admin only)
app.put('/api/clients/:id/webhook', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { webhook_url } = req.body;

  if (!webhook_url) {
    return res.status(400).json({ error: 'Webhook URL required' });
  }

  try {
    const result = await query(
      "UPDATE clients SET webhook_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id",
      [webhook_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Webhook updated successfully' });
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete client (admin only)
app.delete('/api/clients/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // First check if client exists
    const clientCheck = await getRow("SELECT id, username, company_name FROM clients WHERE id = $1", [id]);
    
    if (!clientCheck) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Delete the client (this will cascade delete agents and messages due to foreign key constraints)
    const result = await query(
      "DELETE FROM clients WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    console.log(`Admin deleted client: ${clientCheck.username} (${clientCheck.company_name})`);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Agent management routes
app.get('/api/agents', authenticateToken, async (req, res) => {
  const clientId = req.user.id;
  
  try {
    const agents = await getRows("SELECT * FROM agents WHERE client_id = $1 ORDER BY created_at DESC", [clientId]);
    res.json(agents);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/agents', authenticateToken, async (req, res) => {
  const clientId = req.user.id;
  const { name, description, webhook_url } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Agent name required' });
  }

  try {
    const result = await query(
      "INSERT INTO agents (client_id, name, description, webhook_url) VALUES ($1, $2, $3, $4) RETURNING *",
      [clientId, name, description, webhook_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/agents/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const clientId = req.user.id;
  const { name, description, webhook_url, is_active } = req.body;

  try {
    const result = await query(
      "UPDATE agents SET name = $1, description = $2, webhook_url = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND client_id = $6 RETURNING id",
      [name, description, webhook_url, is_active, id, clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ message: 'Agent updated successfully' });
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/agents/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const clientId = req.user.id;

  try {
    const result = await query(
      "DELETE FROM agents WHERE id = $1 AND client_id = $2 RETURNING id",
      [id, clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Chat functionality
app.post('/api/chat/:agentId', authenticateToken, async (req, res) => {
  const { agentId } = req.params;
  const clientId = req.user.id;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  try {
    // Get agent details
    const agent = await getRow("SELECT * FROM agents WHERE id = $1 AND client_id = $2", [agentId, clientId]);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (!agent.is_active) {
      return res.status(400).json({ error: 'Agent is not active' });
    }

    // Store message in database
    const messageResult = await query(
      "INSERT INTO messages (client_id, agent_id, message) VALUES ($1, $2, $3) RETURNING id",
      [clientId, agentId, message]
    );

    const messageId = messageResult.rows[0].id;

    // Send message to webhook if available
    if (agent.webhook_url) {
      axios.post(agent.webhook_url, {
        message,
        client_id: clientId,
        agent_id: agentId,
        message_id: messageId,
        timestamp: new Date().toISOString()
      }, {
        timeout: 10000
      }).then(async (response) => {
        const response_text = response.data.response || response.data.message || 'Agent response received';
        
        // Update message with response
        await query(
          "UPDATE messages SET response = $1 WHERE id = $2",
          [response_text, messageId]
        );

        // Emit to socket for real-time updates
        io.to(`client_${clientId}`).emit('agent_response', {
          messageId,
          agentId,
          response: response_text
        });
      }).catch(async (error) => {
        console.error('Webhook error:', error);
        const error_response = 'Sorry, the agent is currently unavailable.';
        
        await query(
          "UPDATE messages SET response = $1 WHERE id = $2",
          [error_response, messageId]
        );

        io.to(`client_${clientId}`).emit('agent_response', {
          messageId,
          agentId,
          response: error_response
        });
      });
    } else {
      const no_webhook_response = 'This agent is not configured with a webhook yet.';
      
      await query(
        "UPDATE messages SET response = $1 WHERE id = $2",
        [no_webhook_response, messageId]
      );

      io.to(`client_${clientId}`).emit('agent_response', {
        messageId,
        agentId,
        response: no_webhook_response
      });
    }

    res.json({
      messageId,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get chat history
app.get('/api/chat/:agentId/history', authenticateToken, async (req, res) => {
  const { agentId } = req.params;
  const clientId = req.user.id;

  try {
    const messages = await getRows(
      "SELECT * FROM messages WHERE client_id = $1 AND agent_id = $2 ORDER BY timestamp ASC",
      [clientId, agentId]
    );
    res.json(messages);
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_client_room', (clientId) => {
    socket.join(`client_${clientId}`);
    console.log(`Client ${clientId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

// Start the server
startServer().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin credentials: admin / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 