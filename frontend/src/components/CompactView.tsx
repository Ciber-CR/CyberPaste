import React, { useRef } from 'react';
import { ClipboardItem as AppClip, FolderItem } from '../types';
import { Search, List, Maximize2, Hash, Clock, Trash2, Folder as FolderIcon, X, Pin, PinOff, Zap, Flame, Star, Leaf, Droplets, Cloud, Moon, Music, Shield, Cpu, Database, Globe, Lock, Terminal, Code, Command, Compass, HardDrive, Ghost, Activity, FolderHeart, FolderSync, FolderOpen, FolderLock, Archive, Briefcase, Bookmark, Tag, Inbox, Layers, Layout, Library, Package, Paperclip, Puzzle, Settings, Share2, Smile, Sun } from 'lucide-react';
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
  onDragStart: (clipId: string, startX: number, startY: number) => void;
  onDragHover: (folderId: string | null) => void;
  onDragLeave: () => void;
  isDragging: boolean;
  dragTargetFolderId: string | null;
}

export const CompactView: React.FC<CompactViewProps> = ({
  clips,
  folders,
  selectedFolder,
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
  onTogglePin,
  onFolderContextMenu,
  onDragStart,
  onDragHover,
  onDragLeave,
  isDragging,
  dragTargetFolderId
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

  const folderScrollRef = useRef<HTMLDivElement>(null);

  const handleFolderWheel = (e: React.WheelEvent) => {
    if (folderScrollRef.current) {
      folderScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full w-full font-sans select-none overflow-hidden",
      theme === 'dark' ? "text-white/90" : "text-slate-800"
    )}>
      {/* Header */}
      <div 
        data-tauri-drag-region
        className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5 backdrop-blur-md cursor-move"
      >
        <div data-tauri-drag-region className="flex items-center gap-2">
          <div data-tauri-drag-region className="w-6 h-6 rounded-md bg-cyan-600 flex items-center justify-center shadow-[0_0_10px_rgba(8,145,178,0.3)]">
            <Hash size={14} className="text-white" />
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
            onClick={onToggleMode}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-cyan-400"
            title="Full View"
          >
            <Maximize2 size={16} />
          </button>
          <button 
            onClick={onOpenSettings}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors opacity-60 hover:opacity-100"
            title="Settings"
          >
            <List size={16} />
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

      {/* Search & Folders */}
      <div className="p-2 space-y-2">
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

        {/* Mini Folders Bar */}
        <div 
          ref={folderScrollRef}
          onWheel={handleFolderWheel}
          className="flex gap-1 overflow-x-auto no-scrollbar pb-1 scroll-smooth"
        >
          <button
            onClick={() => onSelectFolder(null)}
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border",
              selectedFolder === null && !dragTargetFolderId
                ? "bg-white/10 text-white border-white/20 shadow-[0_0_8px_rgba(255,255,255,0.05)]" 
                : dragTargetFolderId === null && isDragging
                ? "bg-cyan-500/30 border-cyan-400 text-white"
                : "bg-white/5 hover:bg-white/10 border-transparent opacity-60 hover:opacity-100"
            )}
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
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border",
                  selectedFolder === folder.id && !dragTargetFolderId
                    ? "bg-white/10 text-white border-white/20" 
                    : dragTargetFolderId === folder.id
                    ? "bg-cyan-500/30 border-cyan-400 text-white"
                    : "bg-white/5 hover:bg-white/10 border-transparent opacity-60 hover:opacity-100"
                )}
                onMouseEnter={() => isDragging && onDragHover(folder.id)}
                onMouseLeave={onDragLeave}
              >
                <Icon size={10} style={{ color: folder.color || undefined }} />
                {folder.name}
                <span className={cn("opacity-40 text-[9px]", selectedFolder === folder.id && "opacity-80")}>({folder.item_count || 0})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-2 space-y-1">
        {clips.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 italic text-sm">
            <p>{t('clipList.empty')}</p>
          </div>
        ) : (
          clips.map((clip, index) => (
            <div 
              key={clip.id}
              onClick={() => onPaste(clip.id)}
              onMouseDown={(e) => onDragStart(clip.id, e.clientX, e.clientY)}
              className="group relative flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-pointer overflow-hidden h-12 flex-shrink-0"
            >
              <div className="flex-shrink-0 w-8 flex items-center justify-center">
                <span className="text-[10px] opacity-30 font-mono">#{clips.length - index}</span>
              </div>
              
              <div className="flex-1 min-w-0 flex items-center gap-3">
                {clip.clip_type === 'image' ? (
                  <>
                    <div className="w-10 h-8 rounded border border-white/10 overflow-hidden bg-black/20 flex items-center justify-center flex-shrink-0">
                      {clip.content ? (
                        <img 
                          src={getClipImageSrc(clip.content)} 
                          alt="clip" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-[10px] opacity-40">IMG</span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-cyan-400/80 truncate">{t('common.image')}</span>
                  </>
                ) : (
                  <span className="text-xs font-medium truncate leading-none">
                    {clip.preview.replace(/[\n\r\t]+/g, ' ')}
                  </span>
                )}
              </div>

              <div className="flex-shrink-0 flex items-center gap-3 pr-2">
                <span className="text-[10px] opacity-30 flex items-center gap-1 whitespace-nowrap">
                  <Clock size={10} />
                  {formatDistanceToNow(new Date(clip.created_at), { addSuffix: false })}
                </span>
                
                {/* Hover Actions */}
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
  );
};
