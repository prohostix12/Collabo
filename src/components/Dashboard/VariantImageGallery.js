import React, { useState } from 'react';
import { Upload, X, Star, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

/**
 * Manages a variant's image gallery: a single "primary/display image" (the
 * variant's own `image` field) plus extra gallery shots (VariantImage rows).
 *
 * - When `variantId` is set (editing a variant that's already been saved),
 *   gallery uploads/removals hit the real backend immediately:
 *   POST/DELETE /ecommerce/product-variants/<id>/images/ (confirmed request/
 *   response shape: POST {image, order} -> {id, variant, image, order};
 *   DELETE {image_id} -> 204).
 * - When `variantId` is null (building a brand-new variant that doesn't exist
 *   in the DB yet), uploads are staged locally and handed back via
 *   `onStagedChange` — the parent uploads them for real right after the
 *   variant itself is created.
 */
const VariantImageGallery = ({ variantId, primaryImage, onPrimaryChange, images, onImagesChange }) => {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast.error(`${file.name}: unsupported format (use JPG, PNG, WebP or GIF)`);
          continue;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          toast.error(`${file.name}: over 5MB, skipped`);
          continue;
        }
        const dataUrl = await fileToDataUrl(file);
        if (variantId) {
          const res = await api.post(`/ecommerce/product-variants/${variantId}/images/`, {
            image: dataUrl, order: images.length,
          });
          onImagesChange([...images, res.data]);
        } else {
          onImagesChange([...images, { image: dataUrl, order: images.length, _local: true, _key: `local-${Date.now()}-${Math.random()}` }]);
        }
      }
      toast.success('Image added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (img) => {
    if (variantId && img.id) {
      try {
        await api.delete(`/ecommerce/product-variants/${variantId}/images/`, { data: { image_id: img.id } });
      } catch (err) {
        toast.error('Failed to remove image');
        return;
      }
    }
    onImagesChange(images.filter(i => (img.id ? i.id !== img.id : i._key !== img._key)));
  };

  const makePrimary = (img) => onPrimaryChange(img.image);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {primaryImage && (
          <div className="relative group w-16 h-16 shrink-0">
            <img src={primaryImage} alt="Primary" className="w-full h-full object-cover rounded-lg border-2 border-orange-500" />
            <span className="absolute -top-1.5 -left-1.5 bg-orange-500 text-white rounded-full p-0.5 shadow"><Star className="w-2.5 h-2.5" fill="currentColor" /></span>
          </div>
        )}
        {images.map((img) => (
          <div key={img.id || img._key} className="relative group w-16 h-16 shrink-0">
            <img src={img.image} alt="Variant" className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
              <button type="button" onClick={() => makePrimary(img)} title="Set as primary image" className="p-1 bg-white/90 rounded-full text-gray-700 hover:text-orange-600">
                <Star className="w-3 h-3" />
              </button>
              <button type="button" onClick={() => removeImage(img)} title="Remove" className="p-1 bg-white/90 rounded-full text-gray-700 hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors shrink-0">
          {uploading ? <Loader2 className="w-4 h-4 text-orange-500 animate-spin" /> : <Upload className="w-4 h-4 text-gray-400" />}
          <input type="file" accept="image/*" multiple disabled={uploading} className="hidden"
            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
        </label>
      </div>
      <p className="text-[10px] text-gray-400">JPG/PNG/WebP/GIF, up to 5MB each. The starred image is what buyers see first; click the star on any thumbnail to make it primary.</p>
    </div>
  );
};

export default VariantImageGallery;
