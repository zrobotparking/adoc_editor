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
    
    // Sync internal state if prop changes (e.g. undo/redo or external update)
    useEffect(() => {
        setValue(content);
    }, [content]);

    const handleBlur = () => {
        if (value !== content) {
            onUpdate(value);
        }
    };

    const Tag = isHeader ? 'th' : 'td';
    const className = isHeader 
        ? "border border-[#3c3c3c] p-0 bg-[#333333] font-bold min-w-[100px]"
        : "border border-[#3c3c3c] p-0 hover:bg-[#264f78] min-w-[100px]";

    return (
        <Tag className={className}>
            <input
                className="w-full h-full bg-transparent border-none outline-none p-2 text-inherit font-inherit"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
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
        <div className="flex-1 overflow-auto bg-[#252526] p-4 font-sans text-[#d4d4d4]">
             <table className="w-full border-collapse text-sm">
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
