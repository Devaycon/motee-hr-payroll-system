import { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Login Page',
  description: '',
};

const Index = dynamic(
  () => import('@/src/components/auth')
);

const IndexPage = () => {
  return <Index />;
};

export default IndexPage;