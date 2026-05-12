import React, { useEffect, useRef, useState, useCallback } from 'react';
// @ts-ignore
import { Grid, GridImperativeAPI, CellComponentProps } from 'react-window';
import { ClipCard } from './ClipCard';
import { ClipboardItem } from '../types';
import { LAYOUT, COLUMN_WIDTH } from '../constants';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

interface ClipListProps {
  clips: ClipboardItem[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onPaste: (id: string) => void;
  onCopy: (id: string) => void;
  onDragStart: (clipId: string, startX: number, startY: number) => void;
  selectedClipId: string | null;
  onCardContextMenu?: (e: React.MouseEvent, id: string) => void;
  resetToken?: number;
  viewMode?: 'full' | 'compact';
  scrollDirection?: 'horizontal' | 'vertical';
}

export const ClipList: React.FC<ClipListProps> = ({
  clips,
  isLoading,
  onLoadMore,
  onPaste,
  onCopy,
  onDragStart,
  selectedClipId,
  onCardContextMenu,
  resetToken = 0,
  scrollDirection = 'horizontal',
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);
  const gridRef = useRef<GridImperativeAPI>(null);

  const isVertical = scrollDirection === 'vertical';

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Force 6 columns in vertical mode if enough space, or calculate precisely
  const columnCount = isVertical
    ? 6 
    : clips.length;

  const rowCount = isVertical
    ? Math.ceil(clips.length / columnCount)
    : 1;

  const selectedClipIndex = clips.findIndex((c) => c.id === selectedClipId);

  useEffect(() => {
    if (gridRef.current && selectedClipIndex >= 0) {
      if (isVertical) {
        const rowIndex = Math.floor(selectedClipIndex / columnCount);
        gridRef.current.scrollToCell({
          rowIndex,
          columnIndex: selectedClipIndex % columnCount,
          rowAlign: 'smart',
        });
      } else {
        gridRef.current.scrollToCell({
          columnIndex: selectedClipIndex,
          rowIndex: 0,
          columnAlign: 'smart',
        });
      }
    }
  }, [selectedClipIndex, isVertical, columnCount]);

  // Smooth Scroll State
  const scrollTarget = useRef(0);
  const scrollCurrent = useRef(0);
  const rafId = useRef<number | null>(null);

  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  const animate = useCallback(() => {
    const element = gridRef.current?.element;
    if (!element) return;

    const diff = Math.abs(scrollTarget.current - scrollCurrent.current);
    
    if (diff > 0.5) {
      scrollCurrent.current = lerp(scrollCurrent.current, scrollTarget.current, 0.2);
      if (isVertical) {
        element.scrollTop = scrollCurrent.current;
      } else {
        element.scrollLeft = scrollCurrent.current;
      }
      rafId.current = requestAnimationFrame(animate);
    } else {
      scrollCurrent.current = scrollTarget.current;
      if (isVertical) {
        element.scrollTop = scrollCurrent.current;
      } else {
        element.scrollLeft = scrollCurrent.current;
      }
      rafId.current = null;
    }
  }, [isVertical]);

  useEffect(() => {
    // Reset scroll on view change or refresh
    scrollTarget.current = 0;
    scrollCurrent.current = 0;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = null;
  }, [resetToken, isVertical]);

  // Prevent rapid-fire scroll triggers
  const lastScrollTime = useRef(0);

  const handleWheel = (e: React.WheelEvent) => {
    const element = gridRef.current?.element;
    if (!element) return;

    e.preventDefault();
    
    // Cooldown to ensure snappy one-at-a-time feel
    const now = Date.now();
    if (now - lastScrollTime.current < 150) return;
    
    const delta = e.deltaY;
    if (Math.abs(delta) < 5) return; // Ignore micro-scrolls

    const maxScroll = isVertical 
      ? element.scrollHeight - element.clientHeight 
      : element.scrollWidth - element.clientWidth;

    const snapSize = isVertical ? 230 : COLUMN_WIDTH;

    // Sync current scroll
    const currentActual = isVertical ? element.scrollTop : element.scrollLeft;
    if (Math.abs(currentActual - scrollCurrent.current) > 10) {
        scrollCurrent.current = currentActual;
        scrollTarget.current = currentActual;
    }

    if (delta > 0) {
      // Snap to next
      scrollTarget.current = Math.min(maxScroll, Math.ceil((scrollCurrent.current + 5) / snapSize) * snapSize);
    } else {
      // Snap to previous
      scrollTarget.current = Math.max(0, Math.floor((scrollCurrent.current - 5) / snapSize) * snapSize);
    }
    
    lastScrollTime.current = now;
    
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(animate);
    }
  };

  const handleCellsRendered = (visibleCells: any) => {
    const lastIndex = isVertical ? visibleCells.rowStopIndex * columnCount : visibleCells.columnStopIndex;
    if (lastIndex >= clips.length - (isVertical ? columnCount * 2 : 2)) {
      onLoadMore();
    }
  };

  const SIDE_PADDING = 16; // Align with search and close buttons

  const Cell = ({ columnIndex, rowIndex, style }: CellComponentProps) => {
    const index = isVertical ? rowIndex * columnCount + columnIndex : columnIndex;
    const clip = clips[index];
    if (!clip) return null;

    // Calculate dynamic padding/width to ensure 6 columns fit perfectly with side padding
    const usableWidth = containerWidth - SIDE_PADDING;
    const cellWidth = isVertical ? (usableWidth / columnCount) : style.width;

    const calculatedStyle = {
        ...style,
        left: isVertical ? (style.left as number) + (SIDE_PADDING / 2) : style.left,
        width: cellWidth,
    };

    return (
      <div data-el="clip-cell" data-clip-id={clip.id} style={calculatedStyle} className={clsx(
        "flex items-center justify-center px-2",
        isVertical ? "py-3" : "h-full"
      )}>
        <ClipCard
          clip={clip}
          isSelected={selectedClipId === clip.id}
          onPaste={() => onPaste(clip.id)}
          onCopy={() => onCopy(clip.id)}
          onDragStart={onDragStart}
          onContextMenu={(e: React.MouseEvent) => onCardContextMenu?.(e, clip.id)}
        />
      </div>
    );
  };

  if (isLoading && clips.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">{t('clipList.loadingClips')}</p>
        </div>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-400">{t('clipList.empty')}</h3>
        <p className="max-w-xs text-sm text-gray-500">{t('clipList.emptyDesc')}</p>
      </div>
    );
  }

  const gridHeight = isVertical ? (LAYOUT.WINDOW_HEIGHT - LAYOUT.CONTROL_BAR_HEIGHT) : 240;

  return (
    <div ref={containerRef} className="h-full w-full flex-1 overflow-hidden">
      <Grid
        data-el="clip-list"
        cellComponent={Cell}
        cellProps={{}}
        className="no-scrollbar"
        style={{
          height: gridHeight,
          width: containerWidth,
          scrollBehavior: 'auto',
          position: 'relative',
          overflow: 'hidden'
        }}
        defaultHeight={gridHeight}
        defaultWidth={containerWidth}
        gridRef={gridRef}
        rowCount={rowCount}
        rowHeight={isVertical ? 230 : 180}
        columnCount={columnCount}
        columnWidth={isVertical ? ((containerWidth - SIDE_PADDING) / columnCount) : COLUMN_WIDTH}
        overscanCount={4}
        onCellsRendered={handleCellsRendered}
        onWheel={handleWheel}
      />
    </div>
  );
}
