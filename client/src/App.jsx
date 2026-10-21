import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import KudosFeed from './components/KudosFeed';
import CreateKudosModal from './components/CreateKudosModal';
import ModerationActionModal from './components/ModerationActionModal';
import AuditLogModal from './components/AuditLogModal';

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [kudos, setKudos] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Filter & Feed States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'moderation'

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [modModalState, setModModalState] = useState({
    isOpen: false,
    actionType: 'HIDE', // 'HIDE' | 'DELETE'
    kudos: null
  });

  // Toast / feedback message
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Initial Load: Fetch Users & Initial Current User
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.users && data.users.length > 0) {
          setUsers(data.users);
          // Default to first regular user (Sarah Chen)
          const defaultUser = data.users.find(u => u.role === 'USER') || data.users[0];
          setCurrentUser(defaultUser);
        }
      })
      .catch(err => console.error('Failed to load users:', err));
  }, []);

  // 2. Fetch Stats
  const fetchStats = useCallback(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load stats:', err));
  }, []);

  // 3. Fetch Kudos Feed
  const fetchKudos = useCallback(() => {
    if (!currentUser) return;
    const isAdmin = currentUser.role === 'ADMIN';
    const params = new URLSearchParams();

    if (selectedCategory !== 'All') {
      params.append('category', selectedCategory);
    }
    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }
    if (isAdmin) {
      params.append('include_hidden', 'true');
    }

    fetch(`/api/kudos?${params.toString()}`, {
      headers: { 'x-user-id': currentUser.id }
    })
      .then(res => res.json())
      .then(data => {
        setKudos(data.items || []);
      })
      .catch(err => console.error('Failed to fetch kudos feed:', err));
  }, [currentUser, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchKudos();
    fetchStats();
  }, [fetchKudos, fetchStats]);

  // Handle Emoji Reaction
  const handleReact = async (kudosId, emoji) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/kudos/${kudosId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ emoji })
      });
      const data = await res.json();
      if (res.ok) {
        setKudos(prev =>
          prev.map(k => (k.id === kudosId ? { ...k, reactions: data.reactions } : k))
        );
        fetchStats();
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  };

  // Open Moderation Modal (Hide)
  const handleOpenHide = (kudosItem) => {
    setModModalState({
      isOpen: true,
      actionType: 'HIDE',
      kudos: kudosItem
    });
  };

  // Open Moderation Modal (Delete)
  const handleOpenDelete = (kudosItem) => {
    setModModalState({
      isOpen: true,
      actionType: 'DELETE',
      kudos: kudosItem
    });
  };

  // Confirm Moderation Action
  const handleConfirmModeration = async (kudosId, reason) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    const isDelete = modModalState.actionType === 'DELETE';
    const endpoint = isDelete
      ? `/api/moderation/${kudosId}`
      : `/api/moderation/${kudosId}/hide`;
    const method = isDelete ? 'DELETE' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      },
      body: JSON.stringify({ reason })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Moderation action failed');
    }

    showToast(
      isDelete ? 'Kudos soft-deleted from system.' : 'Kudos hidden from public feed.',
      'info'
    );
    fetchKudos();
    fetchStats();
  };

  // Unhide / Restore
  const handleUnhide = async (kudosItem) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    try {
      const res = await fetch(`/api/moderation/${kudosItem.id}/unhide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ reason: 'Approved and restored to feed by administrator.' })
      });
      if (res.ok) {
        showToast('Kudos restored to public feed!', 'success');
        fetchKudos();
        fetchStats();
      }
    } catch (err) {
      console.error('Error restoring kudos:', err);
    }
  };

  // When a new Kudos is created
  const handleKudosCreated = (newKudos) => {
    setKudos(prev => [newKudos, ...prev]);
    showToast('Kudos successfully sent! Thank you for appreciating your teammate.');
    fetchStats();
  };

  // Filter display based on Active Tab for Admins
  const displayedKudos = kudos.filter(k => {
    if (currentUser?.role === 'ADMIN' && activeTab === 'moderation') {
      return !k.is_visible;
    }
    // In normal feed mode, show visible items (and if admin, hidden items with banner)
    return k.is_visible || (currentUser?.role === 'ADMIN');
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-pop-in">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 ${
            toast.type === 'info'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-emerald-600 text-white border-emerald-500'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Header
        users={users}
        currentUser={currentUser}
        onSelectUser={(u) => {
          setCurrentUser(u);
          setActiveTab('feed');
          showToast(`Switched active persona to ${u.name} (${u.role})`, 'info');
        }}
        onOpenModal={() => setIsCreateModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Real-time KPI Stats Banner */}
        <StatsCards stats={stats} />

        {/* Main Kudos Stream */}
        <KudosFeed
          kudosList={displayedKudos}
          currentUser={currentUser}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onReact={handleReact}
          onHide={handleOpenHide}
          onUnhide={handleUnhide}
          onDelete={handleOpenDelete}
          onOpenAuditLogs={() => setIsAuditModalOpen(true)}
        />

      </main>

      {/* Create Kudos Modal */}
      <CreateKudosModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onSubmitSuccess={handleKudosCreated}
      />

      {/* Moderation Reason & Confirmation Modal */}
      <ModerationActionModal
        isOpen={modModalState.isOpen}
        actionType={modModalState.actionType}
        kudos={modModalState.kudos}
        onClose={() => setModModalState({ isOpen: false, actionType: 'HIDE', kudos: null })}
        onConfirm={handleConfirmModeration}
      />

      {/* Compliance & Audit Logs Modal */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400">
        <p>© 2026 Datacom — Employee Portal AI Accelerator. Spec-Driven Architecture.</p>
      </footer>

    </div>
  );
}
