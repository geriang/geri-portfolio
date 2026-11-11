import { render, screen } from '@testing-library/react';
import PortfolioPage from '@/app/portfolio/page';

test('renders Portfolio page heading', () => {
  render(<PortfolioPage />);
  expect(screen.getByRole('heading', { name: /Portfolio Page/i })).toBeInTheDocument();
});