import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4500 }) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message, title = 'Success') => {
    addToast({ title, message, type: 'success' });
  }, [addToast]);

  const error = useCallback((message, title = 'Error') => {
    addToast({ title, message, type: 'error', duration: 6000 });
  }, [addToast]);

  const warning = useCallback((message, title = 'Warning') => {
    addToast({ title, message, type: 'warning' });
  }, [addToast]);

  const info = useCallback((message, title = 'Information') => {
    addToast({ title, message, type: 'info' });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="assertive"
        className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
            error: <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
            info: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
          };

          const borders = {
            success: 'border-emerald-200 bg-emerald-50/95 text-emerald-900',
            error: 'border-rose-200 bg-rose-50/95 text-rose-900',
            warning: 'border-amber-200 bg-amber-50/95 text-amber-900',
            info: 'border-blue-200 bg-blue-50/95 text-blue-900',
          };

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur transition-all duration-200 ${borders[toast.type] || borders.info}`}
            >
              {icons[toast.type] || icons.info}
              <div className="flex-1 min-w-0">
                {toast.title && <p className="text-sm font-semibold leading-tight">{toast.title}</p>}
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed break-words">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 focus:outline-none rounded p-0.5"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
