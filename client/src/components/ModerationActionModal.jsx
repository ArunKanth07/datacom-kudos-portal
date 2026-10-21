import React, { useState } from 'react';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';

export default function ModerationActionModal({
  isOpen,
  actionType, // 'HIDE' or 'DELETE'
  kudos,
  onClose,
  onConfirm
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !kudos) return null;

  const isDelete = actionType === 'DELETE';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('A moderation reason of at least 5 characters is required for audit logs.');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(kudos.id, reason.trim());
      setReason('');
      onClose();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-pop-in">
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDelete ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldAlert className={`w-5 h-5 ${isDelete ? 'text-rose-600' : 'text-amber-600'}`} />
            <h3 className="font-bold text-slate-900">
              {isDelete ? 'Soft-Delete Kudos' : 'Hide Inappropriate Kudos'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
            <span className="font-semibold text-slate-900 block mb-1">Target Kudos:</span>
            <p className="italic line-clamp-2">"{kudos.message}"</p>
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-semibold">{error}</p>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Reason for Moderation (Required)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Inappropriate language, policy breach, promotional spam..."
              className="w-full bg-slate-50 text-slate-800 text-xs rounded-xl p-3 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              This reason will be permanently recorded in the immutable compliance audit trail.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer ${
                isDelete
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {submitting ? 'Applying...' : isDelete ? 'Confirm Delete' : 'Confirm Hide'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
