import React from 'react';
import { Award, ShieldCheck, UserCheck, Plus, Sparkles } from 'lucide-react';

export default function Header({ users, currentUser, onSelectUser, onOpenModal }) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Award className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">DATACOM</span>
                <span className="px-2 py-0.5 text-xs font-bold uppercase rounded-md bg-blue-100 text-blue-700 tracking-wider">
                  Kudos
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Internal Employee Recognition Portal</p>
            </div>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Persona / User Switcher */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <div className="hidden sm:flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-500">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Simulate:</span>
              </div>
              <select
                aria-label="Select active employee persona"
                value={currentUser?.id || ''}
                onChange={(e) => {
                  const selected = users.find(u => u.id === e.target.value);
                  if (selected) onSelectUser(selected);
                }}
                className="bg-white text-slate-800 text-xs sm:text-sm font-semibold rounded-lg px-2.5 py-1.5 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.role === 'ADMIN' ? '🛡️ ' : '👤 '} {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Role Indicator */}
            {currentUser?.role === 'ADMIN' ? (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Admin Active
              </span>
            ) : null}

            {/* "Give Kudos" CTA Button */}
            <button
              onClick={onOpenModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Give Kudos</span>
              <span className="sm:hidden">Give</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
