import { useEffect } from 'react';

interface KeyboardOptions {
  onClose?: () => void;
  onSearch?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  onFolderPrev?: () => void;
  onFolderNext?: () => void;
  onPaste?: () => void;
  onToggleMode?: () => void;
  toggleModeHotkey?: string; // e.g. "Ctrl+M"
}

export function useKeyboard(options: KeyboardOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Helper to check if event matches a hotkey string like "Ctrl+Shift+V"
      const matchesHotkey = (hotkey: string) => {
        const parts = hotkey.split('+');
        const key = parts.pop()?.toLowerCase();
        const hasCtrl = parts.includes('Ctrl');
        const hasShift = parts.includes('Shift');
        const hasAlt = parts.includes('Alt');
        const hasCmd = parts.includes('Cmd');

        const eventKey = e.key.toLowerCase();
        // Handle physical key names like 'm' vs 'M'
        const keyMatches = eventKey === key || (e.code.startsWith('Key') && e.code.slice(3).toLowerCase() === key);
        
        return (
          keyMatches &&
          e.ctrlKey === hasCtrl &&
          e.shiftKey === hasShift &&
          e.altKey === hasAlt &&
          e.metaKey === hasCmd
        );
      };

      if (e.key === 'Escape' && options.onClose) {
        e.preventDefault();
        options.onClose();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && options.onSearch) {
        e.preventDefault();
        options.onSearch();
      }
      
      // Dynamic Toggle Mode Hotkey
      if (options.onToggleMode && options.toggleModeHotkey) {
        if (matchesHotkey(options.toggleModeHotkey)) {
          e.preventDefault();
          options.onToggleMode();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'm' && options.onToggleMode) {
        // Fallback to Ctrl+M
        e.preventDefault();
        options.onToggleMode();
      }

      if (e.key === 'Delete' && options.onDelete) {
        e.preventDefault();
        options.onDelete();
      }

      if (e.key === 'p' && !e.metaKey && !e.ctrlKey && options.onPin) {
        e.preventDefault();
        options.onPin();
      }

      if (e.key === 'ArrowUp' && options.onNavigatePrev) {
        e.preventDefault();
        e.stopPropagation();
        options.onNavigatePrev();
      }

      if (e.key === 'ArrowDown' && options.onNavigateNext) {
        e.preventDefault();
        e.stopPropagation();
        options.onNavigateNext();
      }

      // Folder navigation — skip when typing in an input/textarea
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      if (e.key === 'ArrowLeft' && options.onFolderPrev && !isTyping) {
        e.preventDefault();
        e.stopPropagation();
        options.onFolderPrev();
      }

      if (e.key === 'ArrowRight' && options.onFolderNext && !isTyping) {
        e.preventDefault();
        e.stopPropagation();
        options.onFolderNext();
      }

      if (e.key === 'Enter' && options.onPaste) {
        e.preventDefault();
        options.onPaste();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}
