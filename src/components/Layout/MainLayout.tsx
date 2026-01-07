import React, { type ReactNode } from 'react';

interface MainLayoutProps {
  explorer?: ReactNode;
  editor: ReactNode;
  preview: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  explorer, 
  editor, 
  preview
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-900 text-white">
      {/* Left Pane: Project Explorer */}
      <div className="w-64 border-r border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-700 font-bold bg-gray-800">
          Explorer
        </div>
        <div className="flex-1 overflow-auto p-2">
          {explorer || <div className="text-gray-500 text-sm p-2">No Folder Opened</div>}
        </div>
      </div>

      {/* Middle Pane: Source Editor */}
      <div className="flex-1 flex flex-col border-r border-gray-700 min-w-[300px]">
         <div className="p-2 border-b border-gray-700 bg-gray-800 text-sm font-medium">
             Source.adoc
         </div>
         <div className="flex-1 overflow-hidden relative">
             {editor}
         </div>
      </div>

      {/* Right Pane: Preview / Visual Editor */}
      <div className="flex-1 flex flex-col min-w-[300px]">
          <div className="p-2 border-b border-gray-700 bg-gray-800 text-sm font-medium flex justify-between">
              <span>Preview</span>
          </div>
          <div className="flex-1 overflow-auto bg-white text-black p-4">
              {preview}
          </div>
      </div>
    </div>
  );
};
