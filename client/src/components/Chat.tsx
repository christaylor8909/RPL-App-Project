import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bot, Send, ArrowLeft, MessageCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: number;
  message: string;
  response: string;
  timestamp: string;
}

interface Agent {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

const Chat: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (agentId) {
      fetchAgentDetails();
      fetchChatHistory();
      setupSocket();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [agentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupSocket = () => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      if (user?.id) {
        newSocket.emit('join_client_room', user.id);
      }
    });

    newSocket.on('agent_response', (data) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, response: data.response }
          : msg
      ));
    });

    return () => {
      newSocket.disconnect();
    };
  };

  const fetchAgentDetails = async () => {
    try {
      const response = await axios.get('/api/agents');
      const agentData = response.data.find((a: Agent) => a.id === parseInt(agentId!));
      if (agentData) {
        setAgent(agentData);
      } else {
        toast.error('Agent not found');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error('Failed to fetch agent details');
      navigate('/dashboard');
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await axios.get(`/api/chat/${agentId}/history`);
      setMessages(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch chat history');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || loading) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`/api/chat/${agentId}`, {
        message: messageText
      });

      // Add the new message to the list
      const newMsg: Message = {
        id: response.data.messageId,
        message: messageText,
        response: '',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMsg]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
      setNewMessage(messageText); // Restore the message
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!agent) {
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="agent-icon">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{agent.name}</h1>
                {agent.description && (
                  <p className="text-sm text-gray-600">{agent.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                agent.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {agent.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-gray-600">Send a message to begin chatting with {agent.name}</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="space-y-3">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="chat-bubble user">
                      {message.message}
                    </div>
                  </div>
                  
                  {/* Agent Response */}
                  {message.response && (
                    <div className="flex justify-start">
                      <div className="chat-bubble agent">
                        {message.response}
                      </div>
                    </div>
                  )}
                  
                  {/* Loading indicator for pending response */}
                  {!message.response && (
                    <div className="flex justify-start">
                      <div className="chat-bubble agent">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="loading-dots">Agent is thinking</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={sendMessage} className="flex space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${agent.name}...`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading || !agent.is_active}
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim() || !agent.is_active}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </form>
            
            {!agent.is_active && (
              <p className="text-sm text-red-600 mt-2 text-center">
                This agent is currently inactive. Please contact your administrator.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 