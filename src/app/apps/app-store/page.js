import apps from '@/data/apps.json';
import AppStoreGalleryClient from './AppStoreGalleryClient';

export const metadata = {
  title: 'App Store — ArcturusDC',
  description: 'A walk-through product gallery for ArcturusDC apps.',
};

export default function AppStorePage() {
  return <AppStoreGalleryClient apps={apps} />;
}
