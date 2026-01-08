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

    React.useEffect(() => {
        console.log('[FileExplorer] Mounted/Updated');
    }, []);

    return (
        <div className="flex flex-col h-full text-sm">
            {/* Header / Actions */}
            <div className="flex items-center justify-between bg-app-base border-b border-explorer-border px-3 py-2">
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
                
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">EXPLORER</span>

                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 transition-colors"
                        title="Add File(s)"
                    >
                        {/* New File Icon */}
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                           <path d="M9 1H4C3 1 2 2 2 3V14C2 15 3 16 4 16H13C14 16 15 15 15 14V6L9 1ZM10 13H12V11H14V9H12V7H10V9H8V11H10V13Z" fillRule="evenodd"/>
                        </svg>
                    </button>
                    <button 
                        onClick={() => folderInputRef.current?.click()}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 transition-colors"
                        title="Open Project Folder"
                    >
                         {/* Folder Icon */}
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                             <path d="M7.5 2L9.5 4H14C14.6 4 15 4.4 15 5V13C15 13.6 14.6 14 14 14H2C1.4 14 1 13.6 1 13V3C1 2.4 1.4 2 2 2H7.5Z"/>
                        </svg>
                    </button>
                </div>
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
