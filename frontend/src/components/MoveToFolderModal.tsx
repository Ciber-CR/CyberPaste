import React from 'react';
import { X, Folder, FolderPlus } from 'lucide-react';
import { FolderItem } from '../types';
import { useTranslation } from 'react-i18next';

interface MoveToFolderModalProps {
  isOpen: boolean;
  folders: FolderItem[];
  onClose: () => void;
  onSelect: (folderId: string | null) => void;
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({ isOpen, folders, onClose, onSelect }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm max-h-[85vh] bg-card border border-primary/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30 flex-shrink-0">
          <h3 className="text-sm font-bold tracking-tight uppercase flex items-center gap-2 text-primary">
            <Folder size={16} />
            Move to Folder
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-2 overflow-y-auto scrollbar-thin flex-1">
          {/* Main Clipboard Option */}
          <button
            onClick={() => { onSelect(null); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all group border border-transparent hover:border-primary/20 mb-1"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <FolderPlus size={16} />
            </div>
            <span className="text-sm font-medium">Main Clipboard</span>
          </button>

          {folders.filter(f => !f.is_system).map(folder => (
            <button
              key={folder.id}
              onClick={() => { onSelect(folder.id); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all group border border-transparent hover:border-primary/20 mb-1"
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:opacity-80 transition-colors"
                style={{ backgroundColor: folder.color ? `${folder.color}20` : 'rgba(var(--primary-rgb), 0.1)' }}
              >
                <Folder size={16} style={{ color: folder.color || 'currentColor' }} />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium block truncate">{folder.name}</span>
                <span className="text-[10px] opacity-40 block">{folder.item_count || 0} items</span>
              </div>
            </button>
          ))}

          {folders.filter(f => !f.is_system).length === 0 && (
            <div className="p-8 text-center opacity-30 italic text-sm">
              No folders created yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
