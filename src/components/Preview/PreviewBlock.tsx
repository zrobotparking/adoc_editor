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
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export const PreviewBlock: React.FC<PreviewBlockProps> = ({ 
    block, 
    isEditing, 
    isHighlighted,
    highlightText,
    onEdit, 
    onUpdate,
    onCancel,
    files = {},
    isCollapsed = false,
    onToggleCollapse
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
    }, [block, isEditing, isHighlighted, highlightText, files]); // Added files dependency

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
                if (!isCollapsed) onEdit(); // Only edit if expanded? Or double click? 
                // User said: "按一下可以把顯示block收合 ... 2邊都可以點". 
                // Wait, if clicking toggles collapse, how do we edit?
                // The prompt says: "have a small indicator... click to collapse".
                // So clicking the BLOCK edits, clicking the INDICATOR collapses.
                onEdit();
            }}
        >
             {/* Collapse Indicator - Top Left */}
             {onToggleCollapse && (
                 <div
                    className="absolute top-1 left-0 z-10 p-1 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleCollapse();
                    }}
                    title={isCollapsed ? "Expand" : "Collapse"}
                 >
                     <span className="text-gray-500 text-xs font-bold leading-none bg-app-base border border-explorer-border rounded px-1">
                         {isCollapsed ? '+' : '-'}
                     </span>
                 </div>
             )}

             {/* Hover indicator for Edit (Top Right) */}
             {!isCollapsed && (
                <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Edit</span>
                </div>
             )}

             {isCollapsed ? (
                 <div className="p-2 text-gray-400 font-mono text-sm italic border border-dashed border-gray-300 rounded">
                     {/* Show a preview snippet? */}
                     {block.type === 'table' ? `Table (${block.table.rows.length} rows)` : `${block.content.substring(0, 50)}...`}
                 </div>
             ) : (
                <div 
                    className={`prose max-w-none ${isHighlighted ? 'highlight-content' : ''}`}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
             )}
        </div>
    );
};
