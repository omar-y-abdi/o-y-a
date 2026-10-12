export const SKIFT_PATH = '/play/skift/';
export const shiftLink = (current = false, mobile = false) => `<a class="shift-link" href="${SKIFT_PATH}" ${mobile ? 'data-skift-mobile-link' : 'data-skift-link'}${current ? ' aria-current="page"' : ''}>Starta ditt arbetsskift</a>`;
