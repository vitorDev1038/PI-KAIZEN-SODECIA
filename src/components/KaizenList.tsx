import { useState } from 'react';
import type { Kaizen, Category, Profile, Department } from '../lib/database.types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Eye, Building2, DollarSign, Printer, Kanban } from 'lucide-react';
import { KaizenA3Report } from './KaizenA3Report';
import { KanbanBoard } from './KanbanBoard';

interface KaizenWithDetails extends Kaizen {
  category?: Category;
  profile?: Profile;
  department?: Department;
}

interface KaizenListProps {
  kaizens: KaizenWithDetails[];
  onKaizenClick?: (kaizen: KaizenWithDetails) => void;
}

export function KaizenList({ kaizens, onKaizenClick }: KaizenListProps) {
  const [selectedKaizen, setSelectedKaizen] = useState<KaizenWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'a3' | 'kanban'>('details');

  const handleClick = (kaizen: KaizenWithDetails) => {
    if (onKaizenClick) {
      onKaizenClick(kaizen);
    } else {
      setSelectedKaizen(kaizen);
      setActiveTab('details');
    }
  };

  if (kaizens.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-500 dark:text-slate-400">Nenhum kaizen encontrado</p>
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
                        <DollarSign className="w-3 h-3" /> R$ {(kaizen.realized_savings || kaizen.estimated_savings || 0).toLocaleString('pt-BR')}
                      </span>
                    ) : null}
                  </div>
                  {kaizen.category && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded">
                      {kaizen.category.name}
                    </span>
                  )}
                  <p className="text-sm text-gray-600 dark:text-slate-300 mt-2 line-clamp-2">{kaizen.problem}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-slate-400">
                    <span>Data: {new Date(kaizen.created_at).toLocaleDateString('pt-BR')}</span>
                    {kaizen.profile && <span>Autor: {kaizen.profile.full_name}</span>}
                  </div>
                </div>
                <button className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <Eye className="w-5 h-5 text-gray-400 dark:text-slate-400" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedKaizen && (
        <Modal isOpen={true} onClose={() => setSelectedKaizen(null)} title={`Kaizen: ${selectedKaizen.title}`} size="xl">
          <div className="space-y-4">
            <div className="flex border-b border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === 'details' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-slate-400'
                }`}
              >
                Detalhes
              </button>
              <button
                onClick={() => setActiveTab('a3')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1 ${
                  activeTab === 'a3' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-slate-400'
                }`}
              >
                <Printer className="w-3.5 h-3.5" /> Ficha A3
              </button>
              <button
                onClick={() => setActiveTab('kanban')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1 ${
                  activeTab === 'kanban' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-slate-400'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" /> Plano 5W2H
              </button>
            </div>

            {activeTab === 'details' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={selectedKaizen.status} />
                  {selectedKaizen.category && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded">
                      {selectedKaizen.category.name}
                    </span>
                  )}
                  {selectedKaizen.department && (
                    <span className="px-2 py-1 text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300 rounded">
                      Setor: {selectedKaizen.department.name}
                    </span>
                  )}
                </div>

                {selectedKaizen.image_url && (
                  <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                    <img src={selectedKaizen.image_url} alt={selectedKaizen.title} className="w-full h-48 object-cover" />
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase mb-1">Problema Identificado</h4>
                  <p className="text-sm text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-900/60 p-3 rounded-lg border border-gray-200 dark:border-slate-700">{selectedKaizen.problem}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase mb-1">Sugestão de Melhoria</h4>
                  <p className="text-sm text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-900/60 p-3 rounded-lg border border-gray-200 dark:border-slate-700">{selectedKaizen.suggestion}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase mb-1">Benefícios Esperados</h4>
                  <p className="text-sm text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-900/60 p-3 rounded-lg border border-gray-200 dark:border-slate-700">{selectedKaizen.benefits}</p>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400">
                  <p>Enviado em: {new Date(selectedKaizen.created_at).toLocaleString('pt-BR')}</p>
                  {selectedKaizen.profile && <p>Por: {selectedKaizen.profile.full_name}</p>}
                </div>
              </div>
            )}

            {activeTab === 'a3' && (
              <KaizenA3Report kaizen={selectedKaizen} />
            )}

            {activeTab === 'kanban' && (
              <KanbanBoard kaizenId={selectedKaizen.id} canEdit={false} />
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
