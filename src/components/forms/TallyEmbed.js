import React, { useEffect, useRef } from 'react';

const TALLY_SCRIPT_URL = 'https://tally.so/widgets/embed.js';

export const NEWSLETTER_FORM_URL = 'https://tally.so/embed/0QLRK0?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1';
export const COLLABORATE_FORM_URL = 'https://tally.so/embed/RGRypP?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1';

let pendingScriptPromise = null;

function loadTallyScript() {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.Tally?.loadEmbeds) {
    return Promise.resolve();
  }

  if (pendingScriptPromise) {
    return pendingScriptPromise;
  }

  pendingScriptPromise = new Promise((resolve) => {
    const existingScript = document.querySelector(`script[src="${TALLY_SCRIPT_URL}"]`);
    const finish = () => resolve();

    if (existingScript) {
      existingScript.addEventListener('load', finish, { once: true });
      existingScript.addEventListener('error', finish, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = TALLY_SCRIPT_URL;
    script.onload = finish;
    script.onerror = finish;
    document.body.appendChild(script);
  });

  return pendingScriptPromise;
}

function TallyEmbed({ className, formUrl, height = 296, title }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    let isActive = true;

    loadTallyScript().finally(() => {
      if (!isActive || !iframeRef.current) {
        return;
      }

      if (window.Tally?.loadEmbeds) {
        window.Tally.loadEmbeds();
        return;
      }

      iframeRef.current.src = iframeRef.current.dataset.tallySrc;
    });

    return () => {
      isActive = false;
    };
  }, [formUrl]);

  return (
    <iframe
      ref={iframeRef}
      className={className}
      data-tally-src={formUrl}
      frameBorder="0"
      height={height}
      loading="lazy"
      marginHeight="0"
      marginWidth="0"
      title={title}
      width="100%"
    />
  );
}

export default TallyEmbed;
