import brevo from '../assets/brands/brevo.svg';
import nodedotjs from '../assets/brands/nodedotjs.svg';
import eslint from '../assets/brands/eslint.svg';
import sentry from '../assets/brands/sentry.svg';
import opentelemetry from '../assets/brands/opentelemetry.svg';
import resend from '../assets/brands/resend.svg';
import postgresql from '../assets/brands/postgresql.svg';
import supabase from '../assets/brands/supabase.svg';
import appwrite from '../assets/brands/appwrite.svg';
import auth0 from '../assets/brands/auth0.svg';
import stripe from '../assets/brands/stripe.svg';
import paddle from '../assets/brands/paddle.svg';
import shopify from '../assets/brands/shopify.svg';
import woocommerce from '../assets/brands/woocommerce.svg';
import cloudflare from '../assets/brands/cloudflare.svg';
import anthropic from '../assets/brands/anthropic.svg';
import googlegemini from '../assets/brands/googlegemini.svg';
import ollama from '../assets/brands/ollama.svg';
import github from '../assets/brands/github.svg';
import gitlab from '../assets/brands/gitlab.svg';
import strapi from '../assets/brands/strapi.svg';
import directus from '../assets/brands/directus.svg';
import contentful from '../assets/brands/contentful.svg';
import sanity from '../assets/brands/sanity.svg';
import discord from '../assets/brands/discord.svg';
import telegram from '../assets/brands/telegram.svg';
import gmail from '../assets/brands/gmail.svg';
import notion from '../assets/brands/notion.svg';
import airtable from '../assets/brands/airtable.svg';
import googlecalendar from '../assets/brands/googlecalendar.svg';
import posthog from '../assets/brands/posthog.svg';
import matomo from '../assets/brands/matomo.svg';
import googleanalytics from '../assets/brands/googleanalytics.svg';
import meilisearch from '../assets/brands/meilisearch.svg';
import algolia from '../assets/brands/algolia.svg';
import cloudflareworkers from '../assets/brands/cloudflareworkers.svg';
import vercel from '../assets/brands/vercel.svg';
import netlify from '../assets/brands/netlify.svg';

const sources: Readonly<Record<string, string>> = Object.freeze({
  brevo,
  'node-test': nodedotjs,
  'node-check': nodedotjs,
  eslint: eslint,
  sentry: sentry,
  opentelemetry: opentelemetry,
  resend: resend,
  postgresql: postgresql,
  supabase: supabase,
  appwrite: appwrite,
  auth0: auth0,
  stripe: stripe,
  paddle: paddle,
  shopify: shopify,
  woocommerce: woocommerce,
  'cloudflare-r2': cloudflare,
  anthropic: anthropic,
  gemini: googlegemini,
  ollama: ollama,
  github: github,
  gitlab: gitlab,
  strapi: strapi,
  directus: directus,
  contentful: contentful,
  sanity: sanity,
  discord: discord,
  telegram: telegram,
  gmail: gmail,
  notion: notion,
  airtable: airtable,
  'google-calendar': googlecalendar,
  posthog: posthog,
  matomo: matomo,
  'google-analytics': googleanalytics,
  meilisearch: meilisearch,
  algolia: algolia,
  'cloudflare-workers': cloudflareworkers,
  vercel: vercel,
  netlify: netlify,
});

export function connectorIconSource(optionId: string): string | undefined {
  return Object.hasOwn(sources, optionId) ? sources[optionId] : undefined;
}
