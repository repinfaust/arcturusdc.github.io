import MLBClient from './MLBClient';

export const metadata = {
  title: 'MLB Line-Movement Study | STEa',
  description:
    'Observational research instrument. Tracks how the MLB total moves pre-game as lineups, scratches, and sharp money arrive. Not a betting model — no predictions, picks, or LLM.',
  robots: { index: false, follow: false },
};

export default function MLBStudyPage() {
  return <MLBClient />;
}
