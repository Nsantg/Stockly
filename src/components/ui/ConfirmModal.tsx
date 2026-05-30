'use client';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  danger = true,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in-up">
        <div className="px-6 pt-6 pb-5">
          <div className={`inline-flex p-2.5 rounded-xl mb-4 ${danger ? 'bg-red-50' : 'bg-brand-50'}`}>
            {danger ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-red-500">
                <path d="M10 3L18 17H2L10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M10 8.5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="10" cy="14.5" r="0.75" fill="currentColor" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-brand-500">
                <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 9V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="10" cy="7" r="0.75" fill="currentColor" />
              </svg>
            )}
          </div>
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          {description && (
            <p className="text-sm text-muted mt-1.5">{description}</p>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium border border-line rounded-xl hover:bg-subtle transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl text-white transition-colors ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-500 hover:bg-brand-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
