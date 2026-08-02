import { Archivo, IBM_Plex_Mono } from 'next/font/google';

import './sidestand.css';

const archivo = Archivo({ subsets: ['latin'], variable: '--font-sidestand-display' });
const plex = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-sidestand-mono' });

export default function SidestandWorkspaceLayout({ children }) {
  return <div className={`${archivo.variable} ${plex.variable}`}>{children}</div>;
}
