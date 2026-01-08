import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { type Block } from '../../core/types';
import { PreviewBlock } from './PreviewBlock';
import './asciidoc.css';

export interface DocPreviewHandle {
    scrollToBlock: (id: string) => void;
    scrollToRatio: (ratio: number) => void;
}

interface DocPreviewProps {
    blocks: Block[];
    onEditBlock: (id: string, type: 'table' | 'text') => void;
    onUpdateBlock: (id: string, content: any) => void;
    onCancelEdit: () => void;
    activeBlockId: string | null;
    highlightedBlockIds?: string[];
    highlightText?: string;
    onScroll?: (scrollTop: number, ratio: number) => void;
    files?: Record<string, string>;
}

export const DocPreview = forwardRef<DocPreviewHandle, DocPreviewProps>(({ 
    blocks, 
    onEditBlock, 
    onUpdateBlock,
    onCancelEdit,
    activeBlockId,
    highlightedBlockIds = [],
    highlightText,
    onScroll,
    files
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        scrollToBlock: (id: string) => {
            if (containerRef.current) {
                const el = containerRef.current.querySelector(`[data-block-id="${id}"]`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        },
        scrollToRatio: (ratio: number) => {
             if (containerRef.current) {
                const { scrollHeight, clientHeight } = containerRef.current;
                containerRef.current.scrollTop = ratio * (scrollHeight - clientHeight);
            }
        }
    }));

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (!onScroll) return;
        const target = e.currentTarget;
        const { scrollTop, scrollHeight, clientHeight } = target;
        const ratio = scrollTop / (scrollHeight - clientHeight || 1);
        onScroll(scrollTop, ratio);
    };

    return (
        <div 
            ref={containerRef} 
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
                    files={files}
                    onEdit={() => onEditBlock(block.id, block.type)}
                    onUpdate={(content) => onUpdateBlock(block.id, content)}
                    onCancel={onCancelEdit}
                />
            ))}
        </div>
    );
});

DocPreview.displayName = 'DocPreview';
