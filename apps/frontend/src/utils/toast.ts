type ToastHandler = (message: string) => void;

const listeners = {
  success: new Set<ToastHandler>(),
  error: new Set<ToastHandler>(),
};

function emit(type: 'success' | 'error', message: string) {
  const set = listeners[type];
  if (set.size === 0) {
    if (typeof window !== 'undefined') {
      console[type === 'error' ? 'error' : 'log'](`[toast:${type}]`, message);
    }
    return;
  }
  set.forEach((handler) => handler(message));
}

export const toast = {
  success: (message: string) => emit('success', message),
  error: (message: string) => emit('error', message),
  subscribe(type: 'success' | 'error', handler: ToastHandler) {
    listeners[type].add(handler);
    return () => listeners[type].delete(handler);
  },
};
