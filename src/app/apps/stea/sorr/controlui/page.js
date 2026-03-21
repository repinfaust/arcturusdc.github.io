import ControlUiClient from './_components/ControlUiClient';

export const metadata = {
  title: 'SoRR Control UI',
  description: 'SoRR governed orchestration POC for STEa.',
};

export default function SorrControlUiOverviewPage() {
  return <ControlUiClient activeView="overview" />;
}
