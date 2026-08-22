import { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useGraphStore } from '../store/useGraphStore';
import { BLOCK_DEFINITIONS } from '../nodes/nodeRegistry';
import type { BlockType, NodeData } from '../types/graph';
import ConstantNode from '../nodes/ConstantNode';
import GainNode from '../nodes/GainNode';
import PwmOutNode from '../nodes/PwmOutNode';
import AnalogInNode from '../nodes/AnalogInNode';

const NODE_TYPES = {
  Constant: ConstantNode,
  Gain: GainNode,
  PwmOut: PwmOutNode,
  AnalogIn: AnalogInNode,
};

let nodeIdCounter = 0;

export default function Canvas() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    addNode, setSelectedNodeId,
  } = useGraphStore();

  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const defaultEdgeOptions = useMemo(
    () => ({
      style: { stroke: '#333333', strokeWidth: 2 },
      type: 'default' as const,
    }),
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const blockType = event.dataTransfer.getData('application/embednodes-block') as BlockType;
      if (!blockType || !BLOCK_DEFINITIONS[blockType]) return;

      const def = BLOCK_DEFINITIONS[blockType];
      const position = reactFlowInstance.current?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }) ?? { x: 100, y: 100 };

      const defaultParams: Record<string, number> = {};
      for (const p of def.params) {
        defaultParams[p.key] = p.default;
      }

      const nodeData: NodeData = {
        blockType,
        params: defaultParams,
        label: def.label,
      };

      nodeIdCounter += 1;
      const newNode = {
        id: `node_${nodeIdCounter}_${Date.now()}`,
        type: blockType,
        position,
        data: nodeData,
      };

      addNode(newNode);
    },
    [addNode]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  return (
    <div className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(instance) => { reactFlowInstance.current = instance; }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={NODE_TYPES}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background variant={BackgroundVariant.Dots} color="#E0E0E0" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeColor="#333333"
          nodeColor="#F8F9FA"
          maskColor="rgba(0,0,0,0.08)"
        />
      </ReactFlow>
    </div>
  );
}
