import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Kaizen, Category, Profile, Comment } from '../lib/database.types';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Search, Filter, Download, Check, X, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface KaizenWithDetails extends Kaizen {
  category?: Category;
  profile?: Profile;
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
  const [loading, setLoading] = useState(true);
  const [selectedKaizen, setSelectedKaizen] = useState<KaizenWithDetails | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
  });

  useEffect(() => {
    fetchKaizens();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [kaizens, filters]);

  const fetchKaizens = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('kaizens')
      .select('*, category:categories(*), profile:profiles(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setKaizens(data as KaizenWithDetails[]);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
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
    const headers = ['ID', 'Título', 'Funcionário', 'Categoria', 'Status', 'Data'];
    const rows = filteredKaizens.map((k) => [
      k.id,
      k.title,
      k.profile?.full_name || '',
      k.category?.name || '',
      k.status,
      new Date(k.created_at).toLocaleDateString('pt-BR'),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaizens-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleKaizenClick = (kaizen: KaizenWithDetails) => {
    setSelectedKaizen(kaizen);
    fetchComments(kaizen.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Kaizens</h1>
          <p className="text-gray-600 mt-1">Gerencie todas as submissões de melhorias</p>
        </div>
        <Button onClick={exportToCSV} variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Buscar por título, problema ou funcionário..."
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
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredKaizens.map((kaizen) => (
            <Card key={kaizen.id} hover>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{kaizen.title}</h3>
                      <Badge variant={kaizen.status} />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {kaizen.category && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {kaizen.category.name}
                        </span>
                      )}
                      {kaizen.profile && (
                        <span className="text-xs text-gray-500">Por: {kaizen.profile.full_name}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{kaizen.problem}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => handleKaizenClick(kaizen)}>
                    Visualizar
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {selectedKaizen && (
        <KaizenDetailModal
          kaizen={selectedKaizen}
          comments={comments}
          newComment={newComment}
          setNewComment={setNewComment}
          onClose={() => setSelectedKaizen(null)}
          onUpdateStatus={updateKaizenStatus}
          onAddComment={addComment}
        />
      )}
    </div>
  );
}

interface KaizenDetailModalProps {
  kaizen: KaizenWithDetails;
  comments: CommentWithProfile[];
  newComment: string;
  setNewComment: (value: string) => void;
  onClose: () => void;
  onUpdateStatus: (id: string, status: Kaizen['status'], feedback?: string) => void;
  onAddComment: () => void;
}

function KaizenDetailModal({
  kaizen,
  comments,
  newComment,
  setNewComment,
  onClose,
  onUpdateStatus,
  onAddComment,
}: KaizenDetailModalProps) {
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
    <Modal isOpen={true} onClose={onClose} title={kaizen.title} size="xl">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Badge variant={kaizen.status} />
          {kaizen.category && (
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
              {kaizen.category.name}
            </span>
          )}
        </div>

        {kaizen.image_url && (
          <div className="rounded-lg overflow-hidden">
            <img src={kaizen.image_url} alt={kaizen.title} className="w-full h-auto" />
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">Problema Identificado</h4>
          <p className="text-sm text-gray-700">{kaizen.problem}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">Sugestão de Melhoria</h4>
          <p className="text-sm text-gray-700">{kaizen.suggestion}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">Benefícios Esperados</h4>
          <p className="text-sm text-gray-700">{kaizen.benefits}</p>
        </div>

        {!showFeedback && (
          <div className="flex gap-3">
            <Button
              variant="success"
              onClick={() => handleAction('approve')}
              disabled={kaizen.status === 'approved'}
            >
              <Check className="w-4 h-4 mr-2" />
              Aprovar
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
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <Textarea
              label={actionType === 'reject' ? 'Motivo da Reprovação' : 'Feedback para Ajustes'}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              required
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmitFeedback}>Confirmar</Button>
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

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Comentários e Feedback</h4>
          <div className="space-y-3 mb-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-3 rounded-lg ${
                  comment.is_feedback ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-900">
                    {comment.profiles?.full_name}
                  </span>
                  {comment.is_feedback && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      Feedback Oficial
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(comment.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Adicionar comentário..."
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
    </Modal>
  );
}
