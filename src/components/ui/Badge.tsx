import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'pending' | 'approved' | 'rejected' | 'under_review' | 'default';
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    under_review: 'bg-blue-100 text-blue-800 border-blue-300',
    default: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const labels = {
    pending: 'Aguardando Aprovação',
    approved: 'Aprovado',
    rejected: 'Reprovado',
    under_review: 'Em Análise',
    default: children,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
      {...props}
    >
      {variant !== 'default' ? labels[variant] : children}
    </span>
  );
}
