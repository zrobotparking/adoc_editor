import React from 'react';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    theme: 'light' | 'dark';
    onThemeChange: (theme: 'light' | 'dark') => void;
    showBlockHighlight: boolean;
    onToggleBlockHighlight: () => void;
    autoReveal: boolean;
    onToggleAutoReveal: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
    isOpen, 
    onClose, 
    theme, 
    onThemeChange,
    showBlockHighlight,
    onToggleBlockHighlight,
    autoReveal,
    onToggleAutoReveal
}) => {
    if (!isOpen) return null;

    return (
        <div className="absolute bottom-12 left-10 w-64 bg-app-panel border border-app-panel shadow-xl rounded-lg p-4 z-50 text-text-primary">
            <h3 className="font-bold mb-4 text-lg border-b border-app-panel pb-2">Settings</h3>
            
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-text-secondary">Color Theme</label>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => onThemeChange('dark')}
                        className={`px-3 py-1 rounded border ${theme === 'dark' ? 'bg-btn-primary text-btn-primary-text border-btn-primary' : 'bg-btn-secondary text-btn-secondary-text border-btn-secondary hover:bg-btn-secondary-hover'}`}
                    >
                        Dark
                    </button>
                    <button 
                        onClick={() => onThemeChange('light')}
                        className={`px-3 py-1 rounded border ${theme === 'light' ? 'bg-btn-primary text-btn-primary-text border-btn-primary' : 'bg-btn-secondary text-btn-secondary-text border-btn-secondary hover:bg-btn-secondary-hover'}`}
                    >
                        Light
                    </button>
                </div>
            </div>

            <div className="mb-4 space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-text-primary cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={showBlockHighlight}
                        onChange={onToggleBlockHighlight}
                        className="form-checkbox h-4 w-4 text-blue-600 rounded bg-app-base border-gray-500"
                    />
                    <span>Highlight Active Block</span>
                </label>
                
                <label className="flex items-center space-x-2 text-sm font-medium text-text-primary cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={autoReveal}
                        onChange={onToggleAutoReveal}
                        className="form-checkbox h-4 w-4 text-blue-600 rounded bg-app-base border-gray-500"
                    />
                    <span>Auto Reveal Preview</span>
                </label>
            </div>

            <button 
                onClick={onClose}
                className="w-full mt-2 px-4 py-2 bg-btn-secondary text-btn-secondary-text hover:bg-btn-secondary-hover rounded text-sm"
            >
                Close
            </button>
        </div>
    );
};
