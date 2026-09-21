import { translate, type StudioLocale } from '../../../i18n';
import type { JourneyStage } from './contracts';

export function stageLabels(locale: StudioLocale = 'en'): Record<JourneyStage, string> {
  return {
    foundation: translate('Projet', 'Project', undefined, locale),
    exploration: 'Discovery',
    frame: translate('Cadrage', 'Brief', undefined, locale),
    design: 'Design',
    architecture: 'Architecture',
    delivery: translate('Réalisation', 'Implementation', undefined, locale),
  };
}
export function designSteps(locale: StudioLocale = 'en') {
  return {
    directions: 'Directions',
    master: 'Master',
    screens: translate('Écrans et états', 'Screens and states', undefined, locale),
    prototype: 'Prototype',
  } as const;
}
export type DesignStep = keyof ReturnType<typeof designSteps>;

export function journeyLocation(hash: string): { stage: JourneyStage; step: DesignStep } {
  const [, stage, step] = hash.split('-');
  return {
    stage: Object.hasOwn(stageLabels(), stage ?? '') ? (stage as JourneyStage) : 'foundation',
    step: Object.hasOwn(designSteps(), step ?? '') ? (step as DesignStep) : 'directions',
  };
}
