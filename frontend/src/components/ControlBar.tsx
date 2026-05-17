// HMR Force Reload
import React, { useState, useEffect } from 'react';
import { Search, Plus, Maximize2, Minimize2, X, Folder as FolderIcon, Zap, Flame, Star, Leaf, Droplets, Clock, Cloud, Moon, Music, Shield, Cpu, Database, Globe, Lock, Terminal, Code, Command, Compass, HardDrive, Ghost, Activity, FolderHeart, FolderSync, FolderOpen, FolderLock, Archive, Briefcase, Bookmark, Tag, Inbox, Layers, Layout, Library, Package, Paperclip, Puzzle, Settings, Share2, Smile, Sun, Pin, PinOff, RotateCcw, FileText, Image as ImageIcon, FileCode, Files, Keyboard, HardDrive as StorageIcon } from 'lucide-react';
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
  hotkey?: string;
  lastClipTime?: string | null;
  dbSizeBytes?: number;
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
  hotkey,
  lastClipTime,
  dbSizeBytes,
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

  // ── Shortcut hint cycling ──
  const HINTS = [
    { keys: 'Ctrl+F', action: 'Search' },
    { keys: 'Enter', action: 'Paste' },
    { keys: 'Del', action: 'Delete' },
    { keys: 'P', action: 'Pin' },
    { keys: 'Esc', action: 'Close' },
  ];
  const [hintIndex, setHintIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setHintIndex(i => (i + 1) % HINTS.length), 4000);
    return () => clearInterval(timer);
  }, []);

  // ── Last clip age (live-updating) ──
  const [lastClipAge, setLastClipAge] = useState('');
  useEffect(() => {
    if (!lastClipTime) { setLastClipAge(''); return; }
    const update = () => {
      const diffMs = Date.now() - new Date(lastClipTime).getTime();
      if (diffMs < 0) { setLastClipAge('now'); return; }
      const secs = Math.floor(diffMs / 1000);
      if (secs < 60) setLastClipAge(`${secs}s`);
      else if (secs < 3600) setLastClipAge(`${Math.floor(secs / 60)}m`);
      else if (secs < 86400) setLastClipAge(`${Math.floor(secs / 3600)}h`);
      else setLastClipAge(`${Math.floor(secs / 86400)}d`);
    };
    update();
    const timer = setInterval(update, 5000);
    return () => clearInterval(timer);
  }, [lastClipTime]);

  // ── DB size formatting ──
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={clsx(
        'relative flex flex-col bg-card/50 backdrop-blur-md z-10',
        theme === 'dark' ? 'text-white' : 'text-slate-900'
      )}
      style={{
        ...style,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* ═══ HUD Status Strip — matches compact header style ═══ */}
      <div
        className="relative flex items-center justify-between px-3 overflow-hidden select-none bg-white/5 backdrop-blur-md shrink-0 border-b-[4px] border-[#0A0A0B]"
        style={{ height: '34px' }}
      >
        <HudKeyframes />
        {/* Scan-line sweep (CSS-only, GPU-composited) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-y-0 w-[25%]"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.05), transparent)',
              animation: 'hud-scan 4s ease-in-out infinite alternate',
            }}
          />
        </div>

        {/* Corner brackets — top-left */}
        <svg className="absolute top-0 left-0 opacity-30 pointer-events-none" width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M0 8V0h8" stroke="rgba(6,182,212,0.6)" strokeWidth="1" />
        </svg>
        {/* Corner brackets — top-right */}
        <svg className="absolute top-0 right-0 opacity-30 pointer-events-none" width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M8 8V0H0" stroke="rgba(6,182,212,0.6)" strokeWidth="1" />
        </svg>
        {/* Corner brackets — bottom-left */}
        <svg className="absolute bottom-0 left-0 opacity-20 pointer-events-none" width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M0 0v8h8" stroke="rgba(99,102,241,0.5)" strokeWidth="1" />
        </svg>
        {/* Corner brackets — bottom-right */}
        <svg className="absolute bottom-0 right-0 opacity-20 pointer-events-none" width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M8 0v8H0" stroke="rgba(99,102,241,0.5)" strokeWidth="1" />
        </svg>

        {/* ── LEFT: Logo + App Name (no badge — only compact has one) ── */}
        <div className="flex items-center gap-2 z-10 flex-shrink-0">
          <div className="w-6 h-6 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
          </div>
          <span className="font-bold text-sm tracking-tight">CyberPaste</span>
        </div>

        {/* ── CENTER: Stat Chips ── */}
        <div className="flex items-center gap-1.5 z-10">
          {/* Clipboard stat uses breathing LED instead of Clock icon */}
          <HudChip icon={
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-cyan-400" style={{ animation: 'hud-breathe 3s ease-in-out infinite' }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
            </span>
          } value={totalClipCount} color="#22d3ee" label="Clipboard" />
          <div className="w-px h-3 bg-white/8" />
          <HudChip icon={<FileText size={11} />} value={textCount} color="#a78bfa" label="Text" />
          <div className="w-px h-3 bg-white/8" />
          <HudChip icon={<ImageIcon size={11} />} value={imageCount} color="#fbbf24" label="Images" />
          <div className="w-px h-3 bg-white/8" />
          <HudChip icon={<Files size={11} />} value={fileCount ?? 0} color="#4ade80" label="Files" />
          <div className="w-px h-3 bg-white/8" />
          <HudChip icon={<FileCode size={11} />} value={(htmlCount ?? 0) + (rtfCount ?? 0)} color="#38bdf8" label="Rich" />
          <div className="w-px h-3 bg-white/8" />
          <HudChip icon={<FolderIcon size={11} />} value={folders.length} color="#fb923c" label="Folders" />
          {selectedFolder && (
            <>
              <div className="mx-1 h-3 w-px bg-cyan-500/20" />
              <span className="text-[8px] font-medium text-cyan-400/60 tracking-wide flex items-center gap-1">
                <span className="px-1 py-px rounded bg-cyan-500/10 border border-cyan-500/15 text-cyan-400 font-bold">
                  {currentFolderName}
                </span>
                <span className="text-white/30">{folders.find(f => f.id === selectedFolder)?.item_count || 0}</span>
              </span>
            </>
          )}
        </div>

        {/* ── RIGHT: Status Info ── */}
        <div className="flex items-center gap-2 z-10 flex-shrink-0">
          {/* Shortcut hint (cycling, fixed width to prevent layout shift) */}
          <div className="flex items-center gap-1 text-[8px] text-white/25 w-[100px]" title="Keyboard shortcuts">
            <Keyboard size={8} className="text-white/20 flex-shrink-0" />
            <div key={hintIndex} className="flex items-center gap-1" style={{ animation: 'hud-hint-fade 0.5s ease-out' }}>
              <span className="font-mono font-bold text-cyan-400/70">{HINTS[hintIndex].keys}</span>
              <span className="text-white/35">{HINTS[hintIndex].action}</span>
            </div>
          </div>

          {/* Hotkey badge */}
          {hotkey && (
            <>
              <div className="w-px h-3 bg-white/8" />
              <span className="text-[8px] font-mono font-bold text-indigo-400/60 px-1 py-px rounded bg-indigo-500/10 border border-indigo-500/15" title="Global hotkey">
                {hotkey}
              </span>
            </>
          )}

          {/* Last clip age */}
          {lastClipAge && (
            <>
              <div className="w-px h-3 bg-white/8" />
              <div className="flex items-center gap-0.5 text-[8px] text-white/20" title={`Last clip: ${lastClipAge} ago`}>
                <Clock size={8} className="text-cyan-400/40" />
                <span className="font-mono text-cyan-400/50">{lastClipAge}</span>
              </div>
            </>
          )}

          {/* DB size */}
          {dbSizeBytes != null && dbSizeBytes > 0 && (
            <>
              <div className="w-px h-3 bg-white/8" />
              <div className="flex items-center gap-0.5 text-[8px] text-white/20" title={`Database: ${formatBytes(dbSizeBytes)}`}>
                <StorageIcon size={8} className="text-amber-400/40" />
                <span className="font-mono text-amber-400/50">{formatBytes(dbSizeBytes)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Main Toolbar ── */}
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
            "no-scrollbar flex flex-1 items-center gap-4 overflow-x-auto transition-all duration-500 ease-in-out",
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

          {/* View-toggle — compact pill */}
          <button
            onClick={onToggleMode}
            className="relative ml-1 flex items-center gap-1 h-7 px-2 rounded-lg overflow-hidden
              bg-gradient-to-r from-cyan-500/20 to-indigo-500/20
              border border-cyan-500/40
              text-cyan-300
              shadow-[0_0_8px_rgba(6,182,212,0.15)]
              hover:shadow-[0_0_16px_rgba(6,182,212,0.4)]
              hover:border-cyan-400/70
              hover:from-cyan-500/30 hover:to-indigo-500/30
              transition-all duration-200 group"
            title={viewMode === 'full' ? "Switch to Compact Mode" : "Switch to Full Mode"}
          >
            {/* shimmer sweep */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {viewMode === 'full'
              ? <Minimize2 size={13} className="relative z-10 flex-shrink-0" />
              : <Maximize2 size={13} className="relative z-10 flex-shrink-0" />
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

/* ── HUD Stat Chip (icon + label + value) ──────────────────────────── */
const HudChip: React.FC<{ icon: React.ReactNode; value: number; color: string; label?: string }> = React.memo(({ icon, value, color, label }) => (
  <div className="flex items-center gap-1.5 px-1" title={label ? `${value} ${label}` : String(value)}>
    <span style={{ color: `${color}88` }}>{icon}</span>
    {label && <span className="text-[10px] font-medium tracking-wide uppercase" style={{ color: `${color}99` }}>{label}</span>}
    <span className="text-[12px] font-bold font-mono tabular-nums" style={{ color }}>{value}</span>
  </div>
));
HudChip.displayName = 'HudChip';

/* ── Inject HUD keyframes (rendered once via React) ────────────────── */
const HudKeyframes = () => (
  <style>{`
    @keyframes hud-scan {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(400%); }
    }
    @keyframes hud-breathe {
      0%, 100% { opacity: .3; transform: scale(1); }
      50%      { opacity: .8; transform: scale(1.8); }
    }
    @keyframes hud-hint-fade {
      0%   { opacity: 0; transform: translateY(4px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `}</style>
);
