import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Kaizen, Category } from '../lib/database.types';
import { KaizenForm } from '../components/KaizenForm';
import { KaizenList } from '../components/KaizenList';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FileText, CheckCircle, Clock, Trophy, Plus, Search, Filter } from 'lucide-react';

interface KaizenWithCategory extends Kaizen {
  category?: Category;
}

interface EmployeeDashboardProps {
  activeTab?: 'dashboard' | 'kaizens';
}

export function EmployeeDashboard({ activeTab = 'dashboard' }: EmployeeDashboardProps) {
  const { profile } = useAuth();
  const [kaizens, setKaizens] = useState<KaizenWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchKaizens();
  }, [profile]);

  const fetchKaizens = async () => {
    if (!profile) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('kaizens')
      .select('*, category:categories(*)')
      .eq('employee_id', profile.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setKaizens(data as KaizenWithCategory[]);
    }
    setLoading(false);
  };

  const filteredKaizens = kaizens.filter((k) => {
    const matchesSearch =
      k.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.suggestion.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? k.status === 'pending' || k.status === 'under_review'
        : k.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      label: 'Total de Kaizens',
      value: kaizens.length,
      icon: FileText,
      color: 'blue',
    },
    {
      label: 'Aprovados',
      value: kaizens.filter((k) => k.status === 'approved').length,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Pendentes / Análise',
      value: kaizens.filter((k) => k.status === 'pending' || k.status === 'under_review').length,
      icon: Clock,
      color: 'yellow',
    },
    {
      label: 'Seus Pontos',
      value: profile?.points || 0,
      icon: Trophy,
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  const isKaizensTab = activeTab === 'kaizens';

  return (
    <div className="space-y-6">
      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isKaizensTab ? 'Meus Kaizens Submetidos' : 'Início'}
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            {isKaizensTab
              ? 'Acompanhe o status, comentários e impacto de todas as suas propostas Kaizen.'
              : `Bem-vindo, ${profile?.full_name || 'Colaborador'}! Continue contribuindo com suas ideias de melhoria.`}
          </p>
        </div>
        {isKaizensTab && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Fechar Formulário' : 'Novo Kaizen'}
          </Button>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">{stat.label}</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      colorClasses[stat.color as keyof typeof colorClasses]
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Conditional Kaizen Form (Always open on Início tab, toggleable on Meus Kaizens tab) */}
      {(!isKaizensTab || showForm) && (
        <KaizenForm
          onSuccess={() => {
            fetchKaizens();
            if (showForm) setShowForm(false);
          }}
        />
      )}

      {/* Kaizens Section / List View */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            {isKaizensTab ? 'Histórico de Propostas Kaizen' : 'Suas Últimas Ideias'}
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <Input
                type="text"
                placeholder="Buscar ideia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 py-1.5 text-sm"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-900 p-1 rounded-lg w-full sm:w-auto overflow-x-auto border border-gray-200/50 dark:border-slate-700/60">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === 'all' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Todos ({kaizens.length})
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === 'approved' ? 'bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Aprovados
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === 'pending' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Em Análise
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === 'rejected' ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Recusados
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardBody className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-500 dark:text-slate-400">Carregando suas propostas Kaizen...</p>
            </CardBody>
          </Card>
        ) : (
          <KaizenList kaizens={filteredKaizens} />
        )}
      </div>
    </div>
  );
}
