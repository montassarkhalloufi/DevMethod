import { useEffect, useRef, useState } from 'react';

export function usePreviewViewport() {
  const container = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ visible: false, width: 0 });
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const resize = () => {
      const width = node.getBoundingClientRect().width;
      setViewport((current) => (current.width === width ? current : { ...current, width }));
    };
    const visibility = () => {
      const rect = node.getBoundingClientRect();
      const visible =
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth;
      setViewport((current) => (current.visible === visible ? current : { ...current, visible }));
    };
    const intersection =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver((entries) => {
            const visible = entries.some((entry) => entry.isIntersecting);
            setViewport((current) =>
              current.visible === visible ? current : { ...current, visible },
            );
          });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    resize();
    intersection?.observe(node);
    observer?.observe(node);
    if (!intersection) {
      visibility();
      window.addEventListener('scroll', visibility, { passive: true });
      window.addEventListener('resize', visibility);
    }
    if (!observer) window.addEventListener('resize', resize);
    return () => {
      intersection?.disconnect();
      observer?.disconnect();
      window.removeEventListener('scroll', visibility);
      window.removeEventListener('resize', visibility);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return { container, ...viewport };
}
