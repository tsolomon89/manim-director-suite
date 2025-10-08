import { KeyframePanel } from './KeyframePanel';

export interface KeyframesSidebarProps {
  keyframes: any[];
  selectedKeyframeId: string | null;
  currentTime: number;
  onCreateKeyframe: (label: string | null) => void;
  onUpdateKeyframe: (id: string, label: string) => void;
  onDeleteKeyframe: (id: string) => void;
  onCloneKeyframe: (id: string) => void;
  onSelectKeyframe: (id: string | null) => void;
}

/**
 * Keyframe Manager sidebar - wraps KeyframePanel
 */
export function KeyframesSidebar(props: KeyframesSidebarProps) {
  return (
    <div className="keyframes-sidebar">
      <KeyframePanel {...props} />
    </div>
  );
}
