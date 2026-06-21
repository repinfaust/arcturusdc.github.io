import { notFound, redirect } from 'next/navigation';
import PortfolioView from '../PortfolioView';
import { getPortfolioView, portfolioViewOrder } from '@/data/portfolio';

export function generateStaticParams() {
  return portfolioViewOrder
    .filter((view) => view !== 'portfolio')
    .map((view) => ({ view }));
}

export function generateMetadata({ params }) {
  const view = getPortfolioView(params.view);
  if (!view || params.view === 'portfolio') return {};

  return {
    title: `${view.title} - Arcturus Digital Consulting`,
    description: view.summary,
    alternates: {
      canonical: `https://www.arcturusdc.com/portfolio/${view.slug}`,
    },
  };
}

export default function PortfolioSubviewPage({ params, searchParams }) {
  if (params.view === 'cv') {
    const query = new URLSearchParams(searchParams || {}).toString();
    redirect(query ? `/portfolio?${query}` : '/portfolio');
  }

  const view = getPortfolioView(params.view);
  if (!view || params.view === 'portfolio') notFound();

  return <PortfolioView viewKey={params.view} />;
}
