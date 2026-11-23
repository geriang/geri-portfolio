import { render, screen } from '@testing-library/react';
import ResumePage from '@/app/resume/page';

test('renders the page title, resume groups and timeline entries', () => {
  render(<ResumePage />);
  expect(screen.getByRole('heading', { level: 1, name: /Resume/i })).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { level: 3, name: 'Professional Experience' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { level: 3, name: 'Education' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { level: 4, name: 'AI Product Owner' }),
  ).toBeInTheDocument();
  expect(screen.getByText(/growing active participation by 70%/i)).toBeInTheDocument();
});
