import { FunctionPanelNew } from './FunctionPanelNew';
import type { FunctionDefinition } from '../engine/expression-types';

export interface FunctionsSidebarProps {
  functions: FunctionDefinition[];
  independentVariables: any[];
  onFunctionCreate: (expression: string, color: string) => any;
  onFunctionUpdate: (id: string, updates: Partial<FunctionDefinition>) => void;
  onFunctionUpdateExpression: (id: string, newExpression: string) => any;
  onFunctionDelete: (id: string) => void;
  onFunctionToggle: (id: string) => void;
  onChangeIndependentVariable: (functionId: string, independentVarId: string) => void;
  onDemoteToParameter: (functionId: string) => void;
}

/**
 * Functions sidebar - wraps FunctionPanelNew
 */
export function FunctionsSidebar(props: FunctionsSidebarProps) {
  return (
    <div className="functions-sidebar">
      <FunctionPanelNew {...props} />
    </div>
  );
}
