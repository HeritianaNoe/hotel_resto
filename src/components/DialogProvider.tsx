"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type DialogKind = "info" | "error" | "success" | "confirm";

type DialogState = {
  open: boolean;
  kind: DialogKind;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type DialogContextValue = {
  alert: (message: string, title?: string) => Promise<void>;
  error: (message: string, title?: string) => Promise<void>;
  success: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

const defaultState: DialogState = {
  open: false,
  kind: "info",
  title: "",
  message: "",
};

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(defaultState);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const openDialog = useCallback(
    (kind: DialogKind, message: string, title?: string) => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        const titles: Record<DialogKind, string> = {
          info: "Information",
          error: "Erreur",
          success: "Succès",
          confirm: "Confirmation",
        };
        setState({
          open: true,
          kind,
          title: title || titles[kind],
          message,
          confirmLabel: kind === "confirm" ? "Confirmer" : "OK",
          cancelLabel: kind === "confirm" ? "Annuler" : undefined,
        });
      });
    },
    []
  );

  const value: DialogContextValue = {
    alert: (message, title) =>
      openDialog("info", message, title).then(() => undefined),
    error: (message, title) =>
      openDialog("error", message, title).then(() => undefined),
    success: (message, title) =>
      openDialog("success", message, title).then(() => undefined),
    confirm: (message, title) => openDialog("confirm", message, title),
  };

  const icon =
    state.kind === "error" ? (
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-5 w-5 text-red-600" />
      </div>
    ) : state.kind === "success" ? (
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      </div>
    ) : state.kind === "confirm" ? (
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
      </div>
    ) : (
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100">
        <Info className="h-5 w-5 text-teal-600" />
      </div>
    );

  return (
    <DialogContext.Provider value={value}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => close(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => close(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center text-center">
              {icon}
              <h3 className="mt-3 text-lg font-semibold text-slate-900">
                {state.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {state.message}
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              {state.kind === "confirm" && (
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="btn-secondary min-w-[100px]"
                >
                  {state.cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => close(true)}
                className={
                  state.kind === "error" || state.kind === "confirm"
                    ? "btn-danger min-w-[100px]"
                    : "btn-primary min-w-[100px]"
                }
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog must be used within DialogProvider");
  }
  return ctx;
}
