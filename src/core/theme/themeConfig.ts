export interface ThemeColors {
    // App Base
    '--bg-app': string;
    '--text-primary': string;
    '--text-secondary': string;
    '--text-accent': string;

    // Sidebar (Explorer)
    '--bg-sidebar': string;
    '--border-sidebar': string;
    '--sidebar-header-bg': string;
    // Explorer Items
    '--explorer-item-text': string;
    '--explorer-item-hover-bg': string;
    '--explorer-item-active-bg': string;
    '--explorer-item-active-text': string;

    // Header
    '--bg-header': string;
    '--border-header': string;

    // Panels (Settings, Dialogs)
    '--bg-panel': string;
    '--border-panel': string;
    
    // Editor
    '--bg-editor': string;
    '--bg-editor-gutter': string;
    '--text-editor': string;
    '--text-editor-gutter': string;

    // Preview
    '--bg-preview': string;
    '--text-preview': string;
    '--preview-header-border': string;
    '--preview-header-text': string;
    '--preview-link': string;
    '--preview-table-border': string;
    '--preview-table-header-bg': string;
    '--preview-table-row-even-bg': string;
    '--preview-code-bg': string;
    '--preview-code-text': string;

    // Edit Widget
    '--edit-widget-bg': string;
    '--edit-widget-border': string;
    '--edit-widget-label': string;

    // Buttons / Interactions
    '--btn-primary-bg': string;
    '--btn-primary-text': string;
    '--btn-secondary-bg': string;
    '--btn-secondary-text': string;
    '--btn-secondary-hover': string;

    // Syntax Highlighting
    '--syntax-header': string;
    '--syntax-bold': string;
    '--syntax-italic': string;
    '--syntax-list': string;
    '--syntax-link': string;
    '--syntax-code': string;
    '--syntax-code-block': string;
    '--syntax-attribute': string;
    '--syntax-string': string;
    '--syntax-comment': string;
    '--syntax-macro': string;
    '--syntax-passthrough': string;
}

export type ThemeName = 'light' | 'dark';

export const themes: Record<ThemeName, ThemeColors> = {
    light: {
        '--bg-app': '#ffffff',
        '--text-primary': '#1f2937', // gray-800
        '--text-secondary': '#4b5563', // gray-600
        '--text-accent': '#2563eb', // blue-600

        '--bg-sidebar': '#e5e7eb', // gray-200
        '--border-sidebar': '#d1d5db', // gray-300
        '--sidebar-header-bg': '#e5e7eb', // gray-200

        '--explorer-item-text': '#374151', // gray-700
        '--explorer-item-hover-bg': '#d1d5db', // gray-300
        '--explorer-item-active-bg': '#dbeafe', // blue-100
        '--explorer-item-active-text': '#1d4ed8', // blue-700

        '--bg-header': '#f3f4f6', // gray-100
        '--border-header': '#e5e7eb', // gray-200

        '--bg-panel': '#ffffff',
        '--border-panel': '#e5e7eb',

        '--bg-editor': '#fffffe', // Almost white
        '--bg-editor-gutter': '#f3f4f6',
        '--text-editor': '#1f2937',
        '--text-editor-gutter': '#6b7280',

        // Preview - GitHub Light inspired
        '--bg-preview': '#ffffff',
        '--text-preview': '#24292f',
        '--preview-header-border': '#eaecef',
        '--preview-header-text': '#24292f',
        '--preview-link': '#0969da',
        '--preview-table-border': '#d0d7de',
        '--preview-table-header-bg': '#f6f8fa',
        '--preview-table-row-even-bg': '#f6f8fa',
        '--preview-code-bg': '#f6f8fa',
        '--preview-code-text': '#24292f',

        '--edit-widget-bg': '#fff7ed', // orange-50
        '--edit-widget-border': '#fdba74', // orange-300
        '--edit-widget-label': '#c2410c', // orange-700

        '--btn-primary-bg': '#2563eb',
        '--btn-primary-text': '#ffffff',
        '--btn-secondary-bg': '#e5e7eb',
        '--btn-secondary-text': '#1f2937',
        '--btn-secondary-hover': '#d1d5db',

        // Syntax Highlighting (Light+)
        '--syntax-header': '#005cc5', // Blue
        '--syntax-bold': '#24292f',
        '--syntax-italic': '#24292f',
        '--syntax-list': '#005cc5',
        '--syntax-link': '#032f62',
        '--syntax-code': '#e3116c',
        '--syntax-code-block': '#e3116c',
        '--syntax-attribute': '#005cc5',
        '--syntax-string': '#032f62',
        '--syntax-comment': '#6a737d',
        '--syntax-macro': '#6f42c1',
        '--syntax-passthrough': '#e3116c'
    },
    dark: {
        '--bg-app': '#1e1e1e', // VS Code Dark+ Base
        '--text-primary': '#cccccc', // VS Code FG
        '--text-secondary': '#9ca3af',
        '--text-accent': '#0e639c', // VS Code blue

        '--bg-sidebar': '#252526', // VS Code Sidebar
        '--border-sidebar': '#2b2b2b', // VS Code Border (approximated)
        '--sidebar-header-bg': '#252526', 

        '--explorer-item-text': '#cccccc',
        '--explorer-item-hover-bg': '#2a2d2e', // VS Code list hover
        '--explorer-item-active-bg': '#37373d', // VS Code list active
        '--explorer-item-active-text': '#ffffff',

        '--bg-header': '#252526', // VS Code Title Barish
        '--border-header': '#2b2b2b',

        '--bg-panel': '#252526',
        '--border-panel': '#454545', // VS Code Widget border

        '--bg-editor': '#1e1e1e',
        '--bg-editor-gutter': '#1e1e1e', // Gutter usually same in vscode
        '--text-editor': '#d4d4d4',
        '--text-editor-gutter': '#858585',

        // Preview - VS Code Dark+ compatible
        '--bg-preview': '#1e1e1e', 
        '--text-preview': '#d4d4d4',
        '--preview-header-border': '#444444', // Darker border
        '--preview-header-text': '#569cd6', // Blueish headers common in themes
        '--preview-link': '#3794ff',
        '--preview-table-border': '#454545',
        '--preview-table-header-bg': '#2d2d2d', // Slightly lighter than bg
        '--preview-table-row-even-bg': '#262626', // very subtle stripe? or nothing. VS Code usually plain but let's do subtle.
        '--preview-code-bg': '#2d2d2d',
        '--preview-code-text': '#ce9178', // Orangeish for inline code

        '--edit-widget-bg': '#2d2624', // Dark with orange tint
        '--edit-widget-border': '#ce9178', // VS Code String Color
        '--edit-widget-label': '#ce9178',

        '--btn-primary-bg': '#0e639c', // VS Code Blue
        '--btn-primary-text': '#ffffff',
        '--btn-secondary-bg': '#3c3c3c', // VS Code Input bg
        '--btn-secondary-text': '#cccccc',
        '--btn-secondary-hover': '#474747',

        // Syntax Highlighting (Dark+)
        '--syntax-header': '#569cd6', // Blue
        '--syntax-bold': '#d4d4d4',   // Standard (bolded via css)
        '--syntax-italic': '#d4d4d4', // Standard (italic via css)
        '--syntax-list': '#6796e6',   // Soft Blue
        '--syntax-link': '#3794ff',   // Blue link
        '--syntax-code': '#ce9178',   // Orangeish
        '--syntax-code-block': '#ce9178',
        '--syntax-attribute': '#4ec9b0', // Teal-ish
        '--syntax-string': '#ce9178',
        '--syntax-comment': '#6a9955', // Green
        '--syntax-macro': '#c586c0',   // Purple
        '--syntax-passthrough': '#ce9178'
    }
};

export function applyTheme(theme: ThemeName) {
    const root = document.documentElement;
    const colors = themes[theme];
    Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}
