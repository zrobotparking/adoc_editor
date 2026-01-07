import React, { type ReactNode } from 'react';

interface MainLayoutProps {
  explorer?: ReactNode;
  editor: ReactNode;
  preview: ReactNode;
  isSyncScroll?: boolean;
  onToggleSyncScroll?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  explorer, 
  editor, 
  preview,
  isSyncScroll = true,
  onToggleSyncScroll
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
          <div className="p-2 border-b border-gray-700 bg-gray-800 text-sm font-medium flex justify-between items-center">
              <span>Preview</span>
              <button 
                onClick={onToggleSyncScroll}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  isSyncScroll 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                title="Toggle Sync Scrolling"
              >
                Sync Scroll: {isSyncScroll ? 'ON' : 'OFF'}
              </button>
          </div>
          <div className="flex-1 overflow-auto bg-white text-black p-4 relative" id="preview-container">
              {/* Ensure relative positioning for absolute children if any. 
                  Note: We might need to attach ref here if we want to scroll THIS container 
                  Or is DocPreview the container? DocPreview renders a div with overflow.
                  MainLayout renders a div with overflow-auto (Line 41).
                  
                  Wait, MainLayout Line 41: overflow-auto.
                  DocPreview Line 21: min-h-full (but no overflow).
                  
                  So MainLayout IS the scroll container for Preview.
                  Wait, if MainLayout is the scroll container, then DocPreview ref won't help us scroll!
                  
                  Correction: I should pass a REF to MainLayout for the preview container.
                  OR, remove overflow from MainLayout and let DocPreview handle overflow.
                  
                  Current DocPreview: "asciidoc-preview ... min-h-full"
                  It does NOT have overflow-auto.
                  
                  So MainLayout is the scroller.
                  
                  I must change MainLayout to NOT be the scroller, and let DocPreview be the scroller.
                  Or pass ref to MainLayout's preview container.
                  
                  Let's make DocPreview the scroller. It's cleaner for encapsulation.
              */}
              {/* Remove overflow here if DocPreview handles it. Let's make DocPreview handle it by passing className="h-full overflow-auto" */}
              
              {/* Actually, let's keep MainLayout simple. I will inject a style to unset overflow here if needed, 
                  but better yet: Let's assume passed 'preview' component handles its own scrolling?
                  
                  If I change MainLayout line 41 to just 'flex-1 overflow-hidden', then DocPreview needs 'overflow-auto'.
                  
                  Let's check DocPreview again.
                  DocPreview line 22: "asciidoc-preview ... min-h-full". No overflow.
                  
                  If I change MainLayout now, existing layout breaks?
                  Line 41 currently: "flex-1 overflow-auto ..."
                  
                  If I want DocPreview to be scrollable via ref, I need the ref on the SCROLLABLE element.
                  Line 41 is the scrollable element.
                  
                  Option A: Pass ref to MainLayout for previewPane.
                  Option B: Move scrolling into DocPreview (change MainLayout line 41 to overflow-hidden, add overflow-auto to DocPreview).
                  
                  Option B is better for component isolation. DocPreview should contain its scroll logic.
              */}
              <div className="h-full w-full overflow-hidden">
                   {preview}
              </div>
          </div>
      </div>
    </div>
  );
};
