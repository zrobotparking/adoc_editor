import React, { useState, useEffect } from 'react';
import Asciidoctor from 'asciidoctor';
import { type Block } from '../../core/types';
import { VisualTableEditor } from '../Editor/VisualTableEditor';
import { VisualTextEditor } from '../Editor/VisualTextEditor';
import { BasicTableSerializer } from '../../core/TableSerializer';

const asciidoctor = Asciidoctor();

interface PreviewBlockProps {
    block: Block;
    isEditing: boolean;
    onEdit: () => void;
    onUpdate: (content: string | any) => void;
    onCancel: () => void;
}

export const PreviewBlock: React.FC<PreviewBlockProps> = ({ 
    block, 
    isEditing, 
    onEdit, 
    onUpdate,
    onCancel
}) => {
    const [html, setHtml] = useState('');

    useEffect(() => {
        if (!isEditing) {
            // Render preview based on block type
            if (block.type === 'text') {
                const converted = asciidoctor.convert(block.content, { safe: 'safe', attributes: { 'showtitle': true } });
                setHtml(converted as string);
            } else if (block.type === 'table') {
                const serializer = new BasicTableSerializer();
                const adoc = serializer.serialize(block.table);
                const converted = asciidoctor.convert(adoc, { safe: 'safe' });
                setHtml(converted as string);
            }
        }
    }, [block, isEditing]);

    if (isEditing) {
        return (
            <div className="my-4 border-2 border-blue-500 rounded-lg shadow-lg bg-white dark:bg-gray-800 overflow-hidden">
                <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <span className="font-bold text-sm text-gray-600 dark:text-gray-200 uppercase">
                        Editing {block.type}
                    </span>
                    <div className="space-x-2">
                        <button 
                            onClick={onCancel}
                            className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
                        >
                            Cancel (ESC)
                        </button>
                        <button 
                            onClick={onCancel} // "Done" effectively acts as exit since updates are real-time or handled by parent
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
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
            className="preview-block hover:ring-2 ring-blue-200 rounded p-1 transition-all cursor-pointer relative group"
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
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
};
