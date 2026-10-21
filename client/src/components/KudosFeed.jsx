import React from 'react';
import { Search, Filter, ShieldAlert, FileText, Sparkles } from 'lucide-react';
import KudosCard from './KudosCard';

const CATEGORIES = ['All', 'Teamwork', 'Innovation', 'Customer First', 'Excellence', 'Integrity'];

export default function KudosFeed({
  kudosList,
  currentUser,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onReact,
  onHide,
  onUnhide,
  onDelete,
  onOpenAuditLogs
}) {
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      
      {/* Top Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        {/* Row 1: Search + Admin View Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by colleague name or message..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Admin Mode Tabs & Audit Log Button */}
          {isAdmin && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => onTabChange('feed')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'feed'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Public Feed
                </button>
                <button
                  onClick={() => onTabChange('moderation')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'moderation'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hidden ({kudosList.filter(k => !k.is_visible).length})</span>
                </button>
              </div>

              <button
                onClick={onOpenAuditLogs}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                title="View Governance & Moderation Logs"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden md:inline">Audit Trail</span>
              </button>
            </div>
          )}

        </div>

        {/* Row 2: Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Values:
          </span>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

      </div>

      {/* Kudos Stream */}
      {kudosList.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">No Kudos Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {activeTab === 'moderation'
              ? 'Great news! There are currently no hidden or flagged kudos requiring attention.'
              : 'Be the first to appreciate a colleague and make someone\'s day!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {kudosList.map(kudos => (
            <KudosCard
              key={kudos.id}
              kudos={kudos}
              currentUser={currentUser}
              onReact={onReact}
              onHide={onHide}
              onUnhide={onUnhide}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

    </div>
  );
}
