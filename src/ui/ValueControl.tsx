/**
 * ValueControl Component
 * Unified value control with:
 * - Optional slider (when bounds are defined)
 * - Click-to-edit value display
 * - Increment/decrement buttons with configurable step
 * - Smart formatting based on precision
 */

import { useState, useEffect, useRef } from 'react';
import './ValueControl.css';

interface ValueControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  showSlider?: boolean; // Auto-determined if not specified
  stepAmount?: number; // Increment/decrement step (defaults to 1)
  label?: string;
  disabled?: boolean;
}

export function ValueControl({
  value,
  onChange,
  min,
  max,
  step = 0.01,
  precision,
  showSlider,
  stepAmount = 1,
  label,
  disabled = false,
}: ValueControlProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if slider should be shown
  const hasBounds = min !== undefined && max !== undefined;
  const shouldShowSlider = showSlider ?? hasBounds;

  // Auto-determine precision from step if not provided
  const displayPrecision = precision ?? Math.max(0, -Math.floor(Math.log10(step)));

  // Update edit value when prop value changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value.toFixed(displayPrecision));
    }
  }, [value, displayPrecision, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleValueClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleInputBlur = () => {
    commitEdit();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditValue(value.toFixed(displayPrecision));
      setIsEditing(false);
    }
  };

  const commitEdit = () => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      const clamped = clampValue(parsed);
      onChange(clamped);
      setEditValue(clamped.toFixed(displayPrecision));
    } else {
      setEditValue(value.toFixed(displayPrecision));
    }
    setIsEditing(false);
  };

  const clampValue = (val: number): number => {
    if (min !== undefined && val < min) return min;
    if (max !== undefined && val > max) return max;
    return val;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = clampValue(value - stepAmount);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = clampValue(value + stepAmount);
    onChange(newValue);
  };

  const canDecrement = min === undefined || value > min;
  const canIncrement = max === undefined || value < max;

  return (
    <div className={`value-control ${disabled ? 'disabled' : ''}`}>
      {label && <label className="value-label">{label}</label>}

      <div className="value-control-inner">
        {shouldShowSlider && (
          <>
            <button
              className="step-button step-decrement"
              onClick={handleDecrement}
              disabled={disabled || !canDecrement}
              title={`Decrease by ${stepAmount}`}
            >
              −
            </button>

            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={handleSliderChange}
              className="value-slider"
              disabled={disabled}
            />

            <button
              className="step-button step-increment"
              onClick={handleIncrement}
              disabled={disabled || !canIncrement}
              title={`Increase by ${stepAmount}`}
            >
              +
            </button>
          </>
        )}

        <div className="value-display-wrapper">
          {isEditing ? (
            <input
              ref={inputRef}
              type="number"
              className="value-input-edit"
              value={editValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              step={step}
              disabled={disabled}
            />
          ) : (
            <div
              className="value-display"
              onClick={handleValueClick}
              title="Click to edit"
            >
              {value.toFixed(displayPrecision)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
