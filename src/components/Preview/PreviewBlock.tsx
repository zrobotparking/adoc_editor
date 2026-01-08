import React, { useState, useEffect } from 'react';
import Asciidoctor from 'asciidoctor';
import { type Block } from '../../core/types';
import { VisualTableEditor } from '../Editor/VisualTableEditor';
import { VisualTextEditor } from '../Editor/VisualTextEditor';
import { BasicTableSerializer } from '../../core/TableSerializer';

const asciidoctor = Asciidoctor();

// Helper to escape regex special characters
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface PreviewBlockProps {
    block: Block;
    isEditing: boolean;
    isHighlighted?: boolean;
    highlightText?: string;
    onEdit: () => void;
    onUpdate: (content: string | any) => void;
    onCancel: () => void;
}

export const PreviewBlock: React.FC<PreviewBlockProps> = ({ 
    block, 
    isEditing, 
    isHighlighted,
    highlightText,
    onEdit, 
    onUpdate,
    onCancel
}) => {
    const [html, setHtml] = useState('');

    useEffect(() => {
        if (!isEditing) {
            let converted = '';
            if (block.type === 'text') {
                converted = asciidoctor.convert(block.content, { safe: 'safe', attributes: { 'showtitle': true } }) as string;
            } else if (block.type === 'table') {
                const serializer = new BasicTableSerializer();
                const adoc = serializer.serialize(block.table);
                converted = asciidoctor.convert(adoc, { safe: 'safe' }) as string;
            }

            // Apply Text Highlight if Block is Highlighted and there is text selected
            // Apply Text Highlight if Block is Highlighted and there is text selected
            if (isHighlighted && highlightText && highlightText.trim().length > 0) {
                const escaped = escapeRegExp(highlightText);
                const regex = new RegExp(`(${escaped})`, 'gi');
                converted = converted.replace(regex, '<span style="background-color: rgba(255, 255, 0, 0.4); color: inherit;">$1</span>');
            }

            setHtml(converted);
        }
    }, [block, isEditing, isHighlighted, highlightText]);

    if (isEditing) {
        return (
            <div className="my-4 border-2 border-edit-border rounded-lg shadow-lg bg-edit-bg overflow-hidden">
                <div className="flex justify-between items-center p-2 bg-app-header border-b border-edit-border">
                    <span className="font-bold text-sm text-edit-label uppercase">
                        Editing {block.type}
                    </span>
                    <div className="space-x-2">
                        <button 
                            onClick={onCancel}
                            className="px-3 py-1 text-xs text-btn-secondary-text bg-btn-secondary hover:bg-btn-secondary-hover rounded"
                        >
                            Cancel (ESC)
                        </button>
                        <button 
                            onClick={onCancel} 
                            className="px-3 py-1 text-xs bg-btn-primary text-btn-primary-text rounded hover:bg-opacity-90"
                        >
                            Done
                        </button>
                    </div>
                </div>
                
                <div className="p-4">
                    {block.type === 'table' ? (
                        <VisualTableEditor 
                            data={block.table} 
                            onUpdate={onUpdate} 
                        />
                    ) : (
                        <VisualTextEditor 
                            initialContent={block.content} 
                            onUpdate={onUpdate} 
                        />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`preview-block rounded p-1 transition-all cursor-pointer relative group ${
                isHighlighted 
                    ? 'ring-1 ring-yellow-500/50' 
                    : 'hover:ring-2 ring-blue-200'
            }`}
            onClick={(e) => {
                e.stopPropagation();
                onEdit();
            }}
        >
             {/* Hover indicator */}
            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Edit</span>
            </div>

            <div 
                className={`prose max-w-none ${isHighlighted ? 'highlight-content' : ''}`}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
};
