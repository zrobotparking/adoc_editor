import React, { useEffect, useState } from 'react';
import Asciidoctor from 'asciidoctor';
import './asciidoc.css';

// Initialize asciidoctor
const asciidoctor = Asciidoctor();

interface DocPreviewProps {
    content: string;
    onEditTable?: (index: number) => void;
    onEditText?: () => void;
}

export const DocPreview: React.FC<DocPreviewProps> = ({ content, onEditTable, onEditText }) => {
    const [html, setHtml] = useState('');

    useEffect(() => {
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
    }, [content]);

    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const potentialTable = target.closest('table');

        if (potentialTable) {
            // Find index of this table among all tables in the preview
            const container = e.currentTarget;
            const tables = Array.from(container.querySelectorAll('table'));
            const index = tables.indexOf(potentialTable);
            
            if (index !== -1) {
                 onEditTable?.(index);
                 return;
            }
        }
        
        // Otherwise, trigger general text edit
        onEditText?.();
    };

    return (
        <div 
            className="asciidoc-preview prose max-w-none p-4 bg-white text-black min-h-full"
            dangerouslySetInnerHTML={{ __html: html }} 
            onDoubleClick={handleDoubleClick}
        />
    );
};
