/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic Application Colors
        app: {
          base: 'var(--bg-app)',
          sidebar: 'var(--bg-sidebar)',
          header: 'var(--bg-header)',
          panel: 'var(--bg-panel)',
        },
        // Text Colors
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          accent: 'var(--text-accent)',
        },
        // Components
        explorer: {
          item: 'var(--explorer-item-text)',
          'item-hover': 'var(--explorer-item-hover-bg)',
          'item-active': 'var(--explorer-item-active-bg)',
          'item-active-text': 'var(--explorer-item-active-text)',
          border: 'var(--border-sidebar)',
          header: 'var(--sidebar-header-bg)',
        },
        editor: {
          bg: 'var(--bg-editor)',
          gutter: 'var(--bg-editor-gutter)',
          text: 'var(--text-editor)',
          'gutter-text': 'var(--text-editor-gutter)',
        },
        preview: {
          bg: 'var(--bg-preview)',
          text: 'var(--text-preview)',
        },
        edit: {
          bg: 'var(--edit-widget-bg)',
          border: 'var(--edit-widget-border)',
          label: 'var(--edit-widget-label)',
        },
        btn: {
          primary: 'var(--btn-primary-bg)',
          'primary-text': 'var(--btn-primary-text)',
          secondary: 'var(--btn-secondary-bg)',
          'secondary-text': 'var(--btn-secondary-text)',
          'secondary-hover': 'var(--btn-secondary-hover)',
        }
      }
    },
  },
  plugins: [],
}

