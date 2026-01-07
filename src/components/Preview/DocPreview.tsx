import React from 'react';
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

export const DocPreview: React.FC<DocPreviewProps> = ({ 
    blocks, 
    onEditBlock, 
    onUpdateBlock,
    onCancelEdit,
    activeBlockId
}) => {
    return (
        <div className="asciidoc-preview prose max-w-none p-4 bg-white text-black min-h-full">
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
};
