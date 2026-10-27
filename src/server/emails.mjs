import { DEFAULT_EMAIL, renderEmail, senderAddress } from './email-render.mjs';
export const FROM = senderAddress(DEFAULT_EMAIL);
const mail = ({ subject, html, text }) => ({ subject, html, text });
export const acknowledgment = ({ resources, origin } = {}) => mail(renderEmail(DEFAULT_EMAIL, 'receipt', { resources, origin }));
export const notification = visitor => mail(renderEmail(DEFAULT_EMAIL, 'notification', { visitor }));
