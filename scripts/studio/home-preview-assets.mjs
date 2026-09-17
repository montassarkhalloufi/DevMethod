// Only declared HTML/CSS asset URLs are rebased. JavaScript source and external URLs stay intact.
function assetURL(value, prefix, files) {
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return value;
  try {
    const url = new URL(value, 'https://preview.invalid');
    const relative = decodeURIComponent(url.pathname.slice(1)) || 'index.html';
    if (!files.has(relative)) return value;
    return prefix + relative.split('/').map(encodeURIComponent).join('/') + url.search + url.hash;
  } catch {
    return value;
  }
}

function cssAssets(source, rewrite) {
  // Consume comments and ordinary strings too, so text such as content:"url(/logo.svg)" is untouched.
  return source.replace(
    /\/\*[\s\S]*?\*\/|\burl\(\s*(?:"([^"\\]*)"|'([^'\\]*)'|([^\s)'"\\]+))\s*\)|@import\s+(?:"([^"\\]*)"|'([^'\\]*)')|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/gi,
    (token, doubleURL, singleURL, bareURL, doubleImport, singleImport) => {
      const value = doubleURL ?? singleURL ?? bareURL ?? doubleImport ?? singleImport;
      if (value === undefined) return token;
      return token.replace(value, rewrite(value));
    },
  );
}

function sourceSet(source, rewrite) {
  if (source.includes('data:')) return source;
  return source.replace(
    /(^|,\s*)(\/[^,\s]+)(?=\s|,|$)/g,
    (_, separator, url) => separator + rewrite(url),
  );
}

function tagAssets(tag, rewrite) {
  return tag.replace(
    /(\s)(src|href|poster|srcset|style)(\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi,
    (_, space, attribute, equals, double, single, bare) => {
      const value = double ?? single ?? bare;
      const quote = double !== undefined ? '"' : single !== undefined ? "'" : '';
      const name = attribute.toLowerCase();
      let updated;
      if (name === 'style') updated = cssAssets(value, rewrite);
      else if (name === 'srcset') updated = sourceSet(value, rewrite);
      else updated = rewrite(value);
      return space + attribute + equals + quote + updated + quote;
    },
  );
}

function htmlAssets(source, rewrite) {
  return source.replace(
    /<!--[\s\S]*?-->|<(script|style)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>[\s\S]*?<\/\1\s*>|<(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi,
    (token, rawTag) => {
      if (token.startsWith('<!--')) return token;
      if (!rawTag) return tagAssets(token, rewrite);
      const opening = /^<(?:[^"'<>]|"[^"]*"|'[^']*')*>/.exec(token)[0];
      const rest = token.slice(opening.length);
      return (
        tagAssets(opening, rewrite) +
        (rawTag.toLowerCase() === 'style' ? cssAssets(rest, rewrite) : rest)
      );
    },
  );
}

export function withHomeAssetURLs(content, { extension, prefix, manifest }) {
  if (!['.html', '.css'].includes(extension)) return content;
  const files = new Set(manifest.map((file) => file.path));
  const rewrite = (value) => assetURL(value, prefix, files);
  const source = content.toString('utf8');
  return Buffer.from(
    extension === '.html' ? htmlAssets(source, rewrite) : cssAssets(source, rewrite),
  );
}
