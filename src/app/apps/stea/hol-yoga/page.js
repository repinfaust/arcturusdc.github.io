import HolYogaHomeClient from './HolYogaHomeClient';

export const metadata = {
  title: 'Heart of Living Yoga — Workspace',
  robots: { index: false, follow: false },
};

export default function HolYogaHomePage() {
  return <HolYogaHomeClient />;
}
