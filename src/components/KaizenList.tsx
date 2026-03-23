import { useState } from 'react';
import type { Kaizen, Category, Profile } from '../lib/database.types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Eye } from 'lucide-react';

interface KaizenWithDetails extends Kaizen {
  category?: Category;
  profile?: Profile;
}

interface KaizenListProps {
  kaizens: KaizenWithDetails[];
  onKaizenClick?: (kaizen: KaizenWithDetails) => void;
}

export function KaizenList({ kaizens, onKaizenClick }: KaizenListProps) {
  const [selectedKaizen, setSelectedKaizen] = useState<KaizenWithDetails | null>(null);

  const handleClick = (kaizen: KaizenWithDetails) => {
    if (onKaizenClick) {
      onKaizenClick(kaizen);
    } else {
      setSelectedKaizen(kaizen);
    }
  };

  if (kaizens.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-500">Nenhum kaizen encontrado</p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {kaizens.map((kaizen) => (
          <Card key={kaizen.id} hover className="cursor-pointer" onClick={() => handleClick(kaizen)}>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{kaizen.title}</h3>
                    <Badge variant={kaizen.status} />
                  </div>
                  {kaizen.category && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {kaizen.category.name}
                    </span>
                  )}
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{kaizen.problem}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>{new Date(kaizen.created_at).toLocaleDateString('pt-BR')}</span>
                    {kaizen.profile && <span>Por: {kaizen.profile.full_name}</span>}
                  </div>
                </div>
                <button className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Eye className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedKaizen && (
        <KaizenDetailModal
          kaizen={selectedKaizen}
          onClose={() => setSelectedKaizen(null)}
        />
      )}
    </>
  );
}

interface KaizenDetailModalProps {
  kaizen: KaizenWithDetails;
  onClose: () => void;
}

function KaizenDetailModal({ kaizen, onClose }: KaizenDetailModalProps) {
  return (
    <Modal isOpen={true} onClose={onClose} title={kaizen.title} size="lg">
      <div className="space-y-4">
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
            <img
              src={kaizen.image_url}
              alt={kaizen.title}
              className="w-full h-auto"
            />
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

        <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
          <p>Enviado em: {new Date(kaizen.created_at).toLocaleString('pt-BR')}</p>
          {kaizen.profile && <p>Por: {kaizen.profile.full_name}</p>}
        </div>
      </div>
    </Modal>
  );
}
