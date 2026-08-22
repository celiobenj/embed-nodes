import { useCallback } from 'react';
import { Plug, Unplug, Send, Save, Play, Square } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';
import { serialManager } from '../serial/WebSerialManager';
import type { BaudRate } from '../types/graph';

export default function Header({ onSendConfig }: { onSendConfig: () => void }) {
  const {
    serialStatus, baudRate, ts, decimation,
    setSerialStatus, setBaudRate, setTs, setDecimation,
  } = useGraphStore();

  const handleConnect = useCallback(async () => {
    try {
      setSerialStatus('connecting');
      await serialManager.connect(baudRate);
      setSerialStatus('connected');
    } catch {
      setSerialStatus('error');
    }
  }, [baudRate, setSerialStatus]);

  const handleDisconnect = useCallback(async () => {
    await serialManager.disconnect();
    setSerialStatus('disconnected');
  }, [setSerialStatus]);

  const handleStart = useCallback(async () => {
    try {
      await serialManager.sendCommand('START');
    } catch (err) {
      console.error('START failed:', err);
    }
  }, []);

  const handleStop = useCallback(async () => {
    try {
      await serialManager.sendCommand('STOP');
    } catch (err) {
      console.error('STOP failed:', err);
    }
  }, []);

  const handleSaveFlash = useCallback(async () => {
    try {
      await serialManager.sendCommand('SAVE');
    } catch (err) {
      console.error('SAVE failed:', err);
    }
  }, []);

  const isConnected = serialStatus === 'connected';

  return (
    <header className="h-12 bg-[#F8F9FA] border-b border-[#333333] flex items-center px-4 gap-4 text-sm">
      {/* Logo */}
      <span className="font-semibold text-base tracking-tight">EmbedNodes</span>
      <div className="w-px h-6 bg-[#333333] opacity-30" />

      {/* Ts and Decimation */}
      <div className="flex items-center gap-2">
        <label className="text-xs">Ts (ms):</label>
        <input
          type="number"
          value={ts}
          onChange={(e) => setTs(Math.max(1, Number(e.target.value)))}
          className="w-16 h-7 px-1.5 border border-[#333333] rounded-[2px] font-mono text-xs text-center bg-white"
          min={1}
        />
        <label className="text-xs">Decim:</label>
        <input
          type="number"
          value={decimation}
          onChange={(e) => setDecimation(Math.max(1, Number(e.target.value)))}
          className="w-14 h-7 px-1.5 border border-[#333333] rounded-[2px] font-mono text-xs text-center bg-white"
          min={1}
        />
      </div>
      <div className="w-px h-6 bg-[#333333] opacity-30" />

      {/* Serial controls */}
      <div className="flex items-center gap-2">
        <select
          value={baudRate}
          onChange={(e) => setBaudRate(Number(e.target.value) as BaudRate)}
          className="h-7 px-1 border border-[#333333] rounded-[2px] text-xs bg-white font-mono"
          disabled={isConnected}
        >
          <option value={115200}>115200</option>
          <option value={921600}>921600</option>
        </select>
        {!isConnected ? (
          <button
            onClick={handleConnect}
            className="h-7 px-3 bg-white border border-[#333333] rounded-[2px] text-xs flex items-center gap-1 hover:bg-[#F8F9FA]"
          >
            <Plug size={14} /> Connect
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="h-7 px-3 bg-white border border-[#333333] rounded-[2px] text-xs flex items-center gap-1 hover:bg-[#F8F9FA]"
          >
            <Unplug size={14} /> Disconnect
          </button>
        )}
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isConnected ? 'bg-[#2D7A31]' : 'bg-[#999999]'
          }`}
          title={serialStatus}
        />
      </div>
      <div className="w-px h-6 bg-[#333333] opacity-30" />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSendConfig}
          disabled={!isConnected}
          className="h-7 px-3 bg-[#0056B3] text-white rounded-[2px] text-xs flex items-center gap-1 hover:opacity-90 disabled:opacity-40"
        >
          <Send size={14} /> Send Config
        </button>
        <button
          onClick={handleStart}
          disabled={!isConnected}
          className="h-7 px-3 bg-white border border-[#333333] rounded-[2px] text-xs flex items-center gap-1 hover:bg-[#F8F9FA] disabled:opacity-40"
        >
          <Play size={14} /> Start
        </button>
        <button
          onClick={handleStop}
          disabled={!isConnected}
          className="h-7 px-3 bg-white border border-[#B30000] text-[#B30000] rounded-[2px] text-xs flex items-center gap-1 hover:bg-red-50 disabled:opacity-40"
        >
          <Square size={14} /> Stop
        </button>
        <button
          onClick={handleSaveFlash}
          disabled={!isConnected}
          className="h-7 px-3 bg-white border border-[#333333] rounded-[2px] text-xs flex items-center gap-1 hover:bg-[#F8F9FA] disabled:opacity-40"
        >
          <Save size={14} /> Save Flash
        </button>
      </div>
    </header>
  );
}
