import SidestandWorkspaceClient from './SidestandWorkspaceClient';

export const metadata = { title: 'Sidestand — Team workspace', robots: { index: false, follow: false } };

export default function SidestandWorkspacePage() {
  return <SidestandWorkspaceClient />;
}
