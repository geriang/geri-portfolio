import { render, screen } from '@testing-library/react';
import SkillPage from '../page';

describe('Skill Page', () => {
  it('renders the main heading', () => {
    render(<SkillPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Technical Skill' })).toBeInTheDocument();
  });

  it('renders the Tech Stack section', () => {
    render(<SkillPage />);
    expect(screen.getByText('Tech Stack')).toBeInTheDocument();
  });
});
