import React from 'react';
import { OrderStatus } from '../types';
import {
  Sparkles,
  PhoneOff,
  ExternalLink,
  Send,
  CheckCircle2,
  FileEdit,
  PhoneMissed,
  XCircle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  جديد: {
    label: 'جديد',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: Sparkles,
  },
  'لم يتم التواصل': {
    label: 'لم يتم التواصل',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: PhoneOff,
  },
  'تم فتح واتساب': {
    label: 'تم فتح واتساب',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: ExternalLink,
  },
  'تم إرسال التأكيد': {
    label: 'تم إرسال التأكيد',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: Send,
  },
  'تم التأكيد': {
    label: 'تم التأكيد',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  'طلب تعديل البيانات': {
    label: 'طلب تعديل البيانات',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: FileEdit,
  },
  'لا يرد': {
    label: 'لا يرد',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: PhoneMissed,
  },
  ملغي: {
    label: 'ملغي',
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
    border: 'border-zinc-200',
    icon: XCircle,
  },
};

export const ALL_STATUSES: OrderStatus[] = [
  'جديد',
  'لم يتم التواصل',
  'تم فتح واتساب',
  'تم إرسال التأكيد',
  'تم التأكيد',
  'طلب تعديل البيانات',
  'لا يرد',
  'ملغي',
];

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['جديد'];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
    lg: 'px-3 py-1.5 text-sm font-semibold gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border whitespace-nowrap ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
