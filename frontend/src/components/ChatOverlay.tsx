import React, { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import ProjectCard from './ProjectCard';

interface ChatOverlayProps {
  onClose: () => void;
  queuePosition: number;
}

const ChatOverlay: React.FC<ChatOverlayProps> = ({ onClose, queuePosition }) => {
  const { messages: initialMessages } = useChat();
  const [messages, setMessages] = useState<string[]>(initialMessages);
  const [toolData, setToolData] = useState<any>(null);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-80 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Chat Demo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-2">Position: {queuePosition}</p>
        <form onSubmit={handleSubmit} className="mb-2 flex">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 border rounded px-2 py-1 mr-2"
            placeholder="Ask something..."
          />
          <button type="submit" className="bg-blue-600 text-white px-3 rounded">Send</button>
        </form>
        <div className="space-y-2">
          {messages.map((msg, idx) => (
            <p key={idx} className="text-gray-800 dark:text-gray-200">{msg}</p>
          ))}
          {toolData && <ProjectCard tool={toolData} />}
        </div>
      </div>
    </div>
  );
};

export default ChatOverlay;

