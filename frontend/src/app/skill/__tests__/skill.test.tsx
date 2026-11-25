import { render, screen } from '@testing-library/react';
import SkillPage from '@/app/skill/page';

test('renders Skill page heading', () => {
  render(<SkillPage />);
  expect(screen.getByRole('heading', { level: 1, name: /Technical Skill/i })).toBeInTheDocument();
});