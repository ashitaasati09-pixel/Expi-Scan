export function getDaysRemaining(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - today.getTime()) / 86_400_000);
}

export function computeStatus(daysRemaining: number): "safe" | "expiring-soon" | "expired" {
  if (daysRemaining < 0) return "expired";
  if (daysRemaining <= 30) return "expiring-soon";
  return "safe";
}