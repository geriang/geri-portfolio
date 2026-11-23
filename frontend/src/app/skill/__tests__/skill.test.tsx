import { render, screen, within } from '@testing-library/react';
import SkillPage from '@/app/skill/page';

test('renders the page title, a section title and feature cards', () => {
  const { container } = render(<SkillPage />);
  expect(
    screen.getByRole('heading', { level: 1, name: /Technical Skill/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: /Tech Stack/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 3, name: 'ReactJS' })).toBeInTheDocument();

  const breadcrumbs = container.querySelector('.breadcrumbs');
  expect(breadcrumbs).not.toBeNull();
  expect(within(breadcrumbs as HTMLElement).getByRole('link', { name: 'Home' })).toBeInTheDocument();
  expect(within(breadcrumbs as HTMLElement).getByText('Technical Skill')).toBeInTheDocument();
});
