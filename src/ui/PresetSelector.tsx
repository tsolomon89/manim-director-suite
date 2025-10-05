import { configManager } from '../config/ConfigManager';
import type { PresetsConfig } from '../config/types';
import './PresetSelector.css';

interface PresetSelectorProps {
  category: keyof PresetsConfig;
  currentId: string;
  onSelect: (id: string) => void;
}

/**
 * Generic preset selector component
 * Works for any preset category (grid-styles, color-schemes, easing-curves, warps)
 */
export function PresetSelector({ category, currentId, onSelect }: PresetSelectorProps) {
  const presets = configManager.getPresets(category);

  return (
    <select
      className="preset-selector"
      value={currentId}
      onChange={(e) => onSelect(e.target.value)}
    >
      {presets.map((preset: any) => (
        <option key={preset.id} value={preset.id}>
          {preset.name}
        </option>
      ))}
    </select>
  );
}
