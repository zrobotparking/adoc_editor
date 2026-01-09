import React from 'react';

interface TableToolbarProps {
    // Actions
    onInsertRow: (direction: 'above' | 'below') => void;
    onInsertCol: (direction: 'left' | 'right') => void;
    onMerge: () => void;
    onSplit: () => void;
    
    onDeleteRow: () => void;
    onDeleteCol: () => void;

    // State for Enabling/Disabling
    canInsert: boolean;
    canMerge: boolean;
    canSplit: boolean;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
    onInsertRow,
    onInsertCol,
    onMerge,
    onSplit,
    onDeleteRow,
    onDeleteCol,
    canInsert,
    canMerge,
    canSplit
}) => {
    return (
        <div className="flex space-x-2 p-2 bg-app-header border-b border-explorer-border sticky top-0 z-10 flex-wrap gap-y-2">
            {/* Insert Buttons */}
            <div className="flex items-center space-x-1">
                <button onClick={() => onInsertRow('above')} disabled={!canInsert} className="btn-icon" title="Row Above">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2L5 5H11L8 2Z" /><rect x="2" y="6" width="12" height="4" stroke="currentColor" fill="none"/></svg>
                </button>
                <button onClick={() => onInsertRow('below')} disabled={!canInsert} className="btn-icon" title="Row Below">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="6" width="12" height="4" stroke="currentColor" fill="none"/><path d="M8 14L5 11H11L8 14Z" /></svg>
                </button>
                <div className="w-px bg-explorer-border mx-1 h-4"></div>
                <button onClick={() => onInsertCol('left')} disabled={!canInsert} className="btn-icon" title="Col Left">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 8L5 5V11L2 8Z" /><rect x="6" y="2" width="4" height="12" stroke="currentColor" fill="none"/></svg>
                </button>
                <button onClick={() => onInsertCol('right')} disabled={!canInsert} className="btn-icon" title="Col Right">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="6" y="2" width="4" height="12" stroke="currentColor" fill="none"/><path d="M14 8L11 5V11L14 8Z" /></svg>
                </button>
            </div>
            
            <div className="w-px bg-explorer-border mx-1 h-4"></div>

            {/* Delete Buttons */}
            <div className="flex items-center space-x-1">
                <button onClick={onDeleteRow} disabled={!canInsert} className="btn-icon text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Row">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 5v1h12V5H2zm2-2h8v1H4V3zm1 4h2v7H5V7zm4 0h2v7H9V7z" /></svg>
                </button>
                <button onClick={onDeleteCol} disabled={!canInsert} className="btn-icon text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Column">
                     <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5 2h1v12H5V2zm-2 2h8v1H3V4zm4 1h7v2H7V5zm0 4h7v2H7V9z" transform="rotate(90 8 8)"/></svg>
                </button>
            </div>
            
            <div className="w-px bg-explorer-border mx-1 h-4"></div>
            
            {/* Merge/Split Controls */}
            <button 
                onClick={onMerge} 
                disabled={!canMerge} 
                className={`px-2 py-1 text-xs rounded border ${canMerge ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'}`}
            >
                Merge Selected
            </button>
            <button 
                onClick={onSplit} 
                disabled={!canSplit} 
                className={`px-2 py-1 text-xs rounded border ${canSplit ? 'bg-app-base hover:bg-gray-100 dark:hover:bg-gray-700 text-text-primary border-gray-300 dark:border-gray-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'}`}
            >
                Split Cell
            </button>
            
            <style>{`
                .btn-icon { @apply p-1.5 rounded hover:bg-explorer-item-hover disabled:opacity-30 disabled:cursor-not-allowed text-text-primary; }
            `}</style>
        </div>
    );
};
