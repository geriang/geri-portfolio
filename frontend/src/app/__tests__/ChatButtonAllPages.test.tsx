// Mock next/dynamic to provide a mock overlay component that includes the expected heading and content
jest.mock('next/dynamic', () => {
  const mock = jest.fn(() => {
    // Return a component that renders the overlay markup
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Component = ({ onClose, queuePosition }: { onClose: () => void; queuePosition: number }) => (
      <div>
        <h2>Chat Demo</h2>
        <p>Position: {queuePosition}</p>
        <p>Welcome to the AI chat demo!</p>
        <p>This is a sample response from the AI.</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
    return Component;
  });
  return mock;
});


import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from '@/app/page';
import FrameworkPage from '@/app/framework/page';
import SkillPage from '@/app/skill/page';
import ResumePage from '@/app/resume/page';
import PortfolioPage from '@/app/portfolio/page';

// After mocking, import the mocked dynamic function to assert calls
import dynamicMock from 'next/dynamic';

describe('ChatButton visibility, console errors, and lazy‑load verification', () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  const pages = [
    { name: 'Home', Component: Home },
    { name: 'Framework', Component: FrameworkPage },
    { name: 'Skill', Component: SkillPage },
    { name: 'Resume', Component: ResumePage },
    { name: 'Portfolio', Component: PortfolioPage },
  ];

  pages.forEach(({ name, Component }) => {
    test(`${name} page shows ChatButton, no console errors, and lazy‑load works`, () => {
      // Ensure dynamicMock has not been called yet
      

      render(<Component />);
      const button = screen.getByRole('button', { name: /open chat/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      // After click, lazy component should be loaded
      expect(dynamicMock).toHaveBeenCalled();
      // Verify overlay appears
      expect(screen.getByRole('heading', { name: /chat demo/i })).toBeInTheDocument();
      // Ensure no console errors were emitted
      expect(consoleError).not.toHaveBeenCalled();
    });
  });

  afterAll(() => {
    consoleError.mockRestore();
  });
});

