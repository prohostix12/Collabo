import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Users, Search, Mail, Phone,
  Shield, Trash2, Eye, Building2, User, MapPin,
  ExternalLink, X, Star
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { showConfirmToast } from '../../utils/toastHelpers';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userTypeFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = userTypeFilter === 'all'
        ? '/auth/admin/all-users/?page_size=1000'
        : `/auth/admin/all-users/?user_type=${userTypeFilter}&page_size=1000`;
      const response = await api.get(url);
      setUsers(response.data.results || response.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteUser = async (userId) => {
    showConfirmToast('Delete this user permanently?', async () => {
      try {
        await api.delete(`/auth/admin/delete-influencer/${userId}/`);
        toast.success('User deleted');
        fetchUsers();
      } catch {
        toast.error('Failed to delete user');
      }
    }, "Delete");
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-[11px] text-gray-500">{filteredUsers.length} users found</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-gray-400 w-48" />
          </div>
          <select value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-gray-400">
            <option value="all">All Roles</option>
            <option value="influencer">Influencers</option>
            <option value="company">Companies</option>
            <option value="seller">Sellers</option>
            <option value="buyer">Buyers</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(u)}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                          {u.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-gray-900 dark:text-white">{u.username}</p>
                          <p className="text-[10px] text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 capitalize">{u.user_type}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                        u.is_approved ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_approved ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {u.approval_status || (u.is_approved ? 'Approved' : 'Pending')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-100">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-[11px] text-gray-400">No users found</div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {selectedUser.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedUser.username}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Account Info */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Role', value: selectedUser.user_type },
                    { label: 'Status', value: selectedUser.approval_status || 'Active' },
                    { label: 'Joined', value: new Date(selectedUser.created_at).toLocaleDateString() },
                  ].map((f, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg">
                      <p className="text-[9px] text-gray-400 uppercase font-medium">{f.label}</p>
                      <p className="text-[11px] font-semibold text-gray-900 dark:text-white capitalize">{f.value}</p>
                    </div>
                  ))}
                </div>

                {/* Influencer Profile */}
                {selectedUser.user_type === 'influencer' && selectedUser.influencer_profile && (
                  <div className="space-y-3">
                    <p className="text-[10px] text-gray-400 uppercase font-medium">Performance</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Followers', value: selectedUser.influencer_profile.followers_count?.toLocaleString() },
                        { label: 'Engagement', value: `${selectedUser.influencer_profile.engagement_rate}%` },
                      ].map((s, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg">
                          <p className="text-[9px] text-gray-400 uppercase font-medium">{s.label}</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {selectedUser.influencer_profile.bio && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-[9px] text-gray-400 uppercase font-medium mb-1">Bio</p>
                        <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">{selectedUser.influencer_profile.bio}</p>
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400 uppercase font-medium">Rates</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Post', val: selectedUser.influencer_profile.rate_per_post },
                        { label: 'Story', val: selectedUser.influencer_profile.rate_per_story },
                        { label: 'Reel', val: selectedUser.influencer_profile.rate_per_reel },
                        { label: 'Video', val: selectedUser.influencer_profile.rate_per_video },
                      ].map(r => (
                        <div key={r.label} className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg text-center">
                          <p className="text-[8px] text-gray-400 uppercase">{r.label}</p>
                          <p className="text-[11px] font-semibold text-gray-900 dark:text-white">₹{r.val}</p>
                        </div>
                      ))}
                    </div>

                    {(selectedUser.influencer_profile.instagram_handle || selectedUser.influencer_profile.youtube_channel) && (
                      <>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Social</p>
                        <div className="space-y-1.5">
                          {selectedUser.influencer_profile.instagram_handle && (
                            <div className="flex items-center justify-between py-1.5 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <span className="text-[10px] text-gray-500">Instagram</span>
                              <span className="text-[11px] font-medium text-gray-900 dark:text-white">@{selectedUser.influencer_profile.instagram_handle}</span>
                            </div>
                          )}
                          {selectedUser.influencer_profile.youtube_channel && (
                            <div className="flex items-center justify-between py-1.5 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <span className="text-[10px] text-gray-500">YouTube</span>
                              <span className="text-[11px] font-medium text-gray-900 dark:text-white">{selectedUser.influencer_profile.youtube_channel}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Company Profile */}
                {selectedUser.user_type === 'company' && selectedUser.company_profile && (
                  <div className="space-y-3">
                    <p className="text-[10px] text-gray-400 uppercase font-medium">Business</p>
                    <div className="space-y-1.5">
                      {[
                        { label: 'Industry', value: selectedUser.company_profile.industry },
                        { label: 'Size', value: selectedUser.company_profile.company_size },
                        { label: 'Location', value: selectedUser.company_profile.location },
                      ].filter(f => f.value).map((f, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <span className="text-[10px] text-gray-500">{f.label}</span>
                          <span className="text-[11px] font-medium text-gray-900 dark:text-white capitalize">{f.value}</span>
                        </div>
                      ))}
                      {selectedUser.company_profile.website && (
                        <div className="flex items-center justify-between py-1.5 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <span className="text-[10px] text-gray-500">Website</span>
                          <a href={selectedUser.company_profile.website} target="_blank" rel="noreferrer"
                            className="text-[11px] font-medium text-gray-900 dark:text-white flex items-center gap-1 hover:underline">
                            Visit <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reset Password */}
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Reset Password</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id={`reset-pw-${selectedUser.id}`}
                      placeholder="Enter new password (min 8 chars)"
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-400 dark:text-white"
                    />
                    <button
                      onClick={async () => {
                        const pw = document.getElementById(`reset-pw-${selectedUser.id}`).value;
                        if (!pw || pw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
                        try {
                          await api.post(`/auth/admin/reset-password/${selectedUser.id}/`, { new_password: pw });
                          toast.success(`Password reset for ${selectedUser.username}`);
                          document.getElementById(`reset-pw-${selectedUser.id}`).value = '';
                        } catch (err) { toast.error(err.response?.data?.error || 'Failed to reset password'); }
                      }}
                      className="px-4 py-2 text-[11px] font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2 flex-wrap">
                  <button onClick={() => setSelectedUser(null)}
                    className="flex-1 py-2 text-[11px] font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
                    Close
                  </button>
                  {selectedUser.user_type !== 'influencer' && selectedUser.user_type !== 'admin' && !selectedUser.is_staff && (
                    <button
                      onClick={async () => {
                        try {
                          await api.post(`/auth/admin/convert-to-influencer/${selectedUser.id}/`);
                          toast.success(`${selectedUser.username} is now an influencer!`);
                          setSelectedUser(null);
                          fetchUsers();
                        } catch (err) {
                          toast.error(err.response?.data?.error || 'Failed to convert user');
                        }
                      }}
                      className="py-2 px-4 text-[11px] font-medium text-violet-600 bg-violet-50 dark:bg-violet-900/10 rounded-lg hover:bg-violet-100 transition-colors flex items-center gap-1">
                      <Star className="w-3 h-3" /> Make Influencer
                    </button>
                  )}
                  <button onClick={() => { setSelectedUser(null); handleDeleteUser(selectedUser.id); }}
                    className="py-2 px-4 text-[11px] font-medium text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
