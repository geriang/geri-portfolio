import { render, screen } from '@testing-library/react';
import Layout from '@/components/Layout';

test('renders layout with header and footer', () => {
  render(
    <Layout>
      <div>Test content</div>
    </Layout>
  );
  expect(screen.getByText('gach.work')).toBeInTheDocument();
  expect(screen.getByText('Test content')).toBeInTheDocument();
});
