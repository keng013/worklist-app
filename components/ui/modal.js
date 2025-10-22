import React from "react";
import { AlertTriangle } from "lucide-react";

// --- Helper Components ---
export const SimpleModal = ({ show, message, onClose }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-auto shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Login Failed
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            {message}
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleModal;
