import { render, screen, fireEvent } from '@testing-library/react';
import PortfolioPage from '@/app/portfolio/page';
import { PortfolioGrid } from '@/components/PortfolioGrid';

test('renders the page title, filters and project cards', () => {
  render(<PortfolioPage />);
  expect(screen.getByRole('heading', { level: 1, name: 'Portfolio' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 4, name: 'Receipt Bot' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /More details about Receipt Bot/i })).toBeInTheDocument();
});

test('filtering by a category shows only that category', () => {
  render(<PortfolioGrid />);

  expect(screen.getByRole('heading', { level: 4, name: 'Receipt Bot' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Management' }));

  expect(screen.queryByRole('heading', { level: 4, name: 'Receipt Bot' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 4, name: 'Community Program' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Management' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('the default filter shows every project', () => {
  render(<PortfolioGrid />);
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
});
