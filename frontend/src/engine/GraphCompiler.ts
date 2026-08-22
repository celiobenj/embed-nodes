import type { Node, Edge } from '@xyflow/react';
import type { NodeData, FirmwareConfig, FirmwareNode, FirmwareLink } from '../types/graph';
import { validateGraph } from './GraphValidator';
import { topologicalSort } from './TopologicalSort';

/**
 * Compiles the React Flow graph into the firmware JSON configuration.
 * Runs validation and topological sort. Throws on errors.
 * Maps React Flow string IDs to sequential 1-based integer IDs.
 */
export function compileGraph(
  nodes: Node[],
  edges: Edge[],
  ts: number,
  decimation: number
): FirmwareConfig {
  // Validate
  const errors = validateGraph(nodes, edges);
  if (errors.length > 0) {
    throw new CompilationError('Graph validation failed', errors);
  }

  // Topological sort
  const sortedIds = topologicalSort(nodes, edges);

  // Build ID mapping: React Flow string ID -> sequential integer (1-based)
  const idMap = new Map<string, number>();
  sortedIds.forEach((id, index) => {
    idMap.set(id, index + 1);
  });

  // Build nodes in topological order
  const nodeMap = new Map<string, Node>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  const firmwareNodes: FirmwareNode[] = sortedIds.map((id) => {
    const node = nodeMap.get(id)!;
    const data = node.data as NodeData;
    return {
      id: idMap.get(id)!,
      type: data.blockType,
      params: { ...data.params },
    };
  });

  // Build links with mapped IDs
  const firmwareLinks: FirmwareLink[] = edges.map((edge) => {
    const fromId = idMap.get(edge.source);
    const toId = idMap.get(edge.target);
    if (fromId === undefined || toId === undefined) {
      throw new Error(`Edge references unknown node: ${edge.source} -> ${edge.target}`);
    }

    // Extract port indices from handle IDs (format: "in_0", "out_0")
    const outPort = parsePortIndex(edge.sourceHandle, 'out');
    const inPort = parsePortIndex(edge.targetHandle, 'in');

    return { from: fromId, outPort, to: toId, inPort };
  });

  return {
    version: '1.0',
    ts,
    decimation,
    nodes: firmwareNodes,
    links: firmwareLinks,
  };
}

function parsePortIndex(handle: string | null | undefined, prefix: string): number {
  if (!handle) return 0;
  const match = handle.match(new RegExp(`^${prefix}_(\\d+)$`));
  return match ? parseInt(match[1]!, 10) : 0;
}

export class CompilationError extends Error {
  constructor(
    message: string,
    public readonly validationErrors: import('../types/graph').ValidationError[]
  ) {
    super(message);
    this.name = 'CompilationError';
  }
}
