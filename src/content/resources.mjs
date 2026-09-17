export const resourceSlots = Object.freeze({
  social: { name: 'Delningsbild', src: '/social/omar-yusuf.png', alt: 'Omar Yusuf. Teknik med hjärna och lite bus i systemet.', mime: 'image/png', width: 1200, height: 630 },
  icon: { name: 'Webbplatsikon', src: '/apple-touch-icon.png', editableSrc: '/favicon.svg', alt: 'Omar Yusufs gula figur', mime: 'image/png', width: 180, height: 180 },
  emailStatic: { name: 'Brevillustration', src: '/mail/omar-smile.png', editableSrc: '/mail/omar-smile.svg', alt: 'En gul figur som ler tillbaka', mime: 'image/png', width: 192, height: 192 },
  emailAnimated: { name: 'Animerad brevillustration', src: '/mail/omar-smile.gif', alt: 'En gul figur som ler tillbaka', mime: 'image/gif', width: 192, height: 192 },
});
export const defaultResources = Object.freeze(Object.fromEntries(Object.entries(resourceSlots).map(([key, value]) => [key, value.src])));
