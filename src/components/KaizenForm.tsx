import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Category, Department } from '../lib/database.types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Card, CardHeader, CardBody } from './ui/Card';
import { Upload, DollarSign, Lightbulb } from 'lucide-react';
import { useToast } from './ui/Toast';

import { getOrSeedDepartments, resolveDepartmentId } from '../lib/departments';

interface KaizenFormProps {
  onSuccess: () => void;
}

export function KaizenForm({ onSuccess }: KaizenFormProps) {
  const { profile } = useAuth();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    department_id: '',
    problem: '',
    suggestion: '',
    benefits: '',
    estimated_savings: 0,
    implementation_cost: 0,
    effort_level: 'medium' as 'low' | 'medium' | 'high',
    impact_level: 'medium' as 'low' | 'medium' | 'high',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    const { data: catData } = await supabase.from('categories').select('*').order('name');
    if (catData) setCategories(catData);

    const deps = await getOrSeedDepartments();
    setDepartments(deps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);

    try {
      let imageUrl = null;

      if (imageFile) {
        // Validate MIME type
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!ALLOWED_TYPES.includes(imageFile.type)) {
          toast.error('Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.');
          setLoading(false);
          return;
        }

        // Validate file size (5MB max)
        const MAX_SIZE_MB = 5;
        if (imageFile.size > MAX_SIZE_MB * 1024 * 1024) {
          toast.error(`Arquivo muito grande. Máximo: ${MAX_SIZE_MB}MB.`);
          setLoading(false);
          return;
        }

        const fileExt = imageFile.name.split('.').pop()?.toLowerCase();
        // Use crypto.randomUUID() for secure filename generation
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('kaizen-images')
          .upload(fileName, imageFile);

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('kaizen-images')
            .getPublicUrl(uploadData.path);

          imageUrl = urlData.publicUrl;
        }
      }

      const resolvedDepId = await resolveDepartmentId(formData.department_id, departments);

      const { error } = await supabase.from('kaizens').insert({
        title: formData.title,
        category_id: formData.category_id || null,
        department_id: resolvedDepId,
        problem: formData.problem,
        suggestion: formData.suggestion,
        benefits: formData.benefits,
        estimated_savings: Number(formData.estimated_savings) || 0,
        implementation_cost: Number(formData.implementation_cost) || 0,
        effort_level: formData.effort_level,
        impact_level: formData.impact_level,
        employee_id: profile.id,
        image_url: imageUrl,
      });

      if (error) throw error;

      // Auto notify admins about new Kaizen submission
      await supabase.from('notifications').insert({
        user_id: profile.id,
        title: 'Kaizen Submetido!',
        message: `Seu Kaizen "${formData.title}" foi recebido e está aguardando avaliação da gestão Sodecia.`,
        type: 'info',
      });

      toast.success('Kaizen enviado com sucesso!');
      setFormData({
        title: '',
        category_id: '',
        department_id: '',
        problem: '',
        suggestion: '',
        benefits: '',
        estimated_savings: 0,
        implementation_cost: 0,
        effort_level: 'medium',
        impact_level: 'medium',
      });
      setImageFile(null);
      onSuccess();
    } catch (error) {
      console.error('Error submitting kaizen:', error instanceof Error ? error.message : 'Unknown error');
      toast.error('Erro ao enviar kaizen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Submeter Novo Kaizen (Melhoria Sodecia)</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Registre sua ideia de melhoria contínua, estimativa financeira e setor afetado.
        </p>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título da Ideia"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Ex: Dispositivo de fixação rápida para linha de solda"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Categoria"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              options={[
                { value: '', label: 'Selecione a categoria' },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
              required
            />

            <Select
              label="Setor / Linha de Produção (Sodecia)"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              options={[
                { value: '', label: 'Selecione o setor' },
                ...departments.map((dep) => ({ value: dep.id, label: dep.name })),
              ]}
              required
            />
          </div>

          <Textarea
            label="Problema Identificado (Situação Atual)"
            value={formData.problem}
            onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
            rows={3}
            required
            placeholder="Descreva o problema ou gargalo observado no posto de trabalho..."
          />

          <Textarea
            label="Sugestão de Melhoria (Situação Proposta)"
            value={formData.suggestion}
            onChange={(e) => setFormData({ ...formData, suggestion: e.target.value })}
            rows={3}
            required
            placeholder="Como você sugere resolver este problema?"
          />

          <Textarea
            label="Benefícios Esperados (Ergonomia, Qualidade, Tempo)"
            value={formData.benefits}
            onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
            rows={3}
            required
            placeholder="Quais benefícios esta melhoria trará para a equipe/operação?"
          />

          {/* Financial ROI and Effort/Impact */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-green-600" />
              Análise de Retorno sobre Investimento (ROI Estimado)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Economia Estimada por Mês (R$)"
                placeholder="Ex: 1500.00"
                value={formData.estimated_savings || ''}
                onChange={(e) => setFormData({ ...formData, estimated_savings: Number(e.target.value) })}
              />
              <Input
                type="number"
                label="Custo de Implantação Estimado (R$)"
                placeholder="Ex: 200.00"
                value={formData.implementation_cost || ''}
                onChange={(e) => setFormData({ ...formData, implementation_cost: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Nível de Esforço Requerido"
                value={formData.effort_level}
                onChange={(e) => setFormData({ ...formData, effort_level: e.target.value as any })}
                options={[
                  { value: 'low', label: 'Baixo Esforço (Execução Rápida)' },
                  { value: 'medium', label: 'Médio Esforço' },
                  { value: 'high', label: 'Alto Esforço (Requer Projeto)' },
                ]}
              />

              <Select
                label="Nível de Impacto Esperado"
                value={formData.impact_level}
                onChange={(e) => setFormData({ ...formData, impact_level: e.target.value as any })}
                options={[
                  { value: 'low', label: 'Baixo Impacto' },
                  { value: 'medium', label: 'Médio Impacto' },
                  { value: 'high', label: 'Alto Impacto (Quick Win / Inovação)' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anexar Imagem / Foto do Posto (opcional)
            </label>
            <div className="mt-1 flex items-center gap-2">
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm">
                  {imageFile ? imageFile.name : 'Escolher foto ou desenho'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {imageFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageFile(null)}
                >
                  Remover
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={loading}>
              Enviar Kaizen
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
