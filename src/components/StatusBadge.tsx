interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const configs: Record<string, { label: string; className: string }> = {
  safe: { label: "Safe", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "expiring-soon": { label: "Expiring Soon", className: "bg-amber-50 text-amber-700 border-amber-200" },
  expired: { label: "Expired", className: "bg-red-50 text-red-700 border-red-200" },
  "refill-required": { label: "Refill Required", className: "bg-blue-50 text-blue-700 border-blue-200" },
  processed: { label: "Processed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  processing: { label: "Processing", className: "bg-amber-50 text-amber-700 border-amber-200" },
  failed: { label: "Failed", className: "bg-red-50 text-red-700 border-red-200" },
  active: { label: "Active", className: "bg-teal-50 text-teal-700 border-teal-200" },
  pending: { label: "Pending", className: "bg-slate-50 text-slate-600 border-slate-200" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = configs[status] || { label: status, className: "bg-slate-50 text-slate-600 border-slate-200" };
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
}
