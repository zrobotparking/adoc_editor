import React, { forwardRef } from 'react';
import { type Block } from '../../core/types';
import { PreviewBlock } from './PreviewBlock';
import './asciidoc.css';

interface DocPreviewProps {
    blocks: Block[];
    onEditBlock: (id: string, type: 'table' | 'text') => void;
    onUpdateBlock: (id: string, content: any) => void;
    onCancelEdit: () => void;
    activeBlockId: string | null;
    highlightedBlockIds?: string[];
    highlightText?: string;
    onScroll?: (scrollTop: number, ratio: number) => void;
}

export const DocPreview = forwardRef<HTMLDivElement, DocPreviewProps>(({ 
    blocks, 
    onEditBlock, 
    onUpdateBlock,
    onCancelEdit,
    activeBlockId,
    highlightedBlockIds = [],
    highlightText,
    onScroll
}, ref) => {
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!onScroll) return;
        const target = e.currentTarget;
        const { scrollTop, scrollHeight, clientHeight } = target;
        const ratio = scrollTop / (scrollHeight - clientHeight || 1);
        onScroll(scrollTop, ratio);
    };

    return (
        <div 
            ref={ref} 
            onScroll={handleScroll}
            className="asciidoc-preview p-4 bg-preview-bg text-preview-text h-full overflow-auto font-sans leading-relaxed"
        >
            {blocks.map((block) => (
                <PreviewBlock 
                    key={block.id} 
                    block={block} 
                    isEditing={block.id === activeBlockId} 
                    isHighlighted={highlightedBlockIds.includes(block.id)}
                    highlightText={highlightText}
                    onEdit={() => onEditBlock(block.id, block.type)}
                    onUpdate={(content) => onUpdateBlock(block.id, content)}
                    onCancel={onCancelEdit}
                />
            ))}
        </div>
    );
});

DocPreview.displayName = 'DocPreview';
