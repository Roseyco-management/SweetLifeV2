'use client';

import { useEffect } from 'react';
import { useConsent } from './ConsentProvider';

export function GoogleTagLoader({ tagId }: { tagId: string }) {
  const { state } = useConsent();

  useEffect(() => {
    if (state !== 'granted') return;
    if (document.getElementById('google-tag-script')) return;

    const script = document.createElement('script');
    script.id = 'google-tag-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`;
    script.onload = () => {
      window.gtag?.('config', tagId);
    };
    document.head.appendChild(script);
  }, [state, tagId]);

  return null;
}
