import { render, screen, within } from '@testing-library/react';
import HomePage from '@/app/page';

test('renders the header sitename and the hero name', () => {
  render(<HomePage />);
  expect(screen.getByRole('heading', { level: 1, name: /Tech Portfolio/i })).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { level: 2, name: /Jordan Lee/i }),
  ).toBeInTheDocument();
});

test('renders the hero role line and its social links', () => {
  const { container } = render(<HomePage />);
  const hero = container.querySelector('.hero');
  expect(hero).not.toBeNull();

  expect(within(hero as HTMLElement).getByText(/AI\/GenAI Product/i)).toBeInTheDocument();
  expect(within(hero as HTMLElement).getByLabelText('LinkedIn')).toBeInTheDocument();
  expect(within(hero as HTMLElement).getByLabelText('GitHub')).toBeInTheDocument();
  // The blinking caret used by the typewriter
  expect(container.querySelector('.typed-cursor')).not.toBeNull();
});
