export const PAYGO_POC_DOCUMENTS = [
  {
    id: 'paygo-poc-v02',
    title: 'PAYGO POC Build Spec v02',
    href: '/docs/paygo/paygo_poc_build_spec_v02.md',
    type: 'MD',
    indexable: true,
  },
  {
    id: 'payg-poc-v1',
    title: 'PAYG POC Build Spec',
    href: '/docs/paygo/payg_poc_build_spec.md',
    type: 'MD',
    indexable: true,
  },
  {
    id: 'paygo-ai-analyst',
    title: 'PAYGO AI Analyst Spec',
    href: '/docs/paygo/paygo_ai_analyst_spec.md',
    type: 'MD',
    indexable: true,
  },
  {
    id: 'paygo-seed-data',
    title: 'PAYGO Seed Data v4',
    href: '/docs/paygo/payg_seed_data_v4.xlsx',
    type: 'XLSX',
    indexable: false,
  },
];

export const PAYGO_CONTEXT_PRIMER = [
  'PAYGO is a product demonstration for prepayment energy management across UK, Ireland, and USA.',
  'The demo uses fictional data only and no real customer PII or live accounts.',
  'UK showcases feature-complete flows including vulnerability support and friendly hours.',
  'Ireland models non-smart meter constraints with estimate-led usage, no auto top-up, and meter-read prompts.',
  'USA showcases AMI + TOU complexity with EV and solar/battery optimization scenarios.',
  'Cross-cutting setup includes seeded usage and payment history so demo screens are always populated.',
].join('\n');
