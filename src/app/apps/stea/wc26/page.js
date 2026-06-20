import WC26Client from './WC26Client';

export const metadata = {
  title: 'WC26 xG Value Engine | STEa',
  description:
    'Deterministic Dixon-Coles / xG pricing for the 2026 World Cup. Fair odds across every market, value detection, ¼-Kelly staking, and an honest model track record. No LLM in the prediction path.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WC26Page() {
  return <WC26Client />;
}
