import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from '@/app/page';
import FrameworkPage from '@/app/framework/page';
import SkillPage from '@/app/skill/page';
import ResumePage from '@/app/resume/page';
import PortfolioPage from '@/app/portfolio/page';

// Mock next/dynamic to provide a simple mock overlay component synchronously in tests
jest.mock('next/dynamic', () => () => {
  const MockOverlay = ({ onClose, queuePosition }) => (
    <div>
      <h2>Chat Demo</h2>
      <p>Position: {queuePosition}</p>
      <p>Welcome to the AI chat demo!</p>
      <p>This is a sample response from the AI.</p>
    </div>
  );
  return MockOverlay;
});

describe('ChatButton visibility and behavior on all pages', () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  const pages = [
    { name: 'Home', Component: Home },
    { name: 'Framework', Component: FrameworkPage },
    { name: 'Skill', Component: SkillPage },
    { name: 'Resume', Component: ResumePage },
    { name: 'Portfolio', Component: PortfolioPage },
  ];

  pages.forEach(({ name, Component }) => {
    test(`${name} page shows ChatButton and overlay works`, () => {
      render(<Component />);
      const button = screen.getByRole('button', { name: /open chat/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      // Overlay should appear
      expect(screen.getByRole('heading', { name: /chat demo/i })).toBeInTheDocument();
    });
  });

  afterAll(() => {
    consoleError.mockRestore();
  });
});
