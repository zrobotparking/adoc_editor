import React from 'react';

interface GitViewProps {
    onOpenImportDialog: () => void;
}

export const GitView: React.FC<GitViewProps> = ({ onOpenImportDialog }) => {
    return (
        <div className="flex flex-col items-center justify-center p-4 text-center h-full text-gray-400">
            <p className="mb-4">No repository opened.</p>
            <button
                onClick={onOpenImportDialog}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
                Clone Repository
            </button>
        </div>
    );
};
