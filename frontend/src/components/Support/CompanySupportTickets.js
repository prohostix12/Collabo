import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket, Clock, CheckCircle, XCircle, AlertCircle,
  Search, Filter, Eye, MessageSquare, Calendar, Plus,
  FileText, Loader
} from 'lucide-react';
import api from '../../services/api';
import ContactSupportModal from './ContactSupportModal';

const CompanySupportTickets = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: ticketsData, isLoading, refetch } = useQuery(
    ['company-support-tickets', statusFilter],
    async () => {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/support/tickets/my_tickets/', { params });
      return response.data;
    }
  );

  const { data: stats } = useQuery('company-ticket-stats', async () => {
    const response = await api.get('/support/stats/');
    return response.data;
  });

  // Handle both paginated and non-paginated responses
  const tickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData?.results || []);

  const getStatusConfig = (status) => {
    const configs = {
      open: {
        label: 'Open',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: AlertCircle,
      },
      in_progress: {
        label: 'In Progress',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: Clock,
      },
      resolved: {
        label: 'Resolved',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: CheckCircle,
      },
      closed: {
        label: 'Closed',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle,
      },
    };
    return configs[status] || configs.open;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      low: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
      medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
      high: { label: 'High', color: 'bg-red-100 text-red-700' },
    };
    return configs[priority] || configs.medium;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      technical: '🔧',
      payment: '💳',
      campaign: '📢',
      account: '👤',
      other: '💬',
    };
    return icons[category] || '💬';
  };

  const filteredTickets = (tickets || []).filter((ticket) =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCloseModal = () => {
    setShowCreateModal(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Support Center
              </h1>
              <p className="text-gray-600">
                Get help with your campaigns and account
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-xl hover:from-primary-700 hover:to-accent-600 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Raise New Ticket</span>
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <Ticket className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600 mt-1">Total Tickets</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.open}</p>
                <p className="text-sm text-gray-600 mt-1">Open</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.in_progress}</p>
                <p className="text-sm text-gray-600 mt-1">In Progress</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.resolved}</p>
                <p className="text-sm text-gray-600 mt-1">Resolved</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <XCircle className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.closed}</p>
                <p className="text-sm text-gray-600 mt-1">Closed</p>
              </motion.div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by subject or ticket number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white min-w-48"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket className="w-12 h-12 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {searchQuery ? 'No tickets found' : 'No support tickets yet'}
              </h3>
              <p className="text-gray-600 mb-8">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Need help? Create your first support ticket and our team will assist you.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-xl hover:from-primary-700 hover:to-accent-600 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Ticket</span>
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map((ticket, index) => {
              const statusConfig = getStatusConfig(ticket.status);
              const priorityConfig = getPriorityConfig(ticket.priority);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedTicket(ticket)}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-xl hover:border-primary-300 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl group-hover:scale-110 transition-transform">
                          {getCategoryIcon(ticket.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                              {ticket.subject}
                            </h3>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusConfig.label}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityConfig.color}`}>
                              {priorityConfig.label} Priority
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Ticket #{ticket.ticket_number}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {new Date(ticket.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
                              {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                            </span>
                            {ticket.admin_reply && (
                              <span className="inline-flex items-center gap-1.5 text-blue-600 font-medium">
                                <MessageSquare className="w-4 h-4" />
                                Admin Replied
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 line-clamp-2 ml-16">
                        {ticket.message}
                      </p>
                    </div>
                    <button className="flex-shrink-0 p-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors lg:ml-4">
                      <Eye className="w-6 h-6" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <TicketDetailModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
          />
        )}
      </AnimatePresence>

      {/* Create Ticket Modal */}
      <ContactSupportModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
      />
    </div>
  );
};

// Ticket Detail Modal Component
const TicketDetailModal = ({ ticket, onClose }) => {
  const statusConfig = {
    open: { label: 'Open', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: AlertCircle },
    in_progress: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Clock },
    resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle },
  }[ticket.status];

  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-accent-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{ticket.subject}</h2>
            <p className="text-sm text-gray-600 mt-1">Ticket #{ticket.ticket_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {/* Status and Info */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold border ${statusConfig.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </span>
            <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
              {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
              ticket.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
            </span>
            <span className="text-sm text-gray-600">
              Created: {new Date(ticket.created_at).toLocaleString()}
            </span>
          </div>

          {/* Your Message */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Your Message
            </h3>
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
            </div>
          </div>

          {/* Screenshot */}
          {ticket.screenshot && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Attachment</h3>
              <img
                src={ticket.screenshot}
                alt="Ticket attachment"
                className="w-full rounded-xl border border-gray-200 shadow-sm"
              />
            </div>
          )}

          {/* Admin Reply */}
          {ticket.admin_reply ? (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Support Team Response
              </h3>
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Support Team</p>
                    <p className="text-xs text-blue-700">
                      {new Date(ticket.admin_replied_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-blue-900 whitespace-pre-wrap leading-relaxed">{ticket.admin_reply}</p>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-5 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-amber-900 mb-1">Awaiting Response</p>
                  <p className="text-sm text-amber-800">
                    Our support team will review your ticket and respond as soon as possible.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CompanySupportTickets;
