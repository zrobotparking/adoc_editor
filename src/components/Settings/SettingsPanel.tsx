import React from 'react';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    theme: 'light' | 'dark';
    onThemeChange: (theme: 'light' | 'dark') => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
    isOpen, 
    onClose, 
    theme, 
    onThemeChange 
}) => {
    if (!isOpen) return null;

    return (
        <div className="absolute bottom-12 left-10 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 text-black dark:text-white">
            <h3 className="font-bold mb-4 text-lg border-b pb-2">Settings</h3>
            
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Color Theme</label>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => onThemeChange('dark')}
                        className={`px-3 py-1 rounded border ${theme === 'dark' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-200 text-gray-800 border-gray-300'}`}
                    >
                        Dark
                    </button>
                    <button 
                        onClick={() => onThemeChange('light')}
                        className={`px-3 py-1 rounded border ${theme === 'light' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-200 text-gray-800 border-gray-300'}`}
                    >
                        Light
                    </button>
                </div>
            </div>

            <button 
                onClick={onClose}
                className="w-full mt-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm"
            >
                Close
            </button>
        </div>
    );
};
