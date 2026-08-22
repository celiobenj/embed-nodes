import { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Header from './components/Header';
import LeftPanel from './components/LeftPanel';
import Canvas from './components/Canvas';
import RightPanel from './components/RightPanel';
import SendConfigModal from './components/SendConfigModal';
import { serialManager } from './serial/WebSerialManager';
import { parseTeleplotLine } from './serial/TeleplotParser';
import { useGraphStore } from './store/useGraphStore';

export default function App() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const { addSample, setSerialStatus } = useGraphStore();

  // Wire up serial callbacks
  useEffect(() => {
    serialManager.setCallbacks(
      (line) => {
        const sample = parseTeleplotLine(line);
        if (sample) addSample(sample);
      },
      (status) => {
        setSerialStatus(status === 'connected' ? 'connected' : status === 'error' ? 'error' : 'disconnected');
      }
    );
  }, [addSample, setSerialStatus]);

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-white">
        <Header onSendConfig={() => setShowConfigModal(true)} />
        <div className="flex flex-1 min-h-0">
          <LeftPanel />
          <Canvas />
          <RightPanel />
        </div>
        {showConfigModal && (
          <SendConfigModal onClose={() => setShowConfigModal(false)} />
        )}
      </div>
    </ReactFlowProvider>
  );
}
