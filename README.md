# RPL Client Portal

A comprehensive client portal application for managing AI agents with webhook integration for n8n workflows. This application provides a secure, multi-tenant system where clients can manage their AI agents and interact with them through a modern chat interface.

## Features

### 🔐 Authentication & Security
- **JWT-based authentication** for both clients and administrators
- **Role-based access control** (Client vs Admin)
- **Secure password hashing** with bcrypt
- **Rate limiting** and security headers
- **CORS protection**

### 👥 Client Management
- **Admin portal** for managing all clients
- **Client registration** with company information
- **Individual client portals** with isolated data
- **Webhook URL management** for n8n integration

### 🤖 AI Agent Management
- **Add/Edit/Delete agents** for each client
- **Agent activation/deactivation**
- **Webhook URL configuration** per agent
- **Agent descriptions** and metadata

### 💬 Real-time Chat Interface
- **Modern chat UI** with message bubbles
- **Real-time responses** via WebSocket
- **Chat history** persistence
- **Loading indicators** and status messages
- **Responsive design** for all devices

### 🔗 n8n Integration
- **Webhook endpoints** for each agent
- **Automatic message forwarding** to n8n workflows
- **Response handling** from n8n back to the chat
- **Error handling** for webhook failures

### 🎨 Modern UI/UX
- **Beautiful gradient design** with glass effects
- **Responsive layout** for desktop and mobile
- **Smooth animations** and transitions
- **Intuitive navigation** and user experience
- **Toast notifications** for user feedback

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database for data persistence
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **bcrypt** for password hashing
- **Helmet** for security headers
- **Rate limiting** for API protection

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **Socket.IO Client** for real-time features
- **Axios** for API communication

## Prerequisites

### Required Software
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### PostgreSQL Setup
1. **Install PostgreSQL** on your system
2. **Start PostgreSQL service**
3. **Note your PostgreSQL credentials** (username, password, port)

## Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd RPL-App-Project
npm run install-all
```

### 2. Configure Database
```bash
# Copy the config file
cp server/config.env server/.env

# Edit the .env file with your PostgreSQL credentials
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_PASSWORD=admin123

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rpl_portal
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

### 3. Setup Database
```bash
# This will create the database and tables
npm run setup-db
```

### 4. Start the Application
```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend development server (port 3000).

### Default Credentials

**Admin Access:**
- Username: `admin`
- Password: `admin123` (or the value set in ADMIN_PASSWORD)

## Usage

### Admin Portal (`/admin/login`)

1. **Login as admin** using the default credentials
2. **Add new clients** with their company information
3. **Manage client webhooks** for n8n integration
4. **View all clients** and their status

### Client Portal (`/login`)

1. **Clients login** with credentials provided by admin
2. **Add AI agents** to their inventory
3. **Configure webhook URLs** for each agent
4. **Chat with agents** through the interactive interface

### Agent Management

1. **Add Agent**: Click "Add Agent" button
2. **Configure**: Set name, description, and webhook URL
3. **Activate**: Toggle agent status on/off
4. **Chat**: Click "Chat" button to interact with the agent

### n8n Integration

1. **Set webhook URL** in the admin portal for each client
2. **Configure n8n workflow** to receive webhook data
3. **Process messages** in your n8n workflow
4. **Return response** to the webhook endpoint

The webhook payload includes:
```json
{
  "message": "User's message",
  "client_id": 123,
  "agent_id": 456,
  "message_id": 789,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Client login
- `POST /api/auth/admin/login` - Admin login

### Client Management (Admin Only)
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Add new client
- `PUT /api/clients/:id/webhook` - Update client webhook

### Agent Management
- `GET /api/agents` - Get client's agents
- `POST /api/agents` - Add new agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

### Chat
- `POST /api/chat/:agentId` - Send message to agent
- `GET /api/chat/:agentId/history` - Get chat history

## Database Schema

### Clients Table
- `id` - Primary key (SERIAL)
- `username` - Unique username (VARCHAR)
- `email` - Unique email (VARCHAR)
- `password_hash` - Hashed password (VARCHAR)
- `company_name` - Company name (VARCHAR)
- `webhook_url` - Client's webhook URL (TEXT)
- `created_at` - Creation timestamp (TIMESTAMP)
- `updated_at` - Last update timestamp (TIMESTAMP)

### Agents Table
- `id` - Primary key (SERIAL)
- `client_id` - Foreign key to clients (INTEGER)
- `name` - Agent name (VARCHAR)
- `description` - Agent description (TEXT)
- `webhook_url` - Agent's webhook URL (TEXT)
- `is_active` - Active status (BOOLEAN)
- `created_at` - Creation timestamp (TIMESTAMP)
- `updated_at` - Last update timestamp (TIMESTAMP)

### Messages Table
- `id` - Primary key (SERIAL)
- `client_id` - Foreign key to clients (INTEGER)
- `agent_id` - Foreign key to agents (INTEGER)
- `message` - User message (TEXT)
- `response` - Agent response (TEXT)
- `timestamp` - Message timestamp (TIMESTAMP)

### Admins Table
- `id` - Primary key (SERIAL)
- `username` - Unique username (VARCHAR)
- `email` - Unique email (VARCHAR)
- `password_hash` - Hashed password (VARCHAR)
- `created_at` - Creation timestamp (TIMESTAMP)

## Security Features

- **JWT tokens** with 24-hour expiration
- **Password hashing** with bcrypt (10 rounds)
- **Rate limiting** (100 requests per 15 minutes)
- **Security headers** with Helmet
- **CORS protection** for cross-origin requests
- **Input validation** and sanitization
- **SQL injection protection** with parameterized queries
- **Connection pooling** for efficient database connections

## Troubleshooting

### Database Connection Issues
1. **Check PostgreSQL is running**: `pg_ctl status`
2. **Verify credentials** in `server/.env`
3. **Test connection**: `psql -h localhost -U postgres -d rpl_portal`
4. **Check port**: Default is 5432

### Common Errors
- **ECONNREFUSED**: PostgreSQL not running
- **28P01**: Authentication failed (wrong password)
- **3D000**: Database doesn't exist (run setup-db)

### Manual Database Setup
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE rpl_portal;

# Exit psql
\q

# Run setup
npm run setup-db
```

## Deployment

### Production Setup

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   NODE_ENV=production
   JWT_SECRET=your-production-secret-key
   ADMIN_PASSWORD=your-secure-admin-password
   DB_HOST=your-production-db-host
   DB_PASSWORD=your-production-db-password
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

### Docker Deployment (Optional)

Create a `Dockerfile` for containerized deployment:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for RPL Client Portal**
