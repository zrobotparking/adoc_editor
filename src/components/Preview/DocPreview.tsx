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
}

export const DocPreview = forwardRef<HTMLDivElement, DocPreviewProps>(({ 
    blocks, 
    onEditBlock, 
    onUpdateBlock,
    onCancelEdit,
    activeBlockId
}, ref) => {
    return (
        <div ref={ref} className="asciidoc-preview p-4 bg-preview-bg text-preview-text h-full overflow-auto font-sans leading-relaxed">
            {blocks.map((block) => (
                <PreviewBlock 
                    key={block.id} 
                    block={block} 
                    isEditing={block.id === activeBlockId} 
                    onEdit={() => onEditBlock(block.id, block.type)}
                    onUpdate={(content) => onUpdateBlock(block.id, content)}
                    onCancel={onCancelEdit}
                />
            ))}
        </div>
    );
});

DocPreview.displayName = 'DocPreview';
