import React, { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EditClipModalProps {
  isOpen: boolean;
  content: string;
  onClose: () => void;
  onSave: (newContent: string) => void;
}

export const EditClipModal: React.FC<EditClipModalProps> = ({ isOpen, content, onClose, onSave }) => {
  const [editedContent, setEditedContent] = useState(content);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setEditedContent(content);
    }
  }, [isOpen, content]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl max-h-[90vh] bg-card border border-primary/20 rounded-2xl shadow-[0_0_50px_rgba(var(--primary-rgb),0.15)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-2 text-primary">
            <Edit3 size={18} />
            <h3 className="text-sm font-bold tracking-tight uppercase">{t('settings.editClip')}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Editor Area */}
        <div className="p-4 bg-black/20 overflow-y-auto flex-1 scrollbar-thin">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-40 bg-background/50 border border-border rounded-xl p-3 font-mono text-xs leading-relaxed focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none scrollbar-thin"
            spellCheck={false}
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/30 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-white/5 transition-all"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => onSave(editedContent)}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Save size={14} />
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
