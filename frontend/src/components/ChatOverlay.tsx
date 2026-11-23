import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import ProjectCard from './ProjectCard';

interface ChatOverlayProps {
  onClose: () => void;
  queuePosition: number;
}

const ChatOverlay: React.FC<ChatOverlayProps> = ({ onClose, queuePosition }) => {
  const { messages: initialMessages } = useChat();
  const [messages, setMessages] = useState<string[]>(initialMessages);
  const [toolData, setToolData] = useState<unknown>(null);
  const [input, setInput] = useState('');

  const sendPrompt = async (prompt: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
      if (data.tool) {
        setToolData(data.tool);
      }
    } catch (e) {
      console.error('Chat request failed', e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendPrompt(input.trim());
      setInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4">
      <div className="w-80 max-w-full rounded border border-white/10 bg-surface p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat Demo</h2>
          <button
            onClick={onClose}
            className="text-foreground/60 transition duration-300 hover:text-accent"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>
        <p className="mb-2 text-sm text-foreground/60">Position: {queuePosition}</p>
        <form onSubmit={handleSubmit} className="mb-2 flex">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="mr-2 flex-1 rounded border border-white/10 bg-background px-2 py-1 text-foreground outline-none focus:border-accent"
            placeholder="Ask something..."
          />
          <button
            type="submit"
            className="rounded bg-accent px-3 text-contrast transition duration-300 hover:opacity-90"
          >
            Send
          </button>
        </form>
        <div className="space-y-2">
          {messages.map((msg, idx) => (
            <p key={idx}>{msg}</p>
          ))}
          {toolData !== null && toolData !== undefined && <ProjectCard tool={toolData} /> }
        </div>
      </div>
    </div>
  );
};

export default ChatOverlay;

