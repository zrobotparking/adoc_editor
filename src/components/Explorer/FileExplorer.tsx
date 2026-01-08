import React, { useRef } from 'react';

interface FileExplorerProps {
    files: Record<string, string>;
    activeFile: string | null;
    onSelectFile: (filename: string) => void;
    onUpload: (files: { path: string, content: string }[]) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFile, onSelectFile, onUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const processFiles = (fileList: FileList | null) => {
        if (!fileList) return;

        const filesArray = Array.from(fileList);
        const validFiles = filesArray.filter(f => f.name.endsWith('.adoc') || f.name.endsWith('.txt') || f.name.endsWith('.asciidoc'));
        
        if (validFiles.length === 0) return;

        const results: { path: string, content: string }[] = [];
        let processedCount = 0;

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                // Use webkitRelativePath for folder structure if available, else name
                const path = file.webkitRelativePath || file.name;
                results.push({ path, content });
                
                processedCount++;
                if (processedCount === validFiles.length) {
                    onUpload(results);
                }
            };
            reader.readAsText(file);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files);
    };

    const hasFiles = Object.keys(files).length > 0;
    const sortedFiles = Object.keys(files).sort();

    return (
        <div className="flex flex-col h-full text-sm">
            {/* Header / Actions */}
            <div className="p-2 border-b border-explorer-border flex space-x-2">
                 {/* Hidden Inputs */}
                 <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    accept=".adoc,.txt,.asciidoc"
                    multiple
                    onChange={handleFileChange}
                />
                <input 
                    type="file"
                    ref={folderInputRef}
                    className="hidden"
                    // @ts-ignore
                    webkitdirectory=""
                    directory=""
                    multiple
                    onChange={handleFileChange}
                />
                
                {!hasFiles && (
                    <div className="flex flex-col space-y-2 w-full p-4 items-center">
                        <button 
                            onClick={() => folderInputRef.current?.click()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded w-full transition-colors font-medium text-xs"
                        >
                            Open Folder
                        </button>
                         <div className="text-xs text-gray-500 text-center">- OR -</div>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded w-full transition-colors text-xs"
                        >
                            Open File(s)
                        </button>
                    </div>
                )}
                
                {hasFiles && (
                     <button 
                        onClick={() => folderInputRef.current?.click()}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                        title="Open Project Folder"
                    >
                        📂
                    </button>
                )}
            </div>

            {/* File List */}
            {hasFiles && (
                <div className="flex-1 overflow-auto p-2">
                    {sortedFiles.map(path => (
                        <div 
                            key={path}
                            className={`
                                cursor-pointer px-2 py-1 rounded truncate text-xs mb-1
                                ${activeFile === path 
                                    ? 'bg-explorer-item-active text-explorer-item-active-text font-medium' 
                                    : 'text-explorer-item hover:bg-explorer-item-hover'
                                }
                            `}
                            onClick={() => onSelectFile(path)}
                            title={path}
                        >
                            {/* Simple display: just show last part of path for now, or full path if short */}
                            {path.split('/').pop()} 
                            {/* <span className="opacity-50 ml-1 text-[10px]">{path}</span> Optional full path */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
