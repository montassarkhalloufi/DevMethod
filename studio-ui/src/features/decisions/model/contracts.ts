export type ProposalPreview =
  | { kind: 'image'; referenceId: string; status: 'simulation' }
  | {
      kind: 'revision';
      revisionId: string;
      status: 'implemented' | 'simulation';
      route?: string;
      element?: { selector: string; text: string };
    };

export interface ProposalOption {
  id: string;
  title: string;
  consequences: string[];
  preview?: ProposalPreview;
}

export interface DecisionProposal {
  id: string;
  topic: string;
  question: string;
  stage: 'implementation' | 'visual';
  baseRevision: string | null;
  options: ProposalOption[];
  selectedOptionId: string | null;
  recommendation?: { optionId: string; reason: string };
}

export interface DecisionActions {
  select(proposalId: string, optionId: string): Promise<void>;
  approve(proposalId: string, optionId: string, reason: string): Promise<void>;
}

export interface DecisionCardProps {
  draftScope?: string;
  proposal: DecisionProposal;
  activeRevision: string | null;
  execution: 'automatic' | 'host';
  actions: DecisionActions;
}

export function approvalLabel(proposal: DecisionProposal, execution: 'automatic' | 'host') {
  if (proposal.stage === 'implementation')
    return execution === 'automatic'
      ? 'Approuver et lancer la réalisation'
      : 'Approuver et préparer la réalisation';
  const option = proposal.options.find((entry) => entry.id === proposal.selectedOptionId);
  return option?.preview?.status === 'implemented'
    ? 'Valider le rendu de cette version'
    : 'Retenir cette proposition visuelle';
}
