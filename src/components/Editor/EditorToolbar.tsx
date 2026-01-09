import React from 'react';

interface EditorToolbarProps {
    onAction: (action: string, value?: string) => void;
}

const ToolbarButton: React.FC<{
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
}> = ({ icon, title, onClick }) => (
    <button 
        onClick={onClick}
        title={title}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
    >
        {icon}
    </button>
);

const Divider = () => <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />;

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ onAction }) => {
    return (
        <div className="flex items-center flex-wrap gap-1 p-1 bg-app-header border-b border-edit-border select-none">
            {/* History */}
            {/* Note: Undo/Redo often best left to browser/OS, but we can trigger execCommand for basic support */ }
            <ToolbarButton 
                title="Undo (Ctrl+Z)"
                onClick={() => onAction('undo')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>} 
            />
            <ToolbarButton 
                title="Redo (Ctrl+Shift+Z)"
                onClick={() => onAction('redo')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>} 
            />
            
            <Divider />

            {/* Basic Formatting */}
            <ToolbarButton 
                title="Bold (**text**)"
                onClick={() => onAction('bold')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 12h8a4 4 0 0 0 0-8H6v8Zm0 0h9a4 4 0 0 1 0 8H6v-8Z"/></svg>} 
            />
            <ToolbarButton 
                title="Italic (__text__)"
                onClick={() => onAction('italic')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>} 
            />
            <ToolbarButton 
                title="Strikethrough ([line-through]#...#)"
                onClick={() => onAction('strike')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>} 
            />
            
            <Divider />

            {/* Headings */}
            <ToolbarButton 
                title="Heading 1 (= Title)"
                onClick={() => onAction('heading', '1')}
                icon={<span className="font-bold text-xs">H1</span>} 
            />
            <ToolbarButton 
                title="Heading 2 (== Title)"
                onClick={() => onAction('heading', '2')}
                icon={<span className="font-bold text-xs">H2</span>} 
            />
            <ToolbarButton 
                title="Heading 3 (=== Title)"
                onClick={() => onAction('heading', '3')}
                icon={<span className="font-bold text-xs">H3</span>} 
            />

            <Divider />
            
            {/* Code */}
            <ToolbarButton 
                title="Inline Code (`code`)"
                onClick={() => onAction('code')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>} 
            />
            <ToolbarButton 
                title="Code Block (....)"
                onClick={() => onAction('codeBlock')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 16v-2"/><path d="M15 16v-2"/><path d="M9 8h6"/></svg>} 
            />
            <ToolbarButton 
                title="Quote Block (____)"
                onClick={() => onAction('quote')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>} 
            />

            <Divider />

            {/* Lists */}
            <ToolbarButton 
                title="Bulleted List (* Item)"
                onClick={() => onAction('ul')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>} 
            />
            <ToolbarButton 
                title="Numbered List (. Item)"
                onClick={() => onAction('ol')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>} 
            />
            <ToolbarButton 
                title="Checklist (* [ ] Item)"
                onClick={() => onAction('checklist')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>} 
            />

            <Divider />

            {/* Insert */}
            <ToolbarButton 
                title="Insert Link (http://...)"
                onClick={() => onAction('link')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>} 
            />
            <ToolbarButton 
                title="Insert Image (image::...)"
                onClick={() => onAction('image')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>} 
            />
            <ToolbarButton 
                title="Insert Table (|===)"
                onClick={() => onAction('table')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M12 21V9"/></svg>} 
            />
             <ToolbarButton 
                title="Horizontal Rule (''')"
                onClick={() => onAction('hr')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>} 
            />
            <ToolbarButton 
                title="Comment (// ...)"
                onClick={() => onAction('comment')}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>} 
            />
        </div>
    );
};
