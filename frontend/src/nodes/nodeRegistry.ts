import type { BlockType, BlockDefinition } from '../types/graph';

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  Constant: {
    type: 'Constant',
    label: 'Constant',
    category: 'Fontes',
    inputs: [],
    outputs: [{ name: 'out_0', label: 'out' }],
    params: [
      { key: 'value', label: 'Value', type: 'number', default: 0, step: 0.1 },
    ],
  },
  Gain: {
    type: 'Gain',
    label: 'Gain',
    category: 'Matematica',
    inputs: [{ name: 'in_0', label: 'in' }],
    outputs: [{ name: 'out_0', label: 'out' }],
    params: [
      { key: 'k', label: 'K', type: 'number', default: 1.0, step: 0.1 },
    ],
  },
  PwmOut: {
    type: 'PwmOut',
    label: 'PWM Out',
    category: 'I/O Fisico',
    inputs: [{ name: 'in_0', label: 'duty' }],
    outputs: [],
    params: [
      { key: 'pin', label: 'GPIO Pin', type: 'integer', default: 18, min: 0, max: 39 },
      { key: 'channel', label: 'LEDC Channel', type: 'integer', default: 0, min: 0, max: 15 },
      { key: 'freq', label: 'Frequency (Hz)', type: 'integer', default: 5000, min: 1, max: 40000 },
      { key: 'res_bits', label: 'Resolution (bits)', type: 'integer', default: 8, min: 1, max: 16 },
    ],
    gpioParams: ['pin'],
  },
  AnalogIn: {
    type: 'AnalogIn',
    label: 'Analog In',
    category: 'I/O Fisico',
    inputs: [],
    outputs: [{ name: 'out_0', label: 'adc' }],
    params: [
      { key: 'pin', label: 'ADC1 Pin', type: 'integer', default: 34, min: 32, max: 39 },
      { key: 'sample_avg', label: 'Sample Avg', type: 'integer', default: 4, min: 1, max: 64 },
    ],
    gpioParams: ['pin'],
  },
};

export const BLOCK_LIST: BlockDefinition[] = Object.values(BLOCK_DEFINITIONS);
