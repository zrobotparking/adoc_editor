import React, { useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import type { LintError } from '../../core/Linter';
import { AsciiDocTokenizer, type Token } from '../../core/AsciiDocTokenizer';
import { EditorToolbar } from './EditorToolbar';

export interface SourceEditorHandle {
    scrollTo: (ratio: number) => void;
}

interface SourceEditorProps {
    value: string;
    onChange: (value: string, immediate?: boolean) => void;
    lintErrors?: LintError[];
    onScroll?: (scrollTop: number, scrollRatio: number) => void;
    onSelectionChange?: (selection: { startLine: number, endLine: number, text: string }) => void;
    highlightedRanges?: { startLine: number, endLine: number }[];
    onUndo?: () => void;
    onRedo?: () => void;
}

export const SourceEditor = forwardRef<SourceEditorHandle, SourceEditorProps>(({ 
    value, 
    onChange, 
    lintErrors = [], 
    onScroll, 
    onSelectionChange,
    highlightedRanges = [],
    onUndo,
    onRedo
}, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLPreElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const highlightLayerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        scrollTo: (ratio: number) => {
            if (textareaRef.current) {
                const { scrollHeight, clientHeight } = textareaRef.current;
                const targetScroll = ratio * (scrollHeight - clientHeight);
                textareaRef.current.scrollTop = targetScroll;
                
                if (gutterRef.current) gutterRef.current.scrollTop = targetScroll;
                if (overlayRef.current) overlayRef.current.scrollTop = targetScroll;
                if (highlightLayerRef.current) highlightLayerRef.current.scrollTop = targetScroll;
            }
        }
    }));

    // Helper to insert text at cursor
    const insertAtCursor = (prefix: string, suffix: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newContent = before + prefix + selection + suffix + after;
        
        // Toolbar actions are discrete steps, so they should always commit immediately
        onChange(newContent, true);

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            if (selection.length > 0) {
                textarea.setSelectionRange(start + prefix.length, start + prefix.length + selection.length);
            } else {
                textarea.setSelectionRange(start + prefix.length, start + prefix.length);
            }
        }, 0);
    };

    const handleToolbarAction = (action: string, value?: string) => {
        const textarea = textareaRef.current;
        if (!textarea && action !== 'undo' && action !== 'redo') return;

        switch(action) {
            case 'undo':
                if (onUndo) onUndo();
                break;
            case 'redo':
                if (onRedo) onRedo();
                break;
            case 'bold':
                insertAtCursor('*', '*');
                break;
            case 'italic':
                insertAtCursor('_', '_');
                break;
            case 'strike':
                insertAtCursor('[.line-through]#', '#');
                break;
            case 'heading':
                const level = parseInt(value || '1');
                const equals = '='.repeat(level);
                insertAtCursor(`${equals} `);
                break;
            case 'code':
                insertAtCursor('`', '`');
                break;
            case 'codeBlock':
                insertAtCursor('\n....\n', '\n....\n');
                break;
            case 'quote':
                insertAtCursor('\n____\n', '\n____\n');
                break;
            case 'ul':
                insertAtCursor('* ');
                break;
            case 'ol':
                insertAtCursor('. ');
                break;
            case 'checklist':
                insertAtCursor('* [ ] ');
                break;
            case 'link':
                insertAtCursor('http://url[', ']');
                break;
            case 'image':
                insertAtCursor('image::url[', ']');
                break;
            case 'table':
                insertAtCursor('\n|===\n|Header 1 |Header 2\n\n|Cell 1 |Cell 2\n|===\n');
                break;
            case 'hr':
                insertAtCursor("\n'''\n");
                break;
            case 'comment':
                insertAtCursor('// ');
                break;
        }
    };

    // Tokenizer
    const tokenizer = useMemo(() => new AsciiDocTokenizer(), []);
    
    const tokens = useMemo(() => {
        // console.time('Tokenizer');
        const res = tokenizer.tokenize(value);
        // console.timeEnd('Tokenizer');
        return res;
    }, [value, tokenizer]);

    const [scrollTop, setScrollTop] = React.useState(0);
    const [editorHeight, setEditorHeight] = React.useState(0);

    // Sync scroll and update virtualization state
    const handleScroll = () => {
        if (textareaRef.current) {
            const currentScrollTop = textareaRef.current.scrollTop;
            const clientHeight = textareaRef.current.clientHeight;
            const scrollLeft = textareaRef.current.scrollLeft;
            const scrollHeight = textareaRef.current.scrollHeight;

            // Standard React State Update ensures synchronization accuracy
            // Using standard approach as requested (no throttling/conditional updates)
            setScrollTop(currentScrollTop);
            
            if (editorHeight !== clientHeight) {
                setEditorHeight(clientHeight);
            }
            
            // Sync other layers natively for smoothness (still good practice for overlays)
            if (gutterRef.current) gutterRef.current.scrollTop = currentScrollTop;
            if (overlayRef.current) {
                overlayRef.current.scrollTop = currentScrollTop;
                overlayRef.current.scrollLeft = scrollLeft;
            }
            if (highlightLayerRef.current) {
                highlightLayerRef.current.scrollTop = currentScrollTop;
                highlightLayerRef.current.scrollLeft = scrollLeft;
            }
            
            if (onScroll) {
                const ratio = currentScrollTop / (scrollHeight - clientHeight || 1);
                onScroll(currentScrollTop, ratio);
            }
        }
    };

    console.time('Line Split');
    const lines = value.split('\n');
    console.timeEnd('Line Split');
    
    // Line offsets no longer needed for rendering, but might be needed for other things?
    // Not used elsewhere. Removing.

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
            console.time('Handle Select');
            const { selectionStart, selectionEnd, value } = textareaRef.current;
            const beforeStart = value.substring(0, selectionStart);
            // const beforeEnd = value.substring(0, selectionEnd); // Not strictly needed for single cursor?
            // Wait, logic says:
            const beforeEnd = value.substring(0, selectionEnd);
            const selectedText = value.substring(selectionStart, selectionEnd);
            
            // COSTLY: Splitting entire string just to find line number
            console.time('Calc Line Num');
            const startLine = beforeStart.split('\n').length - 1;
            const endLine = beforeEnd.split('\n').length - 1;
            console.timeEnd('Calc Line Num');
           
            if (onSelectionChange) {
                onSelectionChange({ startLine, endLine, text: selectedText });
            }
            console.timeEnd('Handle Select');
        }
    };

    // Virtualized Overlay Rendering
    const renderOverlay = () => {
        const rowHeight = 21;
        const startNode = Math.floor(scrollTop / rowHeight);
        const visibleNodeCount = Math.ceil((editorHeight || 500) / rowHeight);
        
        // render buffer
        const startLine = Math.max(0, startNode - 5);
        const endLine = Math.min(lines.length, startNode + visibleNodeCount + 5);
        
        const renderedLines: React.ReactNode[] = [];
        
        // Push top padding
        if (startLine > 0) {
            renderedLines.push(<div key="spacer-top" style={{ height: `${startLine * rowHeight}px` }} />);
        }

        for (let i = startLine; i < endLine; i++) {
            const lineTokens = tokens[i] || [];
            const lineText = lines[i];
            
            const lineElements: React.ReactNode[] = [];
            let lastIndex = 0; // Relative to line start

            lineTokens.forEach((token, tIdx) => {
                // Gap
                if (token.start > lastIndex) {
                    lineElements.push(
                        <span key={`gap-${tIdx}`} style={{color: 'var(--text-editor)'}}>
                            {lineText.substring(lastIndex, token.start)}
                        </span>
                    );
                }

                // Token
                const colorVar = `var(--syntax-${token.type})`;
                let style: React.CSSProperties = { color: colorVar };
                if (token.type === 'bold' || token.type === 'header') style.fontWeight = 'bold';
                if (token.type === 'italic') style.fontStyle = 'italic';
                if (token.type === 'header') style.textDecoration = 'none';

                lineElements.push(
                    <span key={tIdx} style={style}>
                        {token.text}
                    </span>
                );

                lastIndex = token.end;
            });
            
            // Tail of line
            if (lastIndex < lineText.length) {
                 lineElements.push(
                     <span key="tail" style={{color: 'var(--text-editor)'}}>
                         {lineText.substring(lastIndex)}
                     </span>
                 );
            }
            
            renderedLines.push(
                <div key={i} style={{ height: '21px', whiteSpace: 'pre' }}>
                    {lineElements}
                </div>
            );
        }
        
        // Push bottom padding
        if (endLine < lines.length) {
            renderedLines.push(<div key="spacer-bottom" style={{ height: `${(lines.length - endLine) * rowHeight}px` }} />);
        }

        return renderedLines;
    };

    // Virtualized Gutter Rendering
    const renderGutter = () => {
        const rowHeight = 21;
        const startNode = Math.floor(scrollTop / rowHeight);
        const visibleNodeCount = Math.ceil((editorHeight || 500) / rowHeight);
        
        const startLine = Math.max(0, startNode - 5);
        const endLine = Math.min(lines.length, startNode + visibleNodeCount + 5);
        
        const renderedItems: React.ReactNode[] = [];

        // Spacer Top
        if (startLine > 0) {
            renderedItems.push(<div key="spacer-top" style={{ height: `${startLine * rowHeight}px` }} />);
        }

        for (let i = startLine; i < endLine; i++) {
            const hasError = errorMap.has(i);
            renderedItems.push(
                <div key={i} className="relative h-[21px]">
                    {hasError && (
                        <span className="absolute left-0 text-yellow-500 font-bold" title={errorMap.get(i)?.[0].message}>
                            !
                        </span>
                    )}
                    {i + 1}
                </div>
            );
        }

        // Spacer Bottom
        if (endLine < lines.length) {
            renderedItems.push(<div key="spacer-bottom" style={{ height: `${(lines.length - endLine) * rowHeight}px` }} />);
        }

        return renderedItems;
    };

    // Calculate total height for the highlight layer to ensure it scrolls correctly
    // 21px per line + 32px padding (16px top + 16px bottom)
    // Adding extra buffer to be safe
    const contentHeight = Math.max((lines.length * 21) + 32, 100); 

    // Font settings to ensure perfect alignment between textarea and overlay
    const editorStyle: React.CSSProperties = {
        fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
        fontSize: '14px',
        lineHeight: '21px',
        letterSpacing: '0px',
        fontVariantLigatures: 'none',
        boxSizing: 'border-box',
    };

    return (
        <div className="flex flex-col h-full bg-editor-bg border border-gray-700 rounded-lg overflow-hidden">
             {/* Toolbar */}
             <EditorToolbar onAction={handleToolbarAction} />

             {/* Editor Area Wrapper */}
             <div className="flex flex-grow relative overflow-hidden">
                {/* Gutter */}
                <div 
                    ref={gutterRef}
                    className="w-12 bg-editor-gutter text-editor-gutter-text text-right font-mono text-sm leading-relaxed p-4 pr-2 select-none overflow-hidden border-r border-explorer-border"
                    style={{ 
                        ...editorStyle,
                        fontFamily: 'monospace', // Gutter can stay default mono or match
                        width: '48px',
                        paddingTop: '16px' 
                    }}
                >
                    {renderGutter()}
                </div>

                {/* Editor Container - Stacked */}
                <div className="flex-grow relative" style={editorStyle}>
                    
                    {/* Block Highlight Layer */}
                    <div
                        ref={highlightLayerRef}
                        className="absolute inset-0 overflow-hidden pointer-events-none"
                    >
                         <div className="relative w-full" style={{ height: `${contentHeight}px` }}>
                            {highlightedRanges.map((range, idx) => {
                                const top = range.startLine * 21 + 16;
                                const height = (range.endLine - range.startLine + 1) * 21;
                                return (
                                    <div 
                                        key={idx}
                                        className="absolute w-full border-r-2 border-l-2 border-t-2 border-b-2 border-blue-400 opacity-30 bg-blue-100 rounded"
                                        style={{ 
                                            top: `${top}px`, 
                                            left: '4px',
                                            right: '4px',
                                            width: 'calc(100% - 8px)',
                                            height: `${height}px`,
                                            backgroundColor: 'rgba(59, 130, 246, 0.1)' 
                                        }}
                                    />
                                );
                            })}
                         </div>
                    </div>

                    {/* Syntax Overlay */}
                    <pre
                        ref={overlayRef}
                        aria-hidden="true"
                        className="absolute inset-0 p-4 m-0 overflow-hidden whitespace-pre pointer-events-none bg-transparent"
                        style={{ 
                            ...editorStyle
                        }}
                    >
                        {renderOverlay()}
                    </pre>

                    {/* Interaction Layer (Textarea) */}
                    <textarea
                        ref={textareaRef}
                        className="absolute inset-0 w-full h-full p-4 m-0 resize-none outline-none whitespace-pre bg-transparent text-transparent caret-editor-text"
                        style={{ 
                            ...editorStyle,
                            caretColor: 'var(--text-secondary)',
                            zIndex: 1
                        }}
                        value={value}
                        onChange={(e) => {
                            const val = e.target.value;
                            
                            // Smart Undo Logic
                            let immediate = false;
                            const nativeEvent = e.nativeEvent as InputEvent;
                            
                            if (nativeEvent.inputType === 'insertLineBreak') {
                                immediate = true;
                            } else if (nativeEvent.data) {
                                // Check for space or special chars
                                const char = nativeEvent.data;
                                if ([' ', '.', ',', ';', ':', '!', '?', '"', "'", '(', ')', '[', ']', '{', '}', '<', '>', '=', '|', '*', '_', '`'].includes(char)) {
                                    immediate = true;
                                }
                            }
                            
                            onChange(val, immediate);
                        }}
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
});

SourceEditor.displayName = 'SourceEditor';
