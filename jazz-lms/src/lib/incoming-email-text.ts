import 'server-only';
import { compile } from 'html-to-text';

export const MAX_INCOMING_EMAIL_BODY_LENGTH = 100_000;
const conversionLimitMarker = '\u0000incoming-email-conversion-limit\u0000';

export class IncomingEmailConversionLimitError extends Error {
  constructor() {
    super('Incoming email exceeds conversion limits');
    this.name = 'IncomingEmailConversionLimitError';
  }
}

// This produces plain text, not HTML safe for interpolation. The inbox keeps
// React's normal text encoding, and email notifications use Resend's text field.
// Conversion never evaluates markup, loads URLs, or expands href/src values.
const convert = compile({
  wordwrap: false,
  decodeEntities: true,
  limits: {
    maxInputLength: MAX_INCOMING_EMAIL_BODY_LENGTH,
    maxDepth: 256,
    maxChildNodes: 20_000,
    ellipsis: conversionLimitMarker,
  },
  selectors: [
    ...['head', 'title', 'script', 'style', 'template', 'noscript', 'iframe', 'object', 'svg', '[hidden]']
      .map(selector => ({ selector, format: 'skip' })),
    { selector: 'img', format: 'skip' },
    { selector: 'a', options: { ignoreHref: true } },
    ...['p', 'div', 'pre']
      .map(selector => ({ selector, options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } })),
    { selector: 'tr', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    ...['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      .map(selector => ({ selector, options: { uppercase: false } })),
  ],
});

export function incomingEmailHtmlToText(html: string): string {
  // Reject before parsing; the library's input cap otherwise truncates and logs.
  if (html.length > MAX_INCOMING_EMAIL_BODY_LENGTH) throw new IncomingEmailConversionLimitError();
  const text = convert(html).trim();
  // Structural bounds must not silently discard part of a professor's reply.
  if (text.includes(conversionLimitMarker) || text.length > MAX_INCOMING_EMAIL_BODY_LENGTH) {
    throw new IncomingEmailConversionLimitError();
  }
  return text;
}
