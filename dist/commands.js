/** Native stage entry points; module selection remains the six-module contract. */
export const stageOwners = {
    'devmethod-explore': 'project-foundation',
    'devmethod-frame': 'project-foundation',
    'devmethod-design': 'design-to-code',
    'devmethod-architecture': 'decision-architecture',
    'devmethod-plan': 'scoped-delivery',
    'devmethod-ready': 'scoped-delivery',
    'devmethod-implement': 'scoped-delivery',
    'devmethod-review': 'scoped-delivery',
    'devmethod-verify': 'scoped-delivery',
    'devmethod-integrate': 'scoped-delivery',
    'devmethod-correct-course': 'project-foundation',
    'devmethod-next': 'scoped-delivery',
    'devmethod-status': 'project-foundation',
    'devmethod-handoff': 'scoped-delivery',
};
export function commandSkills(selected) {
    return Object.entries(stageOwners).filter(([, owner]) => selected.includes('project-foundation') && selected.includes(owner)).map(([name]) => name);
}
