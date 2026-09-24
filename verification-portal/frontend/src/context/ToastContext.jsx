import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback((message, title = 'Success') => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const showError = useCallback((message, title = 'Error') => {
    addToast({ type: 'error', title, message, duration: 6000 });
  }, [addToast]);

  const showWarning = useCallback((message, title = 'Warning') => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const showInfo = useCallback((message, title = 'Notice') => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map((toast) => {
          let bgClass = 'bg-white border-slate-200 text-slate-800';
          let Icon = Info;
          let iconColor = 'text-blue-600';

          if (toast.type === 'success') {
            bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-900';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-600';
          } else if (toast.type === 'error') {
            bgClass = 'bg-rose-50 border-rose-200 text-rose-900';
            Icon = AlertCircle;
            iconColor = 'text-rose-600';
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-50 border-amber-200 text-amber-900';
            Icon = AlertTriangle;
            iconColor = 'text-amber-600';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg ${bgClass} transition-all duration-200`}
              role="alert"
            >
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                {toast.title && <h4 className="text-sm font-semibold">{toast.title}</h4>}
                <p className="text-xs mt-0.5 break-words leading-relaxed">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 -mr-1 -mt-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
