import { useEffect, useState } from 'react';

export function SystemText({ text, delay = 0, speed = 40 }) {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay, speed]);
  
  return (
    <span className="system-text">
      {displayed}
      <span className="cursor">|</span>
    </span>
  );
}
