import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData } from '../types/graph';

const PwmOutNode = memo(function PwmOutNode({ data, selected }: NodeProps) {
  const nodeData = data as NodeData;
  return (
    <div
      className={`bg-white border border-[#333333] rounded-[2px] min-w-[140px] ${
        selected ? 'border-[#0056B3] border-2' : ''
      }`}
    >
      <div className="bg-[#F8F9FA] px-3 py-1 border-b border-[#333333] text-xs font-medium font-sans">
        PWM Out
      </div>
      <div className="px-3 py-2 text-xs font-mono space-y-0.5">
        <div>Pin: {nodeData.params.pin}</div>
        <div>Ch: {nodeData.params.channel} | {nodeData.params.freq} Hz</div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="in_0"
        className="!w-2.5 !h-2.5 !bg-[#333333] !border-none"
      />
    </div>
  );
});

export default PwmOutNode;
