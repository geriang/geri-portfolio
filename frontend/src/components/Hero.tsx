'use client';

import React, { useEffect, useRef } from 'react';

export default function Hero() {
  const typedTextRef = useRef<string[]>(['Strategist', 'Manager', 'Owner', 'Builder']);
  const textIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const isDeletingRef = useRef(false);
  const typedTextRefElement = useRef<HTMLSpanElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const type = () => {
      const currentText = typedTextRef.current[textIndexRef.current];
      
      if (!typedTextRefElement.current) return;

      if (isDeletingRef.current) {
        typedTextRefElement.current.textContent = currentText.substring(0, charIndexRef.current - 1);
        charIndexRef.current--;
      } else {
        typedTextRefElement.current.textContent = currentText.substring(0, charIndexRef.current + 1);
        charIndexRef.current++;
      }

      let typingSpeed = isDeletingRef.current ? 50 : 100;

      if (!isDeletingRef.current && charIndexRef.current === currentText.length) {
        typingSpeed = 2000;
        isDeletingRef.current = true;
      } else if (isDeletingRef.current && charIndexRef.current === 0) {
        isDeletingRef.current = false;
        textIndexRef.current = (textIndexRef.current + 1) % typedTextRef.current.length;
        typingSpeed = 500;
      }

      typingTimeoutRef.current = setTimeout(type, typingSpeed);
    };

    type();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section id="hero" className="hero section dark-background">
      <div className="container" data-aos="zoom-out" data-aos-delay="100">
        <h2>Geri Ang</h2>
        <p>
          AI/GenAI Product <span className="typed">
            <span ref={typedTextRefElement}></span>
            <span className="typed-cursor typed-cursor--blink">|</span>
          </span>
        </p>
        <p className="hero-note">
          Built and maintained through agentic coding — an AI-driven workflow automating this site's development.
        </p>
        <div className="social-links">
          <a href="https://www.linkedin.com/in/gerillima/"><i className="bi bi-linkedin"></i></a>
          <a href="https://github.com/geriang"><i className="bi bi-github"></i></a>
        </div>
      </div>
    </section>
  );
}
