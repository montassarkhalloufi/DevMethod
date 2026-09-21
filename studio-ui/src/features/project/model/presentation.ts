import { engineMessage } from './engine-messages';
import type { ProjectAnalysis, ProjectIntelligence, Provenance } from './contracts';

/** Presentation only: fingerprints, identifiers, source references and observed traces stay intact. */
export function presentAnalysis(analysis: ProjectAnalysis, locale: 'en' | 'fr'): ProjectAnalysis {
  const message = (value: string) => engineMessage(value, locale);
  const provenance = (entries: Provenance[]) =>
    entries.map((entry) =>
      entry.kind === 'observed'
        ? entry
        : {
            ...entry,
            method: message(entry.method),
            ...(entry.limitation ? { limitation: message(entry.limitation) } : {}),
          },
    );
  return {
    ...analysis,
    environment: message(analysis.environment),
    scope: message(analysis.scope),
    files: analysis.files.map((file) => ({ ...file, role: message(file.role) })),
    elements: analysis.elements.map((element) => ({
      ...element,
      description: message(element.description),
      provenance: provenance(element.provenance),
    })),
    relations: analysis.relations.map((relation) => ({
      ...relation,
      label: message(relation.label),
      provenance: provenance(relation.provenance),
    })),
    flows: analysis.flows.map((flow) =>
      flow.kind === 'observed'
        ? flow
        : {
            ...flow,
            errors: flow.errors.map((error) => ({ ...error, label: message(error.label) })),
            limits: flow.limits.map(message),
          },
    ),
    issues: analysis.issues.map((issue) => ({ ...issue, message: message(issue.message) })),
    limits: analysis.limits.map(message),
  };
}
export function presentProjectModel(model: ProjectIntelligence | undefined, locale: 'en' | 'fr') {
  if (!model) return model;
  return {
    ...model,
    analysis: presentAnalysis(model.analysis, locale),
    previous: model.previous ? presentAnalysis(model.previous, locale) : null,
    impact: {
      ...model.impact,
      limits: model.impact.limits.map((value) => engineMessage(value, locale)),
    },
  };
}
