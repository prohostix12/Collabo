import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  X, Monitor, Smartphone, Tablet, HelpCircle, MapPin, Clock, LogOut, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: HelpCircle,
};

const timeAgo = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const DeviceManagementModal = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBusyId, setActionBusyId] = useState(null);
  const [revokeOthersBusy, setRevokeOthersBusy] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // session object or 'others'

  const fetchSessions = useCallback(() => {
    setLoading(true);
    setError('');
    api.get('/auth/sessions/')
      .then(res => setSessions(res.data))
      .catch(() => setError("Couldn't load your devices right now. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isOpen) fetchSessions();
  }, [isOpen, fetchSessions]);

  const handleRevoke = async (session) => {
    setActionBusyId(session.id);
    setConfirmTarget(null);
    try {
      const res = await api.post(`/auth/sessions/${session.id}/revoke/`);
      if (res.data.was_current_device) {
        toast.success('Logged out of this device');
        logout();
        onClose();
        return;
      }
      toast.success('Device logged out');
      fetchSessions();
    } catch {
      toast.error('Could not log out that device. Please try again.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleRevokeOthers = async () => {
    setRevokeOthersBusy(true);
    setConfirmTarget(null);
    try {
      const res = await api.post('/auth/sessions/revoke-others/');
      toast.success(res.data.message || 'Other devices logged out');
      fetchSessions();
    } catch {
      toast.error('Could not log out other devices. Please try again.');
    } finally {
      setRevokeOthersBusy(false);
    }
  };

  if (!isOpen) return null;

  const activeOthers = (sessions || []).filter(s => !s.revoked && !s.is_current);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/70 backdrop-blur-sm" onClick={onClose} />

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl border border-slate-100 relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Active Sessions</h3>
                <p className="text-sm text-slate-500">Devices currently signed in to your account</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {activeOthers.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setConfirmTarget('others')}
                disabled={revokeOthersBusy}
                className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
              >
                Log out all other devices ({activeOthers.length})
              </button>
            </div>
          )}

          <div className="max-h-[55vh] overflow-y-auto -mx-2 px-2 space-y-2">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <p className="text-sm text-slate-500 mb-2">{error}</p>
                <button onClick={fetchSessions} className="text-xs font-bold text-orange-600 hover:underline">Retry</button>
              </div>
            ) : !sessions || sessions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No sessions found</p>
            ) : (
              sessions.map((s) => {
                const Icon = DEVICE_ICONS[s.device_type] || HelpCircle;
                return (
                  <div
                    key={s.id}
                    className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border ${
                      s.revoked ? 'border-slate-100 bg-slate-50/60 opacity-60' : s.is_current ? 'border-orange-200 bg-orange-50/40' : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.revoked ? 'bg-slate-200' : 'bg-orange-100'}`}>
                        <Icon className={`w-4.5 h-4.5 ${s.revoked ? 'text-slate-400' : 'text-orange-600'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-800 truncate">{s.device_name}</p>
                          {s.is_current && (
                            <span className="text-[9px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-full shrink-0">This device</span>
                          )}
                          {s.revoked ? (
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-full shrink-0">Logged out</span>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full shrink-0">Active</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap mt-1 text-[11px] text-slate-400">
                          {s.location && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.location}</span>
                          )}
                          {s.ip_address && <span>{s.ip_address}</span>}
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                            {s.revoked ? `Logged out ${timeAgo(s.revoked_at || s.last_active_at)}` : `Active ${timeAgo(s.last_active_at)}`}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5">
                          Signed in {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {!s.revoked && (
                      <button
                        onClick={() => setConfirmTarget(s)}
                        disabled={actionBusyId === s.id}
                        className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                      >
                        <LogOut className="w-3 h-3" />
                        {s.is_current ? 'Log out' : 'Log out device'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Confirmation sub-dialog */}
      {confirmTarget && (
        <div className="fixed inset-0 z-[100000] bg-black/50 flex items-center justify-center p-4" onClick={() => setConfirmTarget(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {confirmTarget === 'others' ? 'Log out all other devices?' : 'Log out this device?'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {confirmTarget === 'others'
                    ? 'Every other device currently signed in will be logged out immediately.'
                    : confirmTarget.is_current
                      ? 'You will be logged out of this device immediately.'
                      : `"${confirmTarget.device_name}" will be logged out immediately.`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmTarget(null)} className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => confirmTarget === 'others' ? handleRevokeOthers() : handleRevoke(confirmTarget)}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default DeviceManagementModal;
