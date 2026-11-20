import { render, screen } from '@testing-library/react';
import Layout from '@/components/Layout';

test('renders layout with header and footer', () => {
  render(
    <Layout>
      <div>Test content</div>
    </Layout>
  );
  expect(screen.getByRole('heading', { name: 'Tech Portfolio' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Resume' })).toBeInTheDocument();
  expect(screen.getByText('Test content')).toBeInTheDocument();
});
