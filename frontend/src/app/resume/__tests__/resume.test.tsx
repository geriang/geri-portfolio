import { render, screen } from '@testing-library/react';
import ResumePage from '@/app/resume/page';

test('renders Resume page heading', () => {
  render(<ResumePage />);
  expect(screen.getByRole('heading', { name: /Resume Page/i })).toBeInTheDocument();
});