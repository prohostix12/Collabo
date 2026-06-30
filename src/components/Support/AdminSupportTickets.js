import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket, Clock, CheckCircle, XCircle, AlertCircle,
  Search, Filter, Eye, MessageSquare, Calendar, Send,
  User, Activity, X
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminSupportTickets = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const { data: ticketsData, isLoading } = useQuery(
    ['admin-support-tickets', statusFilter, priorityFilter],
    async () => {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      const response = await api.get('/support/tickets/', { params });
      return response.data;
    }
  );

  // Handle both paginated and non-paginated responses
  const tickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData?.results || []);

  const { data: stats } = useQuery('admin-ticket-stats', async () => {
    const response = await api.get('/support/tickets/statistics/');
    return response.data;
  });

  const replyMutation = useMutation(
    async ({ ticketId, reply, status }) => {
      const payload = {
        admin_reply: reply,
      };
      
      // Only include status if it's provided and not empty
      if (status && status.trim() !== '') {
        payload.status = status;
      }
      
      const response = await api.post(`/support/tickets/${ticketId}/reply/`, payload);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Reply sent successfully!');
        queryClient.invalidateQueries('admin-support-tickets');
        queryClient.invalidateQueries('admin-ticket-stats');
        setSelectedTicket(null);
        setReplyText('');
        setNewStatus('');
      },
      onError: (error) => {
        console.error('Reply error:', error.response?.data);
        const errorMessage = error.response?.data?.admin_reply?.[0] || 
                           error.response?.data?.status?.[0] ||
                           error.response?.data?.message || 
                           'Failed to send reply';
        toast.error(errorMessage);
      },
    }
  );

  const updateStatusMutation = useMutation(
    async ({ ticketId, status }) => {
      const response = await api.patch(`/support/tickets/${ticketId}/update_status/`, {
        status,
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Status updated successfully!');
        queryClient.invalidateQueries('admin-support-tickets');
        queryClient.invalidateQueries('admin-ticket-stats');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update status');
      },
    }
  );

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
      low: 'text-gray-600 bg-gray-100',
      medium: 'text-blue-600 bg-blue-100',
      high: 'text-red-600 bg-red-100',
    };
    return colors[priority] || colors.medium;
  };

  const filteredTickets = (tickets || []).filter((ticket) =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.user_details?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReply = () => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    if (replyText.trim().length < 10) {
      toast.error('Reply must be at least 10 characters long');
      return;
    }

    replyMutation.mutate({
      ticketId: selectedTicket.id,
      reply: replyText,
      status: newStatus || undefined,
    });
  };

  const handleStatusChange = (ticketId, status) => {
    updateStatusMutation.mutate({ ticketId, status });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Support Tickets</h1>
        <p className="text-[11px] text-gray-500">{filteredTickets.length} tickets</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total_tickets, icon: Ticket },
            { label: 'Open', value: stats.status_breakdown?.open || 0, icon: AlertCircle },
            { label: 'In Progress', value: stats.status_breakdown?.in_progress || 0, icon: Clock },
            { label: 'Resolved', value: stats.status_breakdown?.resolved || 0, icon: CheckCircle },
            { label: 'Avg Response', value: stats.average_response_time_hours ? `${stats.average_response_time_hours}h` : 'N/A', icon: Activity },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <s.icon className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters + List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-700">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-800" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-800">
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white dark:bg-gray-800">
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
            { value: 'open', label: 'Open', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
            { value: 'in_progress', label: 'In Progress', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
            { value: 'resolved', label: 'Resolved', color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            { value: 'closed', label: 'Closed', color: 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${statusFilter === tab.value ? tab.color + ' ring-2 ring-offset-1 ring-gray-300 dark:ring-gray-600 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              {tab.label}
              {tab.value !== 'all' && stats && (
                <span className="ml-1.5 text-[9px] opacity-70">
                  {tab.value === 'open' ? (stats.status_breakdown?.open || 0) :
                   tab.value === 'in_progress' ? (stats.status_breakdown?.in_progress || 0) :
                   tab.value === 'resolved' ? (stats.status_breakdown?.resolved || 0) :
                   (stats.status_breakdown?.closed || 0)}
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredTickets.length === 0 ? (
          <div className="text-center py-10 text-[11px] text-gray-400">No tickets found</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {filteredTickets.map((ticket, index) => {
              const statusConfig = getStatusConfig(ticket.status);
              const StatusIcon = statusConfig.icon;
              return (
                <div key={ticket.id}
                  className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[11px] font-medium text-gray-900 dark:text-white truncate">{ticket.subject}</span>
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {statusConfig.label}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        <span>#{ticket.ticket_number}</span>
                        <span>{ticket.user_details?.username || 'Unknown'}</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        <span className="capitalize">{ticket.category}</span>
                      </div>
                      {ticket.admin_reply && (
                        <div className="mt-1.5 text-[10px] text-gray-500 bg-gray-50 dark:bg-gray-700/30 px-2.5 py-1.5 rounded-lg line-clamp-1">
                          Replied: {ticket.admin_reply}
                        </div>
                      )}
                    </div>
                    <Eye className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  </div>
                </div>
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
            onClose={() => {
              setSelectedTicket(null);
              setReplyText('');
              setNewStatus('');
            }}
            replyText={replyText}
            setReplyText={setReplyText}
            newStatus={newStatus}
            setNewStatus={setNewStatus}
            onReply={handleReply}
            onStatusChange={handleStatusChange}
            isSubmitting={replyMutation.isLoading || updateStatusMutation.isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Ticket Detail Modal Component
const TicketDetailModal = ({
  ticket,
  onClose,
  replyText,
  setReplyText,
  newStatus,
  setNewStatus,
  onReply,
  onStatusChange,
  isSubmitting,
}) => {
  const statusConfig = {
    open: { label: 'Open', color: 'bg-amber-100 text-amber-800', icon: AlertCircle },
    in_progress: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-800', icon: Clock },
    resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  }[ticket.status];

  const StatusIcon = statusConfig.icon;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>

        {/* Header — fixed */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{ticket.subject}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-400">#{ticket.ticket_number}</span>
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium ${statusConfig.color}`}>
                <StatusIcon className="w-2.5 h-2.5" />{statusConfig.label}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${ticket.priority === 'high' ? 'bg-red-50 text-red-600' : ticket.priority === 'medium' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>{ticket.priority}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Meta */}
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span>User: <span className="text-gray-700 dark:text-gray-200 font-medium">{ticket.user_details?.username}</span></span>
            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
            <span className="capitalize">{ticket.category}</span>
          </div>

          {/* Status Change */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-medium mb-1.5">Status</p>
            <div className="flex gap-1.5">
              {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
                <button key={s} onClick={() => onStatusChange(ticket.id, s)}
                  disabled={ticket.status === s || isSubmitting}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                    ticket.status === s ? 'bg-gray-900 text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 border border-gray-200 dark:border-gray-600'
                  } disabled:opacity-50`}>
                  {s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Message</p>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-[11px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
            </div>
          </div>

          {/* Screenshot */}
          {ticket.screenshot && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Attachment</p>
              <img src={ticket.screenshot} alt="Screenshot" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 max-h-48 object-contain bg-gray-50" />
            </div>
          )}

          {/* Previous Reply */}
          {ticket.admin_reply && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Previous Reply</p>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                <p className="text-[9px] text-gray-400 mb-1">{new Date(ticket.admin_replied_at).toLocaleDateString()}</p>
                <p className="text-[11px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.admin_reply}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer — fixed reply + actions */}
        <div className="shrink-0 border-t border-gray-100 dark:border-gray-700 p-4 space-y-3 bg-gray-50/50 dark:bg-gray-800">
          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply..." rows={3}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none bg-white dark:bg-gray-900 dark:text-white" />
          <div className="flex items-center gap-2">
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] focus:outline-none bg-white dark:bg-gray-800 text-gray-600">
              <option value="">Keep status</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <div className="flex-1" />
            <button onClick={onClose} disabled={isSubmitting}
              className="px-4 py-1.5 text-[11px] font-medium text-gray-600 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              Close
            </button>
            <button onClick={onReply} disabled={isSubmitting || !replyText.trim() || replyText.trim().length < 10}
              className="px-4 py-1.5 text-[11px] font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-40 flex items-center gap-1.5">
              <Send className="w-3 h-3" />
              {isSubmitting ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminSupportTickets;
