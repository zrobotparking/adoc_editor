import React from 'react';
import { type Table } from '../../core/types';

interface VisualTableEditorProps {
    data: Table | null;
    onUpdate?: (updatedTable: Table) => void;
}

export const VisualTableEditor: React.FC<VisualTableEditorProps> = ({ data, onUpdate }) => {
    if (!data) {
        return <div className="p-4 text-gray-500">No table selected or parsed.</div>;
    }

    const handleCellChange = (rowId: string, cellId: string, newContent: string) => {
        if (!onUpdate) return;

        // Create a deep copy of the table to avoid mutating props
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
                   {/* Simplified rendering: First row as header for now, logic to be improved */}
                   {data.rows.length > 0 && (
                       <tr>
                           {data.rows[0].cells.map((cell) => (
                               <th 
                                   key={cell.id} 
                                   className="border border-[#3c3c3c] p-2 text-left bg-[#333333] font-bold"
                                   contentEditable
                                   suppressContentEditableWarning
                                   onBlur={(e) => handleCellChange(data.rows[0].id, cell.id, e.currentTarget.textContent || '')}
                               >
                                   {cell.content}
                               </th>
                           ))}
                       </tr>
                   )}
                </thead>
                <tbody>
                    {data.rows.slice(1).map((row) => (
                        <tr key={row.id}>
                            {row.cells.map((cell) => (
                                <td 
                                    key={cell.id}
                                    className="border border-[#3c3c3c] p-2 text-left align-top outline-none hover:bg-[#264f78]"
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleCellChange(row.id, cell.id, e.currentTarget.textContent || '')}
                                >
                                    {cell.content}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
             </table>
        </div>
    );
};
