import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, BadgeItem } from '../lib/database.types';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Trophy, Award, Sparkles, ShieldCheck, DollarSign, Shield, Gift, Star, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

export function GamificationPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [topUsers, setTopUsers] = useState<Profile[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ranking' | 'badges' | 'rewards'>('ranking');

  useEffect(() => {
    fetchLeaderboard();
    fetchBadges();
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .order('points', { ascending: false })
      .limit(10);

    if (data) {
      setTopUsers(data);
    }
  };

  const fetchBadges = async () => {
    const { data } = await supabase.from('badges').select('*').order('points_required');
    if (data) {
      setBadges(data);
    }
  };

  const rewards = [
    { id: 1, title: 'Garrafa Térmica Exclusiva Sodecia', points: 30, icon: Gift, description: 'Squeeze inox com a logo Sodecia Kaizen' },
    { id: 2, title: 'Voucher Almoço Especial', points: 50, icon: Star, description: 'Almoço VIP no restaurante executivo' },
    { id: 3, title: 'Camisa Polo Sodecia Kaizen Team', points: 80, icon: Award, description: 'Edição limitada para colaboradores inovadores' },
    { id: 4, title: 'Folga no Dia do Aniversário', points: 120, icon: Sparkles, description: 'Dia livre remunerado no seu aniversário' },
  ];

  const handleRedeem = (rewardTitle: string, pointsNeeded: number) => {
    if (!profile) return;
    if ((profile.points || 0) < pointsNeeded) {
      toast.error(`Você precisa de ${pointsNeeded} pontos para resgatar este prêmio.`);
      return;
    }
    toast.success(`Solicitação de resgate do prêmio "${rewardTitle}" enviada ao RH/Sodecia!`);
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-blue-600" />;
      case 'Award': return <Award className="w-6 h-6 text-amber-600" />;
      case 'ShieldCheck': return <ShieldCheck className="w-6 h-6 text-slate-600" />;
      case 'Trophy': return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 'DollarSign': return <DollarSign className="w-6 h-6 text-emerald-600" />;
      case 'Shield': return <Shield className="w-6 h-6 text-red-600" />;
      default: return <Award className="w-6 h-6 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Sodecia Kaizen Gamification
          </div>
          <h1 className="text-3xl font-extrabold">Mural de Reconhecimento & Pontos</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Ganhe 10 pontos a cada Kaizen aprovado. Desbloqueie conquistas e resgate prêmios exclusivos!
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <span className="text-xs text-blue-200 uppercase font-semibold">Seus Pontos Atual</span>
          <span className="text-3xl font-black text-yellow-400">{profile?.points || 0} pts</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('ranking')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'ranking'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Ranking de Contribuidores
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'badges'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Award className="w-4 h-4" />
          Medalhas & Conquistas
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'rewards'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Gift className="w-4 h-4" />
          Catálogo de Recompensas
        </button>
      </div>

      {/* Tab 1: Ranking */}
      {activeTab === 'ranking' && (
        <div className="space-y-6">
          {/* Top 3 Podium */}
          {topUsers.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              {/* 2nd Place */}
              <Card className="order-2 sm:order-1 border-2 border-slate-300 bg-gradient-to-b from-slate-50 to-white text-center">
                <CardBody className="py-6">
                  <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 font-black text-xl flex items-center justify-center mx-auto mb-2 border-2 border-slate-400">
                    🥈
                  </div>
                  <h3 className="font-bold text-gray-900">{topUsers[1].full_name}</h3>
                  <p className="text-xs text-gray-500">{topUsers[1].email}</p>
                  <span className="inline-block mt-3 px-3 py-1 bg-slate-100 text-slate-800 font-bold text-sm rounded-full">
                    {topUsers[1].points} pts
                  </span>
                </CardBody>
              </Card>

              {/* 1st Place */}
              <Card className="order-1 sm:order-2 border-2 border-yellow-400 bg-gradient-to-b from-yellow-50 to-white text-center transform sm:-translate-y-2 shadow-lg">
                <CardBody className="py-8">
                  <div className="w-16 h-16 rounded-full bg-yellow-400 text-yellow-900 font-black text-2xl flex items-center justify-center mx-auto mb-2 border-4 border-yellow-300 shadow">
                    🥇
                  </div>
                  <h3 className="font-extrabold text-lg text-gray-900">{topUsers[0].full_name}</h3>
                  <p className="text-xs text-gray-500">{topUsers[0].email}</p>
                  <span className="inline-block mt-3 px-4 py-1.5 bg-yellow-400 text-yellow-950 font-black text-base rounded-full shadow-sm">
                    {topUsers[0].points} pts
                  </span>
                </CardBody>
              </Card>

              {/* 3rd Place */}
              <Card className="order-3 border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-white text-center">
                <CardBody className="py-6">
                  <div className="w-12 h-12 rounded-full bg-amber-200 text-amber-800 font-black text-xl flex items-center justify-center mx-auto mb-2 border-2 border-amber-400">
                    🥉
                  </div>
                  <h3 className="font-bold text-gray-900">{topUsers[2].full_name}</h3>
                  <p className="text-xs text-gray-500">{topUsers[2].email}</p>
                  <span className="inline-block mt-3 px-3 py-1 bg-amber-100 text-amber-900 font-bold text-sm rounded-full">
                    {topUsers[2].points} pts
                  </span>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Full Table */}
          <Card>
            <CardBody className="p-0">
              <div className="divide-y divide-gray-200">
                {topUsers.map((user, idx) => (
                  <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                        idx === 1 ? 'bg-slate-200 text-slate-800' :
                        idx === 2 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="font-black text-blue-900 text-base">
                      {user.points} pts
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab 2: Badges */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const hasUnlocked = (profile?.points || 0) >= badge.points_required;
            return (
              <Card key={badge.id} className={`transition-all ${hasUnlocked ? 'border-blue-300 shadow-md' : 'opacity-60 bg-gray-50'}`}>
                <CardBody className="p-5 flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${hasUnlocked ? 'bg-blue-100' : 'bg-gray-200'}`}>
                    {getBadgeIcon(badge.icon)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-sm">{badge.title}</h3>
                      {hasUnlocked ? (
                        <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Conquistado
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                          {badge.points_required} pts
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab 3: Rewards */}
      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {rewards.map((rw) => {
            const Icon = rw.icon;
            const canAfford = (profile?.points || 0) >= rw.points;
            return (
              <Card key={rw.id} className="flex flex-col justify-between">
                <CardBody className="p-5 space-y-4">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{rw.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{rw.description}</p>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                    <span className="font-black text-amber-600 text-sm">{rw.points} pts</span>
                    <Button
                      size="sm"
                      variant={canAfford ? 'primary' : 'secondary'}
                      disabled={!canAfford}
                      onClick={() => handleRedeem(rw.title, rw.points)}
                    >
                      {canAfford ? 'Resgatar' : 'Pontos Insuficientes'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
