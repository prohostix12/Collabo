import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mail, Upload, Download, Plus, Send, Eye, X, Search, Pencil, Pause, Play, RefreshCw, FileText, History, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const inputCls = 'w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 px-2.5 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400/50';
const btn = 'inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
const btnDark = `${btn} bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-600`;
const btnOrange = `${btn} bg-orange-500 hover:bg-orange-600 text-white`;
const btnLight = `${btn} border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800`;
const PLACEHOLDERS = ['{{brand_name}}', '{{contact_person}}', '{{category}}'];

const BUSINESS_TYPES = ['D2C', 'B2C'];
const businessTypeCls = (t) => (t === 'D2C' ? 'bg-violet-50 text-violet-700' : t === 'B2C' ? 'bg-sky-50 text-sky-700' : 'bg-gray-100 text-gray-400');

// Column headings the importer understands. Headings only, so nothing is imported by accident.
const downloadTemplateCsv = () => {
  const csv = String.fromCharCode(0xFEFF) + ['#', 'Brand Name', 'Category', 'D2C or B2C', 'Headquarters', 'Founded', 'Founders', 'Key Products', 'Official Website / Store Link', 'e-mail ID', 'Contact Number'].join(',') + String.fromCharCode(13, 10);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'collabo-brand-outreach-template.csv'; a.click();
  URL.revokeObjectURL(url);
};

const fmtDate = (s) => (s ? new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');
const errMsg = (e, fallback) => e?.response?.data?.error || e?.response?.data?.detail || fallback;

const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

const statusPill = (st) => {
  const map = {
    active: 'bg-emerald-50 text-emerald-700', opted_out: 'bg-gray-100 text-gray-600', bounced: 'bg-red-50 text-red-700',
    running: 'bg-blue-50 text-blue-700', paused: 'bg-amber-50 text-amber-700', completed: 'bg-emerald-50 text-emerald-700', cancelled: 'bg-gray-100 text-gray-600',
    sent: 'bg-emerald-50 text-emerald-700', failed: 'bg-red-50 text-red-700', queued: 'bg-gray-100 text-gray-600', sending: 'bg-blue-50 text-blue-700', skipped: 'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${map[st] || 'bg-gray-100 text-gray-600'}`}>{String(st).replace('_', ' ')}</span>;
};

/* ------------------------------------------------------------------ SEND TAB */
const SendTab = ({ templates, limits, reloadLimits, onSent }) => {
  const { user } = useAuth();
  const [data, setData] = useState({ results: [], count: 0, categories: [], summary: {} });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', category: '', business_type: '', status: 'active', contacted: '' });
  const [selected, setSelected] = useState(new Set());
  const [allMatching, setAllMatching] = useState(false);
  const [excluded, setExcluded] = useState(new Set());
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [footer, setFooter] = useState(false);
  const [plain, setPlain] = useState(false);
  const [skipContacted, setSkipContacted] = useState(true);
  const [testTo, setTestTo] = useState(user?.email || 'info@collabo.co.in');
  const [preview, setPreview] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(null); // contact object, or {} for new
  const [showImport, setShowImport] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const PAGE_SIZE = 50;

  const params = useMemo(() => {
    const p = { page, page_size: PAGE_SIZE };
    Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; });
    return p;
  }, [page, filters]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/outreach/contacts/', { params });
      setData(res.data);
    } catch (e) {
      toast.error(errMsg(e, 'Could not load brands'));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!templateId && templates.length) { setTemplateId(String(templates[0].id)); } }, [templates, templateId]);
  const tpl = templates.find((t) => String(t.id) === String(templateId));
  useEffect(() => { setSubject(tpl ? tpl.subject : ''); }, [tpl]);

  const setFilter = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); clearSelection(); };
  const clearSelection = () => { setSelected(new Set()); setAllMatching(false); setExcluded(new Set()); };

  const isChecked = (id) => (allMatching ? !excluded.has(id) : selected.has(id));
  const toggleRow = (id) => {
    if (allMatching) setExcluded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    else setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const pageIds = data.results.map((c) => c.id);
  const allOnPage = pageIds.length > 0 && pageIds.every(isChecked);
  const togglePage = () => {
    if (allMatching) { setExcluded((s) => { const n = new Set(s); pageIds.forEach((id) => (allOnPage ? n.add(id) : n.delete(id))); return n; }); return; }
    setSelected((s) => { const n = new Set(s); pageIds.forEach((id) => (allOnPage ? n.delete(id) : n.add(id))); return n; });
  };
  const selectedCount = allMatching ? Math.max(0, data.count - excluded.size) : selected.size;

  const buildPayload = () => {
    const base = { template_id: Number(templateId), subject, add_footer: footer, plain_style: plain, skip_contacted: skipContacted };
    if (allMatching) return { ...base, select_all: true, filters: Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), exclude_ids: [...excluded] };
    return { ...base, contact_ids: [...selected] };
  };

  const doBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const payload = allMatching
        ? { action: 'delete', select_all: true, filters: Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), exclude_ids: [...excluded] }
        : { action: 'delete', ids: [...selected] };
      const res = await api.post('/outreach/contacts/bulk/', payload);
      toast.success(`Deleted ${res.data.affected} brand${res.data.affected === 1 ? '' : 's'}`);
      setConfirmBulkDelete(false); clearSelection(); load();
    } catch (e) { toast.error(errMsg(e, 'Could not delete')); } finally { setBulkDeleting(false); }
  };

  const doPreview = async (contactId) => {
    try {
      const res = await api.post('/outreach/preview/', { template_id: Number(templateId), subject, add_footer: footer, plain_style: plain, contact_id: contactId });
      setPreview(res.data);
    } catch (e) { toast.error(errMsg(e, 'Could not build the preview')); }
  };
  const doTest = async () => {
    try {
      const res = await api.post('/outreach/test/', { template_id: Number(templateId), subject, add_footer: footer, plain_style: plain, to: testTo });
      toast.success(`Test email sent to ${res.data.sent_to}`);
    } catch (e) { toast.error(errMsg(e, 'Could not send the test email')); }
  };
  const doSend = async () => {
    setSending(true);
    try {
      const res = await api.post('/outreach/campaigns/', buildPayload());
      const c = res.data;
      const skipped = (c.skipped_opted_out_or_invalid || 0) + (c.skipped_already_emailed || 0);
      toast.success(`Sending started to ${c.total} brand${c.total === 1 ? '' : 's'}${skipped ? ` (${skipped} skipped)` : ''}`);
      setConfirm(false); clearSelection(); load(); reloadLimits(); onSent(c.id);
    } catch (e) {
      toast.error(errMsg(e, 'Could not start sending'));
      setConfirm(false);
    } finally { setSending(false); }
  };

  const summary = data.summary || {};
  const remaining = limits?.remaining ?? null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
      {/* brands */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="p-3 space-y-2.5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={filters.search} onChange={(e) => setFilter('search', e.target.value)} placeholder="Search brand, email, contact..." className={`${inputCls} pl-8`} />
            </div>
            <select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} className={`${inputCls} !w-auto`}>
              <option value="">All categories</option>
              {data.categories.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
            </select>
            <select value={filters.business_type} onChange={(e) => setFilter('business_type', e.target.value)} className={`${inputCls} !w-auto`}>
              <option value="">D2C/B2C</option>
              {BUSINESS_TYPES.map((t) => {
                const match = (data.business_types || []).find((b) => b.name === t);
                return <option key={t} value={t}>{t}{match ? ` (${match.count})` : ''}</option>;
              })}
            </select>
            <select value={filters.contacted} onChange={(e) => setFilter('contacted', e.target.value)} className={`${inputCls} !w-auto`}>
              <option value="">Emailed or not</option>
              <option value="never">Not emailed yet</option>
              <option value="sent">Already emailed</option>
            </select>
            <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className={`${inputCls} !w-auto`}>
              <option value="active">Active</option>
              <option value="opted_out">Opted out</option>
              <option value="bounced">Bounced / invalid</option>
              <option value="">Any status</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-gray-500">
              <b className="text-gray-800 dark:text-gray-100">{summary.total ?? 0}</b> brands &middot; <b className="text-gray-800 dark:text-gray-100">{summary.never_contacted ?? 0}</b> not emailed yet
              {summary.opted_out ? <> &middot; {summary.opted_out} opted out</> : null}{summary.bounced ? <> &middot; {summary.bounced} bounced</> : null}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={downloadTemplateCsv} className={btnLight}><Download className="w-3 h-3" /> CSV template</button>
              <button onClick={() => setShowImport(true)} className={btnLight}><Upload className="w-3 h-3" /> Import Excel / CSV</button>
              <button onClick={() => setEditing({})} className={btnLight}><Plus className="w-3 h-3" /> Add brand</button>
            </div>
          </div>
          {allOnPage && !allMatching && data.count > pageIds.length && (
            <div className="text-[11px] bg-orange-50 text-orange-800 rounded-lg px-3 py-1.5">
              All {pageIds.length} on this page are selected. <button className="font-bold underline" onClick={() => { setAllMatching(true); setExcluded(new Set()); }}>Select all {data.count} brands matching these filters</button>
            </div>
          )}
          {allMatching && (
            <div className="text-[11px] bg-orange-50 text-orange-800 rounded-lg px-3 py-1.5">
              All {data.count - excluded.size} brands matching these filters are selected. <button className="font-bold underline" onClick={clearSelection}>Clear selection</button>
            </div>
          )}
          {selectedCount > 0 && (
            <div className="flex items-center justify-between bg-red-50 text-red-800 rounded-lg px-3 py-1.5 text-[11px]">
              <span><b>{selectedCount}</b> brand{selectedCount === 1 ? '' : 's'} selected</span>
              <button onClick={() => setConfirmBulkDelete(true)} className="font-bold underline">Delete selected</button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/40 text-[10px] uppercase tracking-wider text-gray-500 text-left">
                <th className="px-3 py-2 w-8"><input type="checkbox" checked={allOnPage} onChange={togglePage} /></th>
                <th className="px-3 py-2">Brand</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">D2C/B2C</th><th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Contact</th><th className="px-3 py-2">Last emailed</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-gray-900/20">
                  <td className="px-3 py-2"><input type="checkbox" checked={isChecked(c.id)} onChange={() => toggleRow(c.id)} /></td>
                  <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white">{c.brand_name || '-'}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{c.category || '-'}</td>
                  <td className="px-3 py-2">{c.business_type ? <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${businessTypeCls(c.business_type)}`}>{c.business_type}</span> : <span className="text-gray-400">-</span>}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{c.email}</td>
                  <td className="px-3 py-2 text-gray-500">{c.contact_person || '-'}</td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{c.times_sent ? `${fmtDate(c.last_sent_at)}${c.times_sent > 1 ? ` (x${c.times_sent})` : ''}` : <span className="text-gray-400">Never</span>}</td>
                  <td className="px-3 py-2">{statusPill(c.status)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button title="Preview this email" onClick={() => doPreview(c.id)} className="p-1 text-gray-400 hover:text-orange-600"><Eye className="w-3.5 h-3.5" /></button>
                    <button title="Edit" onClick={() => setEditing(c)} className="p-1 text-gray-400 hover:text-orange-600"><Pencil className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
              {!loading && data.results.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-10 text-center text-gray-500">
                  {summary.total ? 'No brands match these filters.' : 'No brands yet. Click "Import Excel / CSV" to upload your list, or "Add brand".'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700 text-[11px] text-gray-500">
          <span>{data.count ? `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, data.count)} of ${data.count}` : '0 brands'}</span>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className={btnLight}>Prev</button>
            <button disabled={page * PAGE_SIZE >= data.count} onClick={() => setPage(page + 1)} className={btnLight}>Next</button>
          </div>
        </div>
      </div>

      {/* compose panel */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 h-fit xl:sticky xl:top-14">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-orange-500" /> Compose</h3>
        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Template</span>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={inputCls}>
            {templates.length === 0 && <option value="">No templates yet</option>}
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
        </label>
        <label className="flex items-start gap-2 text-[11px] text-gray-600 dark:text-gray-300">
          <input type="checkbox" className="mt-0.5" checked={skipContacted} onChange={(e) => setSkipContacted(e.target.checked)} />
          <span>Skip brands I've already emailed</span>
        </label>
        <label className="flex items-start gap-2 text-[11px] text-gray-600 dark:text-gray-300">
          <input type="checkbox" className="mt-0.5" checked={footer} onChange={(e) => setFooter(e.target.checked)} />
          <span>Add an "reply unsubscribe to opt out" line <span className="text-gray-400">(recommended for bulk email)</span></span>
        </label>
        <label className="flex items-start gap-2 text-[11px] text-gray-600 dark:text-gray-300">
          <input type="checkbox" className="mt-0.5" checked={plain} onChange={(e) => setPlain(e.target.checked)} />
          <span>Plain style <span className="text-gray-400">(simple text, no Unsubscribe button. Looks like a normal email and is less likely to land in Gmail's Promotions tab)</span></span>
        </label>
        <div className="flex gap-2">
          <button onClick={() => doPreview()} disabled={!templateId} className={`${btnLight} flex-1`}><Eye className="w-3 h-3" /> Preview</button>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Send a test to</span>
          <div className="flex gap-2">
            <input value={testTo} onChange={(e) => setTestTo(e.target.value)} className={inputCls} />
            <button onClick={doTest} disabled={!templateId} className={btnLight}>Test</button>
          </div>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2">
          <p className="text-[11px] text-gray-500">
            {remaining !== null && <>You can send <b className="text-gray-800 dark:text-gray-100">{remaining}</b> more email{remaining === 1 ? '' : 's'} in the next 24 hours (limit {limits.daily_limit}).</>}
          </p>
          <button onClick={() => setConfirm(true)} disabled={!selectedCount || !templateId || !subject.trim()} className={`${btnOrange} w-full !py-2.5 text-xs`}>
            <Send className="w-3.5 h-3.5" /> Send to {selectedCount} brand{selectedCount === 1 ? '' : 's'}
          </button>
        </div>
      </div>

      {confirm && (
        <Modal title="Send emails now?" onClose={() => !sending && setConfirm(false)}>
          <div className="space-y-3 text-xs text-gray-700 dark:text-gray-200">
            <p><b>{tpl?.name}</b> will be sent to <b>{selectedCount}</b> brand{selectedCount === 1 ? '' : 's'} from <b>{limits?.from_email || 'info@collabo.co.in'}</b>.</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-500">
              <li>Emails go out one at a time, about {Math.round(limits?.delay_seconds || 4)} seconds apart (roughly {Math.max(1, Math.ceil((selectedCount * (limits?.delay_seconds || 4)) / 60))} min in total).</li>
              <li>Brands that are opted out or invalid{skipContacted ? ', and brands you have already emailed,' : ''} are skipped automatically.</li>
              {remaining !== null && selectedCount > remaining && <li className="text-amber-700">Only {remaining} can go out in the next 24 hours; sending will pause and you can resume later.</li>}
            </ul>
            <p className="text-gray-500">You can pause or cancel from the History tab.</p>
            <div className="flex justify-end gap-2 pt-1">
              <button className={btnLight} onClick={() => setConfirm(false)} disabled={sending}>Cancel</button>
              <button className={btnOrange} onClick={doSend} disabled={sending}>{sending ? 'Starting...' : 'Yes, send'}</button>
            </div>
          </div>
        </Modal>
      )}

      {preview && (
        <Modal title="Email preview" onClose={() => setPreview(null)} wide>
          <div className="text-xs space-y-2">
            <p className="text-gray-500">To: <b className="text-gray-800 dark:text-gray-100">{preview.to || `(example: ${preview.brand})`}</b></p>
            <p className="text-gray-500">Subject: <b className="text-gray-800 dark:text-gray-100">{preview.subject}</b></p>
            <div className="border border-gray-200 rounded-lg bg-white p-4 text-gray-900" dangerouslySetInnerHTML={{ __html: preview.html }} />
          </div>
        </Modal>
      )}

      {editing && <ContactModal contact={editing} categories={data.categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={() => { load(); }} />}
      {confirmBulkDelete && (
        <ConfirmModal
          title="Delete these brands?"
          body={`${selectedCount} brand${selectedCount === 1 ? '' : 's'} will be permanently removed from your list, along with their contact history. This can't be undone.`}
          confirmLabel={`Delete ${selectedCount}`}
          busy={bulkDeleting}
          onClose={() => setConfirmBulkDelete(false)}
          onConfirm={doBulkDelete}
        />
      )}
    </div>
  );
};

const ConfirmModal = ({ title, body, confirmLabel = 'Delete', onConfirm, onClose, busy }) => (
  <Modal title={title} onClose={onClose}>
    <div className="space-y-4 text-xs">
      <p className="text-gray-600 dark:text-gray-300">{body}</p>
      <div className="flex justify-end gap-2">
        <button className={btnLight} onClick={onClose} disabled={busy}>Cancel</button>
        <button className={`${btn} bg-red-600 hover:bg-red-700 text-white`} onClick={onConfirm} disabled={busy}>{busy ? 'Deleting...' : confirmLabel}</button>
      </div>
    </div>
  </Modal>
);

const ContactModal = ({ contact, categories, onClose, onSaved }) => {
  const isNew = !contact.id;
  const [f, setF] = useState({ brand_name: '', category: '', business_type: '', email: '', contact_person: '', phone: '', website: '', status: 'active', ...contact });
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = async () => {
    setBusy(true);
    try {
      if (isNew) await api.post('/outreach/contacts/', f);
      else await api.patch(`/outreach/contacts/${contact.id}/`, f);
      toast.success(isNew ? 'Brand added' : 'Saved');
      onSaved();
    } catch (e) { toast.error(errMsg(e, 'Could not save')); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/outreach/contacts/${contact.id}/`); toast.success('Deleted'); onSaved(); } catch (e) { toast.error(errMsg(e, 'Could not delete')); } finally { setBusy(false); }
  };
  return (
    <Modal title={isNew ? 'Add a brand' : 'Edit brand'} onClose={onClose}>
      <div className="space-y-2.5 text-xs">
        <label className="block space-y-1"><span className="font-semibold text-gray-600">Brand name</span><input className={inputCls} value={f.brand_name} onChange={set('brand_name')} /></label>
        <label className="block space-y-1"><span className="font-semibold text-gray-600">Email *</span><input className={inputCls} value={f.email} onChange={set('email')} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1"><span className="font-semibold text-gray-600">Category</span>
            <input className={inputCls} list="outreach-cats" value={f.category} onChange={set('category')} />
            <datalist id="outreach-cats">{categories.map((c) => <option key={c.name} value={c.name} />)}</datalist>
          </label>
          <label className="block space-y-1"><span className="font-semibold text-gray-600">D2C or B2C</span>
            <select className={inputCls} value={f.business_type} onChange={set('business_type')}>
              <option value="">Not set</option>
              {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block space-y-1"><span className="font-semibold text-gray-600">Contact person</span><input className={inputCls} value={f.contact_person} onChange={set('contact_person')} /></label>
          <label className="block space-y-1"><span className="font-semibold text-gray-600">Phone</span><input className={inputCls} value={f.phone} onChange={set('phone')} /></label>
          <label className="block space-y-1"><span className="font-semibold text-gray-600">Website</span><input className={inputCls} value={f.website} onChange={set('website')} /></label>
        </div>
        {!isNew && (
          <label className="block space-y-1"><span className="font-semibold text-gray-600">Status</span>
            <select className={inputCls} value={f.status} onChange={set('status')}>
              <option value="active">Active</option><option value="opted_out">Opted out (never email)</option><option value="bounced">Bounced / invalid</option>
            </select>
          </label>
        )}
        <div className="flex items-center justify-between pt-2">
          {!isNew ? <button onClick={() => setConfirmDelete(true)} className="text-[11px] font-semibold text-red-600 hover:underline">Delete</button> : <span />}
          <div className="flex gap-2"><button className={btnLight} onClick={onClose}>Cancel</button><button className={btnOrange} onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></div>
        </div>
      </div>
      {confirmDelete && (
        <ConfirmModal
          title="Delete this brand?"
          body={`"${f.brand_name || f.email}" will be removed from your list. This can't be undone.`}
          busy={busy}
          onClose={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}
    </Modal>
  );
};

const ImportModal = ({ onClose, onDone }) => {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const go = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await api.post('/outreach/contacts/import/', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 });
      setResult(res.data); onDone();
    } catch (e) { toast.error(errMsg(e, 'Import failed')); } finally { setBusy(false); }
  };
  return (
    <Modal title="Import brands from Excel / CSV" onClose={onClose}>
      {!result ? (
        <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
          <p>Upload an <b>.xlsx</b> or <b>.csv</b>. Every sheet with an <b>Email</b> column is read. Brand name, category (or the sheet name), contact person, phone and website columns are picked up when present.</p>
          <p className="text-gray-500">Brands already in your list are not duplicated, and nothing is deleted.</p>
          <button onClick={downloadTemplateCsv} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-600 hover:underline"><Download className="w-3 h-3" /> Download the CSV template</button>
          <input type="file" accept=".xlsx,.csv" onChange={(e) => setFile(e.target.files[0] || null)} className={inputCls} />
          <div className="flex justify-end gap-2"><button className={btnLight} onClick={onClose}>Cancel</button><button className={btnOrange} onClick={go} disabled={!file || busy}>{busy ? 'Importing...' : 'Import'}</button></div>
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          <p className="flex items-center gap-1.5 text-emerald-700 font-semibold"><CheckCircle2 className="w-4 h-4" /> {result.created} new brand{result.created === 1 ? '' : 's'} added</p>
          <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300 space-y-0.5">
            {result.updated > 0 && <li>{result.updated} existing brand{result.updated === 1 ? '' : 's'} updated with missing details</li>}
            {result.duplicates_in_file > 0 && <li>{result.duplicates_in_file} duplicate email{result.duplicates_in_file === 1 ? '' : 's'} inside the file ignored</li>}
            {result.invalid > 0 && <li>{result.invalid} row{result.invalid === 1 ? '' : 's'} had no valid email{result.invalid_samples.length ? ` (e.g. ${result.invalid_samples.join(', ')})` : ''}</li>}
          </ul>
          {result.sheets.length > 1 && (
            <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
              {result.sheets.map((s) => (
                <div key={s.sheet} className="flex justify-between px-3 py-1.5"><span>{s.sheet}</span><span className={s.emails ? 'text-gray-700' : 'text-amber-600'}>{s.emails ? `${s.emails} emails` : s.note}</span></div>
              ))}
            </div>
          )}
          <div className="flex justify-end"><button className={btnDark} onClick={onClose}>Done</button></div>
        </div>
      )}
    </Modal>
  );
};

/* ------------------------------------------------------------------ TEMPLATES TAB */
const TemplatesTab = ({ templates, reload }) => {
  const [sel, setSel] = useState(null);
  const [f, setF] = useState({ name: '', subject: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (sel === null && templates.length) { setSel(templates[0].id); }
  }, [templates, sel]);
  useEffect(() => {
    if (sel === 'new') { setF({ name: '', subject: '', body: '' }); return; }
    const t = templates.find((x) => x.id === sel);
    if (t) setF({ name: t.name, subject: t.subject, body: t.body });
  }, [sel, templates]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const insert = (ph) => {
    const el = bodyRef.current;
    if (!el) return setF((x) => ({ ...x, body: x.body + ph }));
    const s = el.selectionStart, e = el.selectionEnd;
    setF((x) => ({ ...x, body: x.body.slice(0, s) + ph + x.body.slice(e) }));
    setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = s + ph.length; }, 0);
  };
  const save = async () => {
    setBusy(true);
    try {
      if (sel === 'new') { const r = await api.post('/outreach/templates/', f); await reload(); setSel(r.data.id); }
      else { await api.put(`/outreach/templates/${sel}/`, f); await reload(); }
      toast.success('Template saved');
    } catch (e) { toast.error(errMsg(e, 'Could not save the template')); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm('Delete this template? Past campaigns keep their own copy.')) return;
    try { await api.delete(`/outreach/templates/${sel}/`); setSel(null); await reload(); toast.success('Deleted'); } catch (e) { toast.error(errMsg(e, 'Could not delete')); }
  };
  const doPreview = async () => {
    try { const r = await api.post('/outreach/preview/', { subject: f.subject, body: f.body }); setPreview(r.data); } catch (e) { toast.error(errMsg(e, 'Could not build the preview')); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 space-y-1 h-fit">
        {templates.map((t) => (
          <button key={t.id} onClick={() => setSel(t.id)} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${sel === t.id ? 'bg-gray-900 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{t.name}</button>
        ))}
        <button onClick={() => setSel('new')} className={`w-full ${btnLight} justify-start`}><Plus className="w-3 h-3" /> New template</button>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
        <label className="block space-y-1"><span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Template name</span><input className={inputCls} value={f.name} onChange={set('name')} /></label>
        <label className="block space-y-1"><span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Subject</span><input className={inputCls} value={f.subject} onChange={set('subject')} /></label>
        <div className="space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Message</span>
            <span className="text-[10px] text-gray-400">Insert: {PLACEHOLDERS.map((p) => <button key={p} onClick={() => insert(p)} className="ml-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-orange-100">{p}</button>)}</span>
          </div>
          <textarea ref={bodyRef} rows={18} className={`${inputCls} font-mono leading-relaxed`} value={f.body} onChange={set('body')} />
          <p className="text-[10px] text-gray-400">Blank line = new paragraph. Start a line with "- " for a bullet. **bold**. Links become clickable. Placeholders are replaced for every brand.</p>
        </div>
        <div className="flex items-center justify-between">
          {sel !== 'new' && sel ? <button onClick={remove} className="text-[11px] font-semibold text-red-600 hover:underline">Delete template</button> : <span />}
          <div className="flex gap-2"><button onClick={doPreview} disabled={!f.body} className={btnLight}><Eye className="w-3 h-3" /> Preview</button><button onClick={save} disabled={busy || !f.name || !f.subject || !f.body} className={btnOrange}>{busy ? 'Saving...' : 'Save template'}</button></div>
        </div>
      </div>
      {preview && (
        <Modal title="Template preview" onClose={() => setPreview(null)} wide>
          <div className="text-xs space-y-2">
            <p className="text-gray-500">Subject: <b className="text-gray-800 dark:text-gray-100">{preview.subject}</b></p>
            <div className="border border-gray-200 rounded-lg bg-white p-4 text-gray-900" dangerouslySetInnerHTML={{ __html: preview.html }} />
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ HISTORY TAB */
const HistoryTab = ({ focusId, reloadLimits }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [open, setOpen] = useState(focusId || null);
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/outreach/campaigns/');
      setCampaigns(res.data);
      return res.data;
    } catch { return []; }
  }, []);
  const loadDetail = useCallback(async (id, st) => {
    if (!id) return setDetail(null);
    try { const res = await api.get(`/outreach/campaigns/${id}/`, { params: st ? { status: st } : {} }); setDetail(res.data); } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadDetail(open, filter); }, [open, filter, loadDetail]);
  const anyRunning = campaigns.some((c) => c.status === 'running' && !c.stalled);
  useEffect(() => {
    if (!anyRunning) return undefined;
    const t = setInterval(() => { load(); loadDetail(open, filter); reloadLimits(); }, 3000);
    return () => clearInterval(t);
  }, [anyRunning, open, filter, load, loadDetail, reloadLimits]);

  const act = async (id, action, body = {}) => {
    try { await api.post(`/outreach/campaigns/${id}/${action}/`, body); await load(); await loadDetail(id, filter); reloadLimits(); } catch (e) { toast.error(errMsg(e, 'That did not work')); }
  };

  return (
    <div className="space-y-3">
      {campaigns.length === 0 && <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center text-xs text-gray-500">No emails sent yet. Your sending history will appear here.</div>}
      {campaigns.map((c) => {
        const done = c.sent + c.failed + c.skipped;
        const pct = c.total ? Math.round((done / c.total) * 100) : 0;
        const isOpen = open === c.id;
        return (
          <div key={c.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="p-3 flex flex-wrap items-center gap-3 cursor-pointer" onClick={() => setOpen(isOpen ? null : c.id)}>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{c.template_name} <span className="font-normal text-gray-400">&middot; {fmtDate(c.created_at)}</span></p>
                <p className="text-[11px] text-gray-500 truncate">{c.subject}</p>
              </div>
              <div className="w-44">
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className={`h-full ${c.failed ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} /></div>
                <p className="text-[10px] text-gray-500 mt-1">{c.sent} sent{c.failed ? `, ${c.failed} failed` : ''}{c.queued ? `, ${c.queued} waiting` : ''} of {c.total}</p>
              </div>
              {statusPill(c.status)}
            </div>
            {c.note && <p className="px-3 pb-2 text-[11px] text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {c.note}</p>}
            {isOpen && detail && detail.id === c.id && (
              <div className="border-t border-gray-100 dark:border-gray-700 p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {c.status === 'running' && <button onClick={() => act(c.id, 'pause')} className={btnLight}><Pause className="w-3 h-3" /> Pause</button>}
                  {(c.status === 'paused' || c.stalled) && <button onClick={() => act(c.id, 'resume')} className={btnOrange}><Play className="w-3 h-3" /> Resume</button>}
                  {c.failed > 0 && c.status !== 'running' && <button onClick={() => act(c.id, 'resume', { retry_failed: true })} className={btnLight}><RefreshCw className="w-3 h-3" /> Retry failed</button>}
                  {(c.status === 'running' || c.status === 'paused') && <button onClick={() => window.confirm('Cancel this campaign? Emails not yet sent will be dropped.') && act(c.id, 'cancel')} className={`${btnLight} !text-red-600`}>Cancel</button>}
                  <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${inputCls} !w-auto ml-auto`}>
                    <option value="">All</option><option value="sent">Sent</option><option value="failed">Failed</option><option value="queued">Waiting</option><option value="skipped">Skipped</option>
                  </select>
                </div>
                <div className="max-h-72 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-lg">
                  <table className="w-full text-[11px]">
                    <tbody>
                      {detail.sends.map((s) => (
                        <tr key={s.id} className="border-b border-gray-50 dark:border-gray-700 last:border-0">
                          <td className="px-2 py-1.5 font-semibold text-gray-800 dark:text-gray-100">{s.brand_name || '-'}</td>
                          <td className="px-2 py-1.5 text-gray-600 dark:text-gray-300">{s.email}</td>
                          <td className="px-2 py-1.5">{statusPill(s.status)}</td>
                          <td className="px-2 py-1.5 text-gray-400">{s.error || fmtDate(s.sent_at)}</td>
                          <td className="px-2 py-1.5 text-right">
                            {s.message_id && (
                              <button
                                title={`${s.message_id} (click to copy). Search for this in Zoho Admin Console > Email Log to see if it was delivered.`}
                                onClick={() => { navigator.clipboard?.writeText(s.message_id); toast.success('Message ID copied'); }}
                                className="text-[10px] font-semibold text-gray-400 hover:text-orange-600 whitespace-nowrap"
                              >Copy ID</button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {detail.sends.length === 0 && <tr><td className="px-2 py-4 text-center text-gray-400">Nothing here.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ PAGE */
const BrandOutreach = () => {
  const [tab, setTab] = useState('send');
  const [templates, setTemplates] = useState([]);
  const [limits, setLimits] = useState(null);
  const [focusCampaign, setFocusCampaign] = useState(null);

  const loadTemplates = useCallback(async () => {
    try { const r = await api.get('/outreach/templates/'); setTemplates(r.data); } catch (e) { toast.error(errMsg(e, 'Could not load templates')); }
  }, []);
  const loadLimits = useCallback(async () => {
    try { const r = await api.get('/outreach/limits/'); setLimits(r.data); } catch { /* ignore */ }
  }, []);
  useEffect(() => { loadTemplates(); loadLimits(); }, [loadTemplates, loadLimits]);

  const tabs = [
    { id: 'send', label: 'Send emails', icon: Send },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><Users className="w-4 h-4 text-orange-500" /> Brand Outreach</h2>
          <p className="text-[11px] text-gray-500">Email brands and suppliers in bulk from {limits?.from_email || 'info@collabo.co.in'}</p>
        </div>
        {limits && <span className="text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1">Last 24 hours: <b>{limits.sent_last_24h}</b> / {limits.daily_limit} emails</span>}
      </div>
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px ${tab === t.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'send' && <SendTab templates={templates} limits={limits} reloadLimits={loadLimits} onSent={(id) => { setFocusCampaign(id); setTab('history'); }} />}
      {tab === 'templates' && <TemplatesTab templates={templates} reload={loadTemplates} />}
      {tab === 'history' && <HistoryTab key={focusCampaign || 'h'} focusId={focusCampaign} reloadLimits={loadLimits} />}
    </div>
  );
};

export default BrandOutreach;
