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
        className="fixed bottom-4 left-4 z-[99998] flex h-12 w-12 items-center justify-center rounded-full bg-accent text-contrast shadow-lg transition duration-300 hover:opacity-90"
        aria-label="Open chat"
      >
        💬
      </button>
      {showOverlay && <ChatOverlay onClose={close} queuePosition={position} />}
    </>
  );
};
