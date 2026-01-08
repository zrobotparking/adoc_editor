import React, { useState, useEffect, useRef } from 'react';
import { type Table } from '../../core/types';

interface VisualTableEditorProps {
    data: Table | null;
    onUpdate?: (updatedTable: Table) => void;
}

// Helper for IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

const EditableCell: React.FC<{
    content: string;
    isHeader?: boolean;
    onUpdate: (newContent: string) => void;
    onFocus?: () => void;
}> = ({ content, isHeader, onUpdate, onFocus }) => {
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
                onFocus={onFocus}
                onKeyDown={handleKeyDown}
                rows={1}
            />
        </Tag>
    );
};

export const VisualTableEditor: React.FC<VisualTableEditorProps> = ({ data, onUpdate }) => {
    const [activeCell, setActiveCell] = useState<{ rowId: string, cellId: string, rowIndex: number, colIndex: number } | null>(null);

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

    const insertRow = (direction: 'above' | 'below') => {
        if (!onUpdate || !activeCell) return;
        
        const newRowId = generateId();
        const colCount = data.rows[0]?.cells.length || 0;
        const newCells = Array(colCount).fill(null).map(() => ({
            id: generateId(),
            content: '',
            rowSpan: 1,
            colSpan: 1
        }));

        const newRow = { id: newRowId, cells: newCells };
        const insertIndex = direction === 'above' ? activeCell.rowIndex : activeCell.rowIndex + 1;

        const newRows = [...data.rows];
        newRows.splice(insertIndex, 0, newRow);

        onUpdate({ ...data, rows: newRows });
    };

    const insertCol = (direction: 'left' | 'right') => {
         if (!onUpdate || !activeCell) return;

         const insertIndex = direction === 'left' ? activeCell.colIndex : activeCell.colIndex + 1;
         
         const newRows = data.rows.map(row => {
             const newCells = [...row.cells];
             newCells.splice(insertIndex, 0, {
                 id: generateId(),
                 content: '',
                 rowSpan: 1,
                 colSpan: 1
             });
             return { ...row, cells: newCells };
         });

         onUpdate({ ...data, rows: newRows });
    };

    return (
        <div className="flex flex-col h-full bg-app-base rounded">
             {/* Toolbar */}
             <div className="flex space-x-2 p-2 bg-app-header border-b border-explorer-border sticky top-0 z-10">
                 <button 
                    onClick={() => insertRow('above')} 
                    disabled={!activeCell}
                    className="p-1.5 rounded hover:bg-explorer-item-hover disabled:opacity-30 disabled:cursor-not-allowed text-text-primary"
                    title="Insert Row Above"
                 >
                    {/* Icon: Row with arrow up */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="2" y="6" width="12" height="4" stroke="currentColor" fill="none" rx="1"/>
                        <path d="M8 2L5 5H11L8 2Z" />
                    </svg>
                 </button>
                 <button 
                    onClick={() => insertRow('below')} 
                    disabled={!activeCell}
                    className="p-1.5 rounded hover:bg-explorer-item-hover disabled:opacity-30 disabled:cursor-not-allowed text-text-primary"
                    title="Insert Row Below"
                 >
                     {/* Icon: Row with arrow down */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="2" y="6" width="12" height="4" stroke="currentColor" fill="none" rx="1"/>
                        <path d="M8 14L5 11H11L8 14Z" />
                    </svg>
                 </button>
                 <div className="w-px bg-explorer-border mx-1"></div>
                 <button 
                    onClick={() => insertCol('left')} 
                    disabled={!activeCell}
                    className="p-1.5 rounded hover:bg-explorer-item-hover disabled:opacity-30 disabled:cursor-not-allowed text-text-primary"
                    title="Insert Column Left"
                 >
                    {/* Icon: Col with arrow left */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="6" y="2" width="4" height="12" stroke="currentColor" fill="none" rx="1"/>
                        <path d="M2 8L5 5V11L2 8Z" />
                    </svg>
                 </button>
                 <button 
                    onClick={() => insertCol('right')} 
                    disabled={!activeCell}
                    className="p-1.5 rounded hover:bg-explorer-item-hover disabled:opacity-30 disabled:cursor-not-allowed text-text-primary"
                    title="Insert Column Right"
                 >
                     {/* Icon: Col with arrow right */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="6" y="2" width="4" height="12" stroke="currentColor" fill="none" rx="1"/>
                        <path d="M14 8L11 5V11L14 8Z" />
                    </svg>
                 </button>
             </div>

             <div className="flex-1 overflow-auto p-4">
                <table className="w-full border-collapse text-sm shadow-sm">
                    <thead>
                    {data.rows.length > 0 && (
                        <tr>
                            {data.rows[0].cells.map((cell, colIndex) => (
                                <EditableCell 
                                    key={cell.id}
                                    content={cell.content}
                                    isHeader={true}
                                    onUpdate={(val) => handleCellUpdate(data.rows[0].id, cell.id, val)}
                                    // Header is row 0
                                    onFocus={() => setActiveCell({ rowId: data.rows[0].id, cellId: cell.id, rowIndex: 0, colIndex })}
                                />
                            ))}
                        </tr>
                    )}
                    </thead>
                    <tbody>
                        {data.rows.slice(1).map((row, rowIndex) => (
                            <tr key={row.id}>
                                {row.cells.map((cell, colIndex) => (
                                    <EditableCell 
                                        key={cell.id}
                                        content={cell.content}
                                        isHeader={false}
                                        onUpdate={(val) => handleCellUpdate(row.id, cell.id, val)}
                                        // Body rows start at index 1 effectively for this slice, but globally rowIndex + 1
                                        onFocus={() => setActiveCell({ rowId: row.id, cellId: cell.id, rowIndex: rowIndex + 1, colIndex })}
                                    />
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
