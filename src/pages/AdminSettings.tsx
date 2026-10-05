import { useState, useEffect } from 'react';
import { useSettings, SiteSettings } from '../contexts/SettingsContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import type { Category, Department } from '../lib/database.types';
import {
  Building2,
  Award,
  Sliders,
  Palette,
  Layers,
  Save,
  RotateCcw,
  CheckCircle,
  Plus,
  Trash2,
  Lightbulb,
  ShieldCheck,
  Mail,
  HelpCircle,
} from 'lucide-react';

export function AdminSettings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'identity' | 'gamification' | 'workflow' | 'theme' | 'data'>('identity');
  const [formData, setFormData] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Categories & Departments state
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [newDepName, setNewDepName] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  useEffect(() => {
    const isDifferent = JSON.stringify(formData) !== JSON.stringify(settings);
    setHasChanges(isDifferent);
  }, [formData, settings]);

  useEffect(() => {
    if (activeTab === 'data') {
      fetchCategoriesAndDepartments();
    }
  }, [activeTab]);

  const fetchCategoriesAndDepartments = async () => {
    setLoadingData(true);
    try {
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      const { data: deps } = await supabase.from('departments').select('*').order('name');
      if (cats) setCategories(cats);
      if (deps) setDepartments(deps);
    } catch (err) {
      console.error('Error fetching categories/departments:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = async () => {
    if (!formData.institutionName.trim()) {
      toast.addToast('O nome da instituição não pode ser vazio', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateSettings(formData);
      toast.addToast('Configurações salvas com sucesso!', 'success');
      setHasChanges(false);
    } catch (error) {
      toast.addToast('Erro ao salvar as configurações', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Deseja restaurar as configurações padrão da instituição?')) {
      await resetSettings();
      toast.addToast('Configurações restauradas para os padrões', 'info');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCatName.trim(), color: newCatColor, description: 'Categoria customizada' }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCategories((prev) => [...prev, data]);
        setNewCatName('');
        toast.addToast('Categoria adicionada com sucesso!', 'success');
      }
    } catch (err: any) {
      toast.addToast(err.message || 'Erro ao adicionar categoria', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.addToast('Categoria removida!', 'success');
    } catch (err: any) {
      toast.addToast('Não foi possível remover a categoria (pode estar em uso em Kaizens existentes)', 'error');
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('departments')
        .insert([{ name: newDepName.trim(), company: formData.institutionName }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setDepartments((prev) => [...prev, data]);
        setNewDepName('');
        toast.addToast('Departamento adicionado com sucesso!', 'success');
      }
    } catch (err: any) {
      toast.addToast(err.message || 'Erro ao adicionar departamento', 'error');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este departamento?')) return;
    try {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      toast.addToast('Departamento removido!', 'success');
    } catch (err: any) {
      toast.addToast('Não foi possível remover o departamento (pode estar em uso)', 'error');
    }
  };

  const themeColorsMap = {
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', ring: 'ring-blue-500' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600', ring: 'ring-emerald-500' },
    violet: { bg: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-600', ring: 'ring-violet-500' },
    amber: { bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-600', ring: 'ring-amber-500' },
    rose: { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', ring: 'ring-rose-500' },
    indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600', ring: 'ring-indigo-500' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            Configurações do Sistema & Instituição
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Personalize a identidade da empresa, regras de pontuação, tema e permissões da plataforma.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleReset} title="Restaurar Padrões">
            <RotateCcw className="w-4 h-4 mr-2 text-gray-500" />
            Restaurar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={saving}
            className={hasChanges ? 'animate-pulse' : ''}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">
            ⚠️ Você tem alterações não salvas no formulário. Clique em "Salvar Alterações" para aplicar.
          </span>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
            Salvar Agora
          </Button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-white p-2 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('identity')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'identity'
              ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Identidade da Instituição
        </button>

        <button
          onClick={() => setActiveTab('gamification')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'gamification'
              ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Award className="w-4 h-4" />
          Gamificação & Pontos
        </button>

        <button
          onClick={() => setActiveTab('workflow')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'workflow'
              ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Regras de Fluxo
        </button>

        <button
          onClick={() => setActiveTab('theme')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'theme'
              ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          Aparência & Tema
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'data'
              ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Categorias & Setores
        </button>
      </div>

      {/* Tab 1: Identidade da Instituição */}
      {activeTab === 'identity' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardBody className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Identidade Institucional</h3>
                  <p className="text-xs text-gray-500">
                    Altere o nome e informações da instituição exibidos em todo o sistema, relatórios A3 e cabeçalhos.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Nome da Instituição / Empresa *
                    </label>
                    <Input
                      type="text"
                      value={formData.institutionName}
                      onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                      placeholder="Ex: Sodecia Kaizen, IFPB, Hospital São Lucas, etc."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Este nome substitui o título nos menus, telas de login e relatórios exportados.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Sigla / Iniciais
                      </label>
                      <Input
                        type="text"
                        value={formData.institutionAbbreviation}
                        onChange={(e) => setFormData({ ...formData, institutionAbbreviation: e.target.value.toUpperCase() })}
                        placeholder="Ex: SOD, KZN, IF"
                        maxLength={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">Exibido nos relatórios A3 impressos.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Símbolo Monetário
                      </label>
                      <Input
                        type="text"
                        value={formData.currencySymbol}
                        onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                        placeholder="Ex: R$, $, €"
                      />
                      <p className="text-xs text-gray-500 mt-1">Usado para estimativas financeiras.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Subtítulo ou Slogan do Sistema
                    </label>
                    <Input
                      type="text"
                      value={formData.institutionSubtitle}
                      onChange={(e) => setFormData({ ...formData, institutionSubtitle: e.target.value })}
                      placeholder="Ex: Programa de Ideias e Melhoria Contínua"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      E-mail Institucional de Suporte
                    </label>
                    <Input
                      type="email"
                      value={formData.supportEmail}
                      onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                      placeholder="kaizen@instituicao.com"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Preview Panel */}
          <div>
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-white sticky top-20">
              <CardBody className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  Pré-visualização do Cabeçalho
                </h4>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                      {formData.institutionAbbreviation || 'KZN'}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        {formData.institutionName || 'Nome da Instituição'}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {formData.institutionSubtitle || 'Portal de Melhorias'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-100/60 rounded-lg text-xs text-blue-900 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-700" /> Alterações ao Vivo
                  </p>
                  <p>
                    Ao salvar, esta nova identidade será aplicada imediatamente no menu principal, relatórios A3 e login.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Gamificação & Pontos */}
      {activeTab === 'gamification' && (
        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Regras de Gamificação e Recompensas</h3>
                  <p className="text-xs text-gray-500">
                    Defina quantos pontos os colaboradores ganham por cada etapa de submissão e aprovação.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.gamificationEnabled}
                    onChange={(e) => setFormData({ ...formData, gamificationEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-semibold text-gray-900">
                    {formData.gamificationEnabled ? 'Gamificação Ativada' : 'Gamificação Desativada'}
                  </span>
                </label>
              </div>

              {formData.gamificationEnabled ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                      <Award className="w-5 h-5" /> Submissão de Kaizen
                    </div>
                    <p className="text-xs text-gray-600">
                      Pontos concedidos no momento em que o funcionário cadastra uma nova ideia.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Pontos por envio</label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.pointsForSubmission}
                        onChange={(e) => setFormData({ ...formData, pointsForSubmission: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                      <Award className="w-5 h-5" /> Aprovação pela Gestão
                    </div>
                    <p className="text-xs text-gray-600">
                      Pontos adicionais quando o administrador aprova o Kaizen para implementação.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Pontos por aprovação</label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.pointsForApproval}
                        onChange={(e) => setFormData({ ...formData, pointsForApproval: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                      <Award className="w-5 h-5" /> Conclusão & Resultado
                    </div>
                    <p className="text-xs text-gray-600">
                      Bônus de pontos quando a melhoria é completamente finalizada na prática.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Pontos por conclusão</label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.pointsForCompletion}
                        onChange={(e) => setFormData({ ...formData, pointsForCompletion: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-gray-100 rounded-xl text-center text-gray-500">
                  O sistema de gamificação e ranking de pontos está temporariamente oculto para os usuários.
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab 3: Regras de Fluxo */}
      {activeTab === 'workflow' && (
        <Card>
          <CardBody className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900">Políticas de Fluxo de Trabalho & Segurança</h3>

            <div className="space-y-4 divide-y divide-gray-200">
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Aprovação Automática de Kaizens</h4>
                  <p className="text-xs text-gray-500">
                    Se ativado, Kaizens recém-criados passarão direto para o status "Em Progresso" sem análise prévia.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoApproveKaizens}
                    onChange={(e) => setFormData({ ...formData, autoApproveKaizens: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Permitir Exclusão de Ideias por Funcionários</h4>
                  <p className="text-xs text-gray-500">
                    Permite que o próprio criador do Kaizen apague a sugestão enquanto ela estiver pendente.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowEmployeeKaizenDelete}
                    onChange={(e) => setFormData({ ...formData, allowEmployeeKaizenDelete: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Notificações por E-mail</h4>
                  <p className="text-xs text-gray-500">
                    Enviar e-mail automático ao funcionário quando seu Kaizen for aprovado ou receber um comentário.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableEmailNotifications}
                    onChange={(e) => setFormData({ ...formData, enableEmailNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="pt-4 max-w-xs">
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Tamanho Máximo de Fotos (MB)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={formData.maxImageUploadMB}
                  onChange={(e) => setFormData({ ...formData, maxImageUploadMB: parseInt(e.target.value) || 5 })}
                />
                <p className="text-xs text-gray-500 mt-1">Limite por arquivo enviado nas imagens de Antes/Depois.</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tab 4: Aparência & Tema */}
      {activeTab === 'theme' && (
        <Card>
          <CardBody className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Personalização Visual e Cor de Destaque</h3>
              <p className="text-xs text-gray-500">
                Escolha o tom de destaque que melhor combina com a identidade visual da sua instituição.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { id: 'blue', label: 'Azul Kaizen', color: 'bg-blue-600' },
                { id: 'emerald', label: 'Verde Sustentável', color: 'bg-emerald-600' },
                { id: 'violet', label: 'Roxo Inovação', color: 'bg-violet-600' },
                { id: 'amber', label: 'Laranja Energia', color: 'bg-amber-600' },
                { id: 'rose', label: 'Rosa Corporativo', color: 'bg-rose-600' },
                { id: 'indigo', label: 'Índigo Tech', color: 'bg-indigo-600' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFormData({ ...formData, primaryColor: c.id as any })}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    formData.primaryColor === c.id
                      ? 'border-gray-900 ring-2 ring-gray-900 bg-gray-50 font-bold'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${c.color} shadow-sm`} />
                  <span className="text-xs text-gray-800 text-center">{c.label}</span>
                </button>
              ))}
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Amostra do Botão Primário</h4>
              <button
                className={`px-4 py-2 text-white font-medium rounded-lg shadow-sm ${
                  themeColorsMap[formData.primaryColor]?.bg || 'bg-blue-600'
                }`}
              >
                Exemplo de Botão - {formData.institutionName}
              </button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tab 5: Categorias & Setores */}
      {activeTab === 'data' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gerenciar Categorias */}
          <Card>
            <CardBody className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Categorias de Kaizen
              </h3>
              <p className="text-xs text-gray-500">
                Cadastre e gerencie as áreas de foco (ex: Segurança, Qualidade, Ergonomia).
              </p>

              <form onSubmit={handleAddCategory} className="flex items-center gap-2 pt-2">
                <Input
                  type="text"
                  placeholder="Nova Categoria..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1"
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-10 h-10 p-1 border rounded-lg cursor-pointer"
                  title="Cor da categoria"
                />
                <Button type="submit" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </form>

              <div className="space-y-2 max-h-72 overflow-y-auto pt-2">
                {categories.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Nenhuma categoria cadastrada.</p>
                ) : (
                  categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: cat.color || '#3b82f6' }}
                        />
                        <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title="Excluir Categoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>

          {/* Gerenciar Departamentos/Setores */}
          <Card>
            <CardBody className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Departamentos / Setores da Instituição
              </h3>
              <p className="text-xs text-gray-500">
                Cadastre os setores onde os Kaizens serão aplicados (ex: Linha 1, TI, Manutenção).
              </p>

              <form onSubmit={handleAddDepartment} className="flex items-center gap-2 pt-2">
                <Input
                  type="text"
                  placeholder="Novo Departamento/Setor..."
                  value={newDepName}
                  onChange={(e) => setNewDepName(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </form>

              <div className="space-y-2 max-h-72 overflow-y-auto pt-2">
                {departments.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Nenhum departamento cadastrado.</p>
                ) : (
                  departments.map((dep) => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span className="text-sm font-semibold text-gray-800">{dep.name}</span>
                      <button
                        onClick={() => handleDeleteDepartment(dep.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title="Excluir Departamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
