import { ParameterPanel } from './ParameterPanel';
import type { UIControlType } from '../engine/types';
import type { FunctionDefinition } from '../engine/expression-types';

export interface ParametersSidebarProps {
  parameters: any[];
  functions: FunctionDefinition[];
  onParameterCreate: (name: string, value: number, controlType: UIControlType) => void;
  onParameterChange: (id: string, value: number) => void;
  onParameterDelete: (id: string) => void;
  onParameterUpdateValue: (id: string, value: number) => void;
  onParameterClearValue: (id: string) => void;
  onParameterUpdateDomain: (id: string, domain: { min: number; max: number; step: number }) => void;
  onConvertToFunction: (paramId: string) => void;
}

/**
 * Parameters sidebar - wraps ParameterPanel
 */
export function ParametersSidebar(props: ParametersSidebarProps) {
  return (
    <div className="parameters-sidebar">
      <ParameterPanel {...props} />
    </div>
  );
}
