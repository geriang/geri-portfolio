import { render, screen } from '@testing-library/react';
import Layout from '@/components/Layout';

test('renders layout with header, footer and fixed controls', () => {
  render(
    <Layout active="/skill">
      <div>Test content</div>
    </Layout>,
  );

  expect(screen.getByRole('heading', { level: 1, name: 'Tech Portfolio' })).toBeInTheDocument();
  expect(screen.getByText('Test content')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Technical Skill' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Technical Skill' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  expect(screen.getByRole('button', { name: /open chat/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Scroll to top' })).toBeInTheDocument();
  expect(screen.getByText(/Copyright 2026/i)).toBeInTheDocument();
});

test('marks the active route in the nav menu', () => {
  const { container } = render(
    <Layout active="/portfolio">
      <div>Test content</div>
    </Layout>,
  );

  expect(container.querySelector('.nav-link.is-active')).toHaveTextContent('Portfolio');
});
