import type { SeasonStatus } from '../types/season';

export function seasonStatusLabel(status: SeasonStatus): string {
  switch (status) {
    case 'ACTIVE': return 'Active';
    case 'GRACE': return 'Grace';
    case 'SCHEDULED': return 'Scheduled';
    case 'COMPLETED': return 'Completed';
    default: return status;
  }
}

export function seasonStatusColor(status: SeasonStatus): string {
  switch (status) {
    case 'ACTIVE': return '#f1c40f';
    case 'GRACE': return '#e67e22';
    case 'SCHEDULED': return '#3498db';
    case 'COMPLETED': return 'rgba(255,255,255,0.45)';
    default: return 'rgba(255,255,255,0.45)';
  }
}

export function formatSeasonRange(startsAt: string, endsAt: string): string {
  try {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)} IST`;
  } catch {
    return `${startsAt} – ${endsAt}`;
  }
}
