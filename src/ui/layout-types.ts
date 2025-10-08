/**
 * Layout system types for sidebar management
 */

export type SidebarPosition = 'left' | 'right' | 'closed';

export type SidebarId = 'functions' | 'parameters' | 'keyframes' | 'visual-settings';

export interface SidebarConfig {
  id: SidebarId;
  title: string;
  position: SidebarPosition;
  width: number; // in pixels
  minWidth: number;
  maxWidth: number;
  defaultPosition: SidebarPosition;
}

export interface LayoutState {
  sidebars: Record<SidebarId, SidebarConfig>;
  footerVisible: boolean;
  footerHeight: number;
}

export interface ViewportDimensions {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}
