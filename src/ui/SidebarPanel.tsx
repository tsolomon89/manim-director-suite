import React, { ReactNode } from 'react';
import type { SidebarPosition } from './layout-types';
import './SidebarPanel.css';

export interface SidebarPanelProps {
  id: string;
  title: string;
  position: SidebarPosition;
  width: number;
  children: ReactNode;
  onClose: () => void;
  onMoveToLeft: () => void;
  onMoveToRight: () => void;
}

/**
 * Reusable sidebar panel component with positioning controls
 */
export function SidebarPanel({
  id,
  title,
  position,
  width,
  children,
  onClose,
  onMoveToLeft,
  onMoveToRight,
}: SidebarPanelProps) {
  if (position === 'closed') {
    return null;
  }

  return (
    <aside
      className={`sidebar-panel sidebar-${position}`}
      style={{ width: `${width}px` }}
      data-sidebar-id={id}
    >
      <div className="sidebar-header">
        <h3 className="sidebar-title">{title}</h3>
        <div className="sidebar-controls">
          <button
            className="sidebar-control-btn"
            onClick={onMoveToLeft}
            title="Move to left"
            disabled={position === 'left'}
          >
            ⬅
          </button>
          <button
            className="sidebar-control-btn"
            onClick={onMoveToRight}
            title="Move to right"
            disabled={position === 'right'}
          >
            ➡
          </button>
          <button
            className="sidebar-control-btn sidebar-close-btn"
            onClick={onClose}
            title="Close panel"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="sidebar-content">
        {children}
      </div>
    </aside>
  );
}
