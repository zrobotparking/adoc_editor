import React, { useRef, useState, useMemo } from 'react';

interface FileExplorerProps {
    files: Record<string, string>;
    activeFile: string | null;
    onSelectFile: (filename: string) => void;
    onUpload: (files: { path: string, content: string }[]) => void;
}

interface TreeNode {
    name: string;
    path: string; // Full path
    type: 'file' | 'folder';
    children: Record<string, TreeNode>; // Map for easier access
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFile, onSelectFile, onUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Build Tree Structure
    const fileTree = useMemo(() => {
        const root: Record<string, TreeNode> = {};

        Object.keys(files).sort().forEach(filePath => {
            const parts = filePath.split('/');
            let currentLevel = root;
            parts.forEach((part, index) => {
                const isFile = index === parts.length - 1;
                if (!currentLevel[part]) {
                    currentLevel[part] = {
                        name: part,
                        path: parts.slice(0, index + 1).join('/'),
                        type: isFile ? 'file' : 'folder',
                        children: {}
                    };
                }
                if (!isFile) {
                    currentLevel = currentLevel[part].children;
                }
            });
        });
        return root;
    }, [files]);

    const toggleFolder = (path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

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

    const renderTree = (nodes: Record<string, TreeNode>, depth: number = 0) => {
        return Object.values(nodes).map(node => {
            const isExpanded = expandedFolders.has(node.path);
            const indent = depth * 12; // 12px indent per level

            if (node.type === 'folder') {
                return (
                    <div key={node.path}>
                        <div 
                            className="flex items-center px-2 py-1 cursor-pointer hover:bg-explorer-item-hover text-explorer-item select-none"
                            style={{ paddingLeft: `${indent + 8}px` }}
                            onClick={(e) => toggleFolder(node.path, e)}
                        >
                            <span className="mr-1 text-gray-500 text-[10px]">
                                {isExpanded ? '▼' : '▶'}
                            </span>
                            {/* Folder Icon */}
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="mr-1 text-yellow-500">
                                <path d="M7.5 2L9.5 4H14C14.6 4 15 4.4 15 5V13C15 13.6 14.6 14 14 14H2C1.4 14 1 13.6 1 13V3C1 2.4 1.4 2 2 2H7.5Z"/>
                            </svg>
                            {node.name}
                        </div>
                        {isExpanded && renderTree(node.children, depth + 1)}
                    </div>
                );
            } else {
                return (
                    <div 
                        key={node.path}
                        className={`
                            cursor-pointer px-2 py-1 rounded truncate text-xs mb-0.5
                            ${activeFile === node.path 
                                ? 'bg-explorer-item-active text-explorer-item-active-text font-medium' 
                                : 'text-explorer-item hover:bg-explorer-item-hover'
                            }
                        `}
                        style={{ paddingLeft: `${indent + 20}px` }}
                        onClick={() => onSelectFile(node.path)}
                        title={node.path}
                    >
                         {/* File Icon */}
                        <span className="mr-1 opacity-70">📄</span>
                        {node.name}
                    </div>
                );
            }
        });
    };

    const hasFiles = Object.keys(files).length > 0;

    return (
        <div className="flex flex-col h-full text-sm select-none">
            {/* Header / Actions */}
            <div className="flex items-center justify-between bg-app-base border-b border-explorer-border px-3 py-2 shrink-0">
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

            {/* File List Tree */}
            <div className="flex-1 overflow-auto p-0 py-2">
                {hasFiles ? renderTree(fileTree) : (
                    <div className="p-4 text-xs text-gray-500 text-center italic">
                        No files open.
                        <br/>
                        Click icons to add files.
                    </div>
                )}
            </div>
        </div>
    );
};
