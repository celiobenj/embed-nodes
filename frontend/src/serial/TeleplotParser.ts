import type { TeleplotSample } from '../types/graph';

const TELEPLOT_REGEX = /^>([\w.]+):([-+]?\d*\.?\d+)/;

/**
 * Parses a single line from the serial stream.
 * Detects Teleplot format: ">variable_name:numeric_value"
 * Returns a TeleplotSample or null if the line doesn't match.
 */
export function parseTeleplotLine(line: string): TeleplotSample | null {
  const trimmed = line.trim();
  const match = trimmed.match(TELEPLOT_REGEX);
  if (!match) return null;

  return {
    name: match[1]!,
    value: parseFloat(match[2]!),
    timestamp: performance.now(),
  };
}
