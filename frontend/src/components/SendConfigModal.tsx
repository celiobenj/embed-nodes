import { useState, useCallback, useEffect } from 'react';
import { X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';
import { validateGraph } from '../engine/GraphValidator';
import { compileGraph, CompilationError } from '../engine/GraphCompiler';
import { serialManager } from '../serial/WebSerialManager';
import type { ValidationError, FirmwareConfig } from '../types/graph';

type ModalStep = 'validating' | 'compiling' | 'transmitting' | 'waiting_ack' | 'ready' | 'error';

export default function SendConfigModal({ onClose }: { onClose: () => void }) {
  const { nodes, edges, ts, decimation, setRightPanelTab } = useGraphStore();
  const [step, setStep] = useState<ModalStep>('validating');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [statusText, setStatusText] = useState('Validating graph...');

  const runPipeline = useCallback(async () => {
    // Step 1: Validate
    setStep('validating');
    setStatusText('Validating graph...');
    await delay(300);

    const validationErrors = validateGraph(nodes, edges);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setStep('error');
      setStatusText('Validation failed');
      return;
    }

    // Step 2: Compile
    setStep('compiling');
    setStatusText('Compiling graph...');
    await delay(200);

    let config: FirmwareConfig;
    try {
      config = compileGraph(nodes, edges, ts, decimation);
    } catch (err) {
      if (err instanceof CompilationError) {
        setErrors(err.validationErrors);
      } else {
        setErrors([{ code: 'ERR_04_BAD_PARAM', message: String(err) }]);
      }
      setStep('error');
      setStatusText('Compilation failed');
      return;
    }

    // Step 3: Transmit
    setStep('transmitting');
    setStatusText('Transmitting configuration...');
    try {
      const json = JSON.stringify(config);
      console.log('[EmbedNodes] Sending config:', json);

      // Step 4: Wait for ACK
      setStep('waiting_ack');
      setStatusText('Waiting for ACK:READY...');
      await serialManager.sendConfig(json);

      setStep('ready');
      setStatusText('Configuration accepted!');
    } catch (err) {
      setErrors([{ code: 'ERR_04_BAD_PARAM', message: `Serial error: ${String(err)}` }]);
      setStep('error');
      setStatusText('Transmission failed');
    }
  }, [nodes, edges, ts, decimation]);

  useEffect(() => {
    runPipeline();
  }, [runPipeline]);

  const handleStartControl = useCallback(async () => {
    try {
      await serialManager.sendCommand('START');
      setRightPanelTab('plotter');
      onClose();
    } catch (err) {
      console.error('START failed:', err);
    }
  }, [onClose, setRightPanelTab]);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white border border-[#333333] rounded-[2px] w-[420px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#E0E0E0]">
          <span className="text-sm font-semibold">Send Configuration</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col items-center gap-3">
          {step !== 'error' && step !== 'ready' && (
            <Loader2 size={32} className="animate-spin text-[#0056B3]" />
          )}
          {step === 'ready' && (
            <CheckCircle2 size={32} className="text-[#2D7A31]" />
          )}
          {step === 'error' && (
            <AlertTriangle size={32} className="text-[#B30000]" />
          )}
          <p className="text-sm text-center">{statusText}</p>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="w-full max-h-48 overflow-y-auto space-y-1">
              {errors.map((err, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 bg-red-50 border border-[#B30000] rounded-[2px] text-xs text-[#B30000] font-mono"
                >
                  <strong>{err.code}:</strong> {err.message}
                </div>
              ))}
            </div>
          )}

          {/* Start Control button */}
          {step === 'ready' && (
            <button
              onClick={handleStartControl}
              className="h-8 px-6 bg-[#0056B3] text-white rounded-[2px] text-sm font-medium hover:opacity-90"
            >
              Start Control
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
