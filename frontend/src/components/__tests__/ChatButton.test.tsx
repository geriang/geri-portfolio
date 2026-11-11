/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatButton } from '../ChatButton';
import { ChatProvider } from '../../context/ChatContext';

// Mock Next.js dynamic import to load a simple mock overlay component synchronously in tests
jest.mock('next/dynamic', () => () => {
  const React = require('react');
  const { useChat } = require('../../context/ChatContext');
  const MockOverlay = ({ onClose, queuePosition }: { onClose: () => void; queuePosition: number }) => {
    const { messages } = useChat();
    return (
      <div>
        <h2>Chat Demo</h2>
        <p>Position: {queuePosition}</p>
        {messages.map((msg: string, i: number) => (
          <p key={i}>{msg}</p>
        ))}
        <button onClick={onClose}>Close</button>
      </div>
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
