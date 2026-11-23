import { render, screen } from '@testing-library/react';
import FrameworkPage from '../page';

describe('Framework Page', () => {
  it('renders the main heading', () => {
    render(<FrameworkPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Framework' })).toBeInTheDocument();
  });

  it('renders the Business Framework section', () => {
    render(<FrameworkPage />);
    expect(screen.getByText('Business Framework')).toBeInTheDocument();
  });
});
