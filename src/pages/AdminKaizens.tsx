import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Kaizen, Category, Profile, Comment, Department, ActionPlan } from '../lib/database.types';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Download, Check, X, MessageSquare, Printer, Kanban, Building2, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KaizenA3Report } from '../components/KaizenA3Report';
import { KanbanBoard } from '../components/KanbanBoard';
import { getOrSeedDepartments } from '../lib/departments';

interface KaizenWithDetails extends Kaizen {
  category?: Category;
  profile?: Profile;
  department?: Department;
  actionPlans?: ActionPlan[];
}

interface CommentWithProfile extends Comment {
  profiles?: Profile;
}

export function AdminKaizens() {
  const { profile } = useAuth();
  const toast = useToast();
  const [kaizens, setKaizens] = useState<KaizenWithDetails[]>([]);
  const [filteredKaizens, setFilteredKaizens] = useState<KaizenWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKaizen, setSelectedKaizen] = useState<KaizenWithDetails | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'a3' | 'kanban'>('details');

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    department: '',
  });

  useEffect(() => {
    fetchKaizens();
    fetchCategories();
    fetchDepartments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [kaizens, filters]);

  const fetchKaizens = async () => {
    setLoading(true);
    let { data, error } = await supabase
      .from('kaizens')
      .select('*, category:categories(*), profile:profiles(*), department:departments(*)')
      .order('created_at', { ascending: false });

    // Fallback if department or category table/relation does not exist in DB
    if (error) {
      const fallbackResult = await supabase
        .from('kaizens')
        .select('*, category:categories(*), profile:profiles(*)')
        .order('created_at', { ascending: false });
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      const basicResult = await supabase
        .from('kaizens')
        .select('*, profile:profiles(*)')
        .order('created_at', { ascending: false });
      data = basicResult.data;
    }

    if (data) {
      setKaizens(data as KaizenWithDetails[]);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  const fetchDepartments = async () => {
    const deps = await getOrSeedDepartments();
    setDepartments(deps);
  };

  const fetchComments = async (kaizenId: string) => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('kaizen_id', kaizenId)
      .order('created_at', { ascending: true });

    if (data) setComments(data as CommentWithProfile[]);
  };

  const applyFilters = () => {
    let filtered = [...kaizens];

    if (filters.search) {
      filtered = filtered.filter(
        (k) =>
          k.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          k.problem.toLowerCase().includes(filters.search.toLowerCase()) ||
          k.profile?.full_name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter((k) => k.status === filters.status);
    }

    if (filters.category) {
      filtered = filtered.filter((k) => k.category_id === filters.category);
    }

    if (filters.department) {
      filtered = filtered.filter((k) => k.department_id === filters.department);
    }

    setFilteredKaizens(filtered);
  };

  const updateKaizenStatus = async (
    kaizenId: string,
    status: Kaizen['status'],
    feedback?: string
  ) => {
    const { error } = await supabase
      .from('kaizens')
      .update({ status })
      .eq('id', kaizenId);

    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }

    if (selectedKaizen) {
      // Notify employee about status change
      await supabase.from('notifications').insert({
        user_id: selectedKaizen.employee_id,
        title: `Status do Kaizen Alterado: ${status.toUpperCase()}`,
        message: feedback || `Seu Kaizen "${selectedKaizen.title}" teve o status alterado para ${status}.`,
        type: status === 'approved' ? 'success' : status === 'rejected' ? 'warning' : 'info',
        kaizen_id: selectedKaizen.id,
      });
    }

    if (feedback && profile) {
      await supabase.from('comments').insert({
        kaizen_id: kaizenId,
        user_id: profile.id,
        content: feedback,
        is_feedback: true,
      });
    }

    toast.success('Status atualizado com sucesso!');
    fetchKaizens();
    setSelectedKaizen(null);
  };

  const addComment = async () => {
    if (!selectedKaizen || !newComment.trim() || !profile) return;

    const { error } = await supabase.from('comments').insert({
      kaizen_id: selectedKaizen.id,
      user_id: profile.id,
      content: newComment,
      is_feedback: false,
    });

    if (!error) {
      setNewComment('');
      fetchComments(selectedKaizen.id);
      toast.success('Comentário adicionado!');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Título', 'Funcionário', 'Setor', 'Categoria', 'Status', 'Economia R$', 'Data'];
    const rows = filteredKaizens.map((k) => [
      k.id,
      `"${k.title}"`,
      `"${k.profile?.full_name || ''}"`,
      `"${k.department?.name || ''}"`,
      `"${k.category?.name || ''}"`,
      k.status,
      k.realized_savings || k.estimated_savings || 0,
      new Date(k.created_at).toLocaleDateString('pt-BR'),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaizens-sodecia-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleKaizenClick = (kaizen: KaizenWithDetails) => {
    setSelectedKaizen(kaizen);
    setActiveModalTab('details');
    fetchComments(kaizen.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão Avançada de Kaizens</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">Gerencie submissões, planos 5W2H e fichas A3</p>
        </div>
        <Button onClick={exportToCSV} variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório CSV
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <Input
                placeholder="Buscar título, problema..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={[
                { value: '', label: 'Todos os status' },
                { value: 'pending', label: 'Aguardando Aprovação' },
                { value: 'approved', label: 'Aprovado' },
                { value: 'rejected', label: 'Reprovado' },
                { value: 'under_review', label: 'Em Análise' },
              ]}
            />
            <Select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              options={[
                { value: '', label: 'Todas as categorias' },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
            />
            <Select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              options={[
                { value: '', label: 'Todos os setores Sodecia' },
                ...departments.map((dep) => ({ value: dep.id, label: dep.name })),
              ]}
            />
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredKaizens.map((kaizen) => (
            <Card key={kaizen.id} hover>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{kaizen.title}</h3>
                      <Badge variant={kaizen.status} />
                      {kaizen.department && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300 rounded border border-primary-200 dark:border-primary-800 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {kaizen.department.name}
                        </span>
                      )}
                      {(kaizen.realized_savings || kaizen.estimated_savings) ? (
                        <span className="px-2 py-0.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> R$ {(kaizen.realized_savings || kaizen.estimated_savings || 0).toLocaleString('pt-BR')} /mês
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 dark:text-slate-400">
                      {kaizen.category && (
                        <span className="font-medium text-gray-700 dark:text-slate-300">Categoria: {kaizen.category.name}</span>
                      )}
                      {kaizen.profile && <span>• Por: {kaizen.profile.full_name}</span>}
                      <span>• Data: {new Date(kaizen.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2">{kaizen.problem}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => handleKaizenClick(kaizen)}>
                    Visualizar Detalhes
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {selectedKaizen && (
        <Modal isOpen={true} onClose={() => setSelectedKaizen(null)} title={`Kaizen: ${selectedKaizen.title}`} size="xl">
          <div className="space-y-4">
            {/* Modal Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setActiveModalTab('details')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors ${
                  activeModalTab === 'details' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-slate-400'
                }`}
              >
                Avaliação & Feedback
              </button>
              <button
                onClick={() => setActiveModalTab('a3')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1 ${
                  activeModalTab === 'a3' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-slate-400'
                }`}
              >
                <Printer className="w-3.5 h-3.5" /> Ficha A3 Kaizen (PDF)
              </button>
              <button
                onClick={() => setActiveModalTab('kanban')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1 ${
                  activeModalTab === 'kanban' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-slate-400'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" /> Plano 5W2H (Kanban)
              </button>
            </div>

            {activeModalTab === 'details' && (
              <KaizenDetailModalContent
                kaizen={selectedKaizen}
                comments={comments}
                newComment={newComment}
                setNewComment={setNewComment}
                onUpdateStatus={updateKaizenStatus}
                onAddComment={addComment}
              />
            )}

            {activeModalTab === 'a3' && (
              <KaizenA3Report kaizen={selectedKaizen} />
            )}

            {activeModalTab === 'kanban' && (
              <KanbanBoard kaizenId={selectedKaizen.id} canEdit={true} />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

interface KaizenDetailModalContentProps {
  kaizen: KaizenWithDetails;
  comments: CommentWithProfile[];
  newComment: string;
  setNewComment: (value: string) => void;
  onUpdateStatus: (id: string, status: Kaizen['status'], feedback?: string) => void;
  onAddComment: () => void;
}

function KaizenDetailModalContent({
  kaizen,
  comments,
  newComment,
  setNewComment,
  onUpdateStatus,
  onAddComment,
}: KaizenDetailModalContentProps) {
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'review' | null>(null);

  const handleAction = (action: 'approve' | 'reject' | 'review') => {
    if (action === 'approve') {
      onUpdateStatus(kaizen.id, 'approved');
    } else {
      setActionType(action);
      setShowFeedback(true);
    }
  };

  const handleSubmitFeedback = () => {
    if (actionType === 'reject') {
      onUpdateStatus(kaizen.id, 'rejected', feedback);
    } else if (actionType === 'review') {
      onUpdateStatus(kaizen.id, 'under_review', feedback);
    }
    setShowFeedback(false);
    setFeedback('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant={kaizen.status} />
        {kaizen.department && (
          <span className="px-2 py-1 text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300 rounded border border-primary-200 dark:border-primary-800">
            Setor: {kaizen.department.name}
          </span>
        )}
        {kaizen.category && (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded">
            {kaizen.category.name}
          </span>
        )}
      </div>

      {kaizen.image_url && (
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
          <img src={kaizen.image_url} alt={kaizen.title} className="w-full h-48 object-cover" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-900/60 p-4 rounded-xl text-xs border border-gray-200 dark:border-slate-700">
        <div>
          <span className="text-gray-500 dark:text-slate-400 font-bold uppercase block">Economia Estimada</span>
          <span className="text-sm font-black text-green-700 dark:text-green-400">R$ {(kaizen.estimated_savings || 0).toLocaleString('pt-BR')}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-slate-400 font-bold uppercase block">Custo de Implantação</span>
          <span className="text-sm font-black text-gray-700 dark:text-slate-200">R$ {(kaizen.implementation_cost || 0).toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Problema Identificado</h4>
        <p className="text-sm text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-900/60 p-3 rounded-lg border border-gray-200 dark:border-slate-700">{kaizen.problem}</p>
      </div>

      <div>
        <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Sugestão de Melhoria</h4>
        <p className="text-sm text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-900/60 p-3 rounded-lg border border-gray-200 dark:border-slate-700">{kaizen.suggestion}</p>
      </div>

      <div>
        <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Benefícios Esperados</h4>
        <p className="text-sm text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-900/60 p-3 rounded-lg border border-gray-200 dark:border-slate-700">{kaizen.benefits}</p>
      </div>

      {!showFeedback && (
        <div className="flex gap-3 pt-2">
          <Button
            variant="success"
            onClick={() => handleAction('approve')}
            disabled={kaizen.status === 'approved'}
          >
            <Check className="w-4 h-4 mr-2" />
            Aprovar Kaizen (+10 pts)
          </Button>
          <Button
            variant="danger"
            onClick={() => handleAction('reject')}
            disabled={kaizen.status === 'rejected'}
          >
            <X className="w-4 h-4 mr-2" />
            Reprovar
          </Button>
          <Button variant="secondary" onClick={() => handleAction('review')}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Solicitar Ajustes
          </Button>
        </div>
      )}

      {showFeedback && (
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-slate-900/60 rounded-lg border border-gray-200 dark:border-slate-700">
          <Textarea
            label={actionType === 'reject' ? 'Motivo da Reprovação' : 'Feedback para Ajustes'}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            required
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmitFeedback}>Confirmar Envio</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowFeedback(false);
                setFeedback('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Comentários e Histórico de Feedback</h4>
        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg text-xs ${
                comment.is_feedback
                  ? 'bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800'
                  : 'bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-gray-900 dark:text-white">
                  {comment.profiles?.full_name || 'Usuário'}
                </span>
                {comment.is_feedback && (
                  <span className="text-[10px] px-2 py-0.5 bg-primary-100 dark:bg-primary-900/80 text-primary-800 dark:text-primary-300 font-bold rounded">
                    Feedback Oficial Admin
                  </span>
                )}
              </div>
              <p className="text-gray-700 dark:text-slate-200">{comment.content}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                {new Date(comment.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea
            placeholder="Escreva um comentário ou instrução..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
          />
          <Button onClick={onAddComment} disabled={!newComment.trim()}>
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
