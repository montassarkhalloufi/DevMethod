import { digest } from './files.mjs';

export function contextKey(state) {
  return digest(
    Buffer.from(
      JSON.stringify({
        project: state.project,
        brief: state.brief,
        decisions: state.decisions,
        selectedDesignId: state.selectedDesignId,
        designs: state.designs,
        proposals: state.proposals,
        designJourney: state.designJourney,
      }),
    ),
  );
}
