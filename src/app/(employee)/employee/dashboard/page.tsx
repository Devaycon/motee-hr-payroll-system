import { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Employee Portal',
  description: '',
};

const Index = dynamic(
  () => import('@/src/components/employee')
);

const EmployeeDashboardPage = () => {
  return <Index />;
};

export default EmployeeDashboardPage;