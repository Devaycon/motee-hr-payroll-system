import { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Motee Admin Dashboard',
  description: '',
};

const Index = dynamic(
  () => import('@/src/components/motee')
);

const MoteeDashboard = () => {
  return <Index />;
};

export default MoteeDashboard;