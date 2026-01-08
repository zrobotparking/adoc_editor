import React from 'react';
import type { LintError } from '../../core/Linter';

interface SourceEditorProps {
    value: string;
    onChange: (value: string) => void;
    lintErrors?: LintError[];
    onScroll?: (scrollTop: number, scrollRatio: number) => void;
}

export const SourceEditor: React.FC<SourceEditorProps> = ({ value, onChange, lintErrors = [], onScroll }) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const gutterRef = React.useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (textareaRef.current && gutterRef.current) {
            const scrollTop = textareaRef.current.scrollTop;
            const scrollHeight = textareaRef.current.scrollHeight;
            const clientHeight = textareaRef.current.clientHeight;
            
            gutterRef.current.scrollTop = scrollTop;
            
            // Notify parent
            if (onScroll) {
                const ratio = scrollTop / (scrollHeight - clientHeight || 1);
                onScroll(scrollTop, ratio);
            }
        }
    };

    const lines = value.split('\n');
    const errorMap = React.useMemo(() => {
        const map = new Map<number, LintError[]>();
        lintErrors.forEach(err => {
            if (!map.has(err.line)) map.set(err.line, []);
            map.get(err.line)?.push(err);
        });
        return map;
    }, [lintErrors]);

    return (
        <div className="flex flex-col h-full bg-editor-bg">
             {/* Main Editor Area */}
             <div className="flex flex-grow relative overflow-hidden">
                {/* Gutter */}
                <div 
                    ref={gutterRef}
                    className="w-12 bg-editor-gutter text-editor-gutter-text text-right font-mono text-sm leading-relaxed p-4 pr-2 select-none overflow-hidden border-r border-explorer-border"
                >
                    {lines.map((_, i) => {
                        const hasError = errorMap.has(i);
                        return (
                            <div key={i} className="relative h-[21px]"> {/* Assuming standard line-height matches textarea roughly, might need tuning */}
                                {hasError && (
                                    <span className="absolute left-0 text-yellow-500 font-bold" title={errorMap.get(i)?.[0].message}>
                                        !
                                    </span>
                                )}
                                {i + 1}
                            </div>
                        );
                    })}
                </div>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    className="flex-grow bg-editor-bg text-editor-text font-mono p-4 pl-2 resize-none focus:outline-none text-sm leading-relaxed whitespace-pre"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onScroll={handleScroll}
                    spellCheck={false}
                    style={{ lineHeight: '21px' }} // Enforce line-height for alignment
                />
            </div>
            
            {/* Error Panel (Bottom) */}
            {lintErrors.length > 0 && (
                <div className="bg-[#2d2d2d] border-t border-[#444] max-h-32 overflow-y-auto">
                    {lintErrors.map((error, idx) => (
                        <div key={idx} className="p-1 px-4 text-xs text-yellow-400 border-b border-[#444] flex items-center hover:bg-[#3d3d3d] cursor-pointer">
                            <span className="font-bold mr-2 w-16">Line {error.line + 1}:</span>
                            <span>{error.message}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
