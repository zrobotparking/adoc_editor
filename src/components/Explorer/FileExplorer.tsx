import React, { useRef } from 'react';

interface FileExplorerProps {
    onFileUpload: (content: string, filename: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ onFileUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                onFileUpload(content, file.name);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col h-full text-sm">
            <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center text-gray-500">
                <p className="mb-4">No Open Folder</p>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    accept=".adoc,.txt,.asciidoc"
                    onChange={handleFileChange}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                    Open File
                </button>
            </div>
        </div>
    );
};
