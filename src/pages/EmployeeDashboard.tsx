import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Kaizen, Category } from '../lib/database.types';
import { KaizenForm } from '../components/KaizenForm';
import { KaizenList } from '../components/KaizenList';
import { Card, CardBody } from '../components/ui/Card';
import { FileText, CheckCircle, Clock, Trophy } from 'lucide-react';

interface KaizenWithCategory extends Kaizen {
  category?: Category;
}

export function EmployeeDashboard() {
  const { profile } = useAuth();
  const [kaizens, setKaizens] = useState<KaizenWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

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
      label: 'Pendentes',
      value: kaizens.filter((k) => k.status === 'pending' || k.status === 'under_review').length,
      icon: Clock,
      color: 'yellow',
    },
    {
      label: 'Pontos',
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Início</h1>
        <p className="text-gray-600 mt-1">
          Bem-vindo, {profile?.full_name}! Continue contribuindo com suas ideias.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
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

      <KaizenForm onSuccess={fetchKaizens} />

      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Meus Kaizens</h2>
        {loading ? (
          <Card>
            <CardBody className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </CardBody>
          </Card>
        ) : (
          <KaizenList kaizens={kaizens} />
        )}
      </div>
    </div>
  );
}
