import React from 'react';
import { useChat } from '../context/ChatContext';

interface ChatOverlayProps {
  onClose: () => void;
  queuePosition: number;
}

const ChatOverlay: React.FC<ChatOverlayProps> = ({ onClose, queuePosition }) => {
  const { messages } = useChat();

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
        <div className="space-y-2">
          {messages.map((msg, idx) => (
            <p key={idx} className="text-gray-800 dark:text-gray-200">
              {msg}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatOverlay;
