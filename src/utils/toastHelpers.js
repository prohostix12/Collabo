import React from 'react';
import toast from 'react-hot-toast';

export const showConfirmToast = (message, onConfirm, confirmText = 'Confirm') => {
  toast((t) => (
    <div className="flex flex-col gap-3 p-1">
      <p className="text-sm font-bold text-slate-800">{message}</p>
      <div className="flex gap-2 justify-end mt-1">
        <button 
          onClick={() => toast.dismiss(t.id)} 
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={() => { 
            toast.dismiss(t.id); 
            onConfirm(); 
          }} 
          className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
        >
          {confirmText}
        </button>
      </div>
    </div>
  ), { duration: 10000 });
};
