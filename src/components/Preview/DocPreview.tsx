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
    onEditText?: () => void;
    editorNode?: React.ReactNode;
    activeTableIndex?: number;
    isEditing?: boolean;
}

export const DocPreview: React.FC<DocPreviewProps> = ({ 
    content, 
    onEditTable, 
    onEditText,
    editorNode,
    activeTableIndex = -1,
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
        
        // Only create/manage portal ONLY if we are actively editing
        if (isEditing && activeTableIndex !== -1 && tables[activeTableIndex]) {
            const targetTable = tables[activeTableIndex];
            
            let wrapper = targetTable.parentElement?.querySelector('.editor-portal-wrapper') as HTMLDivElement;
            
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = 'editor-portal-wrapper';
                // Insert after the table
                targetTable.after(wrapper);
            }

            // Hide the static table
            targetTable.style.display = 'none';
            setPortalContainer(wrapper);

            // Cleanup function for when this effect re-runs or unmounts
            return () => {
                if (targetTable) targetTable.style.display = ''; // Show table again
                if (wrapper && wrapper.parentNode) {
                   wrapper.remove();
                }
            };
        } else {
             setPortalContainer(null);
        }

    }, [html, activeTableIndex, isEditing]); // Re-run when HTML structure changes or active table changes

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isEditing) return; // Ignore clicks if already editing
        
        const target = e.target as HTMLElement;
        const potentialTable = target.closest('table');

        if (potentialTable) {
            const container = e.currentTarget;
            const tables = Array.from(container.querySelectorAll('table'));
            const index = tables.indexOf(potentialTable);
            
            if (index !== -1) {
                 onEditTable?.(index);
                 e.stopPropagation(); // Prevent bubbling if needed
                 return;
            }
        }
        
        onEditText?.();
    }, [isEditing, onEditTable, onEditText]);

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
