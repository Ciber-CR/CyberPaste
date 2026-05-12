// HMR Force Reload
import React from 'react';
import { Search, Plus, MoreVertical, Maximize2, Minimize2, X, Folder as FolderIcon, Zap, Flame, Star, Leaf, Droplets, Clock, Cloud, Moon, Music, Shield, Cpu, Database, Globe, Lock, Terminal, Code, Command, Compass, HardDrive, Ghost, Activity, FolderHeart, FolderSync, FolderOpen, FolderLock, Archive, Briefcase, Bookmark, Tag, Inbox, Layers, Layout, Library, Package, Paperclip, Puzzle, Settings, Share2, Smile, Sun, Pin, PinOff } from 'lucide-react';
import { FolderItem } from '../types';
import { clsx } from 'clsx';

const IconMap: Record<string, any> = {
  Zap, Flame, Star, Leaf, Droplets, Cloud, Moon, Music, Shield, Cpu, Database, Globe, Lock, Terminal, Code, Command, Compass, HardDrive, Ghost, Activity, FolderIcon, FolderHeart, FolderSync, FolderOpen, FolderLock, Archive, Briefcase, Bookmark, Tag, Inbox, Layers, Layout, Library, Package, Paperclip, Puzzle, Settings, Share2, Smile, Sun
};

interface ControlBarProps {
  folders: FolderItem[];
  selectedFolder: string | null;
  onSelectFolder: (id: string | null) => void;
  showSearch: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchClick: () => void;
  onAddClick: () => void;
  onMoreClick: () => void;
  onMoveClip: (clipId: string, folderId: string | null) => void;
  isDragging: boolean;
  dragTargetFolderId: string | null;
  onDragHover: (folderId: string | null) => void;
  onDragLeave: () => void;
  totalClipCount: number;
  onFolderContextMenu: (e: React.MouseEvent, folderId: string) => void;
  theme: 'light' | 'dark';
  onToggleMode: () => void;
  viewMode: 'full' | 'compact';
  isPinned?: boolean;
  onTogglePin?: () => void;
  style?: React.CSSProperties;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  folders,
  selectedFolder,
  onSelectFolder,
  showSearch,
  searchQuery,
  onSearchChange,
  onSearchClick,
  onAddClick,
  onMoreClick,
  onDragHover,
  onDragLeave,
  dragTargetFolderId,
  totalClipCount,
  onFolderContextMenu,
  theme,
  onToggleMode,
  viewMode,
  isPinned,
  onTogglePin,
  style,
}) => {

  return (
    <div
      style={style}
      className={clsx(
        'relative flex items-center gap-2 border-b border-border bg-card/50 px-4 h-[50px] backdrop-blur-md',
        theme === 'dark' ? 'text-white' : 'text-slate-900'
      )}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={onSearchClick}
          className={clsx(
            'flex h-9 w-9 items-center justify-center rounded-xl transition-all',
            showSearch ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary/50'
          )}
        >
          <Search size={18} />
        </button>

        <div className="mx-2 h-6 w-px bg-border/50" />
      </div>

      <div className="flex-1 relative h-full flex items-center min-w-0">
        {/* Folders List - Cybernetic Transition */}
        <div 
          className={clsx(
            "no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto transition-all duration-500 ease-in-out",
            showSearch ? "opacity-0 scale-95 pointer-events-none invisible" : "opacity-100 scale-100 visible"
          )}
          onWheel={(e) => {
              e.currentTarget.scrollLeft += e.deltaY;
          }}
        >
          <button
            onClick={() => onSelectFolder(null)}
            onMouseEnter={() => isDragging && onDragHover(null)}
            onMouseLeave={onDragLeave}
            className={clsx(
              'flex h-10 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-all relative group shrink-0 my-1',
              selectedFolder === null && !dragTargetFolderId
                ? 'bg-indigo-500/30 text-indigo-400 border border-indigo-500/60 shadow-[0_0_20px_rgba(99,102,241,0.5)] ring-1 ring-indigo-500/40'
                : 'bg-white/5 border border-transparent text-white/40 hover:bg-white/10 hover:text-white/60'
            )}
          >
            <div className={clsx(
                "flex h-5 w-5 items-center justify-center rounded-lg transition-colors",
                selectedFolder === null ? "bg-indigo-500/20" : "bg-white/5 group-hover:bg-indigo-500/10"
            )}>
               <Clock size={14} className={selectedFolder === null ? "text-indigo-400" : "text-white/30 group-hover:text-indigo-400"} />
            </div>
            <span className={selectedFolder === null ? "text-indigo-300" : "text-white/50 group-hover:text-indigo-300"}>
              Clipboard
            </span>
            <span className={clsx(
                "ml-1 text-[10px] font-medium transition-opacity",
                selectedFolder === null ? "opacity-80" : "opacity-30 group-hover:opacity-80"
            )}>
              {totalClipCount}
            </span>
          </button>

          {folders.map((folder) => {
            const isSelected = selectedFolder === folder.id;
            const isDragTarget = dragTargetFolderId === folder.id;
            const Icon = IconMap[folder.icon || 'FolderIcon'] || FolderIcon;

            return (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                onContextMenu={(e) => onFolderContextMenu(e, folder.id)}
                onMouseEnter={() => isDragging && onDragHover(folder.id)}
                onMouseLeave={onDragLeave}
                className={clsx(
                  'flex h-10 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-all shrink-0 my-1',
                  isSelected && !isDragTarget
                    ? 'bg-white/5 text-white/40 border border-primary/60 shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] ring-1 ring-primary/40'
                    : isDragTarget
                    ? 'bg-primary/40 ring-2 ring-primary border-transparent'
                    : 'bg-white/5 border border-transparent text-white/40 hover:bg-white/10 hover:text-white/60'
                )}
              >
                <div className={clsx(
                    "flex h-5 w-5 items-center justify-center rounded-lg transition-colors",
                    isSelected ? "bg-primary/20" : "bg-white/5"
                )}>
                  <Icon size={14} style={{ color: folder.color || undefined }} className={isSelected ? "text-primary" : "text-white/30"} />
                </div>
                <span className={isSelected ? "text-white/80" : "text-white/50"}>
                  {folder.name}
                </span>
                <span className={clsx(
                    "ml-1 text-[10px] font-medium transition-opacity",
                    isSelected ? "opacity-80" : "opacity-30"
                )}>
                  {folder.item_count}
                </span>
              </button>
            );
          })}

          <button
            onClick={onAddClick}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 border border-dashed border-white/20 text-white/40 hover:bg-white/10 hover:text-white transition-all"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search Bar Overlay */}
        {showSearch && (
          <div className="absolute inset-0 flex items-center animate-in fade-in zoom-in-95 duration-300 z-10">
            <div className="flex-1 flex items-center gap-3 bg-zinc-950/80 border border-cyan-500/30 rounded-xl px-4 h-10 shadow-[0_0_25px_rgba(6,182,212,0.15)] backdrop-blur-md">
              <Search className="text-cyan-400 animate-pulse" size={18} />
              <div className="flex flex-1 items-center gap-2 overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 whitespace-nowrap">
                  Searching in <span className="text-cyan-400/60">{selectedFolder ? (folders.find(f => f.id === selectedFolder)?.name || 'Folder') : 'Clipboard'}</span>
                </span>
                <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="..."
                  className="flex-1 bg-transparent py-1 text-white text-sm outline-none placeholder:text-white/10 min-w-0"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') onSearchClick();
                  }}
                />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onSearchClick(); }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-rose-400 group"
                title="Cancel Search (Esc)"
              >
                <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 pl-2">
        {onTogglePin && (
          <button
            onClick={onTogglePin}
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
              isPinned ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "hover:bg-secondary/50"
            )}
            title={isPinned ? "Unpin Window" : "Pin Window"}
          >
            {isPinned ? <PinOff size={18} /> : <Pin size={18} />}
          </button>
        )}
        
        <button
          onClick={onToggleMode}
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-secondary/50 text-cyan-400 transition-all"
          title={viewMode === 'full' ? "Switch to Compact Mode" : "Switch to Full Mode"}
        >
          {viewMode === 'full' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        <button
          onClick={onMoreClick}
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-secondary/50 transition-all"
        >
          <MoreVertical size={18} />
        </button>
        
        <button 
          onClick={() => (window as any).__TAURI_INTERNALS__.invoke('hide_window')}
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-rose-500/20 text-rose-500 transition-all"
          title="Close Window"
        >
          <X size={18} />
        </button>
      </div>

    </div>
  );
};
