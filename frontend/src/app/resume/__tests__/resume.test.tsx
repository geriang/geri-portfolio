import { render, screen } from '@testing-library/react';
import ResumePage from '../page';

describe('Resume Page', () => {
  it('renders the main heading', () => {
    render(<ResumePage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Resume' })).toBeInTheDocument();
  });

  it('renders the Summary section', () => {
    render(<ResumePage />);
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('renders the Professional Experience section', () => {
    render(<ResumePage />);
    expect(screen.getByText('Professional Experience')).toBeInTheDocument();
  });
});
