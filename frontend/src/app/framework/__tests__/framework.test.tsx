import { render, screen } from '@testing-library/react';
import FrameworkPage from '@/app/framework/page';

test('renders the page title, a section title and service cards', () => {
  render(<FrameworkPage />);
  expect(
    screen.getByRole('heading', { level: 1, name: /Framework/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { level: 2, name: /Business Framework/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { level: 3, name: 'SWOT Analysis' }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/strengths, weaknesses, opportunities, and threats/i),
  ).toBeInTheDocument();
});
