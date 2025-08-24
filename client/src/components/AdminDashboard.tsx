import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Plus, LogOut, Users, Link, Edit, Trash2, Eye, UserPlus, Copy, Check } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Client {
  id: number;
  username: string;
  email: string;
  company_name: string;
  webhook_url: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    company_name: '',
    webhook_url: ''
  });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copiedCredentials, setCopiedCredentials] = useState<number | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Username, email, and password are required');
      return;
    }

    try {
      const response = await axios.post('/api/clients', formData);
      toast.success('Client added successfully');
      setShowAddModal(false);
      setFormData({ username: '', email: '', password: '', company_name: '', webhook_url: '' });
      fetchClients();
      
      // Show credentials for copying
      const newClient = response.data;
      setCopiedCredentials(newClient.id);
      setTimeout(() => setCopiedCredentials(null), 5000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add client');
    }
  };

  const handleUpdateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !webhookUrl) {
      toast.error('Webhook URL is required');
      return;
    }

    try {
      await axios.put(`/api/clients/${selectedClient.id}/webhook`, {
        webhook_url: webhookUrl
      });
      toast.success('Webhook updated successfully');
      setShowWebhookModal(false);
      setSelectedClient(null);
      setWebhookUrl('');
      fetchClients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update webhook');
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    try {
      await axios.delete(`/api/clients/${selectedClient.id}`);
      toast.success('Client deleted successfully');
      setShowDeleteModal(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete client');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const openWebhookModal = (client: Client) => {
    setSelectedClient(client);
    setWebhookUrl(client.webhook_url || '');
    setShowWebhookModal(true);
  };

  const openDeleteModal = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const copyCredentials = (client: Client) => {
    const credentials = `Username: ${client.username}\nPassword: [Set by admin]\nLogin URL: http://localhost:3000/login`;
    navigator.clipboard.writeText(credentials);
    setCopiedCredentials(client.id);
    toast.success('Credentials copied to clipboard');
    setTimeout(() => setCopiedCredentials(null), 3000);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">RPL Admin Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Admin: {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Client Management</h2>
            <p className="text-gray-600 mt-2">Manage your clients and their individual portals</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition duration-200"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Client</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-semibold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Link className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Webhooks</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {clients.filter(c => c.webhook_url).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <Shield className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admin Access</p>
                <p className="text-2xl font-semibold text-gray-900">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <UserPlus className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Portal URL</p>
                <p className="text-sm font-semibold text-gray-900">localhost:3000</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Client Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Webhook Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.username}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.company_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.webhook_url 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.webhook_url ? 'Configured' : 'Not Set'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => copyCredentials(client)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition duration-200"
                          title="Copy Login Credentials"
                        >
                          {copiedCredentials === client.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openWebhookModal(client)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-50 transition duration-200"
                          title="Manage Webhook"
                        >
                          <Link className="h-4 w-4" />
                        </button>
                        {client.webhook_url && (
                          <a
                            href={client.webhook_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50 transition duration-200"
                            title="View Webhook"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => openDeleteModal(client)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition duration-200"
                          title="Delete Client"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {clients.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first client user</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition duration-200"
            >
              Add Your First Client
            </button>
          </div>
        )}
      </main>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Client User</h3>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition duration-200"
                    title="Generate Password"
                  >
                    🔄
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter company name"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Client Access:</strong> After creation, clients can login at <code className="bg-blue-100 px-1 rounded">http://localhost:3000/login</code>
                </p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-200"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {showWebhookModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Manage Webhook for {selectedClient.company_name || selectedClient.username}
            </h3>
            <form onSubmit={handleUpdateWebhook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://your-n8n-webhook-url.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This webhook will be used to connect the client's agents to your n8n workflows
                </p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-200"
                >
                  Update Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Client Modal */}
      {showDeleteModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-full bg-red-100 text-red-600 mr-3">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Client</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <strong>{selectedClient.company_name || selectedClient.username}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. All client data, including:
                </p>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                  <li>Client account and login credentials</li>
                  <li>All AI agents created by this client</li>
                  <li>Chat history and messages</li>
                  <li>Webhook configurations</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
              >
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 