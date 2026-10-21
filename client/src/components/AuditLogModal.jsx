import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Clock, FileText, ArrowRight } from 'lucide-react';

export default function AuditLogModal({ isOpen, onClose, currentUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/moderation/logs', {
      headers: { 'x-user-id': currentUser.id }
    })
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-pop-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Governance & Moderation Audit Trail</h2>
              <p className="text-xs text-slate-500">Immutable compliance log of all moderation interventions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <p className="text-center py-8 text-xs text-slate-400">Loading audit records...</p>
          ) : logs.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">No moderation actions recorded yet.</p>
          ) : (
            logs.map(log => {
              const actionBadge = 
                log.action === 'HIDE' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                log.action === 'UNHIDE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                'bg-rose-100 text-rose-800 border-rose-200';

              return (
                <div key={log.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] border ${actionBadge}`}>
                      {log.action}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-slate-700">
                    <span className="font-semibold text-slate-900">Admin: </span>
                    {log.admin_name} ({log.admin_email})
                  </div>

                  {log.kudos_snippet && (
                    <div className="p-2 rounded bg-white border border-slate-200 text-slate-600 italic">
                      "{log.kudos_snippet}"
                    </div>
                  )}

                  <div className="text-slate-700">
                    <span className="font-semibold text-slate-900">Mandatory Reason: </span>
                    <span className="text-slate-800 font-medium">{log.reason}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
