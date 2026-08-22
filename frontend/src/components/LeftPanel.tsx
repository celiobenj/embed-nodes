import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { BLOCK_LIST } from '../nodes/nodeRegistry';
import type { BlockCategory, BlockDefinition } from '../types/graph';

const CATEGORIES: BlockCategory[] = ['I/O Fisico', 'Fontes', 'Matematica'];

export default function LeftPanel() {
  const [openCategories, setOpenCategories] = useState<Set<BlockCategory>>(
    new Set(CATEGORIES)
  );

  const toggleCategory = useCallback((cat: BlockCategory) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  const onDragStart = useCallback(
    (event: React.DragEvent, blockDef: BlockDefinition) => {
      event.dataTransfer.setData('application/embednodes-block', blockDef.type);
      event.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  return (
    <aside className="w-48 bg-[#F8F9FA] border-r border-[#333333] overflow-y-auto">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-[#E0E0E0]">
        Blocks
      </div>
      {CATEGORIES.map((cat) => {
        const isOpen = openCategories.has(cat);
        const blocks = BLOCK_LIST.filter((b) => b.category === cat);
        return (
          <div key={cat}>
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center gap-1 px-3 py-1.5 text-xs font-medium hover:bg-white border-b border-[#E0E0E0]"
            >
              {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {cat}
            </button>
            {isOpen && (
              <div className="px-2 py-1 space-y-1">
                {blocks.map((block) => (
                  <div
                    key={block.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, block)}
                    className="px-2 py-1.5 bg-white border border-[#333333] rounded-[2px] text-xs cursor-grab hover:border-[#0056B3] active:cursor-grabbing"
                  >
                    {block.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}
