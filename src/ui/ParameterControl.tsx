import type { Parameter } from '../engine/types';
import { ValueControl } from './ValueControl';
import { configManager } from '../config/ConfigManager';

interface ParameterControlProps {
  parameter: Parameter;
  onChange: (value: number) => void;
}

export function ParameterControl({ parameter, onChange }: ParameterControlProps) {
  const { uiControl, value } = parameter;

  // Get default step amount from config
  const defaultStepAmount = configManager.get<number>('ui.defaultStepAmount') ?? 1;

  // Get defaults if uiControl is not defined
  const defaults = configManager.get('parameters.defaults');

  // Handle array values - only support scalar for now
  const scalarValue = typeof value === 'number' ? value : (Array.isArray(value) ? value[0] ?? 0 : 0);

  // Determine if slider should be shown based on control type
  const showSlider = uiControl?.type === 'slider' ||
                     (uiControl?.type === 'stepper' && uiControl.min !== undefined && uiControl.max !== undefined);

  return (
    <ValueControl
      value={scalarValue}
      onChange={onChange}
      min={uiControl?.min ?? defaults.min}
      max={uiControl?.max ?? defaults.max}
      step={uiControl?.step ?? defaults.step}
      showSlider={showSlider}
      stepAmount={defaultStepAmount}
    />
  );
}
