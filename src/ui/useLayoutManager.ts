import { useState, useCallback, useEffect } from 'react';
import type { LayoutState, SidebarId, SidebarPosition, ViewportDimensions } from './layout-types';

const LAYOUT_STORAGE_KEY = 'parametric-keyframe-studio-layout';

const DEFAULT_LAYOUT: LayoutState = {
  sidebars: {
    parameters: {
      id: 'parameters',
      title: 'Parameters',
      position: 'left',
      width: 350,
      minWidth: 250,
      maxWidth: 600,
      defaultPosition: 'left',
    },
    functions: {
      id: 'functions',
      title: 'Functions',
      position: 'closed',
      width: 350,
      minWidth: 250,
      maxWidth: 600,
      defaultPosition: 'left',
    },
    keyframes: {
      id: 'keyframes',
      title: 'Keyframe Manager',
      position: 'closed',
      width: 350,
      minWidth: 250,
      maxWidth: 600,
      defaultPosition: 'right',
    },
    'visual-settings': {
      id: 'visual-settings',
      title: 'Visual Settings',
      position: 'right',
      width: 350,
      minWidth: 250,
      maxWidth: 600,
      defaultPosition: 'right',
    },
  },
  footerVisible: true,
  footerHeight: 200,
};

export function useLayoutManager() {
  const [layout, setLayout] = useState<LayoutState>(() => {
    // Try to load from localStorage
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as LayoutState;
      } catch (e) {
        console.warn('Failed to parse stored layout, using default');
      }
    }
    return DEFAULT_LAYOUT;
  });

  // Save to localStorage whenever layout changes
  useEffect(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const setSidebarPosition = useCallback((id: SidebarId, position: SidebarPosition) => {
    setLayout((prev) => ({
      ...prev,
      sidebars: {
        ...prev.sidebars,
        [id]: {
          ...prev.sidebars[id],
          position,
        },
      },
    }));
  }, []);

  const setSidebarWidth = useCallback((id: SidebarId, width: number) => {
    setLayout((prev) => {
      const sidebar = prev.sidebars[id];
      const clampedWidth = Math.max(sidebar.minWidth, Math.min(sidebar.maxWidth, width));

      return {
        ...prev,
        sidebars: {
          ...prev.sidebars,
          [id]: {
            ...sidebar,
            width: clampedWidth,
          },
        },
      };
    });
  }, []);

  const toggleFooter = useCallback(() => {
    setLayout((prev) => ({
      ...prev,
      footerVisible: !prev.footerVisible,
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
  }, []);

  // Calculate viewport dimensions based on sidebar positions
  const getViewportDimensions = useCallback((): ViewportDimensions => {
    let left = 0;
    let right = 0;

    Object.values(layout.sidebars).forEach((sidebar) => {
      if (sidebar.position === 'left') {
        left += sidebar.width;
      } else if (sidebar.position === 'right') {
        right += sidebar.width;
      }
    });

    const bottom = layout.footerVisible ? layout.footerHeight : 0;

    return {
      left,
      right,
      top: 0,
      bottom,
      width: window.innerWidth - left - right,
      height: window.innerHeight - bottom - 80, // 80px for header
    };
  }, [layout]);

  return {
    layout,
    setSidebarPosition,
    setSidebarWidth,
    toggleFooter,
    resetLayout,
    getViewportDimensions,
  };
}
