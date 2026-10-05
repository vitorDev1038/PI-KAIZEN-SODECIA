import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ActionPlan } from '../lib/database.types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardBody } from './ui/Card';
import { Plus, Calendar, User, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { useToast } from './ui/Toast';

interface KanbanBoardProps {
  kaizenId: string;
  canEdit?: boolean;
}

export function KanbanBoard({ kaizenId, canEdit = true }: KanbanBoardProps) {
  const toast = useToast();
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAction, setNewAction] = useState({
    what: '',
    who: '',
    where_location: '',
    why_reason: '',
    how_method: '',
    cost: 0,
    due_date: '',
  });

  useEffect(() => {
    fetchPlans();
  }, [kaizenId]);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('action_plans')
      .select('*')
      .eq('kaizen_id', kaizenId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setPlans(data);
    }
    setLoading(false);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.what || !newAction.who) return;

    const { error } = await supabase.from('action_plans').insert({
      kaizen_id: kaizenId,
      what: newAction.what,
      who: newAction.who,
      where_location: newAction.where_location || null,
      why_reason: newAction.why_reason || null,
      how_method: newAction.how_method || null,
      cost: Number(newAction.cost) || 0,
      due_date: newAction.due_date || null,
      status: 'todo',
    });

    if (error) {
      toast.error('Erro ao adicionar ação');
    } else {
      toast.success('Ação 5W2H adicionada!');
      setNewAction({
        what: '',
        who: '',
        where_location: '',
        why_reason: '',
        how_method: '',
        cost: 0,
        due_date: '',
      });
      setShowAddForm(false);
      fetchPlans();
    }
  };

  const updateStatus = async (planId: string, status: ActionPlan['status']) => {
    const { error } = await supabase
      .from('action_plans')
      .update({ status })
      .eq('id', planId);

    if (error) {
      toast.error('Erro ao atualizar status da tarefa');
    } else {
      fetchPlans();
    }
  };

  const columns: { id: ActionPlan['status']; title: string; icon: any; color: string }[] = [
    { id: 'todo', title: 'A Fazer (To Do)', icon: ListTodo, color: 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-700' },
    { id: 'in_progress', title: 'Em Andamento', icon: Clock, color: 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-700' },
    { id: 'done', title: 'Concluído (Done)', icon: CheckCircle2, color: 'border-green-400 bg-green-50/50 dark:bg-green-950/30 dark:border-green-700' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Plano de Ação de Implantação (5W2H)</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">Acompanhamento de tarefas e responsáveis</p>
        </div>
        {canEdit && (
          <Button size="sm" variant="secondary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-1" />
            Nova Ação 5W2H
          </Button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleCreatePlan} className="bg-gray-50 dark:bg-slate-900/60 p-4 rounded-xl border border-gray-200 dark:border-slate-700 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="O que fazer? (What)"
              placeholder="Ex: Instalar sensor fotoelétrico na prensa"
              value={newAction.what}
              onChange={(e) => setNewAction({ ...newAction, what: e.target.value })}
              required
            />
            <Input
              label="Quem executará? (Who)"
              placeholder="Ex: Carlos (Manutenção)"
              value={newAction.who}
              onChange={(e) => setNewAction({ ...newAction, who: e.target.value })}
              required
            />
            <Input
              label="Onde? (Where)"
              placeholder="Ex: Linha de prensa 03"
              value={newAction.where_location}
              onChange={(e) => setNewAction({ ...newAction, where_location: e.target.value })}
            />
            <Input
              type="date"
              label="Data Limite (When)"
              value={newAction.due_date}
              onChange={(e) => setNewAction({ ...newAction, due_date: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm">
              Salvar Ação
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-6">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => {
            const Icon = col.icon;
            const colPlans = plans.filter((p) => p.status === col.id);
            return (
              <div key={col.id} className={`rounded-xl border ${col.color} p-3 min-h-[160px]`}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-700 dark:text-slate-300" />
                    <span className="font-semibold text-xs text-gray-800 dark:text-white">{col.title}</span>
                  </div>
                  <span className="text-xs bg-white dark:bg-slate-800 font-bold px-2 py-0.5 rounded-full text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                    {colPlans.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {colPlans.map((plan) => (
                    <Card key={plan.id} className="bg-white dark:bg-slate-800 text-xs border border-gray-200 dark:border-slate-700 shadow-sm">
                      <CardBody className="p-3 space-y-2">
                        <p className="font-bold text-gray-900 dark:text-white">{plan.what}</p>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400 dark:text-slate-500" /> {plan.who}
                          </span>
                          {plan.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400 dark:text-slate-500" />{' '}
                              {new Date(plan.due_date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>

                        {canEdit && (
                          <div className="pt-2 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-1">
                            {col.id !== 'todo' && (
                              <button
                                onClick={() => updateStatus(plan.id, col.id === 'done' ? 'in_progress' : 'todo')}
                                className="px-2 py-1 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded text-[10px] text-gray-700 dark:text-slate-300 font-medium"
                              >
                                ← Mover
                              </button>
                            )}
                            {col.id !== 'done' && (
                              <button
                                onClick={() => updateStatus(plan.id, col.id === 'todo' ? 'in_progress' : 'done')}
                                className="px-2 py-1 bg-primary-100 dark:bg-primary-950/80 hover:bg-primary-200 rounded text-[10px] text-primary-800 dark:text-primary-300 font-medium"
                              >
                                Mover →
                              </button>
                            )}
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
