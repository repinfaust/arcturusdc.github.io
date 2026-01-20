export const metadata = {
  title: 'STEa Pricing & Plans - Plan, Build, Test, Document | Arcturus Digital Consulting',
  description: 'Choose a STEa plan that fits how you build. Solo (£9/month), Team (£25/seat/month), or Agency (£49/seat/month) plans. All plans include Harls, Filo, Hans, Ruby, and hosted AutoProduct automation. Start your subscription today—cancel anytime.',
  keywords: [
    'STEa',
    'product management',
    'project management',
    'agile tools',
    'testing tools',
    'product documentation',
    'Harls',
    'Filo',
    'Hans',
    'Ruby',
    'subscription pricing',
    'SaaS pricing',
  ],
  alternates: {
    canonical: 'https://www.arcturusdc.com/apps/stea/explore',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'STEa Pricing & Plans - Plan, Build, Test, Document',
    description: 'Choose a STEa plan that fits how you build. Solo, Team, or Agency plans. All plans include Harls, Filo, Hans, Ruby, and hosted AutoProduct automation.',
    url: 'https://www.arcturusdc.com/apps/stea/explore',
    siteName: 'Arcturus Digital Consulting',
    images: [
      {
        url: 'https://www.arcturusdc.com/img/acturusdc_stea_logo.png',
        width: 1200,
        height: 630,
        alt: 'STEa Logo',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'STEa Pricing & Plans - Plan, Build, Test, Document',
    description: 'Choose a STEa plan that fits how you build. Solo, Team, or Agency plans with full access to Harls, Filo, Hans, and Ruby.',
    images: ['https://www.arcturusdc.com/img/acturusdc_stea_logo.png'],
  },
};

export default function SteaExploreLayout({ children }) {
  return children;
}

