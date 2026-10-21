const db = require('./database');

function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return; // Already seeded
  }

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, role, title, department, avatar_url)
    VALUES (@id, @name, @email, @role, @title, @department, @avatar_url)
  `);

  const users = [
    {
      id: 'usr_jordan_taylor',
      name: 'Jordan Taylor',
      email: 'jordan.taylor@datacom.com',
      role: 'ADMIN',
      title: 'Portal Lead & Administrator',
      department: 'Operations & Governance',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_sarah_chen',
      name: 'Sarah Chen',
      email: 'sarah.chen@datacom.com',
      role: 'USER',
      title: 'Cloud Solutions Architect',
      department: 'Cloud & Platform Solutions',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_alex_kumar',
      name: 'Alex Kumar',
      email: 'alex.kumar@datacom.com',
      role: 'USER',
      title: 'Senior Software Engineer',
      department: 'Digital Engineering',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_maya_patel',
      name: 'Maya Patel',
      email: 'maya.patel@datacom.com',
      role: 'USER',
      title: 'Senior Product Designer',
      department: 'Experience Design',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_liam_wilson',
      name: 'Liam Wilson',
      email: 'liam.wilson@datacom.com',
      role: 'USER',
      title: 'DevOps & Site Reliability Engineer',
      department: 'Infrastructure Services',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_elena_rodriguez',
      name: 'Elena Rodriguez',
      email: 'elena.rodriguez@datacom.com',
      role: 'USER',
      title: 'Cybersecurity Analyst',
      department: 'Information Security',
      avatar_url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80'
    }
  ];

  const insertUsersTx = db.transaction((userList) => {
    for (const u of userList) {
      insertUser.run(u);
    }
  });
  insertUsersTx(users);

  const insertKudos = db.prepare(`
    INSERT INTO kudos (
      id, sender_id, recipient_id, message, category, is_visible,
      moderated_by, moderated_at, reason_for_moderation, created_at
    ) VALUES (
      @id, @sender_id, @recipient_id, @message, @category, @is_visible,
      @moderated_by, @moderated_at, @reason_for_moderation, @created_at
    )
  `);

  const initialKudos = [
    {
      id: 'kud_seed_001',
      sender_id: 'usr_alex_kumar',
      recipient_id: 'usr_sarah_chen',
      message: 'Huge thanks to Sarah for architecting our multi-region Kubernetes cluster failover strategy! Flawless execution and zero downtime during the client cutover.',
      category: 'Innovation',
      is_visible: 1,
      moderated_by: null,
      moderated_at: null,
      reason_for_moderation: null,
      created_at: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'kud_seed_002',
      sender_id: 'usr_maya_patel',
      recipient_id: 'usr_alex_kumar',
      message: 'Alex was incredible during sprint refinement, translating complex user journey maps into clean, testable React components ahead of schedule. Outstanding teamwork!',
      category: 'Teamwork',
      is_visible: 1,
      moderated_by: null,
      moderated_at: null,
      reason_for_moderation: null,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'kud_seed_003',
      sender_id: 'usr_sarah_chen',
      recipient_id: 'usr_liam_wilson',
      message: 'Liam stayed online late on Friday to resolve a critical CI/CD build bottleneck, unblocking the entire release team for Monday deployment. Exceptional dedication!',
      category: 'Excellence',
      is_visible: 1,
      moderated_by: null,
      moderated_at: null,
      reason_for_moderation: null,
      created_at: new Date(Date.now() - 3600000 * 1).toISOString()
    },
    {
      id: 'kud_seed_004',
      sender_id: 'usr_elena_rodriguez',
      recipient_id: 'usr_maya_patel',
      message: 'Maya conducted customer accessibility workshops that elevated our WCAG 2.1 AA compliance across all Datacom digital touchpoints. True customer-first focus!',
      category: 'Customer First',
      is_visible: 1,
      moderated_by: null,
      moderated_at: null,
      reason_for_moderation: null,
      created_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'kud_seed_005',
      sender_id: 'usr_alex_kumar',
      recipient_id: 'usr_elena_rodriguez',
      message: 'Spam test message containing promotional links and unrelated spam content to demonstrate the moderation engine.',
      category: 'Integrity',
      is_visible: 0,
      moderated_by: 'usr_jordan_taylor',
      moderated_at: new Date(Date.now() - 900000).toISOString(),
      reason_for_moderation: 'Flagged as promotional spam content violating internal portal usage guidelines.',
      created_at: new Date(Date.now() - 1200000).toISOString()
    }
  ];

  const insertKudosTx = db.transaction((kudosList) => {
    for (const k of kudosList) {
      insertKudos.run(k);
    }
  });
  insertKudosTx(initialKudos);

  // Seed reactions
  const insertReaction = db.prepare(`
    INSERT INTO reactions (id, kudos_id, user_id, emoji, created_at)
    VALUES (@id, @kudos_id, @user_id, @emoji, @created_at)
  `);
  const initialReactions = [
    { id: 'rx_01', kudos_id: 'kud_seed_001', user_id: 'usr_maya_patel', emoji: '🚀', created_at: new Date().toISOString() },
    { id: 'rx_02', kudos_id: 'kud_seed_001', user_id: 'usr_liam_wilson', emoji: '👏', created_at: new Date().toISOString() },
    { id: 'rx_03', kudos_id: 'kud_seed_002', user_id: 'usr_sarah_chen', emoji: '❤️', created_at: new Date().toISOString() },
    { id: 'rx_04', kudos_id: 'kud_seed_003', user_id: 'usr_alex_kumar', emoji: '👍', created_at: new Date().toISOString() }
  ];
  for (const r of initialReactions) {
    insertReaction.run(r);
  }

  // Seed initial moderation log for the hidden item
  const insertModLog = db.prepare(`
    INSERT INTO moderation_logs (id, kudos_id, admin_id, action, reason, created_at)
    VALUES (@id, @kudos_id, @admin_id, @action, @reason, @created_at)
  `);
  insertModLog.run({
    id: 'mod_001',
    kudos_id: 'kud_seed_005',
    admin_id: 'usr_jordan_taylor',
    action: 'HIDE',
    reason: 'Flagged as promotional spam content violating internal portal usage guidelines.',
    created_at: new Date(Date.now() - 900000).toISOString()
  });

  console.log('Database successfully seeded with Datacom employees, kudos, and audit records.');
}

module.exports = seedDatabase;
