import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Plus, Trash2, Image as ImageIcon, 
  // eslint-disable-next-line no-unused-vars
  Type, Palette, Layout, ArrowUp, ArrowDown,
  // eslint-disable-next-line no-unused-vars
  Monitor, Smartphone, Globe, CheckCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LandingContentManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ hero: null, cards: [] });
  const [activeView, setActiveView] = useState('texts'); // texts, cards, animations

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await api.get('/landing/content/');
      setData({
        hero: response.data.hero || {
          title: "Where {Teams} Connect,\nCollaborate, and Create",
          subtitle: "Discover, collaborate, and scale your reach. The all-in-one platform connecting authentic creators with world-class brands.",
          creator_button_text: "Sign up as a Creator",
          brand_button_text: "Sign up as a Brand"
        },
        cards: response.data.cards || []
      });
    } catch (error) {
      console.error('Failed to fetch content:', error);
      toast.error('Failed to load landing content');
    } finally {
      setLoading(false);
    }
  };

  const handleHeroChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({
      ...prev,
      hero: { ...prev.hero, [name]: value }
    }));
  };

  const handleCardChange = (index, field, value) => {
    const newCards = [...data.cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setData(prev => ({ ...prev, cards: newCards }));
  };

  const addCard = () => {
    const newCard = {
      label: "New Brand",
      image_url: "",
      background_color: "#FFFFFF",
      text_color: "#000000",
      attachment_label: "",
      attachment_bg_color: "#FFFFFF",
      attachment_text_color: "#000000",
      card_size: "medium",
      order: data.cards.length,
      is_active: true
    };
    setData(prev => ({ ...prev, cards: [...prev.cards, newCard] }));
  };

  const removeCard = async (index, cardId) => {
    if (!cardId) {
      const newCards = data.cards.filter((_, i) => i !== index);
      setData(prev => ({ ...prev, cards: newCards }));
      return;
    }

    try {
      await api.delete(`/landing/content/${cardId}/manage-card/`);
      toast.success('Card deleted');
      fetchContent();
    } catch (error) {
      toast.error('Failed to delete card');
    }
  };

  const saveHero = async () => {
    setSaving(true);
    try {
      await api.post('/landing/content/update-hero/', data.hero);
      toast.success('Hero content updated!');
    } catch (error) {
      toast.error('Failed to save hero content');
    } finally {
      setSaving(false);
    }
  };

  const saveCard = async (index) => {
    const card = data.cards[index];
    try {
      if (card.id) {
        await api.patch(`/landing/content/${card.id}/manage-card/`, card);
      } else {
        await api.post('/landing/content/add-card/', card);
      }
      toast.success('Card saved!');
      fetchContent();
    } catch (error) {
      toast.error('Failed to save card');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Landing Page</h2>
          <p className="text-[11px] text-gray-500">Hero section & marquee cards</p>
        </div>
        <div className="flex items-center gap-1">
          {[
            { id: 'texts', label: 'Texts' },
            { id: 'cards', label: 'Cards' },
            { id: 'animations', label: 'Animated' },
          ].map(v => (
            <button key={v.id} onClick={() => setActiveView(v.id)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                activeView === v.id ? 'bg-gray-900 dark:bg-gray-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>{v.label}</button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'texts' ? (
          <motion.div 
            key="texts"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Badge Text</label>
                  <input 
                    type="text" 
                    name="badge_text"
                    value={data.hero.badge_text}
                    onChange={handleHeroChange}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[11px] dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                    placeholder="e.g. The New Standard"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Main Title</label>
                  <textarea 
                    name="title"
                    value={data.hero.title}
                    onChange={handleHeroChange}
                    rows="3"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[11px] dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400 font-medium"
                    placeholder="e.g. Where {Teams} Connect"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">Use {'{text}'} for gradient styling and \n for line breaks.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Subtitle</label>
                  <textarea 
                    name="subtitle"
                    value={data.hero.subtitle}
                    onChange={handleHeroChange}
                    rows="4"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[11px] dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Creator Button Text</label>
                  <input 
                    type="text" 
                    name="creator_button_text"
                    value={data.hero.creator_button_text}
                    onChange={handleHeroChange}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[11px] dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Brand Button Text</label>
                  <input 
                    type="text" 
                    name="brand_button_text"
                    value={data.hero.brand_button_text}
                    onChange={handleHeroChange}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[11px] dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
                <div className="pt-6">
                  <button 
                    onClick={saveHero}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save className="w-5 h-5" />}
                    <span>Save Hero Content</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeView === 'animations' ? (
          <motion.div 
            key="animations"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Animated Text</label>
                  <textarea 
                    name="anim_text"
                    value={data.hero.anim_text || ''}
                    onChange={handleHeroChange}
                    rows="6"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[11px] dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400 font-medium"
                    placeholder="e.g. Maximize Your {img1} Brand's\nGrowth and {img2}{img3}{img4} Skyrocket Sales"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">Use {'{img1}'}, {'{img2}'}, {'{img3}'}, {'{img4}'} to place image pills inside the text. Use \n for line breaks.</p>
                </div>
                <div className="pt-6">
                  <button 
                    onClick={saveHero}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save className="w-5 h-5" />}
                    <span>Save Content</span>
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((num) => (
                  <div key={`img_${num}`}>
                    <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Image {num} URL</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        name={`anim_image${num}`}
                        value={data.hero[`anim_image${num}`] || ''}
                        onChange={handleHeroChange}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-violet-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cards"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {data.cards.map((card, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 relative group overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-[10px] font-black uppercase px-2 py-1 rounded-md">
                      Card #{index + 1}
                    </span>
                    <button 
                      onClick={() => removeCard(index, card.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Image URL"
                        value={card.image_url || ''}
                        onChange={(e) => handleCardChange(index, 'image_url', e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="relative">
                      <Type className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Label / Brand Name"
                        value={card.label}
                        onChange={(e) => handleCardChange(index, 'label', e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs font-bold rounded-lg border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Card Size</label>
                        <select 
                          value={card.card_size}
                          onChange={(e) => handleCardChange(index, 'card_size', e.target.value)}
                          className="w-full px-2 py-2 text-xs rounded-lg bg-gray-50 dark:bg-gray-700 border-none dark:text-white"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Order</label>
                        <input 
                          type="number"
                          value={card.order || 0}
                          onChange={(e) => handleCardChange(index, 'order', parseInt(e.target.value))}
                          className="w-full px-2 py-2 text-xs rounded-lg bg-gray-50 dark:bg-gray-700 border-none dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                         <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">BG Color</label>
                         <div className="flex items-center space-x-2">
                            <input 
                             type="color"
                             value={card.background_color?.startsWith('#') ? card.background_color : '#FFFFFF'}
                             onChange={(e) => handleCardChange(index, 'background_color', e.target.value)}
                             className="w-8 h-8 rounded-md overflow-hidden border-none"
                           />
                           <input 
                             type="text"
                             value={card.background_color}
                             onChange={(e) => handleCardChange(index, 'background_color', e.target.value)}
                             className="flex-1 px-2 py-2 text-[10px] rounded-lg bg-gray-50 dark:bg-gray-700 border-none dark:text-white font-mono"
                           />
                         </div>
                       </div>
                       <div>
                         <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Text Color</label>
                         <div className="flex items-center space-x-2">
                            <input 
                             type="color"
                             value={card.text_color?.startsWith('#') ? card.text_color : '#000000'}
                             onChange={(e) => handleCardChange(index, 'text_color', e.target.value)}
                             className="w-8 h-8 rounded-md overflow-hidden border-none"
                           />
                           <input 
                             type="text"
                             value={card.text_color}
                             onChange={(e) => handleCardChange(index, 'text_color', e.target.value)}
                             className="flex-1 px-2 py-2 text-[10px] rounded-lg bg-gray-50 dark:bg-gray-700 border-none dark:text-white font-mono"
                           />
                         </div>
                       </div>
                    </div>

                    <div className="pt-2">
                       <button 
                         onClick={() => saveCard(index)}
                         className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-[10px] font-medium py-1.5 rounded-lg transition-colors"
                       >
                         <Save className="w-3.5 h-3.5" />
                         <span>{card.id ? 'Save Changes' : 'Create Card'}</span>
                       </button>
                    </div>
                  </div>

                  <div className="absolute right-2 top-24 opacity-10 pointer-events-none transition-opacity group-hover:opacity-20">
                    {card.image_url && !card.image_url.includes('undefined') ? (
                      <img 
                        src={card.image_url} 
                        alt="" 
                        className="w-16 h-16 object-cover rounded-lg rotate-12"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <Layout className="w-16 h-16" />
                    )}
                  </div>
                </div>
              ))}
              <button 
                onClick={addCard}
                className="bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center py-8 hover:border-gray-400 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-violet-500" />
                </div>
                <span className="text-sm font-bold text-gray-500 group-hover:text-violet-500">Add New Card</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingContentManager;
