'use client';

import { useEffect, useRef, useState } from 'react';

interface LazyMapFrameProps {
  src: string;
  title: string;
  className?: string;
  allowFullScreen?: boolean;
}

/**
 * A map iframe that only starts loading when it is about to scroll into view.
 * Google's map code is about 300 kB of JavaScript: loading it with the page slows the first paint on phones,
 * and most visitors never scroll that far. The wrapper keeps its size, so nothing jumps when the map appears.
 */
export function LazyMapFrame({ src, title, className, allowFullScreen }: LazyMapFrameProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      const t = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px 250px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <iframe
      ref={ref}
      src={visible ? src : undefined}
      title={title}
      allowFullScreen={allowFullScreen}
      referrerPolicy="no-referrer-when-downgrade"
      className={className}
    />
  );
}
