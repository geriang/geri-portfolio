import { render, screen } from '@testing-library/react';
import Home from '../page';

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 2, name: 'Geri Ang' })).toBeInTheDocument();
  });

  it('renders the hero subtitle', () => {
    render(<Home />);
    expect(screen.getByText(/AI\/GenAI Product/)).toBeInTheDocument();
  });
});
