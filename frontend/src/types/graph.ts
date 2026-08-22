// Block types available in MVP v0.1.0
export type BlockType = 'Constant' | 'Gain' | 'PwmOut' | 'AnalogIn';

// Categories for the block library panel
export type BlockCategory = 'I/O Fisico' | 'Fontes' | 'Matematica';

// Port definition for node inputs/outputs
export interface PortDef {
  name: string;
  label: string;
}

// Parameter definition for node configuration
export interface ParamDef {
  key: string;
  label: string;
  type: 'number' | 'integer';
  default: number;
  min?: number;
  max?: number;
  step?: number;
}

// Full metadata definition for a block type
export interface BlockDefinition {
  type: BlockType;
  label: string;
  category: BlockCategory;
  inputs: PortDef[];
  outputs: PortDef[];
  params: ParamDef[];
  gpioParams?: string[];  // which param keys reference GPIO pins
}

// Data stored inside each React Flow node
export interface NodeData {
  blockType: BlockType;
  params: Record<string, number>;
  label: string;
  [key: string]: unknown;
}

// Firmware JSON output types
export interface FirmwareNode {
  id: number;
  type: string;
  params: Record<string, number>;
}

export interface FirmwareLink {
  from: number;
  outPort: number;
  to: number;
  inPort: number;
}

export interface FirmwareConfig {
  version: string;
  ts: number;
  decimation: number;
  nodes: FirmwareNode[];
  links: FirmwareLink[];
}

// Validation
export type ValidationErrorCode = 'ERR_01_ALG_LOOP' | 'ERR_02_FLOAT_IN' | 'ERR_03_PIN_CONFL' | 'ERR_04_BAD_PARAM';

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  nodeId?: string;
}

// Serial
export type SerialStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type BaudRate = 115200 | 921600;

export interface TeleplotSample {
  name: string;
  value: number;
  timestamp: number;
}
