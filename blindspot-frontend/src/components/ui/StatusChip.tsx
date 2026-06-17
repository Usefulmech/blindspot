

export interface StatusChipProps {
  status: 'success' | 'warning' | 'error' | 'neutral';
  label: string;
  className?: string;
}

export function StatusChip({ status, label, className = '' }: StatusChipProps) {
  const baseStyle = "inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-bold uppercase tracking-wider";
  
  const statusStyles = {
    success: "bg-primary-fixed text-on-primary-fixed-variant",
    warning: "bg-surface-variant text-on-surface",
    error: "bg-error-container text-on-error-container",
    neutral: "bg-secondary-fixed text-on-secondary-fixed-variant"
  };

  return (
    <span className={`${baseStyle} ${statusStyles[status]} ${className}`}>
      {label}
    </span>
  );
}
