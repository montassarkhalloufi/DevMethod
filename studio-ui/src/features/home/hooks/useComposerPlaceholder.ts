import { useEffect, useState } from 'react';

const examples = [
  'Une boutique pour mes créations, avec une collection à découvrir et un panier…',
  'Une application pour réserver des ateliers et suivre les inscriptions…',
  'Un tableau de bord qui rend les chiffres de mon activité faciles à comprendre…',
  'Un portfolio qui raconte mon travail et donne envie de me contacter…',
  'Un espace partagé pour transformer les idées de mon équipe en projets…',
] as const;
const invitation =
  'Décrivez votre idée. À qui s’adresse-t-elle, et que doit-elle permettre de faire ?';

export function useComposerPlaceholder(active: boolean) {
  const [text, setText] = useState('Une boutique');
  useEffect(() => {
    if (!active) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let timer: ReturnType<typeof setTimeout> | undefined;
    let index = 0;
    let cursor = 'Une boutique'.length;
    let deleting = false;
    function schedule(delay: number) {
      timer = setTimeout(tick, delay);
    }
    function tick() {
      if (document.hidden) return;
      if (reduced?.matches) {
        setText(examples[0]);
        return;
      }
      const example = examples[index] ?? examples[0];
      cursor += deleting ? -1 : 1;
      setText(example.slice(0, cursor));
      if (cursor === example.length) {
        deleting = true;
        schedule(2300);
      } else if (cursor === 0) {
        deleting = false;
        index = (index + 1) % examples.length;
        schedule(350);
      } else {
        schedule(deleting ? 18 : 48);
      }
    }
    function resume() {
      clearTimeout(timer);
      if (!document.hidden) schedule(150);
    }
    reduced?.addEventListener('change', resume);
    document.addEventListener('visibilitychange', resume);
    resume();
    return () => {
      clearTimeout(timer);
      reduced?.removeEventListener('change', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [active]);
  return active ? `Imaginez… ${text}` : invitation;
}
