import { render, screen } from '@testing-library/react';
import FrameworkPage from '@/app/framework/page';

test('renders Framework page heading', () => {
  render(<FrameworkPage />);
  expect(screen.getByRole('heading', { name: /Framework Page/i })).toBeInTheDocument();
});