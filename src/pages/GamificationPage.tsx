import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, BadgeItem } from '../lib/database.types';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
  Trophy,
  Award,
  Sparkles,
  ShieldCheck,
  DollarSign,
  Shield,
  Gift,
  Star,
  CheckCircle,
  Printer,
  Ticket,
  Search,
  CheckCircle2,
  Clock,
  QrCode,
  UserCheck,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import {
  TicketItem,
  createRedemptionTicket,
  getUserTickets,
  getAllTickets,
  markTicketAsUsed,
} from '../lib/tickets';

const DEFAULT_BADGES: BadgeItem[] = [
  {
    id: 'badge-1',
    title: 'Primeiro Passo',
    description: 'Submeteu a primeira ideia Kaizen aprovada na Sodecia.',
    points_required: 10,
    icon: 'Sparkles',
    created_at: new Date().toISOString(),
  },
  {
    id: 'badge-2',
    title: 'Inovador Ativo',
    description: 'Acumulou 30 pontos em melhorias contínuas.',
    points_required: 30,
    icon: 'Award',
    created_at: new Date().toISOString(),
  },
  {
    id: 'badge-3',
    title: 'Especialista 5S',
    description: 'Acumulou 50 pontos com foco em organização e eficiência.',
    points_required: 50,
    icon: 'ShieldCheck',
    created_at: new Date().toISOString(),
  },
  {
    id: 'badge-4',
    title: 'Kaizen Master',
    description: 'Alcançou a marca impressionante de 100 pontos.',
    points_required: 100,
    icon: 'Trophy',
    created_at: new Date().toISOString(),
  },
  {
    id: 'badge-5',
    title: 'Economista Sodecia',
    description: 'Implementou ideia de alto impacto financeiro na planta.',
    points_required: 150,
    icon: 'DollarSign',
    created_at: new Date().toISOString(),
  },
  {
    id: 'badge-6',
    title: 'Campeão EHS & Segurança',
    description: 'Alcançou 200 pontos garantindo ambiente de trabalho seguro.',
    points_required: 200,
    icon: 'Shield',
    created_at: new Date().toISOString(),
  },
];

interface TicketVoucher {
  code: string;
  rewardTitle: string;
  description: string;
  pointsDeducted: number;
  remainingPoints: number;
  date: string;
  userName: string;
  status?: 'active' | 'used';
  used_at?: string | null;
}

export function GamificationPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [topUsers, setTopUsers] = useState<Profile[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [userTickets, setUserTickets] = useState<TicketItem[]>([]);
  const [allTicketsList, setAllTicketsList] = useState<TicketItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ranking' | 'badges' | 'rewards' | 'my_tickets' | 'validate_tickets'>('ranking');
  const [ticketVoucher, setTicketVoucher] = useState<TicketVoucher | null>(null);

  // Search input for RH validation tab
  const [searchTicketCode, setSearchTicketCode] = useState('');
  const [validatingLoading, setValidatingLoading] = useState(false);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchLeaderboard();
    fetchBadges();
    if (profile) {
      loadUserTickets();
    }
    if (isAdmin) {
      loadAllTickets();
    }
  }, [profile, isAdmin]);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee')
        .order('points', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        setTopUsers(data);
      }
    } catch {
      // Ignore fallback
    }
  };

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase.from('badges').select('*').order('points_required');
      if (!error && data && data.length > 0) {
        setBadges(data);
        return;
      }
    } catch {
      // Ignore fallback
    }
    setBadges(DEFAULT_BADGES);
  };

  const loadUserTickets = async () => {
    if (!profile) return;
    const tickets = await getUserTickets(profile.id);
    setUserTickets(tickets);
  };

  const loadAllTickets = async () => {
    const tickets = await getAllTickets();
    setAllTicketsList(tickets);
  };

  const rewards = [
    {
      id: 1,
      title: 'Garrafa Térmica Exclusiva Sodecia',
      points: 30,
      icon: Gift,
      description: 'Squeeze inox com a logo Sodecia Kaizen',
    },
    {
      id: 2,
      title: 'Voucher Almoço Especial',
      points: 50,
      icon: Star,
      description: 'Almoço VIP no restaurante executivo Sodecia',
    },
    {
      id: 3,
      title: 'Camisa Polo Sodecia Kaizen Team',
      points: 80,
      icon: Award,
      description: 'Edição limitada para colaboradores inovadores',
    },
    {
      id: 4,
      title: 'Folga no Dia do Aniversário',
      points: 120,
      icon: Sparkles,
      description: 'Dia livre remunerado no seu aniversário',
    },
  ];

  const handleRedeem = async (rewardTitle: string, description: string, pointsNeeded: number) => {
    if (!profile) return;

    const currentPoints = profile.points || 0;
    if (currentPoints < pointsNeeded) {
      toast.error(`Você precisa de ${pointsNeeded} pontos para resgatar este prêmio (você tem ${currentPoints} pts).`);
      return;
    }

    if (!window.confirm(`Confirma o resgate do prêmio "${rewardTitle}" por ${pointsNeeded} pontos?`)) {
      return;
    }

    const newPoints = currentPoints - pointsNeeded;

    try {
      // 1. Deduct points in DB
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // 2. Create ticket record
      const ticket = await createRedemptionTicket(
        profile.id,
        profile.full_name || 'Colaborador Sodecia',
        profile.email || '',
        rewardTitle,
        description,
        pointsNeeded
      );

      // 3. Create notification in DB
      try {
        await supabase.from('notifications').insert({
          user_id: profile.id,
          title: 'Prêmio Resgatado!',
          message: `Você resgatou "${rewardTitle}". Apresente o código ${ticket.code} no RH para retirar seu prêmio.`,
          type: 'success',
        });
      } catch {
        // Notification optional
      }

      // Update local profile points and ticket lists
      profile.points = newPoints;
      setUserTickets((prev) => [ticket, ...prev]);
      if (isAdmin) setAllTicketsList((prev) => [ticket, ...prev]);

      // Open Ticket Voucher Modal
      setTicketVoucher({
        code: ticket.code,
        rewardTitle,
        description,
        pointsDeducted: pointsNeeded,
        remainingPoints: newPoints,
        date: new Date(ticket.created_at).toLocaleDateString('pt-BR'),
        userName: profile.full_name || 'Colaborador Sodecia',
        status: 'active',
      });

      toast.success(`Prêmio "${rewardTitle}" resgatado com sucesso! ${pointsNeeded} pontos deduzidos.`);
      fetchLeaderboard();
    } catch (err: any) {
      console.error('Error redeeming reward:', err);
      toast.error('Não foi possível processar o resgate. Verifique a conexão.');
    }
  };

  const handleValidateTicket = async (codeToValidate: string) => {
    if (!codeToValidate.trim()) return;

    setValidatingLoading(true);
    const result = await markTicketAsUsed(codeToValidate);
    setValidatingLoading(false);

    if (result.success) {
      toast.success(result.message);
      // Reload lists
      loadUserTickets();
      loadAllTickets();
      setSearchTicketCode('');
    } else {
      toast.error(result.message);
    }
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-blue-600" />;
      case 'Award':
        return <Award className="w-6 h-6 text-amber-600" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-slate-600" />;
      case 'Trophy':
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 'DollarSign':
        return <DollarSign className="w-6 h-6 text-emerald-600" />;
      case 'Shield':
        return <Shield className="w-6 h-6 text-red-600" />;
      default:
        return <Award className="w-6 h-6 text-blue-600" />;
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
            Ganhe 10 pontos a cada Kaizen aprovado. Desbloqueie conquistas, resgate prêmios e gerencie seus cupons!
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <span className="text-xs text-blue-200 uppercase font-semibold">Seus Pontos Atuais</span>
          <span className="text-3xl font-black text-yellow-400">{profile?.points || 0} pts</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ranking')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
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
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'badges'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Award className="w-4 h-4" />
          Medalhas & Conquistas ({badges.length})
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'rewards'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Gift className="w-4 h-4" />
          Catálogo de Recompensas
        </button>

        {!isAdmin && (
          <button
            onClick={() => setActiveTab('my_tickets')}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'my_tickets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Ticket className="w-4 h-4" />
            Meus Tickets / Cupons ({userTickets.length})
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('validate_tickets')}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'validate_tickets'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Validar Tickets (RH)
          </button>
        )}
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
                {topUsers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Nenhum colaborador ranqueado ainda.</div>
                ) : (
                  topUsers.map((user, idx) => (
                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            idx === 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{user.full_name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="font-black text-blue-900 text-base">{user.points || 0} pts</div>
                    </div>
                  ))
                )}
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
              <Card
                key={badge.id}
                className={`transition-all ${hasUnlocked ? 'border-blue-300 shadow-md bg-white' : 'opacity-65 bg-gray-50 border-gray-200'}`}
              >
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

      {/* Tab 3: Rewards Catalog */}
      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {rewards.map((rw) => {
            const Icon = rw.icon;
            const canAfford = (profile?.points || 0) >= rw.points;
            return (
              <Card key={rw.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
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
                      onClick={() => handleRedeem(rw.title, rw.description, rw.points)}
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

      {/* Tab 4: Meus Tickets (Employee Only) */}
      {!isAdmin && activeTab === 'my_tickets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-blue-600" />
                Seus Tickets e Cupons Resgatados
              </h2>
              <p className="text-xs text-gray-500">
                Apresente o código do ticket no RH da Sodecia para retirar seu prêmio.
              </p>
            </div>
          </div>

          {userTickets.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12 space-y-3">
                <Ticket className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-gray-700">Nenhum ticket resgatado ainda</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Acumule pontos aprovando ideias Kaizen e resgate prêmios no Catálogo de Recompensas.
                </p>
                <Button size="sm" onClick={() => setActiveTab('rewards')}>
                  Ir para Catálogo de Recompensas
                </Button>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userTickets.map((ticket) => {
                const isUsed = ticket.status === 'used';
                return (
                  <Card
                    key={ticket.id}
                    className={`border-2 transition-all ${
                      isUsed ? 'border-gray-200 bg-gray-50 opacity-75' : 'border-blue-400 bg-white shadow-md'
                    }`}
                  >
                    <CardBody className="p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          SODECIA TICKET
                        </span>
                        {isUsed ? (
                          <span className="text-xs font-bold bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" /> Utilizado / Entregue
                          </span>
                        ) : (
                          <span className="text-xs font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-green-600" /> Válido (Pronto p/ RH)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-base">{ticket.reward_title}</h3>
                          <p className="text-xs text-gray-500">{ticket.reward_description}</p>
                        </div>
                        <span className="font-black text-amber-600 text-sm whitespace-nowrap">
                          {ticket.points_spent} pts
                        </span>
                      </div>

                      <div className="bg-gray-100 p-3 rounded-xl flex items-center justify-between border border-gray-200">
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase font-semibold">CÓDIGO DO TICKET</span>
                          <p className="text-lg font-black text-blue-900 tracking-wider font-mono">{ticket.code}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setTicketVoucher({
                              code: ticket.code,
                              rewardTitle: ticket.reward_title,
                              description: ticket.reward_description || '',
                              pointsDeducted: ticket.points_spent,
                              remainingPoints: profile?.points || 0,
                              date: new Date(ticket.created_at).toLocaleDateString('pt-BR'),
                              userName: profile?.full_name || 'Colaborador Sodecia',
                              status: ticket.status,
                              used_at: ticket.used_at,
                            });
                          }}
                          className="flex items-center gap-1.5 text-xs"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Ver Voucher
                        </Button>
                      </div>

                      <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
                        <span>Resgatado em: {new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
                        {isUsed && ticket.used_at && (
                          <span className="text-gray-500 font-medium">
                            Entregue em: {new Date(ticket.used_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Validate Tickets (RH / Admin Only) */}
      {isAdmin && activeTab === 'validate_tickets' && (
        <div className="space-y-6">
          <Card className="border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardBody className="p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  Validação & Baixa de Tickets (Recursos Humanos / Gestão)
                </h2>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Digite o código informado pelo colaborador para dar baixa e marcar o prêmio como entregue.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Digite o código (ex: SOD-TICK-849201)..."
                    value={searchTicketCode}
                    onChange={(e) => setSearchTicketCode(e.target.value)}
                    className="pl-9 font-mono font-bold uppercase tracking-wider bg-white"
                  />
                </div>
                <Button
                  onClick={() => handleValidateTicket(searchTicketCode)}
                  disabled={!searchTicketCode.trim() || validatingLoading}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {validatingLoading ? 'Validando...' : 'Confirmar Entrega'}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* All Tickets Table */}
          <Card>
            <CardBody className="space-y-4">
              <h3 className="font-bold text-gray-900 text-base">Todos os Tickets Resgatados na Planta</h3>

              <div className="divide-y divide-gray-200 border rounded-lg overflow-hidden">
                {allTicketsList.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">Nenhum ticket registrado no sistema.</div>
                ) : (
                  allTicketsList.map((t) => {
                    const isUsed = t.status === 'used';
                    return (
                      <div
                        key={t.id}
                        className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-blue-950 bg-blue-100 px-2 py-0.5 rounded text-sm">
                              {t.code}
                            </span>
                            {isUsed ? (
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-bold">
                                Entregue
                              </span>
                            ) : (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">
                                Pendente de Entrega
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-gray-900 text-sm">{t.reward_title}</p>
                          <p className="text-xs text-gray-500">
                            Colaborador: <strong>{t.user_name || 'Desconhecido'}</strong> ({t.user_email}) • Data:{' '}
                            {new Date(t.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        <div>
                          {isUsed ? (
                            <span className="text-xs text-gray-500 font-semibold italic">
                              Entregue em {t.used_at ? new Date(t.used_at).toLocaleDateString('pt-BR') : ''}
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleValidateTicket(t.code)}
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold"
                            >
                              <Check className="w-4 h-4 mr-1" /> Dar Baixa / Entregar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Ticket Voucher Modal */}
      {ticketVoucher && (
        <Modal isOpen={!!ticketVoucher} onClose={() => setTicketVoucher(null)} title="Voucher de Resgate de Prêmio">
          <div className="space-y-6 text-center py-2">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-inner ${
                ticketVoucher.status === 'used' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600'
              }`}
            >
              <Ticket className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-gray-900">
                {ticketVoucher.status === 'used' ? 'Ticket Utilizado / Entregue' : 'Voucher de Resgate Ativo'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {ticketVoucher.status === 'used'
                  ? `Este prêmio foi entregue ao colaborador em ${
                      ticketVoucher.used_at ? new Date(ticketVoucher.used_at).toLocaleDateString('pt-BR') : 'data recente'
                    }.`
                  : 'Apresente este código no RH da Sodecia para retirar seu prêmio.'}
              </p>
            </div>

            {/* Ticket Box */}
            <div
              className={`rounded-2xl p-6 shadow-xl space-y-4 border-2 relative overflow-hidden text-white ${
                ticketVoucher.status === 'used'
                  ? 'bg-gradient-to-br from-gray-800 to-slate-900 border-gray-400'
                  : 'bg-gradient-to-br from-blue-900 to-indigo-900 border-yellow-400'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-blue-200 border-b border-white/20 pb-2">
                <span className="font-bold uppercase tracking-wider">SODECIA KAIZEN TICKET</span>
                <span>{ticketVoucher.date}</span>
              </div>

              <div>
                <p className="text-xs text-blue-300">CÓDIGO DE VALIDAÇÃO</p>
                <p className="text-3xl font-black tracking-widest text-yellow-400 mt-1">{ticketVoucher.code}</p>
              </div>

              <div className="border-t border-white/20 pt-3 text-left space-y-1">
                <p className="text-xs text-blue-100">
                  <strong>Colaborador:</strong> {ticketVoucher.userName}
                </p>
                <p className="text-xs text-blue-100">
                  <strong>Prêmio:</strong> {ticketVoucher.rewardTitle}
                </p>
                <p className="text-xs text-blue-200 italic">{ticketVoucher.description}</p>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/20 text-blue-100">
                <span>
                  Status:{' '}
                  <strong>{ticketVoucher.status === 'used' ? 'ENTREGUE / UTILIZADO' : 'VÁLIDO (DISPONÍVEL)'}</strong>
                </span>
                <span>
                  Pontos: <strong>-{ticketVoucher.pointsDeducted} pts</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Imprimir / Guardar Ticket
              </Button>
              <Button onClick={() => setTicketVoucher(null)}>Fechar</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
