import { create } from 'zustand';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: number;
  message: string;
  tone: 'info' | 'error';
  action?: ToastAction;
}

interface ToastState {
  items: ToastItem[];
  push: (
    message: string,
    options?: { tone?: 'info' | 'error'; action?: ToastAction; timeout?: number },
  ) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastState>((set, get) => ({
  items: [],
  push: (message, options = {}) => {
    const id = nextId++;
    const item: ToastItem = {
      id,
      message,
      tone: options.tone ?? 'info',
      ...(options.action ? { action: options.action } : {}),
    };
    set((state) => ({ items: [...state.items, item].slice(-3) }));
    const timeout = options.timeout ?? (options.action ? 6000 : 3200);
    if (timeout > 0) window.setTimeout(() => get().dismiss(id), timeout);
    return id;
  },
  dismiss: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}));

export function toastError(message: string): void {
  useToasts.getState().push(message, { tone: 'error', timeout: 5000 });
}
