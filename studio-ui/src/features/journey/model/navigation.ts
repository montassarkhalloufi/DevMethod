import type { JourneyStage } from './contracts';

export const stageLabels: Record<JourneyStage, string> = {
  foundation: 'Projet',
  exploration: 'Discovery',
  frame: 'Cadrage',
  design: 'Design',
  architecture: 'Architecture',
  delivery: 'Réalisation',
};
export const designSteps = {
  directions: 'Directions',
  master: 'Master',
  screens: 'Écrans et états',
  prototype: 'Prototype',
} as const;
export type DesignStep = keyof typeof designSteps;

export function journeyLocation(hash: string): { stage: JourneyStage; step: DesignStep } {
  const [, stage, step] = hash.split('-');
  return {
    stage: Object.hasOwn(stageLabels, stage ?? '') ? (stage as JourneyStage) : 'foundation',
    step: Object.hasOwn(designSteps, step ?? '') ? (step as DesignStep) : 'directions',
  };
}
