import { render, screen } from '@testing-library/react';
import PortfolioPage from '../page';

describe('Portfolio Page', () => {
  it('renders the main heading', () => {
    render(<PortfolioPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Portfolio' })).toBeInTheDocument();
  });

  it('renders the filter tabs', () => {
    render(<PortfolioPage />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Application')).toBeInTheDocument();
    expect(screen.getByText('Management')).toBeInTheDocument();
  });

  it('renders portfolio items', () => {
    render(<PortfolioPage />);
    expect(screen.getByText('Vanilla Javascript Web App')).toBeInTheDocument();
  });
});
