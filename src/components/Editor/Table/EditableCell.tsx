import React, { useState, useEffect, useRef } from 'react';

interface EditableCellProps {
    content: string;
    isHeader?: boolean;
    onUpdate: (newContent: string) => void;
    onFocus?: () => void;
    
    // Selection & Interaction
    isActive: boolean;
    isSelected: boolean;
    onMouseDown: () => void;
    onMouseEnter: () => void;
    
    rowSpan?: number; 
    colSpan?: number; 
}

export const EditableCell: React.FC<EditableCellProps> = ({ 
    content, isHeader, onUpdate, onFocus, 
    isActive, isSelected, onMouseDown, onMouseEnter, 
    rowSpan, colSpan 
}) => {
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
        // Prevent Enter from inserting newline if we want strict single line? 
        // Or simply stop propagation to avoid editor conflicts.
        // For tables, usually internal newlines are allowed but require shifting.
        // Current logic: Stop prop to allow internal newlines without submitting forms?
        // Actually, AsciiDoc table cells CAN span lines.
        if (e.key === 'Enter' && !e.shiftKey) {
             e.stopPropagation(); 
        }
    };

    const Tag = isHeader ? 'th' : 'td';
    
    // Selection Styles - Using Tailwind
    let baseClass = isHeader 
        ? "border border-explorer-border p-0 bg-app-header font-bold min-w-[100px] align-top text-text-primary"
        : "border border-explorer-border p-0 bg-app-base min-w-[100px] align-top text-text-primary";
    
    if (isSelected) baseClass += " bg-blue-100 dark:bg-blue-900 ring-2 ring-inset ring-blue-300";
    else if (!isHeader) baseClass += " hover:bg-explorer-item-hover";

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
