import { useGraphStore } from '../store/useGraphStore';
import PropertiesPanel from './PropertiesPanel';
import PlotterView from './PlotterView';

export default function RightPanel() {
  const { rightPanelTab, setRightPanelTab } = useGraphStore();

  return (
    <aside className="w-72 bg-[#F8F9FA] border-l border-[#333333] flex flex-col">
      <div className="flex border-b border-[#333333]">
        <button
          onClick={() => setRightPanelTab('properties')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium ${
            rightPanelTab === 'properties'
              ? 'bg-white border-b-2 border-[#0056B3] text-[#0056B3]'
              : 'text-gray-500 hover:bg-white'
          }`}
        >
          Properties
        </button>
        <button
          onClick={() => setRightPanelTab('plotter')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium ${
            rightPanelTab === 'plotter'
              ? 'bg-white border-b-2 border-[#0056B3] text-[#0056B3]'
              : 'text-gray-500 hover:bg-white'
          }`}
        >
          Plotter
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rightPanelTab === 'properties' ? <PropertiesPanel /> : <PlotterView />}
      </div>
    </aside>
  );
}
