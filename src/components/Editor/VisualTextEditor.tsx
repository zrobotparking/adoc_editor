import React, { useEffect, useRef, useState } from 'react';

interface VisualTextEditorProps {
    initialContent: string;
    onUpdate: (content: string) => void;
}

export const VisualTextEditor: React.FC<VisualTextEditorProps> = ({ initialContent, onUpdate }) => {
    const [value, setValue] = useState(initialContent);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
    };

    const handleBlur = () => {
        if (value !== initialContent) {
           onUpdate(value);
        }
    };

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full p-4 border-none outline-none resize-none font-mono bg-white text-black"
            style={{ minHeight: '100px', display: 'block', overflow: 'hidden' }}
            autoFocus
        />
    );
};
