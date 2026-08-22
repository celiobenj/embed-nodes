import { useGraphStore } from '../store/useGraphStore';
import { BLOCK_DEFINITIONS } from '../nodes/nodeRegistry';
import type { NodeData } from '../types/graph';

export default function PropertiesPanel() {
  const { nodes, selectedNodeId, updateNodeData } = useGraphStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="p-4 text-xs text-gray-400 text-center">
        Select a node to edit its properties.
      </div>
    );
  }

  const data = selectedNode.data as NodeData;
  const def = BLOCK_DEFINITIONS[data.blockType];
  if (!def) return null;

  return (
    <div className="p-3 space-y-3">
      <div className="text-sm font-semibold border-b border-[#E0E0E0] pb-1">
        {def.label}
      </div>
      <div className="text-[10px] text-gray-400 font-mono">
        id: {selectedNode.id}
      </div>
      {def.params.map((paramDef) => (
        <div key={paramDef.key} className="space-y-0.5">
          <label className="text-xs text-gray-600">{paramDef.label}</label>
          <input
            type="number"
            value={data.params[paramDef.key] ?? paramDef.default}
            min={paramDef.min}
            max={paramDef.max}
            step={paramDef.step ?? (paramDef.type === 'integer' ? 1 : 0.1)}
            onChange={(e) =>
              updateNodeData(selectedNode.id, {
                [paramDef.key]: Number(e.target.value),
              })
            }
            className="w-full h-7 px-2 border border-[#333333] rounded-[2px] font-mono text-xs bg-white"
          />
        </div>
      ))}
    </div>
  );
}
