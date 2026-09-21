import { useI18n, translate, type StudioLocale } from '../../../i18n';
import { useEffect, useState } from 'react';

function examples(locale: StudioLocale = 'en') {
  return [
    translate(
      'Une boutique pour mes créations, avec une collection à découvrir et un panier…',
      'A shop for my creations, with a collection to explore and a shopping cart…',
      undefined,
      locale,
    ),
    translate(
      'Une application pour réserver des ateliers et suivre les inscriptions…',
      'An app to book workshops and track registrations…',
      undefined,
      locale,
    ),
    translate(
      'Un tableau de bord qui rend les chiffres de mon activité faciles à comprendre…',
      'A dashboard that makes my business figures easy to understand…',
      undefined,
      locale,
    ),
    translate(
      'Un portfolio qui raconte mon travail et donne envie de me contacter…',
      'A portfolio that tells the story of my work and encourages people to get in touch…',
      undefined,
      locale,
    ),
    translate(
      'Un espace partagé pour transformer les idées de mon équipe en projets…',
      'A shared workspace to turn my team’s ideas into projects…',
      undefined,
      locale,
    ),
  ] as const;
}
function invitation(locale: StudioLocale = 'en') {
  return translate(
    'Décrivez votre idée. À qui s’adresse-t-elle, et que doit-elle permettre de faire ?',
    'Describe your idea. Who is it for, and what should it help them do?',
    undefined,
    locale,
  );
}

export function useComposerPlaceholder(active: boolean) {
  const { locale, t } = useI18n();
  const [position, setPosition] = useState({ index: 0, cursor: 6 });
  useEffect(() => {
    if (!active) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const messages = examples(locale);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let index = 0;
    let cursor = 6;
    let deleting = false;
    function schedule(delay: number) {
      timer = setTimeout(tick, delay);
    }
    function tick() {
      if (document.hidden) return;
      if (reduced?.matches) {
        setPosition({ index: 0, cursor: messages[0].length });
        return;
      }
      const example = messages[index] ?? messages[0];
      cursor += deleting ? -1 : 1;
      setPosition({ index, cursor });
      if (cursor === example.length) {
        deleting = true;
        schedule(2300);
      } else if (cursor === 0) {
        deleting = false;
        index = (index + 1) % messages.length;
        schedule(350);
      } else schedule(deleting ? 18 : 48);
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
  }, [active, locale]);
  const text = (examples(locale)[position.index] ?? '').slice(0, position.cursor);
  return active ? t('Imaginez… {text}', 'Imagine… {text}', { text }) : invitation(locale);
}
