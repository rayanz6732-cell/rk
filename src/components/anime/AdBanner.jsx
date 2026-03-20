import { useEffect, useRef } from 'react';

export default function AdBanner() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    // Set atOptions on window
    window.atOptions = {
      key: '8f5a8516decec887fa94fa59f43c4b70',
      format: 'iframe',
      height: 90,
      width: 728,
      params: {}
    };

    const script = document.createElement('script');
    script.src = 'https://www.highperformanceformat.com/8f5a8516decec887fa94fa59f43c4b70/invoke.js';
    script.async = true;
    ref.current.appendChild(script);

    return () => {
      if (ref.current) ref.current.innerHTML = '';
    };
  }, []);

  return <div ref={ref} style={{ minHeight: 90, maxWidth: 728 }} />;
}