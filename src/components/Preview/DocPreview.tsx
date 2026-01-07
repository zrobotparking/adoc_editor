import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Asciidoctor from 'asciidoctor';
import './asciidoc.css';

// Initialize asciidoctor
const asciidoctor = Asciidoctor();

// Inner component to prevent re-renders of the HTML container
const MemoizedPreview = React.memo(({ html, onClick, containerRef }: { 
    html: string; 
    onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}) => {
    return (
        <div 
            ref={containerRef}
            className="asciidoc-preview prose max-w-none p-4 bg-white text-black min-h-full"
            dangerouslySetInnerHTML={{ __html: html }} 
            onClick={onClick}
        />
    );
}, (prevProps, nextProps) => {
    // Only re-render if HTML string changes
    return prevProps.html === nextProps.html;
});

interface DocPreviewProps {
    content: string;
    onEditTable?: (index: number) => void;
    onEditText?: () => void; // Deprecated, but keeping for compatibility if needed
    onEditTextZone?: (index: number) => void;
    editorNode?: React.ReactNode;
    activeTableIndex?: number;
    activeTextZoneIndex?: number;
    isEditing?: boolean;
}

export const DocPreview: React.FC<DocPreviewProps> = ({ 
    content, 
    onEditTable, 
    onEditText,
    onEditTextZone,
    editorNode,
    activeTableIndex = -1,
    activeTextZoneIndex = -1,
    isEditing = false
}) => {
    const [html, setHtml] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

    // 1. AsciiDoc Render Effect
    useEffect(() => {
        // If we are editing, DO NOT re-render HTML to prevent DOM trashing
        if (isEditing) return;

        try {
            const converted = asciidoctor.convert(content, { 
                safe: 'safe', 
                standalone: false,
                attributes: {
                    'showtitle': true,
                    'icons': 'font'
                }
            });
            setHtml(converted as string);
        } catch (e) {
            console.error('Asciidoctor conversion error:', e);
            setHtml('<div class="text-red-500">Error rendering preview</div>');
        }
    }, [content, isEditing]);

    // 2. Portal Management Effect
    useEffect(() => {
        if (!containerRef.current) return;

        const tables = Array.from(containerRef.current.querySelectorAll('table'));
        
        // --- TABLE EDITING ---
        if (isEditing && activeTableIndex !== -1 && tables[activeTableIndex]) {
            const targetTable = tables[activeTableIndex];
            
            let wrapper = targetTable.parentElement?.querySelector('.editor-portal-wrapper') as HTMLDivElement;
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = 'editor-portal-wrapper';
                targetTable.after(wrapper);
            }

            targetTable.style.display = 'none';
            setPortalContainer(wrapper);

            return () => {
                if (targetTable) targetTable.style.display = ''; 
                if (wrapper && wrapper.parentNode) wrapper.remove();
            };
        } 
        // --- TEXT EDITING ---
        // We use activeTableIndex = -1 to signal text mode? 
        // Or we should add a separate prop activeTextZoneIndex.
        // For now, let's look at `activeTextZoneIndex` which we'll add to props.
        else if (isEditing && typeof activeTextZoneIndex === 'number' && activeTextZoneIndex !== -1) {
             // Zone 0: Before first table. 
             // Zone N: After Table N (Wait, zone index is 1-based relative to table gaps? 
             // My logic in handleClick: Zone 0=Before Table 0. Zone 1=After Table 0.
             
             // So if Zone X:
             // We want to insert helper at that position.
             // VisualTextEditor replaces the entire "Text Zone"? No, we can't hide scattered P tags efficiently.
             // We will just INSERT the editor and maybe hide nothing? Or hide siblings?
             // Hiding siblings is hard. 
             // Let's just INSERT the editor. It will push content down.
             // User might see duplicate content (Original Text + Editor), but Editor will be editable.
             // This is acceptable for MVP.
             
             let placementTarget: HTMLElement | null = null;
             let placementMethod: 'prepend' | 'after' = 'after';
             
             if (activeTextZoneIndex === 0) {
                 // Zone 0: Start of container
                 placementTarget = containerRef.current;
                 placementMethod = 'prepend';
             } else {
                 // Zone N > 0: After Table (N-1)
                 // e.g. Zone 1 is after Table 0.
                 const refTableIndex = activeTextZoneIndex - 1;
                 if (tables[refTableIndex]) {
                     placementTarget = tables[refTableIndex];
                     placementMethod = 'after';
                 }
             }

             if (placementTarget) {
                 let wrapper = containerRef.current.querySelector('.text-editor-portal') as HTMLDivElement;
                 if (!wrapper) {
                     wrapper = document.createElement('div');
                     wrapper.className = 'text-editor-portal';
                     wrapper.style.margin = '20px 0';
                     
                     if (placementMethod === 'prepend') {
                         placementTarget.prepend(wrapper);
                     } else {
                         (placementTarget as HTMLElement).after(wrapper);
                     }
                 }
                 setPortalContainer(wrapper);
                 return () => {
                     if (wrapper && wrapper.parentNode) wrapper.remove();
                 };
             }
        }
        else {
             setPortalContainer(null);
        }

    }, [html, activeTableIndex, activeTextZoneIndex, isEditing]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isEditing) return; // Ignore clicks if already editing
        
        let target = e.target as HTMLElement;
        const container = e.currentTarget;

        // 1. Check if clicked element is part of a table (including AsciiDoc wrappers)
        // AsciiDoc often wraps tables in .tableblock or .content
        const tableWrapper = target.closest('.tableblock') || target.closest('table');
        
        // If we found a wrapper, find the actual table inside it
        let actualTable: HTMLTableElement | null = null;
        if (tableWrapper) {
             if (tableWrapper.tagName === 'TABLE') {
                 actualTable = tableWrapper as HTMLTableElement;
             } else {
                 actualTable = tableWrapper.querySelector('table');
             }
        }

        const tables = Array.from(container.querySelectorAll('table'));

        if (actualTable) {
            const index = tables.indexOf(actualTable);
            
            if (index !== -1) {
                 onEditTable?.(index);
                 e.stopPropagation(); 
                 return;
            }
        }
        
        // 2. It's a Text/Other click.
        // PREVENT FALSE POSITIVES:
        // If user clicks a high-level container (like .sect1) that CONTAINS tables, 
        // compareDocumentPosition will return FOLLOWING, causing it to map to Zone 0.
        // We must reject clicks if the target contains any tables (unless it IS a table part, checked above).
        if (target.querySelector('table')) {
             console.log('[DocPreview] Clicked container with tables, ignoring.');
             return;
        }

        // Identify Text Zone
        let foundNextTableIndex = -1;
             
        for (let i = 0; i < tables.length; i++) {
             // If table is AFTER target
             if (target.compareDocumentPosition(tables[i]) & Node.DOCUMENT_POSITION_FOLLOWING) {
                 foundNextTableIndex = i;
                 break;
             }
        }
             
        const textZoneIndex = foundNextTableIndex === -1 ? tables.length : foundNextTableIndex;
        console.log(`[DocPreview] Text Click mapped to Zone ${textZoneIndex}`);
             
        if (onEditTextZone) {
             onEditTextZone(textZoneIndex);
        } else {
             onEditText?.();
        }

    }, [isEditing, onEditTable, onEditText, onEditTextZone]);

    return (
        <div className="relative min-h-full">
            <MemoizedPreview 
                html={html} 
                onClick={handleClick} 
                containerRef={containerRef} 
            />
            {portalContainer && editorNode && ReactDOM.createPortal(editorNode, portalContainer)}
        </div>
    );
};
