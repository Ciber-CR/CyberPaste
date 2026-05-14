import React, { useRef, useEffect } from 'react';
import { ClipboardItem as AppClip, FolderItem } from '../types';
import { Search, Maximize2, Clock, Trash2, Folder as FolderIcon, X, Pin, PinOff, Zap, Flame, Star, Leaf, Droplets, Cloud, Moon, Music, Shield, Cpu, Database, Globe, Lock, Terminal, Code, Command, Compass, HardDrive, Ghost, Activity, FolderHeart, FolderSync, FolderOpen, FolderLock, Archive, Briefcase, Bookmark, Tag, Inbox, Layers, Layout, Library, Package, Paperclip, Puzzle, Settings, Share2, Smile, Sun, RotateCcw, MoveHorizontal, MoveVertical, PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { convertFileSrc } from '@tauri-apps/api/core';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const IconMap: Record<string, any> = {
  Zap, Flame, Star, Leaf, Droplets, Cloud, Moon, Music, Shield, Cpu, Database, Globe, Lock, Terminal, Code, Command, Compass, HardDrive, Ghost, Activity, Folder: FolderIcon, FolderHeart, FolderSync, FolderOpen, FolderLock, Archive, Briefcase, Bookmark, Tag, Inbox, Layers, Layout, Library, Package, Paperclip, Puzzle, Settings, Share2, Smile, Sun
};

interface CompactViewProps {
  clips: AppClip[];
  folders: FolderItem[];
  selectedFolder: string | null;
  selectedClipId: string | null;
  onSelectFolder: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPaste: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleMode: () => void;
  onOpenSettings: () => void;
  isLoading: boolean;
  theme: 'light' | 'dark';
  totalClipCount: number;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onFolderContextMenu?: (e: React.MouseEvent, id: string) => void;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
  onDragStart: (clipId: string, startX: number, startY: number) => void;
  onDragHover: (folderId: string | null) => void;
  onDragLeave: () => void;
  isDragging: boolean;
  reorderTargetClipId?: string | null;
  reorderTargetPosition?: 'before' | 'after' | null;
  reorderEnabled?: boolean;
  dragTargetFolderId: string | null;
  compactFolderLayout?: 'horizontal' | 'vertical';
  compactSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onAddFolder?: () => void;
}

export const CompactView: React.FC<CompactViewProps> = ({
  clips,
  folders,
  selectedFolder,
  selectedClipId,
  onSelectFolder,
  searchQuery,
  onSearchChange,
  onPaste,
  onDelete,
  onToggleMode,
  onOpenSettings,
  isLoading,
  theme,
  totalClipCount,
  isPinned = false,
  onTogglePin,
  onFolderContextMenu,
  onContextMenu,
  onDragStart,
  onDragHover,
  onDragLeave,
  isDragging,
  reorderTargetClipId,
  reorderTargetPosition,
  reorderEnabled,
  dragTargetFolderId,
  compactFolderLayout = 'horizontal',
  compactSidebarCollapsed = false,
  onToggleSidebar,
  onAddFolder,
}) => {
  const { t } = useTranslation();
  
  const getClipImageSrc = (content: string) => {
    if (!content) return '';
    const isAbsolutePath = content.startsWith('/') || /^[A-Za-z]:[\\/]/.test(content);
    if (
      content.startsWith('data:') ||
      content.startsWith('http://') ||
      content.startsWith('https://') ||
      content.startsWith('asset:') ||
      content.startsWith('tauri://')
    ) {
      return content;
    }
    if (isAbsolutePath) {
      return convertFileSrc(content);
    }
    return `data:image/png;base64,${content}`;
  };

  const handleResetSize = async () => {
    try {
      await invoke('reset_window_size');
    } catch (error) {
      console.error('Failed to reset window size:', error);
    }
  };

  const folderScrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected clip
  useEffect(() => {
    if (selectedClipId && listRef.current) {
      const el = listRef.current.querySelector(`[data-clip-id="${selectedClipId}"]`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedClipId]);

  const handleFolderWheel = (e: React.WheelEvent) => {
    if (folderScrollRef.current) {
      folderScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const isVertical = compactFolderLayout === 'vertical';

  const folderPillClass = (_folderId: string | null, isSelected: boolean, isDragTarget: boolean) =>
    cn(
      "px-3 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border",
      isSelected && !dragTargetFolderId
        ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
        : isDragTarget && isDragging
        ? "bg-cyan-500/30 border-cyan-400 text-white"
        : "bg-white/5 hover:bg-white/10 border-transparent opacity-60 hover:opacity-100"
    );

  const folderPillClassNamed = (_folderId: string, isSelected: boolean, isDragTarget: boolean, _color?: string | null) =>
    cn(
      "px-3 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border",
      isSelected && !dragTargetFolderId
        ? "bg-primary/10 text-white/80 border-primary/60 shadow-[0_0_12px_rgba(99,102,241,0.3)] ring-1 ring-primary/40"
        : isDragTarget && isDragging
        ? "bg-cyan-500/30 border-cyan-400 text-white"
        : "bg-white/5 hover:bg-white/10 border-transparent opacity-60 hover:opacity-100"
    );

  const sidebarWidth = isVertical ? (compactSidebarCollapsed ? 0 : 140) : 0;

  return (
    <div className={cn(
      "flex flex-col h-full w-full font-['Segoe_UI',system-ui,sans-serif] select-none overflow-hidden",
      theme === 'dark' ? "text-white/90" : "text-slate-800"
    )}>
      {/* Header */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5 backdrop-blur-md cursor-move flex-shrink-0"
      >
        <div data-tauri-drag-region className="flex items-center gap-2">
          {isVertical && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
              title={compactSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {compactSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          )}
          <div data-tauri-drag-region className="w-6 h-6 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
          </div>
          <div data-tauri-drag-region className="flex items-baseline gap-1.5">
            <span data-tauri-drag-region className="font-bold text-sm tracking-tight">CyberPaste</span>
            <span data-tauri-drag-region className="text-[10px] font-medium text-cyan-400/80 tracking-widest uppercase bg-cyan-400/10 px-1.5 rounded-sm border border-cyan-400/20">Compact</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onTogglePin && (
            <button
              onClick={onTogglePin}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isPinned ? "text-indigo-400 bg-indigo-500/10" : "text-slate-400 hover:bg-white/10"
              )}
              title={isPinned ? "Unpin Window" : "Pin Window"}
            >
              {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
            </button>
          )}
          <button
            onClick={handleResetSize}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            title="Reset Default Size"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors opacity-60 hover:opacity-100 text-muted-foreground hover:text-primary"
            title="Settings"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={onToggleMode}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-cyan-400"
            title="Full View"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={() => (window as any).__TAURI_INTERNALS__.invoke('hide_window')}
            className="p-1.5 rounded-md hover:bg-rose-500/20 transition-colors text-rose-500"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {isVertical ? (
        /* === VERTICAL LAYOUT === */
        <div className="flex flex-row flex-1 overflow-hidden">
          {/* Sidebar */}
          <div
            className="flex-shrink-0 border-r border-white/10 bg-black/10 overflow-hidden transition-all duration-200"
            style={{ width: sidebarWidth }}
          >
            <div className="w-[140px] h-full flex flex-col gap-1 overflow-y-auto no-scrollbar py-2">
              <button
                onClick={() => onSelectFolder(null)}
                className={cn(
                  "mx-1.5 px-2 py-2 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap flex flex-row items-center gap-1.5 border",
                  selectedFolder === null && !dragTargetFolderId
                    ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                    : dragTargetFolderId === null && isDragging
                    ? "bg-cyan-500/30 border-cyan-400 text-white"
                    : "bg-white/5 hover:bg-white/10 border-transparent opacity-60 hover:opacity-100"
                )}
                onMouseEnter={() => isDragging && onDragHover(null)}
                onMouseLeave={onDragLeave}
              >
                <Clock size={10} className="flex-shrink-0" />
                <span className="truncate flex-1 text-left">[Clipboard]</span>
                <span className={cn("opacity-40 text-[9px] flex-shrink-0", selectedFolder === null && "opacity-80")}>({totalClipCount})</span>
              </button>
              {folders.map(folder => {
                const Icon = IconMap[folder.icon || 'Folder'] || FolderIcon;
                const isSelected = selectedFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => onSelectFolder(folder.id)}
                    onContextMenu={(e) => onFolderContextMenu?.(e, folder.id)}
                    className={cn(
                      "mx-1.5 px-2 py-2 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap flex flex-row items-center gap-1.5 border",
                      isSelected && !dragTargetFolderId
                        ? "bg-primary/10 text-white/80 border-primary/60 shadow-[0_0_12px_rgba(99,102,241,0.3)] ring-1 ring-primary/40"
                        : dragTargetFolderId === folder.id && isDragging
                        ? "bg-cyan-500/30 border-cyan-400 text-white"
                        : "bg-white/5 hover:bg-white/10 border-transparent opacity-60 hover:opacity-100"
                    )}
                    onMouseEnter={() => isDragging && onDragHover(folder.id)}
                    onMouseLeave={onDragLeave}
                  >
                    <Icon size={10} style={{ color: folder.color || undefined }} className={isSelected ? "text-primary" : "text-white/30 flex-shrink-0"} />
                    <span className="truncate flex-1 text-left">{folder.name}</span>
                    <span className={cn("opacity-40 text-[9px] flex-shrink-0", isSelected && "opacity-80")}>({folder.item_count || 0})</span>
                  </button>
                );
              })}
              {onAddFolder && (
                <button
                  onClick={onAddFolder}
                  className="mx-1.5 px-2 py-2 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap flex flex-row items-center justify-center gap-1.5 border border-dashed border-white/20 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80"
                  title="Add Folder"
                >
                  <Plus size={10} />
                  <span className="truncate flex-1 text-left">New Folder</span>
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-2 flex-shrink-0">
              <div className="relative group">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 group-focus-within:text-cyan-400 transition-all" size={14} />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded-lg py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-black/40 transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar px-2 pb-2 space-y-1">
              {clips.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 italic text-sm">
                  <p>{t('clipList.empty')}</p>
                </div>
              ) : (
                clips.map((clip, index) => (
                  <ClipRow
                    key={clip.id}
                    clip={clip}
                    index={index}
                    clips={clips}
                    selectedClipId={selectedClipId}
                    selectedFolder={selectedFolder}
                    onPaste={onPaste}
                    onDelete={onDelete}
                    onContextMenu={onContextMenu}
                    onDragStart={onDragStart}
                    reorderEnabled={reorderEnabled}
                    reorderTargetClipId={reorderTargetClipId}
                    reorderTargetPosition={reorderTargetPosition}
                    getClipImageSrc={getClipImageSrc}
                    t={t}
                    formatDistanceToNow={formatDistanceToNow}
                  />
                ))
              )}
              {isLoading && (
                <div className="flex justify-center p-4">
                  <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-white/5 bg-black/10 flex justify-between items-center text-[9px] opacity-40 font-mono tracking-tighter flex-shrink-0">
              <span>{t('compact.enterToPaste')}</span>
              <span>{t('compact.escToHide')}</span>
            </div>
          </div>
        </div>
      ) : (
        /* === HORIZONTAL LAYOUT (existing) === */
        <>
          <div className="p-2 space-y-2 flex-shrink-0">
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 group-focus-within:text-cyan-400 transition-all" size={14} />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-black/20 border border-white/5 rounded-lg py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-black/40 transition-all"
              />
            </div>

            <div
              ref={folderScrollRef}
              onWheel={handleFolderWheel}
              className="flex gap-1 overflow-x-auto no-scrollbar pb-1 scroll-smooth"
            >
              <button
                onClick={() => onSelectFolder(null)}
                className={folderPillClass(null, selectedFolder === null, dragTargetFolderId === null)}
                onMouseEnter={() => isDragging && onDragHover(null)}
                onMouseLeave={onDragLeave}
              >
                <Clock size={10} />
                [Clipboard]
                <span className={cn("opacity-40 text-[9px]", selectedFolder === null && "opacity-80")}>({totalClipCount})</span>
              </button>
              {folders.map(folder => {
                const Icon = IconMap[folder.icon || 'Folder'] || FolderIcon;
                return (
                  <button
                    key={folder.id}
                    onClick={() => onSelectFolder(folder.id)}
                    onContextMenu={(e) => onFolderContextMenu?.(e, folder.id)}
                    className={folderPillClassNamed(folder.id, selectedFolder === folder.id, dragTargetFolderId === folder.id, folder.color)}
                    onMouseEnter={() => isDragging && onDragHover(folder.id)}
                    onMouseLeave={onDragLeave}
                  >
                    <Icon size={10} style={{ color: folder.color || undefined }} className={selectedFolder === folder.id ? "text-primary" : "text-white/30"} />
                    {folder.name}
                    <span className={cn("opacity-40 text-[9px]", selectedFolder === folder.id && "opacity-80")}>({folder.item_count || 0})</span>
                  </button>
                );
              })}
              {onAddFolder && (
                <button
                  onClick={onAddFolder}
                  className="px-2 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border border-dashed border-white/20 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80"
                  title="Add Folder"
                >
                  <Plus size={10} />
                  New
                </button>
              )}
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar px-2 pb-2 space-y-1">
            {clips.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full opacity-30 italic text-sm">
                <p>{t('clipList.empty')}</p>
              </div>
            ) : (
              clips.map((clip, index) => (
                <ClipRow
                  key={clip.id}
                  clip={clip}
                  index={index}
                  clips={clips}
                  selectedClipId={selectedClipId}
                  selectedFolder={selectedFolder}
                  onPaste={onPaste}
                  onDelete={onDelete}
                  onContextMenu={onContextMenu}
                  onDragStart={onDragStart}
                  reorderEnabled={reorderEnabled}
                  reorderTargetClipId={reorderTargetClipId}
                  reorderTargetPosition={reorderTargetPosition}
                  getClipImageSrc={getClipImageSrc}
                  t={t}
                  formatDistanceToNow={formatDistanceToNow}
                />
              ))
            )}
            {isLoading && (
              <div className="flex justify-center p-4">
                <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="p-2 border-t border-white/5 bg-black/10 flex justify-between items-center text-[9px] opacity-40 font-mono tracking-tighter flex-shrink-0">
            <span>{t('compact.enterToPaste')}</span>
            <span>{t('compact.escToHide')}</span>
          </div>
        </>
      )}
    </div>
  );
};

// Extracted clip row component to avoid duplication between horizontal and vertical layouts
const ClipRow: React.FC<{
  clip: AppClip;
  index: number;
  clips: AppClip[];
  selectedClipId: string | null;
  selectedFolder: string | null;
  onPaste: (id: string) => void;
  onDelete: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
  onDragStart: (clipId: string, startX: number, startY: number) => void;
  reorderEnabled?: boolean;
  reorderTargetClipId?: string | null;
  reorderTargetPosition?: 'before' | 'after' | null;
  getClipImageSrc: (content: string) => string;
  t: (key: string) => string;
  formatDistanceToNow: (date: Date, opts: { addSuffix: boolean }) => string;
}> = ({ clip, index, clips, selectedClipId, selectedFolder, onPaste, onDelete, onContextMenu, onDragStart, reorderEnabled, reorderTargetClipId, reorderTargetPosition, getClipImageSrc, t, formatDistanceToNow }) => {
  return (
    <React.Fragment>
      {reorderEnabled && reorderTargetClipId === clip.id && reorderTargetPosition === 'before' && (
        <div className="h-0.5 bg-cyan-400 rounded-full mx-2 shadow-[0_0_8px_rgba(34,211,238,0.6)] flex-shrink-0" />
      )}
      <div
        data-clip-id={clip.id}
        onClick={() => onPaste(clip.id)}
        onContextMenu={(e) => onContextMenu?.(e, clip.id)}
        onMouseDown={(e) => {
          if (e.button === 0) {
            e.preventDefault();
            onDragStart(clip.id, e.clientX, e.clientY);
          }
        }}
        draggable="false"
        className={clsx(
          "group relative flex items-center gap-3 py-1.5 px-2 rounded-lg border transition-all cursor-pointer overflow-hidden h-10 flex-shrink-0",
          selectedClipId === clip.id
            ? "bg-indigo-500/15 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-cyan-500/30",
          reorderEnabled && "cursor-grab active:cursor-grabbing"
        )}
      >
        <div className="flex-shrink-0 w-8 flex items-center justify-center">
          <span className="text-[10px] opacity-30 font-mono">#{clips.length - index}</span>
        </div>
        <div className="flex-shrink-0 w-8 flex items-center justify-center border-l border-white/5">
          {clip.source_icon && (
            <img
              src={`data:image/png;base64,${clip.source_icon}`}
              alt=""
              draggable="false"
              className="h-3.5 w-3.5 object-contain opacity-50 group-hover:opacity-100 transition-opacity"
            />
          )}
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {clip.clip_type === 'image' ? (
            <>
              <div className="w-10 h-8 rounded border border-white/10 overflow-hidden bg-black/20 flex items-center justify-center flex-shrink-0">
                {clip.content ? (
                  <img
                    src={getClipImageSrc(clip.content)}
                    alt="clip"
                    draggable="false"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] opacity-40">IMG</span>
                )}
              </div>
              <span className="text-xs font-medium text-cyan-400/80 truncate">{t('common.image')}</span>
              {(() => {
                try {
                  const parsed = clip.metadata ? JSON.parse(clip.metadata) as { size_bytes?: number; width?: number; height?: number } : null;
                  const w = parsed?.width || 0;
                  const h = parsed?.height || 0;
                  const kb = parsed?.size_bytes ? Math.round(parsed.size_bytes / 1024) : 0;
                  if (w && h && kb) {
                    return (
                      <span className="text-[10px] opacity-40 flex items-center gap-1.5 whitespace-nowrap">
                        <span className="flex items-center gap-0.5">
                          <MoveHorizontal size={9} />
                          {w}
                        </span>
                        <span className="opacity-50">×</span>
                        <span className="flex items-center gap-0.5">
                          <MoveVertical size={9} />
                          {h}
                        </span>
                        <span className="opacity-50">•</span>
                        <span>{kb}KB</span>
                      </span>
                    );
                  }
                } catch { /* empty */ }
                return null;
              })()}
            </>
          ) : (
            <span className="text-xs font-medium truncate leading-none">
              {clip.preview.replace(/[\n\r\t]+/g, ' ')}
            </span>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-3 pr-2">
          <span className="text-[10px] opacity-30 flex items-center gap-1 whitespace-nowrap">
            {index === 0 && (
              <span className="text-[8px] font-bold tracking-widest text-cyan-400/90 uppercase">Latest</span>
            )}
            <Clock size={10} className={selectedFolder === null ? "text-indigo-400" : "text-current"} />
            {formatDistanceToNow(new Date(clip.created_at), { addSuffix: false })}
          </span>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(clip.id); }}
              className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
              title={t('common.delete')}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
      {reorderEnabled && reorderTargetClipId === clip.id && reorderTargetPosition === 'after' && (
        <div className="h-0.5 bg-cyan-400 rounded-full mx-2 shadow-[0_0_8px_rgba(34,211,238,0.6)] flex-shrink-0" />
      )}
    </React.Fragment>
  );
};
