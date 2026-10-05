import type { Kaizen, Category, Profile, Department, ActionPlan } from '../lib/database.types';
import { useSettings } from '../contexts/SettingsContext';
import { Button } from './ui/Button';
import { Printer, TrendingUp, DollarSign, Calendar, User, Building2, CheckCircle2 } from 'lucide-react';

interface KaizenWithFullDetails extends Kaizen {
  category?: Category;
  profile?: Profile;
  department?: Department;
  actionPlans?: ActionPlan[];
}

interface KaizenA3ReportProps {
  kaizen: KaizenWithFullDetails;
  onClose?: () => void;
}

export function KaizenA3Report({ kaizen }: KaizenA3ReportProps) {
  const { settings } = useSettings();

  const handlePrint = () => {
    window.print();
  };

  const netSavings = (kaizen.realized_savings || kaizen.estimated_savings || 0) - (kaizen.implementation_cost || 0);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 print:shadow-none print:border-none print:p-0">
      {/* Action Bar (Hidden during print) */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Relatório A3 Kaizen - Padrão Industrial</h2>
          <p className="text-xs text-gray-500">Documento de Gestão à Vista - {settings.institutionName}</p>
        </div>
        <Button onClick={handlePrint} variant="primary">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir / Exportar A3
        </Button>
      </div>

      {/* Printable Sheet */}
      <div className="border-4 border-blue-900 p-6 bg-white rounded-lg print:border-2 print:p-4 print:w-full">
        {/* Header Institution */}
        <div className="flex items-center justify-between border-b-2 border-blue-900 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-900 text-white rounded-lg flex items-center justify-center font-black text-xl tracking-wider">
              {settings.institutionAbbreviation || 'SOD'}
            </div>
            <div>
              <h1 className="text-2xl font-black text-blue-950 uppercase tracking-tight">{settings.institutionName}</h1>
              <p className="text-xs font-semibold text-gray-600">RELATÓRIO A3 DE MELHORIA CONTINUA</p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-600 space-y-1">
            <p><span className="font-bold">ID Kaizen:</span> #{kaizen.id.substring(0, 8)}</p>
            <p><span className="font-bold">Data:</span> {new Date(kaizen.created_at).toLocaleDateString('pt-BR')}</p>
            <p><span className="font-bold">Status:</span> <span className="uppercase text-blue-800 font-bold">{kaizen.status}</span></p>
          </div>
        </div>

        {/* Info Grid Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-blue-50/60 p-4 rounded-lg border border-blue-100 mb-6 text-xs">
          <div>
            <span className="text-gray-500 block flex items-center gap-1 font-medium">
              <User className="w-3.5 h-3.5 text-blue-600" /> Autor da Ideia
            </span>
            <span className="font-bold text-gray-900 text-sm">{kaizen.profile?.full_name || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500 block flex items-center gap-1 font-medium">
              <Building2 className="w-3.5 h-3.5 text-blue-600" /> Setor / Linha
            </span>
            <span className="font-bold text-gray-900 text-sm">{kaizen.department?.name || 'Produção General'}</span>
          </div>
          <div>
            <span className="text-gray-500 block flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> Categoria
            </span>
            <span className="font-bold text-gray-900 text-sm">{kaizen.category?.name || 'Geral'}</span>
          </div>
          <div>
            <span className="text-gray-500 block flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Esforço x Impacto
            </span>
            <span className="font-bold text-gray-900 text-sm capitalize">
              {kaizen.effort_level} / {kaizen.impact_level}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6 bg-gray-900 text-white p-3 rounded-lg">
          <h2 className="text-lg font-bold tracking-wide uppercase">{kaizen.title}</h2>
        </div>

        {/* 2-Column Main A3 Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left Column: Problem & Before */}
          <div className="space-y-4 border border-red-200 bg-red-50/20 p-4 rounded-lg">
            <h3 className="font-bold text-red-900 text-sm uppercase flex items-center gap-2 border-b border-red-200 pb-2">
              <span className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
              Situação Atual & Problema Identificado
            </h3>
            <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">{kaizen.problem}</p>
            {kaizen.before_image_url && (
              <div className="mt-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Registro Fotográfico (Antes):</span>
                <img src={kaizen.before_image_url} alt="Antes" className="w-full h-36 object-cover rounded border border-gray-300" />
              </div>
            )}
          </div>

          {/* Right Column: Solution & After */}
          <div className="space-y-4 border border-green-200 bg-green-50/20 p-4 rounded-lg">
            <h3 className="font-bold text-green-900 text-sm uppercase flex items-center gap-2 border-b border-green-200 pb-2">
              <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
              Proposta de Melhoria & Situação Proposta
            </h3>
            <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">{kaizen.suggestion}</p>
            {(kaizen.after_image_url || kaizen.image_url) && (
              <div className="mt-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Registro Fotográfico (Depois/Esboço):</span>
                <img src={kaizen.after_image_url || kaizen.image_url || ''} alt="Depois" className="w-full h-36 object-cover rounded border border-gray-300" />
              </div>
            )}
          </div>
        </div>

        {/* Benefits & ROI Block */}
        <div className="border border-blue-200 bg-blue-50/30 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-blue-900 text-sm uppercase flex items-center gap-2 border-b border-blue-200 pb-2 mb-3">
            <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">3</span>
            Benefícios Esperados & Retorno Financeiro (ROI)
          </h3>
          <p className="text-xs text-gray-800 leading-relaxed mb-4">{kaizen.benefits}</p>
          
          <div className="grid grid-cols-3 gap-4 text-center bg-white p-3 rounded-lg border border-blue-100">
            <div>
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Economia Estimada/Real</span>
              <span className="text-base font-black text-green-700">
                R$ {(kaizen.realized_savings || kaizen.estimated_savings || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Custo de Implementação</span>
              <span className="text-base font-black text-gray-700">
                R$ {(kaizen.implementation_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Ganho Líquido Calculado</span>
              <span className={`text-base font-black ${netSavings >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                R$ {netSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Plans 5W2H Table if exists */}
        {kaizen.actionPlans && kaizen.actionPlans.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 text-xs uppercase mb-2">Plano de Ação de Implantação (5W2H)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase">
                    <th className="border border-gray-300 p-1.5">O que (What)</th>
                    <th className="border border-gray-300 p-1.5">Quem (Who)</th>
                    <th className="border border-gray-300 p-1.5">Data limite</th>
                    <th className="border border-gray-300 p-1.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {kaizen.actionPlans.map((ap) => (
                    <tr key={ap.id} className="border-b border-gray-200">
                      <td className="border border-gray-300 p-1.5 font-medium">{ap.what}</td>
                      <td className="border border-gray-300 p-1.5">{ap.who}</td>
                      <td className="border border-gray-300 p-1.5">{ap.due_date ? new Date(ap.due_date).toLocaleDateString('pt-BR') : 'N/A'}</td>
                      <td className="border border-gray-300 p-1.5 uppercase font-bold text-[10px]">
                        {ap.status === 'done' ? 'Concluído' : ap.status === 'in_progress' ? 'Em Andamento' : 'A Fazer'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Signatures */}
        <div className="pt-6 border-t-2 border-gray-300 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="border-b border-gray-400 mb-1 h-8 flex items-end justify-center font-semibold text-gray-800">
              {kaizen.profile?.full_name || ''}
            </div>
            <span className="text-[10px] text-gray-500 uppercase">Elaborado por (Funcionário)</span>
          </div>
          <div>
            <div className="border-b border-gray-400 mb-1 h-8 flex items-end justify-center font-semibold text-gray-800">
              Engenharia de Processos Sodecia
            </div>
            <span className="text-[10px] text-gray-500 uppercase">Aprovado por (Gerência)</span>
          </div>
          <div>
            <div className="border-b border-gray-400 mb-1 h-8 flex items-end justify-center font-semibold text-gray-800">
              Comitê Lean Sodecia
            </div>
            <span className="text-[10px] text-gray-500 uppercase">Validação de Resultados</span>
          </div>
        </div>
      </div>
    </div>
  );
}
