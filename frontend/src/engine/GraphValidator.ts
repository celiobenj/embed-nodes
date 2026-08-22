import type { Node, Edge } from '@xyflow/react';
import type { NodeData, ValidationError, BlockDefinition } from '../types/graph';
import { BLOCK_DEFINITIONS } from '../nodes/nodeRegistry';

/**
 * Validates the graph before compilation and transmission.
 * Returns an array of validation errors. An empty array means the graph is valid.
 */
export function validateGraph(nodes: Node[], edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (nodes.length === 0) {
    errors.push({
      code: 'ERR_02_FLOAT_IN',
      message: 'Graph is empty. Add at least one block.',
    });
    return errors;
  }

  // ERR_02_FLOAT_IN: Check for unconnected required input ports
  for (const node of nodes) {
    const data = node.data as NodeData;
    const def: BlockDefinition | undefined = BLOCK_DEFINITIONS[data.blockType];
    if (!def) continue;

    for (const input of def.inputs) {
      const hasConnection = edges.some(
        (edge) => edge.target === node.id && edge.targetHandle === input.name
      );
      if (!hasConnection) {
        errors.push({
          code: 'ERR_02_FLOAT_IN',
          message: `"${def.label}" (${node.id}): input port "${input.label}" is not connected.`,
          nodeId: node.id,
        });
      }
    }
  }

  // ERR_03_PIN_CONFL: Check for GPIO pin conflicts
  const pinUsage = new Map<number, { nodeId: string; label: string }>();
  for (const node of nodes) {
    const data = node.data as NodeData;
    const def = BLOCK_DEFINITIONS[data.blockType];
    if (!def?.gpioParams) continue;

    for (const paramKey of def.gpioParams) {
      const pinValue = data.params[paramKey];
      if (pinValue === undefined) continue;

      const existing = pinUsage.get(pinValue);
      if (existing) {
        errors.push({
          code: 'ERR_03_PIN_CONFL',
          message: `GPIO pin ${pinValue} conflict: used by "${existing.label}" (${existing.nodeId}) and "${def.label}" (${node.id}).`,
          nodeId: node.id,
        });
      } else {
        pinUsage.set(pinValue, { nodeId: node.id, label: def.label });
      }
    }
  }

  // ERR_04_BAD_PARAM: Check parameter bounds
  for (const node of nodes) {
    const data = node.data as NodeData;
    const def = BLOCK_DEFINITIONS[data.blockType];
    if (!def) continue;

    for (const paramDef of def.params) {
      const value = data.params[paramDef.key];
      if (value === undefined) continue;

      if (paramDef.min !== undefined && value < paramDef.min) {
        errors.push({
          code: 'ERR_04_BAD_PARAM',
          message: `"${def.label}" (${node.id}): param "${paramDef.label}" = ${value} is below minimum ${paramDef.min}.`,
          nodeId: node.id,
        });
      }
      if (paramDef.max !== undefined && value > paramDef.max) {
        errors.push({
          code: 'ERR_04_BAD_PARAM',
          message: `"${def.label}" (${node.id}): param "${paramDef.label}" = ${value} exceeds maximum ${paramDef.max}.`,
          nodeId: node.id,
        });
      }
      if (paramDef.type === 'integer' && !Number.isInteger(value)) {
        errors.push({
          code: 'ERR_04_BAD_PARAM',
          message: `"${def.label}" (${node.id}): param "${paramDef.label}" = ${value} must be an integer.`,
          nodeId: node.id,
        });
      }
    }
  }

  return errors;
}
