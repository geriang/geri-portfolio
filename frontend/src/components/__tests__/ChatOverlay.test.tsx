import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatOverlay from '../ChatOverlay';
import { ChatProvider } from '../../context/ChatContext';

describe('ChatOverlay', () => {
  const onClose = jest.fn();
  test('renders static messages and queue position', () => {
    render(
      <ChatProvider>
        <ChatOverlay onClose={onClose} queuePosition={3} />
      </ChatProvider>
    );
    expect(screen.getByText(/position: 3/i)).toBeInTheDocument();
    expect(screen.getByText(/welcome to the ai chat demo!/i)).toBeInTheDocument();
    expect(screen.getByText(/this is a sample response from the ai\./i)).toBeInTheDocument();
  });

  test('matches snapshot', () => {
    const { asFragment } = render(
      <ChatProvider>
        <ChatOverlay onClose={onClose} queuePosition={1} />
      </ChatProvider>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
