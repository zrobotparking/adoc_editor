import { useState, useEffect, useCallback } from 'react';
import type { Table } from '../core/types';
import { TableUtils, type Grid } from '../core/TableUtils'; // Assuming relative path adjustment

interface SelectionState {
    selectionStart: {row: number, col: number} | null;
    selectionEnd: {row: number, col: number} | null;
    isSelecting: boolean;
}

export const useTableSelection = (data: Table | null) => {
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

    // Selection Handlers
    const handleMouseDown = useCallback((row: number, col: number) => {
        setIsSelecting(true);
        setSelectionStart({ row, col });
        setSelectionEnd({ row, col });
    }, []);

    const handleMouseEnter = useCallback((row: number, col: number) => {
        if (isSelecting) {
            setSelectionEnd({ row, col });
        }
    }, [isSelecting]);

    const stopSelecting = useCallback(() => {
        setIsSelecting(false);
    }, []);

    // Logic
    const isCellSelected = useCallback((r: number, c: number) => {
        if (!selectionStart || !selectionEnd) return false;
        
        const minRow = Math.min(selectionStart.row, selectionEnd.row);
        const maxRow = Math.max(selectionStart.row, selectionEnd.row);
        const minCol = Math.min(selectionStart.col, selectionEnd.col);
        const maxCol = Math.max(selectionStart.col, selectionEnd.col);
        
        return r >= minRow && r <= maxRow && c >= minCol && c <= maxCol;
    }, [selectionStart, selectionEnd]);

    const canMerge = selectionStart && selectionEnd && 
        (selectionStart.row !== selectionEnd.row || selectionStart.col !== selectionEnd.col);
    
    // Reset
    const clearSelection = useCallback(() => {
        setSelectionStart(null);
        setSelectionEnd(null);
    }, []);

    return {
        selectionStart,
        selectionEnd,
        isSelecting,
        handleMouseDown,
        handleMouseEnter,
        stopSelecting,
        isCellSelected,
        canMerge,
        clearSelection
    };
};
