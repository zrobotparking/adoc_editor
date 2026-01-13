import React, { useMemo } from 'react';
import { type Block } from '../../core/types';

interface OutlineViewProps {
    blocks: Block[];
    onNavigate: (blockId: string) => void;
    activeBlockId?: string | null;
}

interface OutlineItem {
    id: string;
    level: number;
    title: string;
    line: number;
}

export const OutlineView: React.FC<OutlineViewProps> = ({ blocks, onNavigate, activeBlockId }) => {
    
    const headers = useMemo(() => {
        const items: OutlineItem[] = [];
        blocks.forEach(block => {
            if (block.type === 'text') {
                // Determine if it is a header
                // Standard AsciiDoc header: = Title, == Title
                const match = block.content.match(/^(=+)\s+(.+)$/);
                if (match) {
                    items.push({
                        id: block.id,
                        level: match[1].length,
                        title: match[2].trim(),
                        line: block.startLine
                    });
                }
            } else if (block.title) {
                // Also include titled blocks (tables, images) as leaves?
                // Maybe just headers for now as requested "Chapters" (章節)
            }
        });
        return items;
    }, [blocks]);

    if (headers.length === 0) {
        return <div className="p-4 text-sm text-gray-500 italic">No headers found.</div>;
    }

    return (
        <div className="flex flex-col w-full py-2">
            {headers.map(header => (
                <div 
                    key={header.id}
                    className={`
                        cursor-pointer px-2 py-1 text-sm truncate hover:bg-white/10 transition-colors flex-shrink-0
                        ${activeBlockId === header.id ? 'bg-blue-600/30 text-blue-300' : 'text-gray-300'}
                    `}
                    style={{ 
                        paddingLeft: `${(header.level - 1) * 12 + 12}px`,
                        fontSize: header.level === 1 ? '14px' : '13px',
                        fontWeight: header.level === 1 ? 'bold' : 'normal',
                        opacity: header.level > 3 ? 0.8 : 1
                    }}
                    onClick={() => onNavigate(header.id)}
                    title={header.title}
                >
                    {header.title}
                </div>
            ))}
        </div>
    );
};
