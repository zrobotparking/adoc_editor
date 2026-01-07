AsciiDoc Editor Implementation Plan
Goal Description
Build a cross-platform, professional-grade AsciiDoc table editor with visual editing capabilities, as outlined in the 
Project Plan
. The goal is to allow users to edit complex AsciiDoc tables visually without dealing with complex syntax.

User Review Required
IMPORTANT

Tech Stack: Proposing React + Vite + TypeScript. This ensures a fast, modern web experience and allows for easy wrapping into VS Code webviews or Electron apps later (Headless Architecture).
Architecture: Following the "Headless Architecture" (Core Logic separated from UI).
Styling: Using TailwindCSS for rapid, modern UI development.
Proposed Changes
Project Structure (New)
I will initialize a new Vite project in d:\others\adoc_editor. Structure:

src/core: Pure TS logic (Table parsing, AsciiDoc AST manipulation).
src/components: React components (Shared UI).
src/platform: Adapters (Web implementation for now).
src/App.tsx: Main entry point.
Core Components
TableParser: Regex or AST based parser for AsciiDoc tables.
GridSystem: Data structure to represent the table in memory (2D array with span metadata).
AsciidoctorAdapter: Integration with asciidoctor.js for preview.
UI Components
Layout: 3-pane design (Project Explorer, Source Editor, Preview/Visual Editor).
MonacoEditor (or simple textarea initially): For the Source Editor.
VisualGrid: A custom grid component for visual editing (supporting colspan/rowspan).
Verification Plan
Automated Tests
Unit tests for Core Logic (Table parsing and generation) using Vitest.
Test case: Parse a complex table, modify it (merge cells), and regenerate AsciiDoc.
Manual Verification
Visual Check:
Open the app.
Paste AsciiDoc content.
Switch to "Visual Mode" for a table.
Perform edits (merge cells).
Verify the Source updates correctly.