import React from 'react';
import { Award, Users, Heart, Sparkles } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    {
      label: 'Total Kudos Shared',
      value: stats?.totalKudos ?? 0,
      icon: Award,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    {
      label: 'Colleagues Appreciated',
      value: stats?.totalRecognizedColleagues ?? 0,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100'
    },
    {
      label: 'Team Reactions',
      value: stats?.totalReactions ?? 0,
      icon: Heart,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100'
    },
    {
      label: 'Active Core Values',
      value: stats?.categoryBreakdown?.length ?? 5,
      icon: Sparkles,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-4 sm:p-5 rounded-2xl bg-white border ${c.border} shadow-xs flex items-center gap-3.5 transition-all hover:shadow-sm`}
          >
            <div className={`w-11 h-11 rounded-xl ${c.bg} ${c.color} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                {c.value}
              </p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                {c.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
