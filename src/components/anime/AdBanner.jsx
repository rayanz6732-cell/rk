import { useEffect, useRef } from 'react';

export default function AdBanner() {
  const containerRef = useRef(null);
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current || !containerRef.current) return;
    injected.current = true;

    const container = containerRef.current;

    window.atOptions = {
      key: '8f5a8516decec887fa94fa59f43c4b70',
      format: 'iframe',
      height: 90,
      width: 728,
      params: {}
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//www.highperformanceformat.com/8f5a8516decec887fa94fa59f43c4b70/invoke.js';
    container.appendChild(script);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex justify-center items-center my-4 w-full overflow-hidden"
      style={{ minHeight: 90 }}
    />
  );
}