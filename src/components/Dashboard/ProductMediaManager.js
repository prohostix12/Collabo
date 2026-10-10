import React, { useState, useRef, useCallback, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Upload, X, Trash2, Film, Image as ImageIcon,
  AlertCircle, Loader2, CheckCircle2, Play, Eye,
  Settings2
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// ProductMediaManager
//
// Props:
//   product        – product object  { id, name, image }
//   onClose        – fn to close modal
//   maxFileSizeMB  – admin-configurable max file size in MB (default: 20)
// ─────────────────────────────────────────────────────────────────────────────

const ProductMediaManager = ({ product, onClose, maxFileSizeMB = 20 }) => {
  const [existingMedia, setExistingMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [dropping, setDropping] = useState(false);
  const [stagedFiles, setStagedFiles] = useState([]); // { file, preview, type, error }
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState(null); // media item for lightbox preview
  const fileInputRef = useRef(null);
  const maxBytes = maxFileSizeMB * 1024 * 1024;

  // ── fetch existing media ──────────────────────────────────────────────────
  const fetchMedia = useCallback(async () => {
    setLoadingMedia(true);
    try {
      const res = await api.get(`/ecommerce/products/${product.id}/influencer-media/`);
      setExistingMedia(Array.isArray(res.data) ? res.data : []);
    } catch {
      setExistingMedia([]);
    } finally {
      setLoadingMedia(false);
    }
  }, [product.id]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // ── file validation & staging ─────────────────────────────────────────────
  const stageFiles = (rawFiles) => {
    const newStaged = Array.from(rawFiles).map((file) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      let error = null;
      if (!isVideo && !isImage) error = 'Only images and videos are allowed.';
      else if (file.size > maxBytes) error = `File exceeds ${maxFileSizeMB} MB limit.`;
      const preview = error ? null : URL.createObjectURL(file);
      return { file, preview, type: isVideo ? 'video' : 'image', error };
    });
    setStagedFiles((prev) => [...prev, ...newStaged]);
  };

  const removeStaged = (idx) => {
    setStagedFiles((prev) => {
      const next = [...prev];
      if (next[idx]?.preview) URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  };

  // ── drag & drop ───────────────────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setDropping(true); };
  const onDragLeave = () => setDropping(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDropping(false);
    stageFiles(e.dataTransfer.files);
  };

  // ── upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    const valid = stagedFiles.filter((f) => !f.error);
    if (!valid.length) return;
    setUploading(true);
    try {
      for (const item of valid) {
        const fd = new FormData();
        fd.append('files', item.file);
        fd.append('media_type', item.type);
        await api.post(
          `/ecommerce/products/${product.id}/influencer-media/upload/`,
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }
      toast.success(`${valid.length} file${valid.length > 1 ? 's' : ''} uploaded!`);
      setStagedFiles([]);
      fetchMedia();
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (mediaId) => {
    try {
      await api.delete(`/ecommerce/influencer-media/${mediaId}/delete/`);
      toast.success('Media deleted');
      setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
    } catch {
      toast.error('Failed to delete media');
    }
  };

  // ── helpers ───────────────────────────────────────────────────────────────
  const validStaged = stagedFiles.filter((f) => !f.error);

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* ── Modal shell ─────────────────────────────────────────────── */}
        <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">

          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-t-3xl flex-shrink-0">
            <div className="p-2 bg-white/20 rounded-xl">
              <Film className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-black text-base tracking-tight">Influencer Media Manager</h2>
              <p className="text-[11px] text-purple-200 truncate">
                {product.name} · Visible only to approved influencers
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] bg-white/15 px-2.5 py-1 rounded-full font-semibold">
              <Settings2 className="w-3 h-3" />
              Max {maxFileSizeMB} MB
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* ── Drag & Drop Zone ── */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 px-6 cursor-pointer transition-all duration-200
                ${dropping
                  ? 'border-violet-500 bg-violet-50 scale-[1.01]'
                  : 'border-gray-200 bg-gray-50 hover:border-violet-400 hover:bg-violet-50/50'
                }`}
            >
              <div className={`p-4 rounded-2xl transition-colors ${dropping ? 'bg-violet-100' : 'bg-white shadow-sm'}`}>
                <Upload className={`w-8 h-8 transition-colors ${dropping ? 'text-violet-600' : 'text-gray-400'}`} />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm text-gray-700">
                  {dropping ? 'Drop files here' : 'Drag & drop files or click to browse'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Images (JPG, PNG, WEBP) · Videos (MP4, MOV, WEBM) · Max {maxFileSizeMB} MB each
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => stageFiles(e.target.files)}
              />
            </div>

            {/* ── Staged Files Preview ── */}
            {stagedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Ready to Upload ({validStaged.length}/{stagedFiles.length} valid)
                  </h3>
                  <button
                    onClick={() => setStagedFiles([])}
                    className="text-xs text-red-400 hover:text-red-600 font-semibold"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {stagedFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className={`relative rounded-2xl overflow-hidden border-2 group transition-all
                        ${item.error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-100'}`}
                    >
                      {/* Preview */}
                      {item.error ? (
                        <div className="h-28 flex flex-col items-center justify-center gap-2 p-3">
                          <AlertCircle className="w-8 h-8 text-red-400" />
                          <p className="text-[10px] text-red-500 font-semibold text-center leading-tight">
                            {item.error}
                          </p>
                        </div>
                      ) : item.type === 'video' ? (
                        <video
                          src={item.preview}
                          className="h-28 w-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={item.preview}
                          alt=""
                          className="h-28 w-full object-cover"
                        />
                      )}
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      {/* File type badge */}
                      {!item.error && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                          {item.type === 'video'
                            ? <><Film className="w-2.5 h-2.5" />VIDEO</>
                            : <><ImageIcon className="w-2.5 h-2.5" />IMAGE</>
                          }
                        </div>
                      )}
                      {/* Remove button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeStaged(idx); }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {/* File name */}
                      <div className="p-2 bg-white border-t border-gray-100">
                        <p className="text-[10px] text-gray-600 font-medium truncate">{item.file.name}</p>
                        <p className="text-[9px] text-gray-400">{(item.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Upload button */}
                <button
                  onClick={handleUpload}
                  disabled={uploading || !validStaged.length}
                  className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-2xl shadow transition-all"
                >
                  {uploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</>
                    : <><CheckCircle2 className="w-4 h-4" />Upload {validStaged.length} File{validStaged.length !== 1 ? 's' : ''}</>
                  }
                </button>
              </div>
            )}

            {/* ── Existing Media ── */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                <Film className="w-3.5 h-3.5 text-violet-500" />
                Uploaded Influencer Media
                {!loadingMedia && (
                  <span className="ml-auto text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-bold">
                    {existingMedia.length} file{existingMedia.length !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>

              {loadingMedia ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
              ) : existingMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
                  <Film className="w-10 h-10 text-gray-300" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-500">No media uploaded yet</p>
                    <p className="text-xs text-gray-400">Upload images or videos above for influencer collaboration</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {existingMedia.map((media) => (
                    <div
                      key={media.id}
                      className="relative rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-100 group"
                    >
                      {media.media_type === 'video' ? (
                        <div className="relative h-28 bg-gray-900">
                          <video
                            src={media.file}
                            className="h-full w-full object-cover opacity-80"
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                              <Play className="w-5 h-5 text-gray-800 ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={media.file}
                          alt="product media"
                          className="h-28 w-full object-cover"
                        />
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setPreviewItem(media)}
                          className="p-2 bg-white/90 rounded-xl hover:bg-white transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleDelete(media.id)}
                          className="p-2 bg-red-500/90 rounded-xl hover:bg-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      {/* Type badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                        {media.media_type === 'video'
                          ? <><Film className="w-2.5 h-2.5" />VIDEO</>
                          : <><ImageIcon className="w-2.5 h-2.5" />IMAGE</>
                        }
                      </div>
                      {/* Info bar */}
                      <div className="p-2 bg-white border-t border-gray-100">
                        <p className="text-[10px] text-gray-500 font-medium">
                          {media.uploaded_at
                            ? new Date(media.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
                            : 'Uploaded'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Influencer Visibility Note ── */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-1.5 bg-violet-100 rounded-xl flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-violet-700">Influencer-Only Content</p>
                <p className="text-xs text-violet-600 mt-0.5">
                  This media is exclusively visible to approved influencers on the product detail page. Regular buyers and sellers cannot see it. Influencers can use this content to directly collaborate with your brand.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Lightbox Preview ─────────────────────────────────────────────────── */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <button
            onClick={() => setPreviewItem(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-xl hover:bg-white/20 text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          {previewItem.media_type === 'video' ? (
            <video
              src={previewItem.file}
              controls
              autoPlay
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={previewItem.file}
              alt="preview"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
};

export default ProductMediaManager;
