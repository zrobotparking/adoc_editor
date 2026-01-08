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
}

export const DocPreview = forwardRef<HTMLDivElement, DocPreviewProps>(({ 
    blocks, 
    onEditBlock, 
    onUpdateBlock,
    onCancelEdit,
    activeBlockId,
    highlightedBlockIds = [],
    highlightText
}, ref) => {
    return (
        <div ref={ref} className="asciidoc-preview p-4 bg-preview-bg text-preview-text h-full overflow-auto font-sans leading-relaxed">
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
