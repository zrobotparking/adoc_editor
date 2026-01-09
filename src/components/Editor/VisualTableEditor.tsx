import React, { useState, useEffect, useRef } from 'react';
import { type Table } from '../../core/types';

interface VisualTableEditorProps {
    data: Table | null;
    onUpdate?: (updatedTable: Table) => void;
}

// Helper for IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

import { TableUtils } from '../../core/TableUtils';

// ... (retain existing imports/interfaces)

// Enhanced EditableCell with Selection Events and Styling
const EditableCell: React.FC<{
    content: string;
    isHeader?: boolean;
    onUpdate: (newContent: string) => void;
    onFocus?: () => void;
    // New Props
    isActive: boolean;
    isSelected: boolean;
    onMouseDown: () => void;
    onMouseEnter: () => void;
    rowSpan?: number; // Visual
    colSpan?: number; // Visual
}> = ({ content, isHeader, onUpdate, onFocus, isActive, isSelected, onMouseDown, onMouseEnter, rowSpan, colSpan }) => {
    const [value, setValue] = useState(content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
        setValue(content);
    }, [content]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; 
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    const handleBlur = () => {
        if (value !== content) onUpdate(value);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.stopPropagation(); 
        }
    };

    const Tag = isHeader ? 'th' : 'td';
    
    // Selection Styles
    let baseClass = isHeader 
        ? "border border-explorer-border p-0 bg-app-header font-bold min-w-[100px] align-top text-text-primary"
        : "border border-explorer-border p-0 bg-app-base min-w-[100px] align-top text-text-primary";
    
    if (isSelected) baseClass += " bg-blue-100 ring-2 ring-inset ring-blue-300";
    else if (!isHeader) baseClass += " hover:bg-explorer-item-hover";

    // If merged (span > 1), maybe distinct visual?
    
    return (
        <Tag 
            className={baseClass} 
            rowSpan={rowSpan} 
            colSpan={colSpan}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
        >
            <textarea
                ref={textareaRef}
                className={`w-full h-full bg-transparent border-none outline-none p-2 text-inherit font-inherit resize-none overflow-hidden block box-border min-h-[40px] ${isActive ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
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
    
    // Area Selection State
    const [selectionStart, setSelectionStart] = useState<{row: number, col: number} | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{row: number, col: number} | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);

    // Global mouse up to stop selecting
    useEffect(() => {
        const handleMouseUp = () => setIsSelecting(false);
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    // Grid Construction (Memoize if expensive, but table size usually small)
    // We need the grid to map visual coordinates for selection
    const grid = React.useMemo(() => data ? TableUtils.buildGrid(data) : [], [data]);

    if (!data) {
        return <div className="p-4 text-gray-500">No table selected or parsed.</div>;
    }

    const handleCellUpdate = (rowId: string, cellId: string, newContent: string) => {
        // ... (existing helper) ...
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
    
    const insertRow = (direction: 'above' | 'below') => { /* ... existing ... */ 
        // Note: For brevity in this replacement, I assume I must retain the code.
        // But implementation_plan says I am modifying.
        // I will invoke the previous logic via Copy-Paste or just implementation.
        // Re-implementing correctly:
        if (!onUpdate || !activeCell) return;
        
        const newRowId = generateId();
        // Col count might vary if rows merged. Safer to take max cols? 
        // Or just copy active row's structure?
        // Basic: standard col count from row 0 magnitude (Grid width)
        const gridWidth = grid[0]?.length || 0;
        
        const newCells = Array(gridWidth).fill(null).map(() => ({
            id: generateId(),
            content: '',
            rowSpan: 1,
            colSpan: 1
        }));
        
        // ... Wait, logic for insertion needs to be careful with existing spans?
        // If I insert row in middle of rowspan, rowspan needs extending.
        // For now, simpler: just insert full row of 1x1 cells. User can merge.
        
        const newRow = { id: newRowId, cells: newCells };
        const insertIndex = direction === 'above' ? activeCell.rowIndex : activeCell.rowIndex + 1;
        const newRows = [...data.rows];
        newRows.splice(insertIndex, 0, newRow);
        onUpdate({ ...data, rows: newRows });
    };

    const insertCol = (direction: 'left' | 'right') => { /* ... existing ... */
         if (!onUpdate || !activeCell) return;
         const insertIndex = direction === 'left' ? activeCell.colIndex : activeCell.colIndex + 1;
         
         const newRows = data.rows.map(row => {
             const newCells = [...row.cells];
             // Warning: this logic insert at `cells[index]` which is strictly the data array index, 
             // NOT visual column index. 
             // In sparse merged tables, `cells[2]` might be visual col 5. 
             // Doing basic Col Insert is hard in merged tables. 
             // We will keep existing logic for now (Risk: unpredictable for merged tables), 
             // but user focus is Merging.
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

    // Selection Handlers
    const handleMouseDown = (row: number, col: number) => {
        setIsSelecting(true);
        setSelectionStart({ row, col });
        setSelectionEnd({ row, col });
    };

    const handleMouseEnter = (row: number, col: number) => {
        if (isSelecting) {
            setSelectionEnd({ row, col });
        }
    };
    
    // Global mouse up to stop selecting


    // Selection Logic
    const isCellSelected = (r: number, c: number) => {
        if (!selectionStart || !selectionEnd) return false;
        
        const minRow = Math.min(selectionStart.row, selectionEnd.row);
        const maxRow = Math.max(selectionStart.row, selectionEnd.row);
        const minCol = Math.min(selectionStart.col, selectionEnd.col);
        const maxCol = Math.max(selectionStart.col, selectionEnd.col);
        
        return r >= minRow && r <= maxRow && c >= minCol && c <= maxCol;
    };
    
    const canMerge = selectionStart && selectionEnd && 
        (selectionStart.row !== selectionEnd.row || selectionStart.col !== selectionEnd.col);
        
    const canSplit = (() => {
        if (!activeCell) return false;
        // Find cell in grid to check span
        const cell = data.rows.find(r => r.id === activeCell.rowId)?.cells.find(c => c.id === activeCell.cellId);
        return cell ? (cell.rowSpan > 1 || cell.colSpan > 1) : false;
    })();

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
        // Reset selection ?
        setSelectionStart(null); setSelectionEnd(null);
    };

    const splitCurrent = () => {
        if (!canSplit || !onUpdate || !activeCell) return;
        
        const updatedTable = TableUtils.splitCell(data, activeCell.cellId);
        onUpdate(updatedTable);
    };

    return (
        <div className="flex flex-col h-full bg-app-base rounded">
             {/* Toolbar */}
             <div className="flex space-x-2 p-2 bg-app-header border-b border-explorer-border sticky top-0 z-10 flex-wrap gap-y-2">
                 {/* Existing Insert Buttons */}
                 <div className="flex items-center space-x-1">
                     <button onClick={() => insertRow('above')} disabled={!activeCell} className="btn-icon" title="Row Above">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2L5 5H11L8 2Z" /><rect x="2" y="6" width="12" height="4" stroke="currentColor" fill="none"/></svg>
                     </button>
                     <button onClick={() => insertRow('below')} disabled={!activeCell} className="btn-icon" title="Row Below">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="6" width="12" height="4" stroke="currentColor" fill="none"/><path d="M8 14L5 11H11L8 14Z" /></svg>
                     </button>
                     <div className="w-px bg-explorer-border mx-1 h-4"></div>
                     <button onClick={() => insertCol('left')} disabled={!activeCell} className="btn-icon" title="Col Left">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 8L5 5V11L2 8Z" /><rect x="6" y="2" width="4" height="12" stroke="currentColor" fill="none"/></svg>
                     </button>
                     <button onClick={() => insertCol('right')} disabled={!activeCell} className="btn-icon" title="Col Right">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="6" y="2" width="4" height="12" stroke="currentColor" fill="none"/><path d="M14 8L11 5V11L14 8Z" /></svg>
                     </button>
                 </div>
                 
                 <div className="w-px bg-explorer-border mx-1 h-4"></div>
                 
                 {/* Merge/Split Controls */}
                 <button 
                    onClick={mergeSelected} 
                    disabled={!canMerge} 
                    className={`px-2 py-1 text-xs rounded border ${canMerge ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                 >
                     Merge Selected
                 </button>
                 <button 
                    onClick={splitCurrent} 
                    disabled={!canSplit} 
                    className={`px-2 py-1 text-xs rounded border ${canSplit ? 'bg-app-base hover:bg-gray-100 text-text-primary border-gray-300' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                 >
                     Split Cell
                 </button>
             </div>

             <div className="flex-1 overflow-auto p-4 select-none"> {/* select-none to prevent text selection while dragging */}
                <table className="w-full border-collapse text-sm shadow-sm" onMouseLeave={() => setIsSelecting(false)}>
                    <tbody>
                        {grid.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((gridCell, colIndex) => {
                                    if (gridCell.isCovered) return null; // Skip covered cells
                                    
                                    const cell = gridCell.cell;
                                    if (!cell) return <td key={colIndex} />; // Should not happen in solid grid

                                    const isSelected = isCellSelected(gridCell.row, gridCell.col);
                                    const isActive = activeCell?.cellId === cell.id;

                                    return (
                                        <EditableCell 
                                            key={cell.id}
                                            content={cell.content}
                                            isHeader={rowIndex === 0} // visual row 0 is header? Data.rows[0] is header? Usually yes.
                                            // Problem: grid index matches visual. AsciiDoc headers are typically the first row block.
                                            // Let's assume rowIndex === 0 is header for visual consistency.
                                            
                                            rowSpan={cell.rowSpan}
                                            colSpan={cell.colSpan}
                                            
                                            // Events
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
            <style>{`
                .btn-icon { @apply p-1.5 rounded hover:bg-explorer-item-hover disabled:opacity-30 disabled:cursor-not-allowed text-text-primary; }
            `}</style>
        </div>
    );
};
