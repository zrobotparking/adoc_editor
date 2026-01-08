import React, { useMemo, useRef } from 'react';
import type { LintError } from '../../core/Linter';
import { AsciiDocTokenizer, type Token } from '../../core/AsciiDocTokenizer';

interface SourceEditorProps {
    value: string;
    onChange: (value: string) => void;
    lintErrors?: LintError[];
    onScroll?: (scrollTop: number, scrollRatio: number) => void;
    onSelectionChange?: (selection: { startLine: number, endLine: number, text: string }) => void;
}

export const SourceEditor: React.FC<SourceEditorProps> = ({ value, onChange, lintErrors = [], onScroll, onSelectionChange }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLPreElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);

    // Tokenizer
    const tokens = useMemo(() => {
        const tokenizer = new AsciiDocTokenizer();
        return tokenizer.tokenize(value);
    }, [value]);

    const handleScroll = () => {
        if (textareaRef.current) {
            const scrollTop = textareaRef.current.scrollTop;
            const scrollLeft = textareaRef.current.scrollLeft;
            const scrollHeight = textareaRef.current.scrollHeight;
            const clientHeight = textareaRef.current.clientHeight;
            
            // Sync Gutter
            if (gutterRef.current) {
                gutterRef.current.scrollTop = scrollTop;
            }

            // Sync Overlay
            if (overlayRef.current) {
                overlayRef.current.scrollTop = scrollTop;
                overlayRef.current.scrollLeft = scrollLeft;
            }
            
            // Notify parent for preview sync
            if (onScroll) {
                const ratio = scrollTop / (scrollHeight - clientHeight || 1);
                onScroll(scrollTop, ratio);
            }
        }
    };

    const lines = value.split('\n');
    const errorMap = useMemo(() => {
        const map = new Map<number, LintError[]>();
        lintErrors.forEach(err => {
            if (!map.has(err.line)) map.set(err.line, []);
            map.get(err.line)?.push(err);
        });
        return map;
    }, [lintErrors]);

    const handleSelect = () => {
        if (textareaRef.current) {
            const { selectionStart, selectionEnd, value } = textareaRef.current;
            const beforeStart = value.substring(0, selectionStart);
            const beforeEnd = value.substring(0, selectionEnd);
            const selectedText = value.substring(selectionStart, selectionEnd);
            
            // Fix: remove duplicate endLine calculation if present in previous version
            const startLine = beforeStart.split('\n').length - 1;
            const endLine = beforeEnd.split('\n').length - 1;
           
            if (onSelectionChange) {
                onSelectionChange({ startLine, endLine, text: selectedText });
            }
        }
    };

    // Construct Overlay HTML
    const renderOverlay = () => {
        let lastIndex = 0;
        const elements: React.ReactNode[] = [];

        tokens.forEach((token, idx) => {
             // Fill gaps with plain text (though Tokenizer usually covers all, safe fallback)
             if (token.start > lastIndex) {
                 elements.push(<span key={`gap-${idx}`} style={{color: 'var(--text-editor)'}}>{value.substring(lastIndex, token.start)}</span>);
             }

             const colorVar = `var(--syntax-${token.type})`;
             // Styling based on token type
             let style: React.CSSProperties = { color: colorVar };
             if (token.type === 'bold' || token.type === 'header') style.fontWeight = 'bold';
             if (token.type === 'italic') style.fontStyle = 'italic';
             if (token.type === 'header') style.textDecoration = 'none'; // Optional

             elements.push(
                 <span key={idx} style={style}>
                     {token.text}
                 </span>
             );

             lastIndex = token.end;
        });
        
        // Trailing text
        if (lastIndex < value.length) {
             elements.push(<span key="tail" style={{color: 'var(--text-editor)'}}>{value.substring(lastIndex)}</span>);
        }

        // IMPORTANT: Add a newline character at the end if the value ends with \n, 
        // to ensure the pre tag heights matches the textarea
        if (value.endsWith('\n')) {
            elements.push(<br key="br-end" />);
        }

        return elements;
    };

    return (
        <div className="flex flex-col h-full bg-editor-bg">
             {/* Main Editor Area */}
             <div className="flex flex-grow relative overflow-hidden">
                {/* Gutter */}
                <div 
                    ref={gutterRef}
                    className="w-12 bg-editor-gutter text-editor-gutter-text text-right font-mono text-sm leading-relaxed p-4 pr-2 select-none overflow-hidden border-r border-explorer-border"
                    style={{ lineHeight: '21px', paddingTop: '16px' }} // Explicit metrics
                >
                    {lines.map((_, i) => {
                        const hasError = errorMap.has(i);
                        return (
                            <div key={i} className="relative h-[21px]">
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

                {/* Editor Container - Stacked */}
                <div className="flex-grow relative font-mono text-sm leading-relaxed" style={{ fontSize: '14px', lineHeight: '21px' }}>
                    {/* Syntax Overlay */}
                    <pre
                        ref={overlayRef}
                        aria-hidden="true"
                        className="absolute inset-0 p-4 m-0 overflow-hidden whitespace-pre pointer-events-none bg-editor-bg"
                        style={{ 
                            fontFamily: 'monospace',
                            boxSizing: 'border-box'
                        }}
                    >
                        {renderOverlay()}
                    </pre>

                    {/* Interaction Layer (Textarea) */}
                    <textarea
                        ref={textareaRef}
                        className="absolute inset-0 w-full h-full p-4 m-0 resize-none outline-none whitespace-pre bg-transparent text-transparent caret-editor-text"
                        style={{ 
                            fontFamily: 'monospace',
                            caretColor: 'var(--text-secondary)', // Use visible color for caret
                            zIndex: 1,
                            boxSizing: 'border-box'
                        }}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onScroll={handleScroll}
                        onSelect={handleSelect}
                        onClick={handleSelect}
                        onKeyUp={handleSelect}
                        spellCheck={false}
                    />
                </div>
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
