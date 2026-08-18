import { PriceProposal } from '../types';

export class GovernanceService {
  static readonly TIMELOCK_DURATION_SECONDS = 86400; // 24 hours

  static canExecute(proposal: PriceProposal, currentTimestampMs: number = Date.now()): boolean {
    if (proposal.status !== 'APPROVED') return false;
    // For demo purposes or simulation, proposals marked approved are actionable
    return true;
  }

  static getStatusBadgeColor(status: PriceProposal['status']): {
    bg: string;
    text: string;
    border: string;
  } {
    switch (status) {
      case 'PENDING':
        return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
      case 'APPROVED':
        return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' };
      case 'EXECUTED':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
      case 'CANCELLED':
        return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' };
      default:
        return { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' };
    }
  }
}
