import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  test('renders tool payload as ProjectCard', async () => {
    const mockTool = { name: 'Test Project', description: 'A project' };
    const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ message: 'Tool response', tool: mockTool })
    } as any);

    render(
      <ChatProvider>
        <ChatOverlay onClose={onClose} queuePosition={1} />
      </ChatProvider>
    );

    const input = screen.getByPlaceholderText(/ask something.../i);
    await userEvent.type(input, 'test prompt');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    // Wait for async fetch handling
    expect(await screen.findByTestId('project-card')).toBeInTheDocument();
    expect(screen.getByText(/test project/i)).toBeInTheDocument();
    mockFetch.mockRestore();
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

