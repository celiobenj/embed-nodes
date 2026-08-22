import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import type { NodeData, SerialStatus, BaudRate, TeleplotSample } from '../types/graph';

type RightPanelTab = 'properties' | 'plotter';

interface GraphStore {
  // Graph
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;
  updateNodeData: (nodeId: string, params: Record<string, number>) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // Serial
  serialStatus: SerialStatus;
  baudRate: BaudRate;
  setSerialStatus: (status: SerialStatus) => void;
  setBaudRate: (rate: BaudRate) => void;

  // Config
  ts: number;
  decimation: number;
  setTs: (ts: number) => void;
  setDecimation: (d: number) => void;

  // Telemetry
  telemetryData: Map<string, { times: number[]; values: number[] }>;
  isPaused: boolean;
  addSample: (sample: TeleplotSample) => void;
  clearTelemetry: () => void;
  togglePause: () => void;

  // UI
  rightPanelTab: RightPanelTab;
  setRightPanelTab: (tab: RightPanelTab) => void;
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  // Graph
  nodes: [],
  edges: [],
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
    // Track selection
    for (const change of changes) {
      if (change.type === 'select' && change.selected) {
        set({ selectedNodeId: change.id });
      }
    }
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection) => {
    set({ edges: addEdge(connection, get().edges) });
  },
  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
  },
  updateNodeData: (nodeId, params) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, params: { ...(n.data as NodeData).params, ...params } } }
          : n
      ),
    });
  },
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  // Serial
  serialStatus: 'disconnected',
  baudRate: 115200,
  setSerialStatus: (status) => set({ serialStatus: status }),
  setBaudRate: (rate) => set({ baudRate: rate }),

  // Config
  ts: 10,
  decimation: 5,
  setTs: (ts) => set({ ts }),
  setDecimation: (d) => set({ decimation: d }),

  // Telemetry
  telemetryData: new Map(),
  isPaused: false,
  addSample: (sample) => {
    if (get().isPaused) return;
    const data = get().telemetryData;
    const series = data.get(sample.name) ?? { times: [], values: [] };
    series.times.push(sample.timestamp);
    series.values.push(sample.value);
    // Keep last 10 seconds of data (at ~100Hz = ~1000 samples max)
    const cutoff = sample.timestamp - 10000;
    while (series.times.length > 0 && series.times[0]! < cutoff) {
      series.times.shift();
      series.values.shift();
    }
    const newData = new Map(data);
    newData.set(sample.name, series);
    set({ telemetryData: newData });
  },
  clearTelemetry: () => set({ telemetryData: new Map() }),
  togglePause: () => set({ isPaused: !get().isPaused }),

  // UI
  rightPanelTab: 'properties',
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
}));
