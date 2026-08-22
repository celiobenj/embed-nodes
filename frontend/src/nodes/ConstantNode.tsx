import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData } from '../types/graph';

const ConstantNode = memo(function ConstantNode({ data, selected }: NodeProps) {
  const nodeData = data as NodeData;
  return (
    <div
      className={`bg-white border border-[#333333] rounded-[2px] min-w-[120px] ${
        selected ? 'border-[#0056B3] border-2' : ''
      }`}
    >
      <div className="bg-[#F8F9FA] px-3 py-1 border-b border-[#333333] text-xs font-medium font-sans">
        Constant
      </div>
      <div className="px-3 py-2 text-sm font-mono text-center">
        {nodeData.params.value}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="out_0"
        className="!w-2.5 !h-2.5 !bg-[#333333] !border-none"
      />
    </div>
  );
});

export default ConstantNode;
