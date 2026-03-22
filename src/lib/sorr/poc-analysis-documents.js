export const POC_DOCUMENTS = [
  {
    id: 'build-spec',
    title: 'SoRR Control Product POC Build Spec',
    href: '/docs/sorr/sorr-control-product-poc-build-spec.md',
    type: 'MD',
    indexable: true,
  },
  {
    id: 'v0-spec',
    title: 'SoRR Control V0 Spec',
    href: '/docs/sorr/sorr-control-v0-spec.md',
    type: 'MD',
    indexable: true,
  },
  {
    id: 'compass-artifact',
    title: 'Compass Workflow Artifact',
    href: '/docs/sorr/compass-artifact.md',
    type: 'MD',
    indexable: true,
  },
  {
    id: 'cpo-rollout-pdf',
    title: 'CPO AI Rollout Strategy Considerations',
    href: '/docs/sorr/cpo-ai-rollout-strategy-considerations.pdf',
    type: 'PDF',
    indexable: false,
  },
  {
    id: 'business-case-docx',
    title: 'SoRR Control Internal Business Case',
    href: '/docs/sorr/sorr-control-internal-business-case.docx',
    type: 'DOCX',
    indexable: false,
  },
  {
    id: 'pitch-deck-pptx',
    title: 'SoRR Control Pitch Deck',
    href: '/docs/sorr/sorr-control-pitch-deck.pptx',
    type: 'PPTX',
    indexable: false,
  },
];

export const POC_CONTEXT_PRIMER = [
  'SoRR Control product model: Claude is the normal thinking interface.',
  'SoRR is the governed execution layer when work touches company data, approved agents, persistent workspaces, or formal outputs.',
  'The POC uses handoff states A-E to communicate escalation from Claude into governed SoRR lanes.',
  'Core routes: continue in Claude, auto-approved governed execution, approval-gated execution, governed workspace, or blocked when no approved enterprise path exists.',
  'Admin console pages are for approvals, audit, policy boundary, and governed operations visibility.',
].join('\n');
