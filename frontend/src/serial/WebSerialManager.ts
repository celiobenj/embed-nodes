import type { BaudRate } from '../types/graph';

export type SerialEventCallback = (line: string) => void;
export type StatusCallback = (status: 'connected' | 'disconnected' | 'error', message?: string) => void;

const ENCODER = new TextEncoder();
const ACK_TIMEOUT_MS = 5000;

export class WebSerialManager {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private readLoopActive = false;
  private lineBuffer = '';
  private onLine: SerialEventCallback | null = null;
  private onStatus: StatusCallback | null = null;
  private ackResolve: ((value: string) => void) | null = null;

  setCallbacks(onLine: SerialEventCallback, onStatus: StatusCallback): void {
    this.onLine = onLine;
    this.onStatus = onStatus;
  }

  get isConnected(): boolean {
    return this.port !== null && this.readLoopActive;
  }

  async connect(baudRate: BaudRate): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser. Use Chrome or Edge.');
    }

    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate });
      this.onStatus?.('connected');
      this.startReadLoop();
    } catch (err) {
      this.onStatus?.('error', String(err));
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.readLoopActive = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch {
      // Ignore errors during cleanup
    }
    this.lineBuffer = '';
    this.onStatus?.('disconnected');
  }

  async sendConfig(json: string): Promise<string> {
    const payload = `$CONFIG:${json}#`;
    await this.writeString(payload);
    return this.waitForAck('$ACK:READY#');
  }

  async sendCommand(cmd: 'START' | 'STOP' | 'SAVE'): Promise<void> {
    await this.writeString(`$CMD:${cmd}#`);
    if (cmd === 'SAVE') {
      await this.waitForAck('$ACK:SAVED#');
    }
  }

  private async writeString(data: string): Promise<void> {
    if (!this.port?.writable) {
      throw new Error('Serial port is not writable.');
    }
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(ENCODER.encode(data));
    } finally {
      writer.releaseLock();
    }
  }

  private waitForAck(expectedAck: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.ackResolve = null;
        reject(new Error(`Timeout waiting for ${expectedAck}`));
      }, ACK_TIMEOUT_MS);

      this.ackResolve = (line: string) => {
        if (line.includes(expectedAck)) {
          clearTimeout(timeout);
          this.ackResolve = null;
          resolve(line);
        }
      };
    });
  }

  private startReadLoop(): void {
    if (!this.port?.readable) return;
    this.readLoopActive = true;

    const readable = this.port.readable;

    const loop = async () => {
      try {
        this.reader = readable.getReader();
        const decoder = new TextDecoder();

        while (this.readLoopActive) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (!value) continue;

          this.lineBuffer += decoder.decode(value, { stream: true });
          const lines = this.lineBuffer.split('\n');
          // Keep the last (potentially incomplete) segment in the buffer
          this.lineBuffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Check for ACK responses
            if (this.ackResolve) {
              this.ackResolve(trimmed);
            }

            // Forward all lines to the callback
            this.onLine?.(trimmed);
          }
        }
      } catch (err) {
        if (this.readLoopActive) {
          this.onStatus?.('error', String(err));
        }
      } finally {
        try {
          this.reader?.releaseLock();
        } catch {
          // Ignore
        }
        this.reader = null;
      }
    };

    loop();
  }
}

export const serialManager = new WebSerialManager();
