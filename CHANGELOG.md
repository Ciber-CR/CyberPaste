# Changelog

All notable changes to CyberPaste will be documented in this file.

## v1.0.0

### Added
- **Dynamic Identity**: Support for custom icons and colors for folders, persisted in the database.
- **Cyber Search**: New overlay search bar with "Searching in [Folder]" context and smooth transitions.
- **Snap Scrolling**: "Silicon Valley" touch magnetic scroll for the clip list with high-precision alignment.
- **Neon Aesthetic**: Refined vibrant neon styles for buttons and minimalist frames for folder tabs.
- **Stability**: Debounced window auto-hide and multi-monitor support refinement.

### 新增
- **动态识别**: 支持文件夹自定义图标和颜色，并持久化保存至数据库。
- **赛博搜索**: 全新的覆盖式搜索栏，支持“正在搜索 [文件夹]”上下文及平滑过渡。
- **吸附滚动**: 剪贴板列表实现“硅谷级”磁性滚动，具有高精度对齐效果。
- **霓虹美学**: 优化了按钮的霓虹视觉效果，以及文件夹选项卡的极简框架设计。
- **稳定性**: 优化了窗口自动隐藏的防抖逻辑及多显示器支持。


## v1.3.7

### Added
- German, French, and Japanese language support

### Improved
- Winget release pipeline: hash verification step added before publishing to winget-pkgs to prevent stale-hash mismatches; release tag now explicitly pinned

### 新增
- 新增德语、法语、日语语言支持

### 优化
- Winget 发布流程：在发布至 winget-pkgs 前增加哈希值校验步骤，防止哈希不匹配问题；发布时明确指定 release tag

## v1.3.6

### Added
- Support floating window above the taskbar (toggle in Settings)
- Every release is now automatically scanned with VirusTotal (70+ antivirus engines) — scan results are linked in the release notes

### 新增
- 窗口支持浮动在任务栏上层（可在设置中开启/关闭）
- 每次发布版本现在会自动通过 VirusTotal（70+ 款杀毒引擎）进行安全扫描，扫描结果链接附在 Release 说明中

## v1.3.5

### Added
- Native rounded corners support for all window effects (Mica, Mica Alt, Clear) using Windows 11 DWM — toggle on/off in Settings

### Fixed
- Fixed TypeScript build error caused by missing Vite client types (`import.meta.env`)

### 新增
- 所有窗口效果（Mica、Mica Alt、Clear）均支持原生圆角，通过 Windows 11 DWM 实现，可在设置中开启/关闭

### 修复
- 修复因缺少 Vite 客户端类型导致的 TypeScript 构建错误（`import.meta.env`）

## v1.3.4

### Added
- Brand new native style look with Windows Mica and Mica-Alt window effects for a seamless, beautiful appearance that blends with your desktop

### 新增
- 全新原生风格外观，支持 Windows Mica 和 Mica-Alt 窗口效果，与桌面完美融合，带来更精美的视觉体验

## v1.3.3

### Changed
- Refined UI layout: reduced window height, tightened card spacing, fixed control bar height, and removed CSS shadow in Clear window effect mode

### 变更
- 优化界面布局：减小窗口高度、收紧卡片间距、固定控制栏高度，并在"无效果"窗口模式下移除 CSS 阴影

## v1.3.2

### Fixed
- Fixed hotkey toggle broken after changing hotkey in settings (issue #6)
- Fixed winget package missing arm64 installer by switching to NSIS setup.exe for architecture detection (issue #7)

## v1.3.1

### Fixed
- Removed white/alpha border around settings window in dark mode

