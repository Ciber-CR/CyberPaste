import { Settings, FolderItem } from '../types';
import {
  X,
  Trash2,
  Plus,
  FolderOpen,
  Settings as SettingsIcon,
  BrainCircuit,
  Folder as FolderIcon,
  MoreHorizontal,
  Eye,
  EyeOff,
  Maximize2,
  Square,
  Info,
  ExternalLink,
  Terminal,
  Heart,
  Flame,
  RotateCcw,
  Volume2,
  Clipboard,
  Layout,
  Command,
  Lock,
  Database,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import { FlaskConical } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { getVersion } from '@tauri-apps/api/app';
import { openUrl } from '@tauri-apps/plugin-opener';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { toast } from 'sonner';
import { ConfirmDialog } from './ConfirmDialog';
import { Select } from './ui/Select';
import { useShortcutRecorder } from 'use-shortcut-recorder';
import { clsx } from 'clsx';

interface SettingsPanelProps {
  settings: Settings;
  onClose: () => void;
}

type Tab = 'general' | 'ai' | 'folders' | 'about';

function PromptEditor({
  label,
  value,
  titleValue,
  placeholder,
  onSave,
  onSaveTitle,
}: {
  label: string;
  value: string;
  titleValue?: string;
  placeholder: string;
  onSave: (val: string) => void;
  onSaveTitle?: (val: string) => void;
}) {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(value);
  const [localTitle, setLocalTitle] = useState(titleValue || label);

  // Sync with prop if it changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    setLocalTitle(titleValue || label);
  }, [titleValue, label]);

  return (
    <div className="space-y-2 rounded-lg border border-border/40 bg-accent/5 p-3">
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={() => {
            if (onSaveTitle && localTitle !== (titleValue || label)) {
              onSaveTitle(localTitle);
            }
          }}
          className="bg-transparent text-xs font-semibold text-foreground/70 outline-none transition-colors focus:text-primary"
          title="Click to rename action"
        />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {t('settings.actionName')}
        </span>
      </div>
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          if (localValue !== value) {
            onSave(localValue);
          }
        }}
        placeholder={placeholder}
        className="min-h-[60px] w-full resize-none rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground transition-all focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
    </div>
  );
}

export function SettingsPanel({ settings: initialSettings, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [_historySize, setHistorySize] = useState<number>(0);
  const [recordingTarget, setRecordingTarget] = useState<'hotkey' | 'view_mode_hotkey' | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    getVersion().then(setAppVersion);
  }, []);

  const openDataDir = async () => {
    try {
      const dataDir = await invoke<string>('get_data_dir_path');
      await invoke('show_item_in_folder', { path: dataDir });
    } catch (e) {
      console.error('Failed to open data dir:', e);
      toast.error('Failed to open data directory');
    }
  };

  const openConsole = async () => {
    try {
      await invoke('open_devtools');
    } catch (e) {
      console.error('Failed to open console:', e);
      toast.error('Failed to open developer console');
    }
  };
  const [localApiKey, setLocalApiKey] = useState(initialSettings.ai_api_key || '');
  const [localBaseUrl, setLocalBaseUrl] = useState(initialSettings.ai_base_url || '');
  const [localModel, setLocalModel] = useState(initialSettings.ai_model || 'gpt-3.5-turbo');
  // Folder Management State
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);

  const toggleMaximize = async () => {
    const win = getCurrentWindow();
    await win.toggleMaximize();
    const maximized = await win.isMaximized();
    setIsMaximized(maximized);
  };

  useEffect(() => {
    const win = getCurrentWindow();
    win.isMaximized().then(setIsMaximized);
    
    const unlisten = win.onResized(() => {
      win.isMaximized().then(setIsMaximized);
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  // Apply theme immediately when settings.theme changes
  useTheme(settings.theme);

  // i18n hook
  const { i18n, t } = useTranslation();

  // Generic handler for immediate settings updates
  const updateSettings = async (updates: Partial<Settings>) => {
    // Determine the next state before updating React state
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };

      // Schedule async actions - we use newSettings which is local to this scope
      // This avoids race conditions with 'settings' variable
      (async () => {
        try {
          await invoke('save_settings', { settings: newSettings });
          await emit('settings-changed', newSettings);

          if (updates.hotkey) {
            await invoke('register_global_shortcut', { hotkey: updates.hotkey });
          }
          if ('round_corners' in updates || 'mica_effect' in updates || 'float_above_taskbar' in updates) {
            await invoke('refresh_window');
          }
        } catch (error) {
          console.error(`Failed to save settings:`, error);
          toast.error(`Failed to save settings`);
        }
      })();

      // Feedback for changes
      const keys = Object.keys(updates);
      if (keys.length === 1) {
        const key = keys[0] as keyof Settings;
        const value = updates[key];
        if (key !== 'theme') {
          const label = key
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          if (typeof value === 'boolean') {
            toast.success(`${label} was ${value ? 'enabled' : 'disabled'}`);
          } else {
            toast.success(`${label} updated`);
          }
        }
      } else if (keys.length > 1) {
        toast.success('Settings updated');
      }

      return newSettings;
    });
  };

  const updateSetting = (key: keyof Settings, value: any) => {
    updateSettings({ [key]: value });
  };

  const handleThemeChange = (newTheme: string) => {
    updateSetting('theme', newTheme);
  };

  const handleLanguageChange = (newLanguage: string) => {
    updateSetting('language', newLanguage);
    // Change language immediately
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('cyberpaste_language', newLanguage);
  };

  // Use use-shortcut-recorder for recording (shows current keys held in real-time)
  const {
    shortcut,
    savedShortcut,
    startRecording: startRecordingLib,
    stopRecording: stopRecordingLib,
    clearLastRecording,
  } = useShortcutRecorder({
    minModKeys: 1, // Require at least one modifier
  });

  // Start recording mode
  const handleStartRecording = (target: 'hotkey' | 'view_mode_hotkey') => {
    setRecordingTarget(target);
    startRecordingLib();
  };

  const [ignoredApps, setIgnoredApps] = useState<string[]>([]);
  const [newIgnoredApp, setNewIgnoredApp] = useState('');

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  const handleResetLayout = async () => {
    try {
      await emit('reset-window-layout', {});
      toast.success("Layout restored to defaults!");
      // Small delay to let user see success message
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (e) {
      console.error(e);
      toast.error("Failed to send reset command");
    }
  };

  const loadFolders = async () => {
    try {
      const data = await invoke<FolderItem[]>('get_folders');
      setFolders(data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  useEffect(() => {
    invoke<number>('get_clipboard_history_size').then(setHistorySize).catch(console.error);
    invoke<string[]>('get_ignored_apps').then(setIgnoredApps).catch(console.error);
    loadFolders();

  }, []);

  const handleAddIgnoredApp = async () => {
    if (!newIgnoredApp.trim()) return;
    try {
      await invoke('add_ignored_app', { appName: newIgnoredApp.trim() });
      setIgnoredApps((prev) => [...prev, newIgnoredApp.trim()].sort());
      setNewIgnoredApp('');
      toast.success(`Added ${newIgnoredApp.trim()} to ignored apps`);
    } catch (e) {
      toast.error(`Failed to add ignored app: ${e}`);
      console.error(e);
    }
  };

  const handleBrowseFile = async () => {
    try {
      const path = await invoke<string>('pick_file', {
        filterName: 'Executables',
        extensions: ['exe', 'app'],
      });
      const filename = path.split(/[\\/]/).pop() || path;
      setNewIgnoredApp(filename);
    } catch (e) {
      console.log('File picker cancelled or failed', e);
    }
  };

  const handleRemoveIgnoredApp = async (app: string) => {
    try {
      await invoke('remove_ignored_app', { appName: app });
      setIgnoredApps((prev) => prev.filter((a) => a !== app));
      toast.success(`Removed ${app} from ignored apps`);
    } catch (e) {
      toast.error(`Failed to remove ignored app: ${e}`);
      console.error(e);
    }
  };

  const confirmClearHistory = () => {
    setConfirmDialog({
      isOpen: true,
      title: t('settings.clearHistory'),
      message: t('settings.clearHistoryMessage'),
      action: async () => {
        try {
          await invoke('clear_all_clips');
          await emit('clipboard-change');
          setHistorySize(0);
          toast.success(t('settings.clearHistorySuccess'));
        } catch (error) {
          console.error('Failed to clear history:', error);
          toast.error(`Failed to clear history: ${error}`);
        }
      },
    });
  };

  // Folder Management Functions
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await invoke('create_folder', { name: newFolderName.trim(), icon: null, color: null });
      setNewFolderName('');
      await loadFolders();
      toast.success('Folder created');
    } catch (e) {
      toast.error(`Failed to create folder: ${e}`);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await invoke('delete_folder', { id });
      await loadFolders();
      toast.success('Folder deleted');
    } catch (e) {
      toast.error(`Failed to delete folder: ${e}`);
    }
  };

  const startRenameFolder = (folder: FolderItem) => {
    setEditingFolderId(folder.id);
    setRenameValue(folder.name);
  };

  const saveRenameFolder = async () => {
    if (!editingFolderId || !renameValue.trim()) return;
    try {
      await invoke('rename_folder', { id: editingFolderId, name: renameValue.trim() });
      setEditingFolderId(null);
      setRenameValue('');
      await loadFolders();
      toast.success('Folder renamed');
    } catch (e) {
      toast.error(`Failed to rename folder: ${e}`);
    }
  };

  // Format shortcut array into Tauri-compatible string
  const formatHotkey = (keys: string[]): string => {
    return keys
      .map((k) => {
        if (k === 'Control') return 'Ctrl';
        if (k === 'Alt') return 'Alt';
        if (k === 'Shift') return 'Shift';
        if (k === 'Meta') return 'Cmd';
        if (k.startsWith('Key')) return k.slice(3);
        if (k.startsWith('Digit')) return k.slice(5);
        return k;
      })
      .join('+');
  };

  const handleSaveHotkey = async () => {
    if (savedShortcut.length > 0 && recordingTarget) {
      const newHotkey = formatHotkey(savedShortcut);
      await updateSetting(recordingTarget, newHotkey);
    }
    stopRecordingLib();
    setRecordingTarget(null);
  };

  const handleCancelRecording = () => {
    stopRecordingLib();
    clearLastRecording();
    setRecordingTarget(null);
  };

  const handleCheckUpdate = async () => {
    try {
      const loadingToast = toast.loading('Checking for updates...');
      const update = await check();
      toast.dismiss(loadingToast);

      if (update && update.available) {
        toast.info(`Update v${update.version} available!`, {
          duration: 10000,
          action: {
            label: 'Download & Restart',
            onClick: async () => {
              try {
                const dlToast = toast.loading(`Downloading v${update.version}...`);
                await update.downloadAndInstall();
                toast.dismiss(dlToast);
                toast.success('Update installed. Restarting...');
                await relaunch();
              } catch (e) {
                toast.error(`Update failed: ${e}`);
              }
            },
          },
        });
      } else {
        toast.success('You are on the latest version.');
      }
    } catch (e) {
      toast.error(`Check failed: ${e}`);
    }
  };

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={async () => {
          await confirmDialog.action();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
      <div className="flex h-full select-none flex-col bg-background text-foreground">
        {/* Header */}
        <div
          data-tauri-drag-region
          className="flex items-center justify-between border-b border-border p-4 bg-card/30 cursor-default"
        >
          <div data-tauri-drag-region className="flex items-center gap-3 pointer-events-none">
            <SettingsIcon size={20} className="text-primary" />
            <h2 className="text-xl font-bold tracking-tight">{t('settings.title')}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMaximize}
              className="icon-button w-8 h-8 flex items-center justify-center hover:bg-accent/50 rounded-md transition-colors"
              onMouseDown={(e) => e.stopPropagation()}
              title={isMaximized ? t('common.restore') : t('common.maximize')}
            >
              {isMaximized ? <Square size={14} className="opacity-70" /> : <Maximize2 size={14} className="opacity-70" />}
            </button>
            <button
              onClick={onClose}
              className="icon-button w-8 h-8 flex items-center justify-center hover:bg-destructive/20 hover:text-destructive rounded-md transition-colors"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0 border-r border-border bg-card/50 p-3">
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setActiveTab('general')}
                className={clsx(
                  'flex items-center gap-3 rounded-md px-4 py-2.5 text-base font-medium transition-all duration-200',
                  activeTab === 'general'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <SettingsIcon size={18} />
                {t('settings.general')}
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={clsx(
                  'flex items-center gap-3 rounded-md px-4 py-2.5 text-base font-medium transition-all duration-200',
                  activeTab === 'ai'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <BrainCircuit size={18} />
                {t('settings.ai')}
              </button>
              <button
                onClick={() => setActiveTab('folders')}
                className={clsx(
                  'flex items-center gap-3 rounded-md px-4 py-2.5 text-base font-medium transition-all duration-200',
                  activeTab === 'folders'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <FolderIcon size={18} />
                {t('settings.folders')}
              </button>
              <div className="mt-auto pt-4 border-t border-border/50">
                <button
                  onClick={() => setActiveTab('about')}
                  className={clsx(
                    'flex h-11 w-full items-center gap-3 rounded-md px-4 py-2.5 text-base font-medium transition-all duration-200',
                    activeTab === 'about'
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  )}
                >
                  <Info size={18} />
                  About
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-2xl space-y-8">
              {/* --- GENERAL TAB --- */}
              {activeTab === 'general' && (
                <>
                  {/* Appearance */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary/80 flex items-center gap-2">
                      <SettingsIcon size={14} /> Appearance
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="block">
                          <span className="text-base font-medium">{t('settings.theme')}</span>
                        </label>
                        <Select
                          value={settings.theme}
                          onChange={handleThemeChange}
                          options={[
                            { value: 'dark', label: t('settings.themeDark') },
                            { value: 'light', label: t('settings.themeLight') },
                            { value: 'system', label: t('settings.themeSystem') },
                          ]}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="block">
                          <span className="text-base font-medium">{t('settings.language')}</span>
                        </label>
                        <Select
                          value={settings.language || 'en'}
                          onChange={handleLanguageChange}
                          options={[
                            { value: 'de', label: 'Deutsch' },
                            { value: 'en', label: 'English' },
                            { value: 'es', label: 'Español' },
                            { value: 'fr', label: 'Francais' },
                            { value: 'ja', label: '日本語' },
                            { value: 'zh', label: '中文' },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-base font-medium">{t('settings.windowEffect')}</span>
                      </label>
                      <Select
                        value={settings.mica_effect || 'clear'}
                        onChange={(val) => updateSetting('mica_effect', val)}
                        options={[
                          { value: 'mica_alt', label: 'Mica Alt' },
                          { value: 'mica', label: 'Mica' },
                          { value: 'clear', label: 'Clear' },
                        ]}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-accent/20 p-3">
                      <div>
                        <span className="text-sm font-medium">{t('settings.floatAboveTaskbar')}</span>
                        <p className="text-xs text-muted-foreground">{t('settings.floatAboveTaskbarDesc')}</p>
                      </div>
                      <button
                        onClick={() => updateSetting('float_above_taskbar', !(settings.float_above_taskbar ?? true))}
                        className={`h-6 w-11 rounded-full transition-colors ${(settings.float_above_taskbar ?? true) ? 'bg-primary' : 'bg-accent'}`}
                      >
                        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${(settings.float_above_taskbar ?? true) ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-accent/20 p-3">
                      <div>
                        <span className="text-sm font-medium">{t('settings.roundCorners')}</span>
                        <p className="text-xs text-muted-foreground">{t('settings.roundCornersDesc')}</p>
                      </div>
                      <button
                        onClick={() => updateSetting('round_corners', !(settings.round_corners ?? false))}
                        className={`h-6 w-11 rounded-full transition-colors ${(settings.round_corners ?? false) ? 'bg-primary' : 'bg-accent'}`}
                      >
                        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${(settings.round_corners ?? false) ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-accent/20 p-3">
                      <div>
                        <span className="text-base font-semibold">{t('settings.startupWithWindows')}</span>
                        <p className="text-sm text-muted-foreground/80">{t('settings.startupWithWindowsDesc')}</p>
                      </div>
                      <button
                        onClick={() => updateSetting('startup_with_windows', !settings.startup_with_windows)}
                        className={`h-6 w-11 rounded-full transition-colors ${settings.startup_with_windows ? 'bg-primary' : 'bg-accent'}`}
                      >
                        <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${settings.startup_with_windows ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </section>

                  {/* Clipboard & Capture */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400/80 flex items-center gap-2">
                      <Clipboard size={14} /> Clipboard & Capture
                    </h3>
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-sm font-bold uppercase tracking-tight text-primary/70">{t('settings.historyLimit')}</span>
                        <p className="text-xs text-muted-foreground">Maximum number of clips to keep in history (excludes folders).</p>
                      </label>
                      <div className="flex items-center gap-4 bg-accent/10 p-3 rounded-xl border border-border/40">
                        <input
                          type="range"
                          min="50"
                          max="1000"
                          step="50"
                          value={settings.max_items || 200}
                          onChange={(e) => updateSetting('max_items', parseInt(e.target.value))}
                          className="flex-1 accent-primary cursor-pointer h-1.5 bg-accent rounded-lg appearance-none"
                        />
                        <span className="font-mono text-sm font-bold text-primary min-w-[3rem] text-center bg-primary/10 border border-primary/20 rounded-lg px-2 py-1 shadow-sm">
                          {settings.max_items || 200}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-accent/20 p-3">
                      <div>
                        <span className="text-base font-semibold">{t('settings.ignoreGhostClips')}</span>
                        <p className="text-sm text-muted-foreground/80">{t('settings.ignoreGhostClipsDesc')}</p>
                      </div>
                      <button
                        onClick={() => updateSetting('ignore_ghost_clips', !settings.ignore_ghost_clips)}
                        className={`h-6 w-11 rounded-full transition-colors ${settings.ignore_ghost_clips ? 'bg-primary' : 'bg-accent'}`}
                      >
                        <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${settings.ignore_ghost_clips ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border border-border bg-accent/20 p-3">
                        <div>
                          <span className="text-sm font-medium">{t('settings.clipboardSound')}</span>
                          <p className="text-xs text-muted-foreground">{t('settings.clipboardSoundDesc')}</p>
                        </div>
                        <button
                          onClick={() => updateSetting('clipboard_sound_enabled', !(settings.clipboard_sound_enabled ?? false))}
                          className={`h-6 w-11 rounded-full transition-colors ${(settings.clipboard_sound_enabled ?? false) ? 'bg-primary' : 'bg-accent'}`}
                        >
                          <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${(settings.clipboard_sound_enabled ?? false) ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      {(settings.clipboard_sound_enabled ?? false) && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={settings.clipboard_sound_path || ''}
                            onChange={(e) => updateSetting('clipboard_sound_path', e.target.value)}
                            placeholder="C:\path\to\sound.wav"
                            className="flex-1 bg-black/20 border border-white/5 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-cyan-500/50 transition-all"
                          />
                          <button
                            onClick={async () => {
                              try {
                                const path = await invoke<string>('pick_file', {
                                  filterName: 'Sound Files',
                                  extensions: ['wav', 'mp3'],
                                });
                                if (path) updateSetting('clipboard_sound_path', path);
                              } catch (e) {
                                if (e !== 'No file selected') console.error(e);
                              }
                            }}
                            className="btn btn-secondary text-xs flex-shrink-0"
                          >
                            {t('common.browse')}
                          </button>
                          <button
                            onClick={async () => {
                              if (settings.clipboard_sound_path) {
                                try {
                                  await invoke('play_clipboard_sound', { soundPath: settings.clipboard_sound_path });
                                } catch (e) {
                                  console.error('Sound preview failed:', e);
                                }
                              }
                            }}
                            disabled={!settings.clipboard_sound_path}
                            className="btn btn-secondary text-xs flex-shrink-0 disabled:opacity-50"
                            title="Preview sound"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-accent/20 p-3">
                      <div>
                        <span className="text-sm font-medium">{t('settings.autoPaste')}</span>
                        <p className="text-sm text-muted-foreground/80">{t('settings.autoPasteDesc')}</p>
                      </div>
                      <button
                        onClick={() => updateSetting('auto_paste', !settings.auto_paste)}
                        className={`h-6 w-11 rounded-full transition-colors ${settings.auto_paste ? 'bg-primary' : 'bg-accent'}`}
                      >
                        <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${settings.auto_paste ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-accent/20 p-3">
                      <div>
                        <span className="text-sm font-medium">{t('settings.autoInjectPaste')}</span>
                        <p className="text-sm text-muted-foreground/80">{t('settings.autoInjectPasteDesc')}</p>
                      </div>
                      <button
                        onClick={() => updateSetting('auto_inject_paste', !settings.auto_inject_paste)}
                        className={`h-6 w-11 rounded-full transition-colors ${settings.auto_inject_paste ? 'bg-primary' : 'bg-accent'}`}
                      >
                        <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${settings.auto_inject_paste ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-sm font-bold uppercase tracking-tight text-primary/70">External Image Editor</span>
                        <p className="text-xs text-muted-foreground">Path to your favorite editor (e.g., CyberViewer). Opens when editing image clips.</p>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={settings.image_editor_path || ''}
                          onChange={(e) => updateSetting('image_editor_path', e.target.value)}
                          placeholder="C:\Path\To\Editor.exe"
                          className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm transition-all focus:border-primary/50"
                        />
                        <button
                          onClick={async () => {
                            try {
                              const path = await invoke<string>('pick_file', {
                                filterName: 'Executables',
                                extensions: ['exe', 'app'],
                              });
                              if (path) updateSetting('image_editor_path', path);
                            } catch (e) {}
                          }}
                          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium hover:bg-accent/80 transition-all"
                        >
                          Browse
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Layout & Navigation */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400/80 flex items-center gap-2">
                      <Layout size={14} /> Layout & Navigation
                    </h3>
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-base font-medium">{t('settings.scrollDirection')}</span>
                        <p className="text-xs text-muted-foreground">{t('settings.scrollDirectionDesc')}</p>
                      </label>
                      <Select
                        value={settings.scroll_direction || 'horizontal'}
                        onChange={(val) => updateSetting('scroll_direction', val)}
                        options={[
                          { value: 'horizontal', label: t('settings.scrollHorizontal') },
                          { value: 'vertical', label: t('settings.scrollVertical') },
                        ]}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-base font-medium">{t('settings.compactFolderLayout')}</span>
                        <p className="text-xs text-muted-foreground">{t('settings.compactFolderLayoutDesc')}</p>
                      </label>
                      <Select
                        value={settings.compact_folder_layout || 'horizontal'}
                        onChange={(val) => updateSetting('compact_folder_layout', val)}
                        options={[
                          { value: 'horizontal', label: t('settings.scrollHorizontal') },
                          { value: 'vertical', label: t('settings.scrollVertical') },
                        ]}
                      />
                      {(settings.compact_folder_layout || 'horizontal') === 'vertical' && (
                        <div className="flex items-center justify-between rounded-lg border border-border bg-accent/20 p-3">
                          <div>
                            <span className="text-sm font-medium">{t('settings.compactSidebarCollapsed')}</span>
                            <p className="text-xs text-muted-foreground">{t('settings.compactSidebarCollapsedDesc')}</p>
                          </div>
                          <button
                            onClick={() => updateSetting('compact_sidebar_collapsed', !(settings.compact_sidebar_collapsed ?? false))}
                            className={`h-6 w-11 rounded-full transition-colors ${(settings.compact_sidebar_collapsed ?? false) ? 'bg-primary' : 'bg-accent'}`}
                          >
                            <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${(settings.compact_sidebar_collapsed ?? false) ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Shortcuts */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400/80 flex items-center gap-2">
                      <Command size={14} /> Shortcuts
                    </h3>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="block">
                          <span className="text-sm font-medium">{t('settings.hotkey')}</span>
                          <p className="text-xs text-muted-foreground">{t('settings.hotkeyDesc')}</p>
                        </label>
                        {recordingTarget === 'hotkey' ? (
                          <div className="space-y-2">
                            <div className="flex w-full items-center gap-2 rounded-lg border border-primary bg-input px-3 py-2 text-sm ring-2 ring-primary">
                              <span className="animate-pulse text-primary font-mono">
                                {shortcut.length > 0
                                  ? formatHotkey(shortcut)
                                  : savedShortcut.length > 0
                                    ? formatHotkey(savedShortcut)
                                    : t('settings.hotkeyRecording')}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveHotkey}
                                disabled={savedShortcut.length === 0}
                                className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50"
                              >
                                {t('common.save')}
                              </button>
                              <button
                                onClick={handleCancelRecording}
                                className="rounded bg-muted px-3 py-1 text-xs text-muted-foreground"
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartRecording('hotkey')}
                            className="flex w-full items-center gap-2 rounded-lg border border-border bg-input px-3 py-2 text-sm transition-colors hover:border-primary group"
                          >
                            <span className="rounded bg-accent px-2 py-0.5 font-mono text-xs font-medium group-hover:text-primary transition-colors">
                              {settings.hotkey}
                            </span>
                            <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto italic">
                              {t('settings.hotkeyPlaceholder')}
                            </span>
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <label className="block">
                          <span className="text-sm font-medium">{t('settings.viewModeHotkey')}</span>
                          <p className="text-xs text-muted-foreground">{t('settings.viewModeHotkeyDesc')}</p>
                        </label>
                        {recordingTarget === 'view_mode_hotkey' ? (
                          <div className="space-y-2">
                            <div className="flex w-full items-center gap-2 rounded-lg border border-primary bg-input px-3 py-2 text-sm ring-2 ring-primary">
                              <span className="animate-pulse text-primary font-mono">
                                {shortcut.length > 0
                                  ? formatHotkey(shortcut)
                                  : savedShortcut.length > 0
                                    ? formatHotkey(savedShortcut)
                                    : t('settings.hotkeyRecording')}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveHotkey}
                                disabled={savedShortcut.length === 0}
                                className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50"
                              >
                                {t('common.save')}
                              </button>
                              <button
                                onClick={handleCancelRecording}
                                className="rounded bg-muted px-3 py-1 text-xs text-muted-foreground"
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartRecording('view_mode_hotkey')}
                            className="flex w-full items-center gap-2 rounded-lg border border-border bg-input px-3 py-2 text-sm transition-colors hover:border-primary group"
                          >
                            <span className="rounded bg-accent px-2 py-0.5 font-mono text-xs font-medium group-hover:text-primary transition-colors">
                              {settings.view_mode_hotkey || 'Ctrl+M'}
                            </span>
                            <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto italic">
                              {t('settings.hotkeyPlaceholder')}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Privacy */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400/80 flex items-center gap-2">
                      <Lock size={14} /> Privacy
                    </h3>
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-sm font-medium">{t('settings.ignoredApps')}</span>
                        <p className="text-sm text-muted-foreground/80">{t('settings.ignoredAppsDesc')}</p>
                      </label>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newIgnoredApp}
                          onChange={(e) => setNewIgnoredApp(e.target.value)}
                          placeholder={'e.g. notepad.exe'}
                          className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddIgnoredApp()}
                        />
                        <button
                          onClick={handleBrowseFile}
                          className="btn btn-secondary px-3"
                          title="Browse executable"
                        >
                          <FolderOpen size={16} />
                        </button>
                        <button
                          onClick={handleAddIgnoredApp}
                          disabled={!newIgnoredApp.trim()}
                          className="btn btn-secondary px-3"
                          title="Add to list"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                        {ignoredApps.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-border p-4 text-center">
                            <p className="text-sm text-muted-foreground/80">
                              {t('settings.noIgnoredApps')}
                            </p>
                          </div>
                        ) : (
                          ignoredApps.map((app) => (
                            <div
                              key={app}
                              className="group flex items-center justify-between rounded-md border border-transparent bg-accent/30 px-3 py-2 text-sm hover:border-border hover:bg-accent/50"
                            >
                              <span className="font-mono text-xs">{app}</span>
                              <button
                                onClick={() => handleRemoveIgnoredApp(app)}
                                className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Data Management */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400/80 flex items-center gap-2">
                      <Database size={14} /> Data Management
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={confirmClearHistory}
                        className="btn border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20"
                      >
                        <Trash2 size={16} className="mr-2" />
                        {t('settings.clearHistory')}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const count = await invoke<number>('remove_duplicate_clips');
                            toast.success(t('settings.removeDuplicatesSuccess', { count }));
                            const newSize = await invoke<number>('get_clipboard_history_size');
                            setHistorySize(newSize);
                          } catch (error) {
                            console.error(error);
                            toast.error(`Failed to remove duplicates: ${error}`);
                          }
                        }}
                        className="btn btn-secondary text-xs"
                      >
                        {t('settings.removeDuplicates')}
                      </button>
                    </div>
                  </section>

                  {/* Panic Room */}
                  <section className="space-y-4 pt-4 border-t border-border/30">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-rose-500/80 flex items-center gap-2">
                      <Flame size={14} /> Panic Room
                    </h3>
                    <div className="flex flex-col gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
                      <p className="text-xs text-muted-foreground">
                        If the window becomes deformed, off-screen, or behaves erratically, use this to restore all layout and visibility settings to factory defaults.
                      </p>
                      <button
                        onClick={handleResetLayout}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                      >
                        <RotateCcw size={16} />
                        Reset Layout & Visibility
                      </button>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-sm font-medium text-primary/80">
                      Backup & Restore
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={async () => {
                          const id = toast.loading("Generating backup...");
                          try {
                            await invoke('export_backup_to_file');
                            toast.success("Backup saved successfully", { id });
                          } catch (error) {
                            if (error === "Export cancelled") {
                                toast.dismiss(id);
                            } else {
                                toast.error(`Export failed: ${error}`, { id });
                            }
                          }
                        }}
                        className="btn border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        <FolderOpen size={16} className="mr-2" />
                        Export Backup (JSON)
                      </button>

                      <button
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: "Import Backup?",
                             message: "This will REPLACE all current clips, folders, images, and settings with the backup data. Your current data will be lost. Export a backup first if you want to keep it.",
                            action: async () => {
                              const id = toast.loading("Restoring backup...");
                              try {
                                await invoke('import_backup_from_file');
                                toast.success("Restore complete! CyberPaste has been updated.", { id });
                                // Force reload to see changes
                                setTimeout(() => window.location.reload(), 1500);
                              } catch (error) {
                                if (error === "Import cancelled") {
                                    toast.dismiss(id);
                                } else {
                                    toast.error(`Import failed: ${error}`, { id });
                                }
                              }
                            },
                          });
                        }}
                        className="btn border border-orange-500/20 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                      >
                        <Plus size={16} className="mr-2" />
                        Import Backup
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                       * Export saves all clips, images, folders, and settings. Import replaces everything with the backup data.
                    </p>
                  </section>
                </>
              )}

              {/* --- AI PROCESSING TAB --- */}
              {activeTab === 'ai' && (
                <>
                  <section className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {t('settings.aiConfiguration')}
                    </h3>

                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-sm font-medium">{t('settings.provider')}</span>
                      </label>
                      <Select
                        value={settings.ai_provider || 'openai'}
                        onChange={(newProvider) => {
                          const updates: Partial<Settings> = { ai_provider: newProvider };

                          // Auto-fill Base URL and Model based on provider
                          if (newProvider === 'openai') {
                            updates.ai_base_url = 'https://api.openai.com/v1';
                            setLocalBaseUrl('https://api.openai.com/v1');
                          } else if (newProvider === 'deepseek') {
                            updates.ai_base_url = 'https://api.deepseek.com';
                            updates.ai_model = 'deepseek-chat';
                            setLocalBaseUrl('https://api.deepseek.com');
                            setLocalModel('deepseek-chat');
                          }

                          updateSettings(updates);
                        }}
                        options={[
                          { value: 'openai', label: t('settings.providerOpenAI') },
                          { value: 'deepseek', label: t('settings.providerDeepSeek') },
                          { value: 'custom', label: t('settings.providerCustom') },
                        ]}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-sm font-medium">{t('settings.apiKey')}</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={localApiKey}
                          onChange={(e) => setLocalApiKey(e.target.value)}
                          onBlur={() => updateSetting('ai_api_key', localApiKey)}
                          placeholder="sk-..."
                          className="w-full rounded-lg border border-border bg-input py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-sm font-medium">{t('settings.model')}</span>
                      </label>
                      <input
                        type="text"
                        value={localModel}
                        onChange={(e) => setLocalModel(e.target.value)}
                        onBlur={() => updateSetting('ai_model', localModel)}
                        placeholder="gpt-4o, deepseek-chat, etc."
                        className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-sm font-medium">{t('settings.baseUrl')}</span>
                      </label>
                      <input
                        type="text"
                        value={localBaseUrl}
                        onChange={(e) => setLocalBaseUrl(e.target.value)}
                        onBlur={() => updateSetting('ai_base_url', localBaseUrl)}
                        placeholder="https://api.openai.com/v1"
                        className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </section>

                  <section className="space-y-4 border-t border-border/50 pt-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {t('settings.customPrompts')}
                    </h3>
                    <p className="text-xs italic text-muted-foreground">
                      {t('settings.customPromptsDesc')}
                    </p>

                    <div className="space-y-4">
                      <PromptEditor
                        label={t('settings.aiSummarize')}
                        value={settings.ai_prompt_summarize || ''}
                        titleValue={settings.ai_title_summarize}
                        onSave={(val) => updateSetting('ai_prompt_summarize', val)}
                        onSaveTitle={(val) => updateSetting('ai_title_summarize', val)}
                        placeholder={t('settings.aiSummarizePlaceholder')}
                      />

                      <PromptEditor
                        label={t('settings.aiTranslate')}
                        value={settings.ai_prompt_translate || ''}
                        titleValue={settings.ai_title_translate}
                        onSave={(val) => updateSetting('ai_prompt_translate', val)}
                        onSaveTitle={(val) => updateSetting('ai_title_translate', val)}
                        placeholder={t('settings.aiTranslatePlaceholder')}
                      />

                      <PromptEditor
                        label={t('settings.aiExplainCode')}
                        value={settings.ai_prompt_explain_code || ''}
                        titleValue={settings.ai_title_explain_code}
                        onSave={(val) => updateSetting('ai_prompt_explain_code', val)}
                        onSaveTitle={(val) => updateSetting('ai_title_explain_code', val)}
                        placeholder={t('settings.aiExplainCodePlaceholder')}
                      />

                      <PromptEditor
                        label={t('settings.aiFixGrammar')}
                        value={settings.ai_prompt_fix_grammar || ''}
                        titleValue={settings.ai_title_fix_grammar}
                        onSave={(val) => updateSetting('ai_prompt_fix_grammar', val)}
                        onSaveTitle={(val) => updateSetting('ai_title_fix_grammar', val)}
                        placeholder={t('settings.aiFixGrammarPlaceholder')}
                      />
                    </div>
                  </section>
                </>
              )}

              {/* --- FOLDERS TAB --- */}
              {activeTab === 'folders' && (
                <section className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t('settings.manageFolders')}
                  </h3>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder={t('settings.newFolderPlaceholder')}
                      className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    />
                    <button
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim()}
                      className="btn btn-secondary px-3"
                    >
                      <Plus size={16} className="mr-1" />
                      {t('settings.add')}
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {folders.filter((f) => !f.is_system).length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border py-4 text-center text-xs text-muted-foreground">
                        {t('settings.noFolders')}
                      </p>
                    ) : (
                      folders
                        .filter((f) => !f.is_system)
                        .map((folder) => (
                          <div
                            key={folder.id}
                            className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                          >
                            {editingFolderId === folder.id ? (
                              <div className="flex flex-1 items-center gap-2">
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveRenameFolder();
                                    if (e.key === 'Escape') setEditingFolderId(null);
                                  }}
                                />
                                <button
                                  onClick={saveRenameFolder}
                                  className="text-xs text-primary hover:underline"
                                >
                                  {t('common.save')}
                                </button>
                                <button
                                  onClick={() => setEditingFolderId(null)}
                                  className="text-xs text-muted-foreground hover:underline"
                                >
                                  {t('common.cancel')}
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-3">
                                  <FolderIcon size={16} className="text-blue-400" />
                                  <span className="text-sm font-medium">{folder.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({folder.item_count} items)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => startRenameFolder(folder)}
                                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                    title="Rename"
                                  >
                                    <MoreHorizontal size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFolder(folder.id)}
                                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </section>
              )}

              {/* --- ABOUT TAB --- */}
              {activeTab === 'about' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col items-center text-center space-y-4 py-6">
                    <div className="w-32 h-32 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_40px_rgba(var(--primary-rgb),0.15)] overflow-hidden">
                      <img src="/logo.png" alt="CyberPaste Logo" className="w-28 h-28 object-contain animate-in fade-in zoom-in duration-1000" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight">CyberPaste</h3>
                      <p className="text-muted-foreground">Version {appVersion || '1.0.1'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="rounded-xl border border-border bg-card/30 p-6 space-y-4">
                      <div className="flex items-center gap-3 text-primary">
                        <Terminal size={20} />
                        <h4 className="font-semibold uppercase tracking-wider text-sm">System & Debug</h4>
                      </div>
                      <p className="text-sm text-muted-foreground/80 leading-relaxed">
                        Access internal tools and data storage. Useful for advanced troubleshooting or manual backups.
                      </p>
                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          onClick={openDataDir}
                          className="flex items-center gap-2 rounded-lg bg-accent/50 px-4 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-foreground"
                        >
                          <FolderOpen size={16} />
                          Data Directory
                        </button>
                        <button
                          onClick={openConsole}
                          className="flex items-center gap-2 rounded-lg bg-accent/50 px-4 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-foreground"
                        >
                          <Terminal size={16} />
                          Developer Console
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card/30 p-6 space-y-4">
                      <div className="flex items-center gap-3 text-primary">
                        <Heart size={20} />
                        <h4 className="font-semibold uppercase tracking-wider text-sm">Open Source</h4>
                      </div>
                      <p className="text-sm text-muted-foreground/80 leading-relaxed">
                        CyberPaste is built with passion and open-source technologies like Rust, Tauri, and React.
                      </p>
                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          onClick={() => openUrl('https://github.com/Ciber-CR/CyberPaste').catch(console.error)}
                          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-all hover:bg-accent"
                        >
                          <ExternalLink size={16} />
                          GitHub Repository
                        </button>
                        <button
                          onClick={() => openUrl('https://github.com/Ciber-CR/CyberPaste/blob/main/LICENSE').catch(console.error)}
                          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-all hover:bg-accent"
                        >
                          <Info size={16} />
                          License (GPL-3.0)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Debug Tools — dev build only */}
        {import.meta.env.DEV && (
          <div className="border-t border-border px-4 py-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Debug</p>
            <div className="flex gap-2">
              <button
                onClick={() => emit('load-demo-data')}
                className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <FlaskConical size={12} />
                Load 20 demo clips
              </button>
              <button
                onClick={() => emit('restore-actual-data')}
                className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              >
                Restore actual data
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col items-center gap-1 border-t border-border bg-background px-4 py-3 text-center">
          <button
            onClick={() => openUrl('https://github.com/Ciber-CR/CyberPaste').catch(console.error)}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            CyberPaste {appVersion || '...'}
          </button>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <a href="https://cyberpaste.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">© 2026 CyberPaste</a>
            <span>•</span>
            <button onClick={handleCheckUpdate} className="underline hover:text-foreground">
              {t('settings.checkForUpdates')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
