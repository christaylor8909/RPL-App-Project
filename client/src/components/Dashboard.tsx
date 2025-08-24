import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bot, Plus, Settings, LogOut, MessageCircle, Trash2, Edit, Power, PowerOff, Building2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Agent {
  id: number;
  name: string;
  description: string;
  webhook_url: string;
  is_active: boolean;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    webhook_url: ''
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await axios.get('/api/agents');
      setAgents(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Agent name is required');
      return;
    }

    try {
      await axios.post('/api/agents', formData);
      toast.success('Agent added successfully');
      setShowAddModal(false);
      setFormData({ name: '', description: '', webhook_url: '' });
      fetchAgents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add agent');
    }
  };

  const handleEditAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAgent || !formData.name) {
      toast.error('Agent name is required');
      return;
    }

    try {
      await axios.put(`/api/agents/${selectedAgent.id}`, formData);
      toast.success('Agent updated successfully');
      setShowEditModal(false);
      setSelectedAgent(null);
      setFormData({ name: '', description: '', webhook_url: '' });
      fetchAgents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update agent');
    }
  };

  const handleDeleteAgent = async (agentId: number) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) {
      return;
    }

    try {
      await axios.delete(`/api/agents/${agentId}`);
      toast.success('Agent deleted successfully');
      fetchAgents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete agent');
    }
  };

  const handleToggleAgent = async (agent: Agent) => {
    try {
      await axios.put(`/api/agents/${agent.id}`, {
        ...agent,
        is_active: !agent.is_active
      });
      toast.success(`Agent ${agent.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchAgents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to toggle agent');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openEditModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description || '',
      webhook_url: agent.webhook_url || ''
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <Bot className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RPL Client Portal</h1>
                {user?.company_name && (
                  <p className="text-sm text-gray-600 flex items-center">
                    <Building2 className="h-4 w-4 mr-1" />
                    {user.company_name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.username}
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

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">
              Welcome to Your AI Agent Portal
            </h2>
            <p className="text-blue-100 text-lg">
              Manage your AI agents and interact with them through our secure platform
            </p>
            {user?.company_name && (
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-full">
                <Building2 className="h-5 w-5 mr-2" />
                <span className="font-medium">{user.company_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your AI Agents</h2>
            <p className="text-gray-600 mt-1">Add and manage your AI agents for seamless interactions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Agent</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Bot className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-2xl font-semibold text-gray-900">{agents.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Power className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {agents.filter(a => a.is_active).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ready to Chat</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {agents.filter(a => a.is_active && a.webhook_url).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="agent-icon">
                  <Bot className="h-6 w-6" />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleAgent(agent)}
                    className={`p-2 rounded-full transition duration-200 ${
                      agent.is_active 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={agent.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {agent.is_active ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openEditModal(agent)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition duration-200"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition duration-200"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{agent.name}</h3>
              {agent.description && (
                <p className="text-gray-600 text-sm mb-4">{agent.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  agent.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {agent.is_active ? 'Active' : 'Inactive'}
                </span>
                
                <button
                  onClick={() => navigate(`/chat/${agent.id}`)}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition duration-200"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="text-center py-12">
            <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No agents yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first AI agent</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Add Your First Agent
            </button>
          </div>
        )}
      </main>

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Agent</h3>
            <form onSubmit={handleAddAgent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter agent name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter agent description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://your-webhook-url.com"
                />
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                >
                  Add Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {showEditModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Agent</h3>
            <form onSubmit={handleEditAgent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter agent name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter agent description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://your-webhook-url.com"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                >
                  Update Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 