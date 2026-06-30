import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket, Clock, CheckCircle, XCircle, AlertCircle,
  Search, Filter, Eye, MessageSquare, Calendar, Plus
} from 'lucide-react';
import api from '../../services/api';
import ContactSupportModal from './ContactSupportModal';

const MySupportTickets = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const { data: tickets, isLoading, refetch } = useQuery(
    ['my-support-tickets', statusFilter],
    async () => {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/support/tickets/my_tickets/', { params });
      return response.data;
    }
  );

  const { data: stats } = useQuery('ticket-stats', async () => {
    const response = await api.get('/support/stats/');
    return response.data;
  });

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

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-red-600',
    };
    return colors[priority] || colors.medium;
  };

  const filteredTickets = tickets?.filter((ticket) =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCloseModal = () => {
    setShowContactModal(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">My Support Tickets</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Track and manage your support requests.</p>
        </div>
        <button
          onClick={() => setShowContactModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all text-xs font-extrabold shadow-sm shadow-orange-500/25"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[24px] p-5 shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0">
              <Ticket className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Total Tickets</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[24px] p-5 shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Open</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats.open}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[24px] p-5 shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">In Progress</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats.in_progress}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[24px] p-5 shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Resolved</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats.resolved}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[24px] p-5 shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Closed</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats.closed}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[24px] p-4 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none min-w-[160px] outline-none transition-all"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[24px] shadow-sm overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Ticket className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">No tickets found</h3>
            <p className="text-xs font-semibold text-slate-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filters.'
                : 'Create your first support ticket to get help.'}
            </p>
            <button
              onClick={() => setShowContactModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all text-xs font-extrabold shadow-sm shadow-orange-500/25"
            >
              <Plus className="w-4 h-4" />
              <span>Create Ticket</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {filteredTickets.map((ticket, index) => {
              const statusConfig = getStatusConfig(ticket.status);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100 dark:border-slate-700">
                          <Ticket className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                              {ticket.subject}
                            </h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 font-mono">
                            #{ticket.ticket_number}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                            <span className={getPriorityColor(ticket.priority)}>
                              {ticket.priority} Priority
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                              {ticket.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 line-clamp-2 sm:ml-13 leading-relaxed">
                        {ticket.message}
                      </p>
                      {ticket.admin_reply && (
                        <div className="mt-3 sm:ml-13 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                          <div className="flex items-center gap-2 mb-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[10px] uppercase tracking-wider font-black text-blue-600 dark:text-blue-400">Admin Reply</span>
                          </div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{ticket.admin_reply}</p>
                        </div>
                      )}
                    </div>
                    <button className="flex-shrink-0 p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition-colors">
                      <Eye className="w-4 h-4" />
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

      {/* Contact Support Modal */}
      <ContactSupportModal
        isOpen={showContactModal}
        onClose={handleCloseModal}
      />
    </div>
  );
};

// Ticket Detail Modal Component
const TicketDetailModal = ({ ticket, onClose }) => {
  const statusConfig = {
    open: { label: 'Open', color: 'bg-amber-100 text-amber-800', icon: AlertCircle },
    in_progress: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-800', icon: Clock },
    resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: XCircle },
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
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </span>
            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
            </span>
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
            </span>
            <span className="text-sm text-gray-600">
              Created: {new Date(ticket.created_at).toLocaleString()}
            </span>
          </div>

          {/* Message */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Message</h3>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
            </div>
          </div>

          {/* Screenshot */}
          {ticket.screenshot && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Screenshot</h3>
              <img
                src={ticket.screenshot}
                alt="Ticket screenshot"
                className="w-full rounded-xl border border-gray-200"
              />
            </div>
          )}

          {/* Admin Reply */}
          {ticket.admin_reply && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Response</h3>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Replied on {new Date(ticket.admin_replied_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-blue-900 whitespace-pre-wrap">{ticket.admin_reply}</p>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MySupportTickets;
