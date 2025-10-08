import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { SidebarId } from './layout-types';
import './Toolbar.css';

export interface ToolbarProps {
  projectName: string;
  onSave: () => void;
  onLoad: () => void;
  onImport: () => void;
  onExportPNG: () => void;
  onExportManim: () => void;
  onToggleSidebar: (id: SidebarId) => void;
  onToggleFooter: () => void;
  sidebarStates: Record<SidebarId, boolean>; // true if visible
  footerVisible: boolean;
}

type MenuId = 'file' | 'edit' | 'view' | 'run' | null;

/**
 * Professional toolbar with dropdown menus (VS Code style)
 */
export function Toolbar({
  projectName,
  onSave,
  onLoad,
  onImport,
  onExportPNG,
  onExportManim,
  onToggleSidebar,
  onToggleFooter,
  sidebarStates,
  footerVisible,
}: ToolbarProps) {
  const [activeMenu, setActiveMenu] = useState<MenuId>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeMenu]);

  const handleMenuClick = (menuId: MenuId) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <h1 className="toolbar-title">{projectName}</h1>
        <nav className="toolbar-menu" ref={menuRef}>
          {/* File Menu */}
          <div className="toolbar-menu-item">
            <button
              className={`toolbar-menu-button ${activeMenu === 'file' ? 'active' : ''}`}
              onClick={() => handleMenuClick('file')}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div className="toolbar-dropdown">
                <button onClick={() => handleMenuItemClick(onSave)}>
                  <span className="menu-label">Save Project</span>
                  <span className="menu-shortcut">Ctrl+S</span>
                </button>
                <button onClick={() => handleMenuItemClick(onLoad)}>
                  <span className="menu-label">Load Project</span>
                  <span className="menu-shortcut">Ctrl+O</span>
                </button>
                <div className="menu-separator" />
                <button onClick={() => handleMenuItemClick(onImport)}>
                  <span className="menu-label">Import from Desmos</span>
                  <span className="menu-shortcut">Ctrl+I</span>
                </button>
                <div className="menu-separator" />
                <button onClick={() => handleMenuItemClick(onExportPNG)}>
                  <span className="menu-label">Export PNG</span>
                  <span className="menu-shortcut">Ctrl+E</span>
                </button>
                <button onClick={() => handleMenuItemClick(onExportManim)}>
                  <span className="menu-label">Export Manim Animation</span>
                  <span className="menu-shortcut">Ctrl+M</span>
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="toolbar-menu-item">
            <button
              className={`toolbar-menu-button ${activeMenu === 'edit' ? 'active' : ''}`}
              onClick={() => handleMenuClick('edit')}
            >
              Edit
            </button>
            {activeMenu === 'edit' && (
              <div className="toolbar-dropdown">
                <button disabled>
                  <span className="menu-label">Undo</span>
                  <span className="menu-shortcut">Ctrl+Z</span>
                </button>
                <button disabled>
                  <span className="menu-label">Redo</span>
                  <span className="menu-shortcut">Ctrl+Y</span>
                </button>
                <div className="menu-separator" />
                <button disabled>
                  <span className="menu-label">Copy</span>
                  <span className="menu-shortcut">Ctrl+C</span>
                </button>
                <button disabled>
                  <span className="menu-label">Paste</span>
                  <span className="menu-shortcut">Ctrl+V</span>
                </button>
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="toolbar-menu-item">
            <button
              className={`toolbar-menu-button ${activeMenu === 'view' ? 'active' : ''}`}
              onClick={() => handleMenuClick('view')}
            >
              View
            </button>
            {activeMenu === 'view' && (
              <div className="toolbar-dropdown">
                <button onClick={() => handleMenuItemClick(() => onToggleSidebar('parameters'))}>
                  <span className="menu-label">
                    {sidebarStates.parameters ? '✓' : '\u00A0\u00A0'} Parameters
                  </span>
                </button>
                <button onClick={() => handleMenuItemClick(() => onToggleSidebar('functions'))}>
                  <span className="menu-label">
                    {sidebarStates.functions ? '✓' : '\u00A0\u00A0'} Functions
                  </span>
                </button>
                <button onClick={() => handleMenuItemClick(() => onToggleSidebar('keyframes'))}>
                  <span className="menu-label">
                    {sidebarStates.keyframes ? '✓' : '\u00A0\u00A0'} Keyframe Manager
                  </span>
                </button>
                <button onClick={() => handleMenuItemClick(() => onToggleSidebar('visual-settings'))}>
                  <span className="menu-label">
                    {sidebarStates['visual-settings'] ? '✓' : '\u00A0\u00A0'} Visual Settings
                  </span>
                </button>
                <div className="menu-separator" />
                <button onClick={() => handleMenuItemClick(onToggleFooter)}>
                  <span className="menu-label">
                    {footerVisible ? '✓' : '\u00A0\u00A0'} Timeline
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Run Menu */}
          <div className="toolbar-menu-item">
            <button
              className={`toolbar-menu-button ${activeMenu === 'run' ? 'active' : ''}`}
              onClick={() => handleMenuClick('run')}
            >
              Run
            </button>
            {activeMenu === 'run' && (
              <div className="toolbar-dropdown">
                <button disabled>
                  <span className="menu-label">Play Animation</span>
                  <span className="menu-shortcut">Space</span>
                </button>
                <button disabled>
                  <span className="menu-label">Render Animation</span>
                  <span className="menu-shortcut">Ctrl+R</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="toolbar-right">
        <Link to="/docs" className="toolbar-docs-link" title="View Documentation">
          📖 Docs
        </Link>
      </div>
    </header>
  );
}
