import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useChat } from '../context/ChatContext';

// Lazy‑load the overlay component; it will only be fetched after the button is clicked
const ChatOverlay = dynamic(() => import('./ChatOverlay'), { ssr: false });

export const ChatButton = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const { position } = useChat();

  const open = () => setShowOverlay(true);
  const close = () => setShowOverlay(false);

  return (
    <>
      <button
        onClick={open}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        aria-label="Open chat"
      >
        💬
      </button>
      {showOverlay && <ChatOverlay onClose={close} queuePosition={position} />}
    </>
  );
};
