# Onedrive Upload Manager — Design Document v1.1

> 版本：v1.1 | 日期：2026-03-29 | 状态：正式版
> 变更：Bug Fix（FileRow 操作菜单）+ 主页卡片拖拽视觉增强

---

## 变更摘要

### Bug Fix: FileRow 操作菜单缺失

**问题**：`FileRow.tsx` 只有图标+名称，没有任何操作按钮，删除/下载/重命名均无法从界面触发。

**修复**：
- 创建 `FileActions.tsx` 组件（⋮ 下拉菜单）
- `FileRow.tsx` 新增 `onDownload`、`onDelete`、`onRename` props
- `FileTable.tsx` 向下传递 handler
- 删除：`window.confirm()` 确认弹窗
- 重命名：行内 `<input>` 编辑，回车确认，Esc 取消

### 增强: 主页卡片拖拽视觉优化

**当前**：`isDragActive` 仅图标区域有遮罩，不够明显。

**优化后**：
- 整张卡片：`border-primary` + `bg-primary/5` + `scale-[1.02]` + `shadow-lg`
- 上传图标：`absolute inset-0` 全卡片覆盖，`animate-pulse`

---

## 技术细节

### FileActions 组件

```tsx
interface FileActionsProps {
  item: DriveItem;
  onDownload?: (item: DriveItem) => void;
  onDelete?: (item: DriveItem) => void;
  onRename?: (item: DriveItem, newName: string) => void;
}
```

- 状态：`isOpen`（菜单开闭）、`isRenaming`（重命名态）、`newName`（输入值）
- 点击外部自动关闭菜单（`useRef` + `mousedown` 事件）
- 重命名态时：隐藏菜单，显示行内 `<input>` + ✓/✗ 按钮

### FolderCard 拖拽优化

```tsx
// getRootProps() 放在外层 div，getInputProps() 隐藏
<div {...getRootProps()}>
  <input {...getInputProps()} />
  <div onClick={onClick} className={`card ... ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg' : ''}`}>
    {/* 图标区域：拖拽时全卡片浮现上传图标 */}
    {isDragActive && (
      <div className="absolute inset-0 bg-primary/10 rounded-2xl flex items-center justify-center animate-pulse">
        <Upload className="w-10 h-10 text-primary scale-110" />
      </div>
    )}
  </div>
</div>
```

---

*本文档为 v1.1 增量变更，v1.0 设计文档中未变更部分继续有效。*
