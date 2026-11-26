import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';

// Curated starter palette per the spec. Sellers aren't limited to these —
// "Custom" opens a real color input + manual hex entry.
const PREDEFINED_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#E53935' },
  { name: 'Blue', hex: '#1E88E5' },
  { name: 'Navy Blue', hex: '#101A35' },
  { name: 'Green', hex: '#43A047' },
  { name: 'Olive Green', hex: '#6B8E23' },
  { name: 'Orange', hex: '#FF8A24' },
  { name: 'Pink', hex: '#EC407A' },
  { name: 'Purple', hex: '#8E24AA' },
  { name: 'Grey', hex: '#757575' },
  { name: 'Brown', hex: '#795548' },
];

const HEX_RE = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

export const normalizeHex = (hex) => {
  const h = (hex || '').trim();
  if (!HEX_RE.test(h)) return null;
  if (h.length === 4) {
    // expand shorthand #abc -> #aabbcc
    return '#' + [...h.slice(1)].map(c => c + c).join('').toUpperCase();
  }
  return h.toUpperCase();
};

/**
 * Controlled multi-select color picker. `colors` is an array of {name, hex}
 * (hex always normalized to '#RRGGBB'). Used by both the inline new-product
 * variant builder and the embedded VariantManagerModal's add/edit form.
 */
const ColorSwatchPicker = ({ colors = [], onChange, multiple = true }) => {
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customHex, setCustomHex] = useState('#FF8A24');
  const [error, setError] = useState('');

  const isSelected = (hex) => colors.some(c => c.hex === hex);

  const togglePredefined = (preset) => {
    setError('');
    if (!multiple) {
      onChange(isSelected(preset.hex) ? [] : [{ name: preset.name, hex: preset.hex }]);
      return;
    }
    if (isSelected(preset.hex)) {
      onChange(colors.filter(c => c.hex !== preset.hex));
    } else {
      onChange([...colors, { name: preset.name, hex: preset.hex }]);
    }
  };

  const addCustom = () => {
    const normalized = normalizeHex(customHex);
    if (!normalized) { setError('Enter a valid HEX code, e.g. #FF8A24'); return; }
    if (multiple && isSelected(normalized)) { setError('This color is already added'); return; }
    if (!customName.trim()) { setError('Give this color a name'); return; }
    onChange(multiple ? [...colors, { name: customName.trim(), hex: normalized }] : [{ name: customName.trim(), hex: normalized }]);
    setCustomName('');
    setCustomHex('#FF8A24');
    setCustomOpen(false);
    setError('');
  };

  const removeColor = (hex) => onChange(colors.filter(c => c.hex !== hex));
  const renameColor = (hex, name) => onChange(colors.map(c => c.hex === hex ? { ...c, name } : c));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PREDEFINED_COLORS.map(preset => (
          <button
            type="button"
            key={preset.hex}
            title={preset.name}
            onClick={() => togglePredefined(preset)}
            className="relative w-7 h-7 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center shrink-0 transition-transform hover:scale-110"
            style={{ backgroundColor: preset.hex }}
          >
            {isSelected(preset.hex) && (
              <Check className={`w-3.5 h-3.5 ${preset.hex === '#FFFFFF' ? 'text-gray-900' : 'text-white'}`} strokeWidth={3} />
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCustomOpen(o => !o)}
          title="Custom color"
          className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {customOpen && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
          <input
            type="color" value={HEX_RE.test(customHex) ? normalizeHex(customHex) || '#FF8A24' : '#FF8A24'}
            onChange={e => setCustomHex(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700 shrink-0"
          />
          <input
            type="text" value={customHex} onChange={e => setCustomHex(e.target.value)}
            placeholder="#FF8A24"
            className="w-24 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs font-mono bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
          <input
            type="text" value={customName} onChange={e => setCustomName(e.target.value)}
            placeholder="Color name"
            className="flex-1 min-w-[100px] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
          <button type="button" onClick={addCustom} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors">
            Add
          </button>
        </div>
      )}
      {error && <p className="text-[11px] text-red-500">{error}</p>}

      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {colors.map(c => (
            <div key={c.hex} className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <span className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600 shrink-0" style={{ backgroundColor: c.hex }} />
              <input
                type="text" value={c.name} onChange={e => renameColor(c.hex, e.target.value)}
                className="w-20 text-[11px] font-semibold bg-transparent focus:outline-none"
              />
              <span className="text-[10px] text-gray-400 font-mono">{c.hex}</span>
              <button type="button" onClick={() => removeColor(c.hex)} className="text-gray-400 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorSwatchPicker;
export { PREDEFINED_COLORS, HEX_RE };
