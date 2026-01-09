import React, { useState } from 'react';
import { type Table } from '../../core/types';
import { TableUtils } from '../../core/TableUtils';
import { EditableCell } from './Table/EditableCell';
import { TableToolbar } from './Table/TableToolbar';
import { useTableSelection } from '../../hooks/useTableSelection';

interface VisualTableEditorProps {
    data: Table | null;
    onUpdate?: (updatedTable: Table) => void;
}

// Helper for IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const VisualTableEditor: React.FC<VisualTableEditorProps> = ({ data, onUpdate }) => {
    const [activeCell, setActiveCell] = useState<{ rowId: string, cellId: string, rowIndex: number, colIndex: number } | null>(null);
    
    // Custom Hook for Selection Logic
    const {
        selectionStart,
        selectionEnd,
        handleMouseDown,
        handleMouseEnter,
        stopSelecting,
        isCellSelected,
        canMerge,
        clearSelection
    } = useTableSelection(data);

    // Grid Construction (Memoize if expensive, but table size usually small)
    const grid = React.useMemo(() => data ? TableUtils.buildGrid(data) : [], [data]);

    if (!data) {
        return <div className="p-4 text-gray-500">No table selected or parsed.</div>;
    }

    // --- Actions ---

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
        const gridWidth = grid[0]?.length || 0;
        const newCells = Array(gridWidth).fill(null).map(() => ({
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

    const mergeSelected = () => {
        if (!canMerge || !onUpdate || !selectionStart || !selectionEnd) return;
        
        const updatedTable = TableUtils.mergeCells(
            data, 
            selectionStart.row, 
            selectionStart.col, 
            selectionEnd.row, 
            selectionEnd.col
        );
        onUpdate(updatedTable);
        clearSelection();
    };

    const canSplit = (() => {
        // 1. Check Active Cell (Focus)
        if (activeCell) {
            // Robust lookup across all rows
            for (const row of data.rows) {
                const cell = row.cells.find(c => c.id === activeCell.cellId);
                if (cell && (cell.rowSpan > 1 || cell.colSpan > 1)) return true;
            }
        }

        // 2. Check Selection (Click)
        // If we selected a single grid slot (start==end), check if it contains a merged cell
        if (selectionStart && selectionEnd && selectionStart.row === selectionEnd.row && selectionStart.col === selectionEnd.col) {
             const gCell = grid[selectionStart.row]?.[selectionStart.col];
             // Note: If we clicked a covered cell, VisualTableEditor only renders event handlers on the Origin cell?
             // No, EditableCell renders only for Origin. Covered cells aren't rendered or are empty <td>.
             // If user clicks empty covered area, `handleMouseDown` might not fire if no handler?
             // Actually VisualTableEditor renders `null` for covered (line 135).
             // So user can only click Origin or normal cells.
             
             if (gCell && gCell.cell) {
                 return gCell.cell.rowSpan > 1 || gCell.cell.colSpan > 1;
             }
        }
        
        return false;
    })();

    const splitCurrent = () => {
        if (!canSplit || !onUpdate) return;
        
        let targetCellId = null;
        
        // 1. Try Active Cell
        if (activeCell) {
            targetCellId = activeCell.cellId;
        } 
        // 2. Try Selection (if single cell selected)
        else if (selectionStart && selectionEnd && selectionStart.row === selectionEnd.row && selectionStart.col === selectionEnd.col) {
             const gCell = grid[selectionStart.row]?.[selectionStart.col];
             if (gCell && gCell.cell) {
                 targetCellId = gCell.cell.id;
             }
        }
        
        if (!targetCellId) return;

        const updatedTable = TableUtils.splitCell(data, targetCellId);
        onUpdate(updatedTable);
    };

    return (
        <div className="flex flex-col h-full bg-app-base rounded">
             <TableToolbar 
                onInsertRow={insertRow}
                onInsertCol={insertCol}
                onMerge={mergeSelected}
                onSplit={splitCurrent}
                canInsert={!!activeCell}
                canMerge={!!canMerge}
                canSplit={canSplit}
             />

             <div className="flex-1 overflow-auto p-4 select-none">
                <table className="w-full border-collapse text-sm shadow-sm" onMouseLeave={stopSelecting}>
                    <tbody>
                        {grid.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((gridCell, colIndex) => {
                                    if (gridCell.isCovered) return null; 
                                    
                                    const cell = gridCell.cell;
                                    if (!cell) return <td key={colIndex} />;

                                    const isSelected = isCellSelected(gridCell.row, gridCell.col);
                                    const isActive = activeCell?.cellId === cell.id;

                                    return (
                                        <EditableCell 
                                            key={cell.id}
                                            content={cell.content}
                                            isHeader={rowIndex === 0}
                                            rowSpan={cell.rowSpan}
                                            colSpan={cell.colSpan}
                                            
                                            onUpdate={(val) => handleCellUpdate(data.rows[gridCell.row]?.id || '', cell.id, val)}
                                            onFocus={() => setActiveCell({ rowId: data.rows[gridCell.row]?.id, cellId: cell.id, rowIndex, colIndex })}
                                            onMouseDown={() => handleMouseDown(gridCell.row, gridCell.col)}
                                            onMouseEnter={() => handleMouseEnter(gridCell.row, gridCell.col)}
                                            
                                            isActive={isActive}
                                            isSelected={isSelected}
                                        />
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
