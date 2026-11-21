import { render, screen } from '@testing-library/react';
import Layout from '@/components/Layout';

test('renders layout with header and footer', () => {
  render(
    <Layout>
      <div>Test content</div>
    </Layout>
  );
  // The site title renders in both the header logo and the footer.
  expect(screen.getAllByText('Tech Portfolio').length).toBeGreaterThan(0);
  expect(screen.getByText('Test content')).toBeInTheDocument();
});
