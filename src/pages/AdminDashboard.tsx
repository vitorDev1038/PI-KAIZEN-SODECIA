import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Kaizen, Category, Profile } from '../lib/database.types';
import { Card, CardBody } from '../components/ui/Card';
import { FileText, CheckCircle, Clock, Users, TrendingUp } from 'lucide-react';

interface KaizenWithDetails extends Kaizen {
  category?: Category;
  profile?: Profile;
}

interface Stats {
  total: number;
  approved: number;
  pending: number;
  thisMonth: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, approved: 0, pending: 0, thisMonth: 0 });
  const [topContributors, setTopContributors] = useState<Profile[]>([]);
  const [recentKaizens, setRecentKaizens] = useState<KaizenWithDetails[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: kaizens } = await supabase
      .from('kaizens')
      .select('*, category:categories(*), profile:profiles(*)');

    if (kaizens) {
      const now = new Date();
      const thisMonth = kaizens.filter((k) => {
        const created = new Date(k.created_at);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      });

      setStats({
        total: kaizens.length,
        approved: kaizens.filter((k) => k.status === 'approved').length,
        pending: kaizens.filter((k) => k.status === 'pending' || k.status === 'under_review').length,
        thisMonth: thisMonth.filter((k) => k.status === 'approved').length,
      });

      setRecentKaizens((kaizens as KaizenWithDetails[]).slice(0, 5));

      const categoryCount: { [key: string]: number } = {};
      kaizens.forEach((k) => {
        if (k.category) {
          categoryCount[k.category.name] = (categoryCount[k.category.name] || 0) + 1;
        }
      });
      setCategoryStats(
        Object.entries(categoryCount).map(([name, count]) => ({ name, count }))
      );
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .order('points', { ascending: false })
      .limit(5);

    if (profiles) {
      setTopContributors(profiles);
    }
  };

  const statCards = [
    {
      label: 'Total de Kaizens',
      value: stats.total,
      icon: FileText,
      color: 'blue',
    },
    {
      label: 'Aprovados (Mês)',
      value: stats.thisMonth,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Pendentes',
      value: stats.pending,
      icon: Clock,
      color: 'yellow',
    },
    {
      label: 'Taxa de Aprovação',
      value: stats.total > 0 ? `${Math.round((stats.approved / stats.total) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-1">Visão geral do programa de melhorias</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Contribuidores</h2>
          </div>
          <CardBody>
            <div className="space-y-3">
              {topContributors.map((contributor, index) => (
                <div key={contributor.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{contributor.full_name}</p>
                      <p className="text-xs text-gray-500">{contributor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">{contributor.points} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Kaizens por Categoria</h2>
          </div>
          <CardBody>
            <div className="space-y-3">
              {categoryStats.map((cat) => {
                const percentage = stats.total > 0 ? (cat.count / stats.total) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                      <span className="text-sm text-gray-600">{cat.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
