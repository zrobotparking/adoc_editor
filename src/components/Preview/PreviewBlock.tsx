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
    files?: Record<string, string>;
}

export const PreviewBlock: React.FC<PreviewBlockProps> = ({ 
    block, 
    isEditing, 
    isHighlighted,
    highlightText,
    onEdit, 
    onUpdate,
    onCancel,
    files = {}
}) => {
    const [html, setHtml] = useState('');

    useEffect(() => {
        if (!isEditing) {
            let converted = '';
            
            // Create a custom registry for this conversion
            const registry = asciidoctor.Extensions.create();
            
            // Register Include Processor
            registry.includeProcessor(function() {
                const self = this;
                self.handles((target: string) => true);
                self.process((doc: any, reader: any, target: string, attrs: any) => {
                    // 1. Try exact match
                    if (files && files[target]) {
                        reader.pushInclude(files[target], target, target, 1, attrs);
                        return;
                    }

                    // 2. Try fuzzy match (suffix match)
                    // This handles cases where file is "folder/doc.adoc" but include is "doc.adoc" (if at root)
                    // or relative paths if we assume flattened or unique filenames.
                    if (files) {
                        const keys = Object.keys(files);
                        // Search for key ending with "/target" or exactly "target"
                        // We iterate to find a potential match.
                        const match = keys.find(k => k === target || k.endsWith('/' + target) || k.endsWith('\\' + target));
                        
                        if (match) {
                            console.log(`[Include] Resolved '${target}' to '${match}'`);
                            reader.pushInclude(files[match], match, match, 1, attrs);
                            return;
                        }
                    }

                    // 3. Not Found
                    console.warn(`[Include] File not found: ${target}. Available:`, Object.keys(files || {}));
                    reader.pushInclude(`Unresolved directive in <stdin> - include::${target}[]`, target, target, 1, attrs);
                });
            });

            const options = { 
                safe: 'safe', 
                attributes: { 'showtitle': true },
                extension_registry: registry 
            };

            if (block.type === 'text') {
                converted = asciidoctor.convert(block.content, options) as string;
            } else if (block.type === 'table') {
                const serializer = new BasicTableSerializer();
                let adoc = serializer.serialize(block.table);
                
                // Prepend attributes and title for correct rendering
                let header = '';
                if (block.title) header += `.${block.title}\n`;
                if (block.attributes && block.attributes.length > 0) {
                    header += block.attributes.join('\n') + '\n';
                }
                
                adoc = header + adoc;
                converted = asciidoctor.convert(adoc, options) as string;
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

    // Handle Click Outside to Auto-Close
    const editContainerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isEditing) return;

        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is outside the edit container
            if (editContainerRef.current && !editContainerRef.current.contains(event.target as Node)) {
                // Optional: Ignore if click is on a portal/overlay (if any exist in future)
                // For now, straightforward check.
                onCancel();
            }
        };

        // Use mousedown to capture immediately (standard for dismissals)
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
             document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditing, onCancel]);

    if (isEditing) {
        return (
            <div 
                ref={editContainerRef}
                className="my-4 border-2 border-edit-border rounded-lg shadow-lg bg-edit-bg overflow-hidden"
            >
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
            data-block-id={block.id}
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
