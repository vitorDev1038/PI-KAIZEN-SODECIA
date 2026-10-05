import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Kaizen, Category, Profile, Department } from '../lib/database.types';
import { Card, CardBody } from '../components/ui/Card';
import { FileText, CheckCircle, Clock, Users, TrendingUp, DollarSign, Award, Building2 } from 'lucide-react';

interface KaizenWithDetails extends Kaizen {
  category?: Category;
  profile?: Profile;
  department?: Department;
}

interface Stats {
  total: number;
  approved: number;
  pending: number;
  thisMonth: number;
  totalSavings: number;
  quickWinsCount: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    approved: 0,
    pending: 0,
    thisMonth: 0,
    totalSavings: 0,
    quickWinsCount: 0,
  });
  const [topContributors, setTopContributors] = useState<Profile[]>([]);
  const [recentKaizens, setRecentKaizens] = useState<KaizenWithDetails[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ name: string; count: number }[]>([]);
  const [departmentStats, setDepartmentStats] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    let { data: kaizens, error } = await supabase
      .from('kaizens')
      .select('*, category:categories(*), profile:profiles(*), department:departments(*)');

    if (error) {
      const fb = await supabase
        .from('kaizens')
        .select('*, category:categories(*), profile:profiles(*)');
      kaizens = fb.data;
      error = fb.error;
    }

    if (error) {
      const fbBasic = await supabase.from('kaizens').select('*');
      kaizens = fbBasic.data;
    }

    if (kaizens) {
      const now = new Date();
      const thisMonth = kaizens.filter((k) => {
        const created = new Date(k.created_at);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      });

      const totalSavings = kaizens.reduce((acc, curr) => {
        return acc + (curr.realized_savings || curr.estimated_savings || 0);
      }, 0);

      const quickWins = kaizens.filter(
        (k) => k.effort_level === 'low' && k.impact_level === 'high'
      ).length;

      setStats({
        total: kaizens.length,
        approved: kaizens.filter((k) => k.status === 'approved' || k.status === 'completed').length,
        pending: kaizens.filter((k) => k.status === 'pending' || k.status === 'under_review').length,
        thisMonth: thisMonth.filter((k) => k.status === 'approved' || k.status === 'completed').length,
        totalSavings,
        quickWinsCount: quickWins,
      });

      setRecentKaizens((kaizens as KaizenWithDetails[]).slice(0, 5));

      // Category breakdown
      const categoryCount: { [key: string]: number } = {};
      kaizens.forEach((k) => {
        if (k.category) {
          categoryCount[k.category.name] = (categoryCount[k.category.name] || 0) + 1;
        }
      });
      setCategoryStats(
        Object.entries(categoryCount).map(([name, count]) => ({ name, count }))
      );

      // Department breakdown
      const depCount: { [key: string]: number } = {};
      kaizens.forEach((k) => {
        const depName = k.department?.name || 'Geral';
        depCount[depName] = (depCount[depName] || 0) + 1;
      });
      setDepartmentStats(
        Object.entries(depCount).map(([name, count]) => ({ name, count }))
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
      label: 'Economia Total Estimada/Real',
      value: `R$ ${stats.totalSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'emerald',
    },
    {
      label: 'Total de Kaizens',
      value: stats.total,
      icon: FileText,
      color: 'blue',
    },
    {
      label: 'Taxa de Aprovação',
      value: stats.total > 0 ? `${Math.round((stats.approved / stats.total) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'purple',
    },
    {
      label: 'Ideias Quick Wins (Alta Eficiência)',
      value: stats.quickWinsCount,
      icon: Award,
      color: 'amber',
    },
  ];

  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Administrativo (Sodecia Lean)</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Visão geral do programa de melhorias e ROI financeiro</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">{stat.label}</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Contributors */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600 dark:text-primary-500" /> Top Contribuidores Sodecia
            </h2>
          </div>
          <CardBody>
            <div className="space-y-3">
              {topContributors.map((contributor, index) => (
                <div key={contributor.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-xs">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{contributor.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{contributor.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/80 px-2.5 py-1 rounded-full border border-primary-100 dark:border-primary-800">
                    {contributor.points} pts
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Categories Breakdown */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Kaizens por Categoria</h2>
          </div>
          <CardBody>
            <div className="space-y-3">
              {categoryStats.map((cat) => {
                const percentage = stats.total > 0 ? (cat.count / stats.total) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{cat.name}</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{cat.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Departments Breakdown */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-600 dark:text-primary-500" /> Distribuição por Setor
            </h2>
          </div>
          <CardBody>
            <div className="space-y-3">
              {departmentStats.map((dep) => {
                const percentage = stats.total > 0 ? (dep.count / stats.total) * 100 : 0;
                return (
                  <div key={dep.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate max-w-[180px]">{dep.name}</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{dep.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-emerald-600 dark:bg-emerald-500 h-2 rounded-full transition-all duration-300"
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

      {/* Recent Submissions */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Últimos Kaizens Submetidos</h2>
        </div>
        <CardBody>
          <div className="space-y-3">
            {recentKaizens.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">Nenhum Kaizen cadastrado ainda.</p>
            ) : (
              recentKaizens.map((k) => (
                <div key={k.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-slate-900/60 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-900/90 border border-gray-100 dark:border-slate-700/50 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{k.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {k.profile?.full_name || 'Desconhecido'} • Setor: {k.department?.name || 'Geral'} • {new Date(k.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {(k.realized_savings || k.estimated_savings) ? (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        + R$ {(k.realized_savings || k.estimated_savings || 0).toLocaleString('pt-BR')}
                      </span>
                    ) : null}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                      k.status === 'approved' || k.status === 'completed' ? 'bg-green-100 dark:bg-green-950/80 text-green-800 dark:text-green-300' :
                      k.status === 'rejected' ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300' :
                      k.status === 'under_review' ? 'bg-yellow-100 dark:bg-yellow-950/80 text-yellow-800 dark:text-yellow-300' :
                      'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                    }`}>
                      {k.status === 'approved' ? 'Aprovado' :
                       k.status === 'completed' ? 'Concluído' :
                       k.status === 'rejected' ? 'Reprovado' :
                       k.status === 'under_review' ? 'Em Análise' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
