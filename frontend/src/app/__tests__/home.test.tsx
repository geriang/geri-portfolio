import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

test('renders Home page heading', () => {
  render(<HomePage />);
  expect(screen.getByRole('heading', { name: /Home Page/i })).toBeInTheDocument();
});