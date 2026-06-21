import PortfolioView from './PortfolioView';

export const metadata = {
  title: 'Portfolio - Arcturus Digital Consulting',
  description:
    'A tiered portfolio of public apps, B2B systems, controlled demos, and authenticated ArcturusDC workspaces.',
};

export default function PortfolioPage() {
  return <PortfolioView viewKey="portfolio" />;
}
