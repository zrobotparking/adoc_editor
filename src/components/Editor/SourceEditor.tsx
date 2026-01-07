import React from 'react';

interface SourceEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export const SourceEditor: React.FC<SourceEditorProps> = ({ value, onChange }) => {
    return (
        <textarea
            className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono p-4 resize-none focus:outline-none text-sm leading-relaxed"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
        />
    );
};
