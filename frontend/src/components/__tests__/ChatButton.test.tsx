import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatButton } from '../ChatButton';
import { ChatProvider } from '../../context/ChatContext';

// Mock Next.js dynamic import to load a simple mock overlay component synchronously in tests
jest.mock('next/dynamic', () => () => {
  const React = require('react');
  const { useChat } = require('../../context/ChatContext');
  const MockOverlay = ({ onClose, queuePosition }) => {
    const { messages } = useChat();
    return (
      React.createElement(React.Fragment, null,
        React.createElement('h2', null, 'Chat Demo'),
        React.createElement('p', null, `Position: ${queuePosition}`),
        ...messages.map((msg, i) => React.createElement('p', { key: i }, msg))
      )
    );
  };
  return MockOverlay;
});




describe('ChatButton', () => {
  test('opens overlay on click', () => {
    render(
      <ChatProvider>
        <ChatButton />
      </ChatProvider>
    );
    const button = screen.getByRole('button', { name: /open chat/i });
    fireEvent.click(button);
    // The overlay should now be in the document
    expect(screen.getByRole('heading', { name: /chat demo/i })).toBeInTheDocument();
    // Verify placeholder messages are shown
    expect(screen.getByText(/welcome to the ai chat demo!/i)).toBeInTheDocument();
    expect(screen.getByText(/this is a sample response from the ai\./i)).toBeInTheDocument();
  });
});
