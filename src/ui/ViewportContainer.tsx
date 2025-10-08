import { ReactNode } from 'react';
import type { LayoutState, SidebarId } from './layout-types';
import { SidebarPanel } from './SidebarPanel';
import './ViewportContainer.css';

export interface ViewportContainerProps {
  layout: LayoutState;
  onSidebarPositionChange: (id: SidebarId, position: 'left' | 'right' | 'closed') => void;
  sidebarContent: Record<SidebarId, ReactNode>;
  viewportContent: ReactNode;
  footerContent: ReactNode;
}

/**
 * Main layout container that manages sidebar positioning and viewport responsiveness
 */
export function ViewportContainer({
  layout,
  onSidebarPositionChange,
  sidebarContent,
  viewportContent,
  footerContent,
}: ViewportContainerProps) {
  // Group sidebars by position
  const leftSidebars = Object.values(layout.sidebars).filter((s) => s.position === 'left');
  const rightSidebars = Object.values(layout.sidebars).filter((s) => s.position === 'right');

  const handleSidebarClose = (id: SidebarId) => {
    onSidebarPositionChange(id, 'closed');
  };

  const handleSidebarMoveToLeft = (id: SidebarId) => {
    onSidebarPositionChange(id, 'left');
  };

  const handleSidebarMoveToRight = (id: SidebarId) => {
    onSidebarPositionChange(id, 'right');
  };

  return (
    <div className="viewport-container">
      <div className="viewport-main-area">
        {/* Left sidebars */}
        {leftSidebars.length > 0 && (
          <div className="viewport-left-sidebars">
            {leftSidebars.map((sidebar) => (
              <SidebarPanel
                key={sidebar.id}
                id={sidebar.id}
                title={sidebar.title}
                position={sidebar.position}
                width={sidebar.width}
                onClose={() => handleSidebarClose(sidebar.id)}
                onMoveToLeft={() => handleSidebarMoveToLeft(sidebar.id)}
                onMoveToRight={() => handleSidebarMoveToRight(sidebar.id)}
              >
                {sidebarContent[sidebar.id]}
              </SidebarPanel>
            ))}
          </div>
        )}

        {/* Main viewport */}
        <div className="viewport-center">
          {viewportContent}
        </div>

        {/* Right sidebars */}
        {rightSidebars.length > 0 && (
          <div className="viewport-right-sidebars">
            {rightSidebars.map((sidebar) => (
              <SidebarPanel
                key={sidebar.id}
                id={sidebar.id}
                title={sidebar.title}
                position={sidebar.position}
                width={sidebar.width}
                onClose={() => handleSidebarClose(sidebar.id)}
                onMoveToLeft={() => handleSidebarMoveToLeft(sidebar.id)}
                onMoveToRight={() => handleSidebarMoveToRight(sidebar.id)}
              >
                {sidebarContent[sidebar.id]}
              </SidebarPanel>
            ))}
          </div>
        )}
      </div>

      {/* Footer (Timeline) */}
      {layout.footerVisible && (
        <div className="viewport-footer" style={{ height: `${layout.footerHeight}px` }}>
          {footerContent}
        </div>
      )}
    </div>
  );
}
