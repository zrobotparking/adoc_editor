import React, { useState, useEffect, useRef } from 'react';
import { type Table } from '../../core/types';

interface VisualTableEditorProps {
    data: Table | null;
    onUpdate?: (updatedTable: Table) => void;
}

const EditableCell: React.FC<{
    content: string;
    isHeader?: boolean;
    onUpdate: (newContent: string) => void;
}> = ({ content, isHeader, onUpdate }) => {
    const [value, setValue] = useState(content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    // Sync internal state if prop changes
    useEffect(() => {
        setValue(content);
    }, [content]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset height
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; // Set to scrollHeight
        }
    }, [value]);

    const handleBlur = () => {
        if (value !== content) {
            onUpdate(value);
        }
    };
    
    // Allow Enter key to work naturally for newlines, stop propagation if needed for parent listeners
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.stopPropagation(); // Prevent any parent Enter handlers (e.g. Save)
        }
    };

    const Tag = isHeader ? 'th' : 'td';
    // Style: Use semantic classes
    const className = isHeader 
        ? "border border-explorer-border p-0 bg-app-header font-bold min-w-[100px] align-top text-text-primary"
        : "border border-explorer-border p-0 bg-app-base hover:bg-explorer-item-hover min-w-[100px] align-top text-text-primary";

    return (
        <Tag className={className}>
            <textarea
                ref={textareaRef}
                className="w-full h-full bg-transparent border-none outline-none p-2 text-inherit font-inherit resize-none overflow-hidden block box-border min-h-[40px] focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                rows={1}
            />
        </Tag>
    );
};

export const VisualTableEditor: React.FC<VisualTableEditorProps> = ({ data, onUpdate }) => {
    if (!data) {
        return <div className="p-4 text-gray-500">No table selected or parsed.</div>;
    }

    const handleCellUpdate = (rowId: string, cellId: string, newContent: string) => {
        if (!onUpdate) return;

        const newTable = {
            ...data,
            rows: data.rows.map(row => {
                if (row.id !== rowId) return row;
                return {
                    ...row,
                    cells: row.cells.map(cell => {
                        if (cell.id !== cellId) return cell;
                        return { ...cell, content: newContent };
                    })
                };
            })
        };

        onUpdate(newTable);
    };

    return (
        <div className="flex-1 overflow-auto p-4 font-sans bg-app-base rounded">
             <table className="w-full border-collapse text-sm shadow-sm">
                <thead>
                   {/* Simplified rendering: First row as header for now */}
                   {data.rows.length > 0 && (
                       <tr>
                           {data.rows[0].cells.map((cell) => (
                               <EditableCell 
                                   key={cell.id}
                                   content={cell.content}
                                   isHeader={true}
                                   onUpdate={(val) => handleCellUpdate(data.rows[0].id, cell.id, val)}
                               />
                           ))}
                       </tr>
                   )}
                </thead>
                <tbody>
                    {data.rows.slice(1).map((row) => (
                        <tr key={row.id}>
                            {row.cells.map((cell) => (
                                <EditableCell 
                                    key={cell.id}
                                    content={cell.content}
                                    isHeader={false}
                                    onUpdate={(val) => handleCellUpdate(row.id, cell.id, val)}
                                />
                            ))}
                        </tr>
                    ))}
                </tbody>
             </table>
        </div>
    );
};
