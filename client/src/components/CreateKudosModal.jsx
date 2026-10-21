import React, { useState } from 'react';
import { X, Send, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const CORE_VALUES = [
  { name: 'Teamwork', desc: 'Collaborating effectively to achieve common goals' },
  { name: 'Innovation', desc: 'Bringing fresh ideas and modern solutions' },
  { name: 'Customer First', desc: 'Delivering exceptional client experiences' },
  { name: 'Excellence', desc: 'Maintaining the highest technical and operational quality' },
  { name: 'Integrity', desc: 'Acting with transparency, respect, and honesty' }
];

export default function CreateKudosModal({
  isOpen,
  onClose,
  users,
  currentUser,
  onSubmitSuccess
}) {
  const [recipientId, setRecipientId] = useState('');
  const [category, setCategory] = useState('Teamwork');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter colleagues to exclude oneself (AC-01 Self-kudos prevention)
  const availableColleagues = users.filter(u => u.id !== currentUser?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!recipientId) {
      setError('Please select a colleague to recognize.');
      return;
    }

    if (message.trim().length < 5) {
      setError('Your message must be at least 5 characters long.');
      return;
    }

    if (message.length > 500) {
      setError('Your message cannot exceed 500 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/kudos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          recipient_id: recipientId,
          category,
          message: message.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit kudos.');
      }

      // Celebrate with confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      onSubmitSuccess(data.kudos);
      onClose();
      setMessage('');
      setRecipientId('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedColleague = users.find(u => u.id === recipientId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-pop-in">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recognize a Colleague</h2>
              <p className="text-xs text-slate-500">Celebrate someone who made a difference</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Colleague Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Select Colleague
            </label>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              required
              className="w-full bg-slate-50 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">-- Choose a teammate --</option>
              {availableColleagues.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.title} ({u.department})
                </option>
              ))}
            </select>
            {selectedColleague && (
              <div className="mt-2 flex items-center gap-2.5 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                <img
                  src={selectedColleague.avatar_url}
                  alt={selectedColleague.name}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-xs font-semibold text-blue-900">
                  Giving kudos to {selectedColleague.name} ({selectedColleague.department})
                </span>
              </div>
            )}
          </div>

          {/* Datacom Core Value Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Datacom Core Value
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CORE_VALUES.map(val => {
                const isSelected = category === val.name;
                return (
                  <button
                    type="button"
                    key={val.name}
                    onClick={() => setCategory(val.name)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{val.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Appreciation Message
              </label>
              <span className={`text-[11px] font-mono ${
                message.length > 500 ? 'text-rose-600 font-bold' : 'text-slate-400'
              }`}>
                {message.length} / 500
              </span>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What did they do that was remarkable? Share specific details..."
              required
              className="w-full bg-slate-50 text-slate-800 text-sm rounded-xl p-3.5 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Minimum 5 characters. Submissions are checked for spam and community guidelines.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-md shadow-blue-600/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4 stroke-[2.2]" />
              <span>{submitting ? 'Submitting...' : 'Send Kudos'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
