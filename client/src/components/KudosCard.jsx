import React from 'react';
import { ShieldAlert, EyeOff, Eye, Trash2, ArrowRight } from 'lucide-react';

const CATEGORY_COLORS = {
  'Teamwork': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Innovation': 'bg-purple-50 text-purple-700 border-purple-200',
  'Customer First': 'bg-blue-50 text-blue-700 border-blue-200',
  'Excellence': 'bg-amber-50 text-amber-700 border-amber-200',
  'Integrity': 'bg-rose-50 text-rose-700 border-rose-200'
};

const AVAILABLE_EMOJIS = ['👍', '❤️', '👏', '🚀'];

function timeAgo(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function KudosCard({
  kudos,
  currentUser,
  onReact,
  onHide,
  onUnhide,
  onDelete
}) {
  const isAdmin = currentUser?.role === 'ADMIN';
  const categoryStyle = CATEGORY_COLORS[kudos.category] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <article
      className={`kudos-card p-5 sm:p-6 transition-all ${
        !kudos.is_visible ? 'is-hidden ring-1 ring-amber-300' : ''
      }`}
    >
      {/* Moderation Alert Banner (If Hidden) */}
      {!kudos.is_visible && (
        <div className="mb-4 p-3 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Moderated by Administrator: </span>
            <span className="italic">{kudos.reason_for_moderation || 'Hidden from public feed.'}</span>
            {kudos.moderator_name && (
              <span className="block mt-0.5 text-amber-800/80">Action by {kudos.moderator_name}</span>
            )}
          </div>
        </div>
      )}

      {/* Header: Sender -> Recipient */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sender */}
          <div className="flex items-center gap-2">
            <img
              src={kudos.sender_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={kudos.sender_name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
            />
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">{kudos.sender_name}</p>
              <p className="text-[10px] text-slate-500">{kudos.sender_department}</p>
            </div>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

          {/* Recipient */}
          <div className="flex items-center gap-2">
            <img
              src={kudos.recipient_avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100'}
              alt={kudos.recipient_name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100"
            />
            <div>
              <p className="text-xs font-bold text-blue-700 leading-tight">{kudos.recipient_name}</p>
              <p className="text-[10px] text-slate-500">{kudos.recipient_title}</p>
            </div>
          </div>
        </div>

        {/* Category & Timestamp */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${categoryStyle}`}>
            #{kudos.category}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            {timeAgo(kudos.created_at)}
          </span>
        </div>
      </div>

      {/* Message Body */}
      <div className="py-4">
        <p className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap">
          "{kudos.message}"
        </p>
      </div>

      {/* Footer: Reactions & Admin Controls */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        {/* Reaction Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {AVAILABLE_EMOJIS.map(emoji => {
            const rxData = kudos.reactions?.[emoji] || { count: 0, hasReacted: false };
            return (
              <button
                key={emoji}
                onClick={() => onReact(kudos.id, emoji)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  rxData.hasReacted
                    ? 'bg-blue-50 border-blue-300 text-blue-800 scale-105 shadow-2xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                }`}
                title={`React with ${emoji}`}
              >
                <span>{emoji}</span>
                {rxData.count > 0 && <span>{rxData.count}</span>}
              </button>
            );
          })}
        </div>

        {/* Administrator Moderation Actions */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            {kudos.is_visible ? (
              <button
                onClick={() => onHide(kudos)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                title="Hide inappropriate kudos from public feed"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide</span>
              </button>
            ) : (
              <button
                onClick={() => onUnhide(kudos)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                title="Restore kudos back to public feed"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Restore</span>
              </button>
            )}

            <button
              onClick={() => onDelete(kudos)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              title="Soft delete permanently"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
