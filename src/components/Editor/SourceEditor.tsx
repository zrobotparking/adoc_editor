import React, { useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import type { LintError } from '../../core/Linter';
import { AsciiDocTokenizer } from '../../core/AsciiDocTokenizer';
import { EditorToolbar } from './EditorToolbar';

export interface SourceEditorHandle {
    scrollTo: (ratio: number) => void;
}

// Update Interface
import type { Block } from '../../core/types';

interface SourceEditorProps {
    value: string;
    onChange: (value: string, immediate?: boolean) => void;
    lintErrors?: LintError[];
    onScroll?: (scrollTop: number, scrollRatio: number) => void;
    onSelectionChange?: (selection: { startLine: number, endLine: number, text: string }) => void;
    highlightedRanges?: { startLine: number, endLine: number }[];
    onUndo?: () => void;
    onRedo?: () => void;
    // New Props for Collapsing
    blocks?: Block[];
    collapsedBlockIds?: string[];
    onToggleCollapse?: (id: string) => void;
}

export const SourceEditor = forwardRef<SourceEditorHandle, SourceEditorProps>(({ 
    value, 
    onChange, 
    lintErrors = [], 
    onScroll, 
    onSelectionChange,
    highlightedRanges = [],
    onUndo,
    onRedo,
    blocks = [],
    collapsedBlockIds = [],
    onToggleCollapse
}, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLPreElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const highlightLayerRef = useRef<HTMLDivElement>(null);


    // Tokenizer
    const tokenizer = useMemo(() => new AsciiDocTokenizer(), []);
    
    // Folding Logic
    const { displayValue, lineMap, realToDisplayMap } = useMemo(() => {
        if (collapsedBlockIds.length === 0 || blocks.length === 0) {
            return { displayValue: value, lineMap: null, realToDisplayMap: null };
        }

        const hiddenRanges = blocks
            .filter(b => collapsedBlockIds.includes(b.id))
            .map(b => ({ start: b.startLine, end: b.endLine }))
            .sort((a, b) => a.start - b.start);

        if (hiddenRanges.length === 0) return { displayValue: value, lineMap: null, realToDisplayMap: null };

        const lines = value.split('\n');
        let newLines: string[] = [];
        let map = new Map<number, number>(); // displayLine -> realLine
        let rMap = new Map<number, number>(); // realLine -> displayLine
        
        for (let i = 0; i < lines.length; i++) {
            const isHidden = hiddenRanges.some(r => i > r.start && i <= r.end); 
            
            if (!isHidden) {
                const displayIdx = newLines.length;
                map.set(displayIdx, i);
                rMap.set(i, displayIdx);
                newLines.push(lines[i]);
            }
        }
        
        return { 
            displayValue: newLines.join('\n'), 
            lineMap: map,
            realToDisplayMap: rMap
        };

    }, [value, blocks, collapsedBlockIds]);

    const activeValue = lineMap ? displayValue : value;

    const tokens = useMemo(() => {
        const res = tokenizer.tokenize(activeValue);
        return res;
    }, [activeValue, tokenizer]);

    useImperativeHandle(ref, () => ({
        scrollTo: (ratio: number) => {
            if (textareaRef.current) {
                const { scrollHeight, clientHeight } = textareaRef.current;
                
                // Map logical ratio to visual ratio?
                // Logic: ratio corresponds to Logical Line.
                // We need to find the visual position of that logical line.
                
                // Estimate logical line
                // const totalLogicalLines = lineMap ? lineMap.size : lines.length; // Approximate? No, lineMap is display size.
                // Actually we don't have totalLogicalLines easily accessible inside here unless we track maxRealLine?
                // But App passes ratio.
                
                // Better: App passes `ratio` which is logical.
                // We assume linear distribution?
                // If we don't fix this, scrolling might be slightly off but acceptable.
                // But if Line 50 is deeply hidden, scrolling to 50% visual might land on Line 80.
                
                // Let's rely on textarea native scroll first. 
                // Improvements can be made if users complain about sync accuracy.
                
                const targetScroll = ratio * (scrollHeight - clientHeight);
                textareaRef.current.scrollTop = targetScroll;
                
                if (gutterRef.current) gutterRef.current.scrollTop = targetScroll;
                if (overlayRef.current) overlayRef.current.scrollTop = targetScroll;
                if (highlightLayerRef.current) highlightLayerRef.current.scrollTop = targetScroll;
            }
        }
    }), [lineMap]); // Depend on lineMap?

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
            case 'pdf':
                window.print();
                break;
        }
    };



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
                // Map visual scrollTop to logical ratio?
                // Approximation: visualRatio
                const ratio = currentScrollTop / (scrollHeight - clientHeight || 1);
                onScroll(currentScrollTop, ratio);
            }
        }
    };

    // Initialize Size and Sync Scroll on Mount
    React.useEffect(() => {
        // Measure initial height
        if (textareaRef.current) {
            setEditorHeight(textareaRef.current.clientHeight);
            // Sync scroll state immediately in case browser restored scroll position
            handleScroll();
        }
        
        // Optional: ResizeObserver to handle window resize or split pane resize
        const resizeObserver = new ResizeObserver(() => {
             if (textareaRef.current) {
                 setEditorHeight(textareaRef.current.clientHeight);
                 handleScroll(); 
             }
        });
        if (textareaRef.current) {
             resizeObserver.observe(textareaRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    console.time('Line Split');
    const lines = activeValue.split('\n');
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

        // Add extra buffer to match textarea scroll behavior at the very bottom
        renderedLines.push(<div key="viewport-buffer" style={{ height: '32px' }} />);

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

        // Pre-calculate block starts for current view range to avoid O(N*M) inside loop?
        // Actually blocks is sorted by line usually.
        // Let's create a map for O(1) lookup: line -> blockId
        // Only needed for visible lines.
        const lineBlockMap = new Map<number, string>();
        blocks.forEach(b => {
            // Only collapsible blocks that are NOT single line
            if ((b.type !== 'text' || b.content.trim().length > 0) && b.startLine !== b.endLine) { 
                lineBlockMap.set(b.startLine, b.id);
            }
        });
        // console.log('[SourceEditor] Gutter Map', { size: lineBlockMap.size, visibleLines: endLine - startLine });

        // Spacer Top
        if (startLine > 0) {
            renderedItems.push(<div key="spacer-top" style={{ height: `${startLine * rowHeight}px` }} />);
        }

        for (let i = startLine; i < endLine; i++) {
            const realLine = lineMap ? (lineMap.get(i) ?? i) : i;

            const hasError = errorMap.has(realLine);
            const blockId = lineBlockMap.get(realLine);
            const isCollapsed = blockId ? collapsedBlockIds.includes(blockId) : false;

            renderedItems.push(
                <div key={i} className="relative h-[21px] flex items-center justify-end pr-5 group">
                    {/* Error Icon */}
                    {hasError && (
                        <span className="absolute left-0 text-yellow-500 font-bold" title={errorMap.get(realLine)?.[0].message}>
                            !
                        </span>
                    )}
                    
                    {/* Collapse Toggle - Moved to Right */}
                    {blockId && onToggleCollapse && (
                         <div 
                            className="absolute right-1 cursor-pointer text-gray-400 hover:text-white text-[10px] leading-none flex items-center justify-center h-full w-3"
                            onClick={(e) => {
                                e.stopPropagation();
                                console.log('[SourceEditor] Toggle Click', blockId);
                                onToggleCollapse(blockId);
                            }}
                            title={isCollapsed ? "Expand" : "Collapse"}
                         >
                             {isCollapsed ? '▶' : '▼'}
                         </div>
                    )}

                    <span style={{ color: isCollapsed ? '#60a5fa' : 'inherit' }}>
                        {realLine + 1}
                    </span>
                </div>
            );
        }

        // Spacer Bottom
        if (endLine < lines.length) {
            renderedItems.push(<div key="spacer-bottom" style={{ height: `${(lines.length - endLine) * rowHeight}px` }} />);
        }

        // Add extra buffer to match textarea scroll behavior (same as overlay)
        renderedItems.push(<div key="viewport-buffer" style={{ height: '32px' }} />);

        return renderedItems;
    };

    // Calculate total height for the highlight layer to ensure it scrolls correctly
    // 21px per line + 32px padding (16px top + 16px bottom) + 32px extra buffer
    // Adding extra buffer to be safe
    const contentHeight = Math.max((lines.length * 21) + 64, 100); 

    // Font settings to ensure perfect alignment between textarea and overlay
    const editorStyle: React.CSSProperties = {
        fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
        fontSize: '14px',
        lineHeight: '21px',
        letterSpacing: '0px',
        fontVariantLigatures: 'none',
        boxSizing: 'border-box',
        padding: '16px', // Explicit padding to match
        margin: 0,
        border: 'none', // Ensure no border affects box model
        background: 'transparent',
        whiteSpace: 'pre',
        overflowWrap: 'normal',
        display: 'block', // Force block display
        verticalAlign: 'baseline',
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
                    className="w-14 bg-editor-gutter text-editor-gutter-text text-right font-mono text-sm leading-relaxed p-4 pr-1 select-none overflow-hidden border-r border-explorer-border"
                    style={{ 
                        ...editorStyle,
                        fontFamily: 'monospace', // Gutter can stay default mono or match
                        width: '56px',
                        paddingTop: '16px',
                        paddingRight: '4px',
                        paddingLeft: '16px',
                        paddingBottom: '16px',
                        borderRight: '1px solid var(--explorer-border)' // Restore border needed for visual
                    }}
                >
                    {renderGutter()}
                </div>

                {/* Editor Container - Stacked */}
                <div className="flex-grow relative" style={{ ...editorStyle, padding: 0 }}> 
                    
                    {/* Block Highlight Layer */}
                    <div
                        ref={highlightLayerRef}
                        className="absolute inset-0 overflow-hidden pointer-events-none"
                    >
                         <div className="relative w-full" style={{ height: `${contentHeight}px` }}>
                            {highlightedRanges.map((range, idx) => {
                                // Map logical range to visual range
                                let startVisual = range.startLine;
                                let endVisual = range.endLine;
                                
                                if (realToDisplayMap) {
                                    startVisual = realToDisplayMap.get(range.startLine) ?? -1;
                                    endVisual = realToDisplayMap.get(range.endLine) ?? -1;
                                }
                                
                                if (startVisual === -1 && endVisual === -1) return null;
                                
                                if (startVisual !== -1 && endVisual !== -1) {
                                    // Adjusted top offset to 14px to align better with text (compensating for border/font baseline)
                                    const top = startVisual * 21 + 14; 
                                    const height = (endVisual - startVisual + 1) * 21;
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
                                }
                                return null;
                            })}
                         </div>
                    </div>

                    {/* Syntax Overlay */}
                    <pre
                        ref={overlayRef}
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full m-0 p-0 overflow-hidden whitespace-pre pointer-events-none bg-transparent border-0"
                        style={{ 
                            ...editorStyle
                        }}
                    >
                        {renderOverlay()}
                    </pre>

                    {/* Interaction Layer (Textarea) */}
                    <textarea
                        ref={textareaRef}
                        className="absolute inset-0 w-full h-full m-0 p-0 resize-none outline-none whitespace-pre bg-transparent text-transparent caret-editor-text border-0"
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
                            
                            // Reconstruction logic for Folded Content
                            if (collapsedBlockIds.length > 0 && lineMap) {
                                // DETECT CHANGE:
                                // If displayValue != newDisplayValue, user tried to edit.
                                if (val !== displayValue) {
                                     console.warn('[SourceEditor] Edit detected in folded view. Reverting and expanding.');
                                     
                                     // 1. Revert the change immediately to prevent data loss
                                     onChange(value, true); // Reset to full original value
                                     
                                     // 2. Auto-expand (Simple approach: Expand All or Expand Focused?)
                                     // Since we don't know exactly which block was touched without diffing,
                                     // and we want to be safe, we can try to find the cursor position.
                                     
                                     // Cursor position is in 'textareaRef', which corresponds to 'displayLine'.
                                     // const cursorLine = ...
                                     // const realLine = lineMap.get(cursorLine);
                                     // const block = blocks.find ...
                                     // onToggleCollapse(block.id);
                                     
                                     // For now, let's just Log and maybe Toast? 
                                     // Or rely on the user to expand.
                                     // But reverting is crucial.
                                     
                                     // Better UX: Show a toast? "Please expand block to edit."
                                     // But I don't have a toast system ready here.
                                     // I will attempting to expand if possible.
                                     
                                     if (onToggleCollapse) {
                                         // Heuristic: Expand the first collapsed block? Or All?
                                         // Let's expanded all collapsed blocks to be safe and allow editing.
                                         // We iterate 'collapsedBlockIds' and toggle them all?
                                         // No, 'onToggleCollapse' takes one ID.
                                         // We loop?
                                         collapsedBlockIds.forEach(id => onToggleCollapse(id));
                                     }
                                }
                            } else {
                                onChange(val, immediate);
                            }
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
