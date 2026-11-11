import React, { createContext, useContext, ReactNode } from 'react';

// Define the shape of the chat context
interface ChatContextProps {
  messages: string[];
  position: number;
}

const defaultContext: ChatContextProps = {
  messages: [
    'Welcome to the AI chat demo!',
    'This is a sample response from the AI.'
  ],
  position: 1,
};

const ChatContext = createContext<ChatContextProps>(defaultContext);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  // For now we just provide the static default context
  return (
    <ChatContext.Provider value={defaultContext}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
