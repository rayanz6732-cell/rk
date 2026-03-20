import { useEffect, useRef } from 'react';

export default function AdBanner() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    // Inject atOptions config
    const configScript = document.createElement('script');
    configScript.text = `
      atOptions = {
        'key': '8f5a8516decec887fa94fa59f43c4b70',
        'format': 'iframe',
        'height': 90,
        'width': 728,
        'params': {}
      };
    `;
    // Inject invoke script
    const invokeScript = document.createElement('script');
    invokeScript.src = 'https://www.highperformanceformat.com/8f5a8516decec887fa94fa59f43c4b70/invoke.js';
    invokeScript.async = true;

    ref.current.appendChild(configScript);
    ref.current.appendChild(invokeScript);
  }, []);

  return (
    <div ref={ref} className="flex justify-center items-center my-4 overflow-hidden" style={{ minHeight: 90 }} />
  );
}