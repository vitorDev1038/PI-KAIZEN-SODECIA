import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Category } from '../lib/database.types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Card, CardHeader, CardBody } from './ui/Card';
import { Upload } from 'lucide-react';
import { useToast } from './ui/Toast';

interface KaizenFormProps {
  onSuccess: () => void;
}

export function KaizenForm({ onSuccess }: KaizenFormProps) {
  const { profile } = useAuth();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    problem: '',
    suggestion: '',
    benefits: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);

    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('kaizen-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('kaizen-images')
          .getPublicUrl(uploadData.path);

        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('kaizens').insert({
        ...formData,
        employee_id: profile.id,
        image_url: imageUrl,
      });

      if (error) throw error;

      toast.success('Kaizen enviado com sucesso!');
      setFormData({
        title: '',
        category_id: '',
        problem: '',
        suggestion: '',
        benefits: '',
      });
      setImageFile(null);
      onSuccess();
    } catch (error) {
      console.error('Error submitting kaizen:', error);
      toast.error('Erro ao enviar kaizen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900">Submeter Novo Kaizen</h2>
        <p className="text-sm text-gray-600 mt-1">
          Compartilhe suas ideias de melhoria com a equipe
        </p>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Ex: Melhorar processo de embalagem"
          />

          <Select
            label="Categoria"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            options={[
              { value: '', label: 'Selecione uma categoria' },
              ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
            ]}
            required
          />

          <Textarea
            label="Problema Identificado"
            value={formData.problem}
            onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
            rows={3}
            required
            placeholder="Descreva o problema ou oportunidade identificada..."
          />

          <Textarea
            label="Sugestão de Melhoria"
            value={formData.suggestion}
            onChange={(e) => setFormData({ ...formData, suggestion: e.target.value })}
            rows={3}
            required
            placeholder="Como você sugere resolver este problema?"
          />

          <Textarea
            label="Benefícios Esperados"
            value={formData.benefits}
            onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
            rows={3}
            required
            placeholder="Quais benefícios esta melhoria pode trazer?"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anexar Imagem (opcional)
            </label>
            <div className="mt-1 flex items-center gap-2">
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm">
                  {imageFile ? imageFile.name : 'Escolher arquivo'}
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
