// HMR Force Reload
import React from 'react';
import { Search, Plus, Maximize2, Minimize2, X, Folder as FolderIcon, Zap, Flame, Star, Leaf, Droplets, Clock, Cloud, Moon, Music, Shield, Cpu, Database, Globe, Lock, Terminal, Code, Command, Compass, HardDrive, Ghost, Activity, FolderHeart, FolderSync, FolderOpen, FolderLock, Archive, Briefcase, Bookmark, Tag, Inbox, Layers, Layout, Library, Package, Paperclip, Puzzle, Settings, Share2, Smile, Sun, Pin, PinOff, RotateCcw } from 'lucide-react';
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
  imageCount: number;
  textCount: number;
  fileCount?: number;
  htmlCount?: number;
  rtfCount?: number;
  onFolderContextMenu: (e: React.MouseEvent, folderId: string) => void;
  theme: 'light' | 'dark';
  onToggleMode: () => void;
  viewMode: 'full' | 'compact';
  isPinned: boolean;
  onTogglePin?: () => void;
  onResetSize?: () => void;
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
  imageCount,
  textCount,
  fileCount,
  htmlCount,
  rtfCount,
  onFolderContextMenu,
  theme,
  onToggleMode,
  viewMode,
  isPinned,
  onTogglePin,
  onResetSize,
  isDragging,
  style,
}) => {
  const foldersRef = React.useRef<HTMLDivElement>(null);

  const currentFolderName = selectedFolder ? (folders.find(f => f.id === selectedFolder)?.name || 'Folder') : 'Clipboard';

  // Auto-scroll selected folder into view
  React.useEffect(() => {
    const selectedBtn = foldersRef.current?.querySelector('[data-selected="true"]');
    if (selectedBtn) {
      selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedFolder]);

  return (
    <div
      className={clsx(
        'relative flex flex-col border-b border-border/40 bg-card/50 backdrop-blur-md',
        'bg-gradient-to-br from-indigo-500/5 via-cyan-500/5 to-transparent bg-[length:200%_200%] animate-subtle-gradient',
        theme === 'dark' ? 'text-white' : 'text-slate-900'
      )}
      style={{
        ...style,
        height: '56px',
        boxShadow: '0 -2px 12px rgba(99, 102, 241, 0.15)',
      }}
    >
      {/* System Status Strip */}
      <div className="flex items-center justify-between px-4 py-0.5 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 via-cyan-500/5 to-transparent">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
          </span>
          <span className="text-[9px] font-medium text-cyan-400/80 tracking-widest uppercase">Monitoring</span>
        </div>

        {/* Context Info */}
        <div className="flex items-center gap-1.5 text-[9px] font-medium tracking-wide">
          <span className="px-1.5 py-px rounded bg-cyan-500/20 text-cyan-400 font-bold tracking-wider">TOTALS</span>
          <span className="text-indigo-300/80">Main Clipboard <span className="text-white/40">({totalClipCount})</span></span>
          <span className="text-white/20">|</span>
          <span className="text-purple-300/80">Folders <span className="text-white/40">({folders.length})</span></span>
          <span className="text-white/20">|</span>
          <span className="text-amber-300/80">Images <span className="text-white/40">({imageCount})</span></span>
          <span className="text-white/20">|</span>
          <span className="text-emerald-300/80">Text <span className="text-white/40">({textCount})</span></span>
          <span className="text-white/20">|</span>
          <span className="text-yellow-300/80">Files <span className="text-white/40">({fileCount ?? 0})</span></span>
          <span className="text-white/20">|</span>
          <span className="text-sky-300/80">HTML <span className="text-white/40">({htmlCount ?? 0})</span></span>
          <span className="text-white/20">|</span>
          <span className="text-violet-300/80">RTF <span className="text-white/40">({rtfCount ?? 0})</span></span>
          {selectedFolder && (
            <>
              <span className="text-white/20">|</span>
              <span className="text-cyan-400/60">
                {folders.find(f => f.id === selectedFolder)?.item_count || 0} items showing in <span className="text-white/50">{currentFolderName}</span>
              </span>
            </>
          )}
        </div>

        <span className="text-[9px] font-mono text-white/20 tracking-wider">v1.0.1</span>
      </div>

      {/* Main Toolbar */}
      <div className="flex items-center gap-1 px-4 flex-1 min-w-0">
        <button
          onClick={onSearchClick}
          className={clsx(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-all shrink-0',
            showSearch ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary/50'
          )}
        >
          <Search size={16} />
        </button>

        <div className="mx-0.5 h-5 w-px bg-border/50 shrink-0" />

        <div className="flex-1 relative h-full flex items-center min-w-0">
        {/* Folders List - Cybernetic Transition */}
        <div 
          ref={foldersRef}
          className={clsx(
            "no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto transition-all duration-500 ease-in-out",
            showSearch ? "opacity-0 scale-95 pointer-events-none invisible" : "opacity-100 scale-100 visible"
          )}
          onWheel={(e) => {
            // Cycle through folders with mouse wheel
            const allFolderIds = [null, ...folders.map(f => f.id)];
            const currentIndex = allFolderIds.indexOf(selectedFolder);
            
            if (e.deltaY > 0) {
              // Wheel down -> Next folder
              const nextIndex = (currentIndex + 1) % allFolderIds.length;
              onSelectFolder(allFolderIds[nextIndex]);
            } else if (e.deltaY < 0) {
              // Wheel up -> Previous folder
              const prevIndex = (currentIndex - 1 + allFolderIds.length) % allFolderIds.length;
              onSelectFolder(allFolderIds[prevIndex]);
            }
          }}
        >
          <button
            onClick={() => onSelectFolder(null)}
            onMouseEnter={() => isDragging && onDragHover(null)}
            onMouseLeave={onDragLeave}
            data-selected={selectedFolder === null}
            className={clsx(
              'flex h-8 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1 text-sm font-bold transition-all relative group shrink-0',
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
                data-selected={isSelected}
                className={clsx(
                  'flex h-8 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1 text-sm font-bold transition-all shrink-0',
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
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 border border-dashed border-white/20 text-white/40 hover:bg-white/10 hover:text-white transition-all"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search Bar Overlay */}
        {showSearch && (
          <div className="absolute inset-0 flex items-center animate-in fade-in zoom-in-95 duration-300 z-10">
            <div className="flex-1 flex items-center gap-3 bg-zinc-950/80 border border-cyan-500/30 rounded-lg px-4 h-8 shadow-[0_0_25px_rgba(6,182,212,0.15)] backdrop-blur-md">
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

        <div className="flex items-center gap-0.5 pl-2 shrink-0">
          {onResetSize && (
            <button
              onClick={onResetSize}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition-all"
              title="Reset Window Size"
            >
              <RotateCcw size={15} />
            </button>
          )}

          {onTogglePin && (
            <button
              onClick={onTogglePin}
              className={clsx(
                "h-8 w-8 flex items-center justify-center rounded-lg transition-all",
                isPinned
                  ? "text-indigo-400 bg-indigo-500/15 border border-indigo-500/30"
                  : "text-white/30 hover:text-white/70 hover:bg-white/8"
              )}
              title={isPinned ? "Unpin Window" : "Pin Window"}
            >
              {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
            </button>
          )}

          <button
            onClick={onMoreClick}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition-all"
            title="Settings"
          >
            <Settings size={15} />
          </button>

          {/* View-toggle — primary action pill */}
          <button
            onClick={onToggleMode}
            className="relative ml-1.5 flex items-center gap-1.5 h-8 px-3 rounded-lg overflow-hidden
              bg-gradient-to-r from-cyan-500/20 to-indigo-500/20
              border border-cyan-500/40
              text-cyan-300 text-[10px] font-bold tracking-widest uppercase
              shadow-[0_0_12px_rgba(6,182,212,0.2)]
              hover:shadow-[0_0_22px_rgba(6,182,212,0.5)]
              hover:border-cyan-400/70
              hover:from-cyan-500/30 hover:to-indigo-500/30
              transition-all duration-200 group"
            title={viewMode === 'full' ? "Switch to Compact Mode" : "Switch to Full Mode"}
          >
            {/* shimmer sweep */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {viewMode === 'full'
              ? <Minimize2 size={14} className="relative z-10 flex-shrink-0" />
              : <Maximize2 size={14} className="relative z-10 flex-shrink-0" />
            }
          </button>

          <button
            onClick={() => (window as any).__TAURI_INTERNALS__.invoke('hide_window')}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/12 transition-all ml-0.5"
            title="Close Window"
          >
            <X size={15} />
          </button>
        </div>
      </div>

    </div>
  );
};
