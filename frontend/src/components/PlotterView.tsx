import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { Pause, Play, Trash2 } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';

const COLORS = ['#0056B3', '#B30000', '#2D7A31', '#FF8C00', '#8B008B', '#00CED1'];

export default function PlotterView() {
  const { telemetryData, isPaused, togglePause, clearTelemetry } = useGraphStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<uPlot | null>(null);
  const seriesNamesRef = useRef<string[]>([]);

  // Build/rebuild chart when series change
  useEffect(() => {
    if (!containerRef.current) return;

    const seriesNames = Array.from(telemetryData.keys()).sort();
    const namesChanged =
      seriesNames.length !== seriesNamesRef.current.length ||
      seriesNames.some((n, i) => n !== seriesNamesRef.current[i]);

    if (!namesChanged && chartRef.current) {
      // Just update data
      updateChartData(chartRef.current, seriesNames, telemetryData);
      return;
    }

    seriesNamesRef.current = seriesNames;

    // Destroy old chart
    chartRef.current?.destroy();

    if (seriesNames.length === 0) {
      chartRef.current = null;
      return;
    }

    const series: uPlot.Series[] = [
      { label: 'Time (s)' },
      ...seriesNames.map((name, i) => ({
        label: name,
        stroke: COLORS[i % COLORS.length],
        width: 2,
      })),
    ];

    const opts: uPlot.Options = {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight - 40,
      series,
      axes: [
        { stroke: '#333333', grid: { stroke: '#E0E0E0' }, font: '10px JetBrains Mono' },
        { stroke: '#333333', grid: { stroke: '#E0E0E0' }, font: '10px JetBrains Mono' },
      ],
      cursor: { show: true },
      legend: { show: true },
    };

    const data = buildUplotData(seriesNames, telemetryData);
    chartRef.current = new uPlot(opts, data, containerRef.current);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [telemetryData]);

  // Resize handler
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.setSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight - 40,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#E0E0E0]">
        <button
          onClick={togglePause}
          className="h-6 px-2 bg-white border border-[#333333] rounded-[2px] text-xs flex items-center gap-1 hover:bg-[#F8F9FA]"
        >
          {isPaused ? <Play size={12} /> : <Pause size={12} />}
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={clearTelemetry}
          className="h-6 px-2 bg-white border border-[#333333] rounded-[2px] text-xs flex items-center gap-1 hover:bg-[#F8F9FA]"
        >
          <Trash2 size={12} /> Clear
        </button>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 p-1" />
    </div>
  );
}

function buildUplotData(
  seriesNames: string[],
  telemetryData: Map<string, { times: number[]; values: number[] }>
): uPlot.AlignedData {
  if (seriesNames.length === 0) return [new Float64Array(0)];

  // Use first series' timestamps as reference
  const refSeries = telemetryData.get(seriesNames[0]!);
  if (!refSeries || refSeries.times.length === 0) return [new Float64Array(0)];

  const times = new Float64Array(refSeries.times.map((t) => t / 1000));
  const result: uPlot.AlignedData = [times];

  for (const name of seriesNames) {
    const s = telemetryData.get(name);
    result.push(new Float64Array(s?.values ?? []));
  }

  return result;
}

function updateChartData(
  chart: uPlot,
  seriesNames: string[],
  telemetryData: Map<string, { times: number[]; values: number[] }>
): void {
  const data = buildUplotData(seriesNames, telemetryData);
  chart.setData(data);
}
