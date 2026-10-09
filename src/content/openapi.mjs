// Only endpoints that exist in src/worker.mjs and src/cms/render.mjs.
// The owner-only /admin/ API is intentionally not public documentation.
const jsonResponse = (description, schema) => ({
  description,
  content: { 'application/json': { schema } },
});
const error = { $ref: '#/components/schemas/Error' };
const contactError = { $ref: '#/components/schemas/ContactError' };
const errorResponses = (codes, schema = error) => Object.fromEntries(codes.map(code => [
  String(code), jsonResponse('Request rejected; read the code and hint.', schema),
]));
const origin = { name: 'Origin', in: 'header', required: true, description: 'Must exactly match this site origin.', schema: { type: 'string', format: 'uri' } };
const eventConsent = { name: 'X-OY-Consent', in: 'header', required: true, description: 'Literal v1 after affirmative consent in the first-party webpage.', schema: { type: 'string', const: 'v1' } };

export const openApi = {
  openapi: '3.1.1',
  info: {
    title: 'Omar Yusuf portfolio public HTTP endpoints',
    version: '1.0.0',
    description: 'A personal portfolio, not an open automation platform. HTTP API major version 1 is supported via the optional API-Version: 1 request header; omission selects v1 for backward compatibility. See /developers/ for the deprecation and sunset policy. Public reads require no API key. Contact and analytics writes are first-party, anti-abuse protected functionality, not unrestricted agent actions. The owner-only CMS is deliberately excluded.',
  },
  servers: [{ url: 'https://omaryusuf.se', description: 'Public portfolio' }],
  tags: [
    { name: 'Site', description: 'Read-only site configuration.' },
    { name: 'Workshop', description: 'Public prewritten workshop card data.' },
    { name: 'First-party only', description: 'Endpoints used by the portfolio UI, not a general automation API.' },
  ],
  paths: {
    '/api/config': {
      get: {
        tags: ['Site'], operationId: 'getSiteConfig', summary: 'Check optional analytics availability',
        description: 'Returns whether voluntary analytics collection is enabled. Does not start tracking or imply consent.',
        responses: {
          200: jsonResponse('Site configuration', { type: 'object', additionalProperties: false, required: ['analytics'], properties: { analytics: { type: 'boolean' } } }),
          ...errorResponses([405]),
        },
      },
    },
    '/api/contact/config': {
      get: {
        tags: ['Site'], operationId: 'getContactConfig', summary: 'Check whether the contact form is available',
        description: 'Read-only form configuration. The sitekey is a public Turnstile widget key only when the contact form is configured; it is not an API authentication credential.',
        responses: {
          200: jsonResponse('Contact form availability', { type: 'object', required: ['enabled','sitekey'], properties: {
            enabled: { type: 'boolean' }, sitekey: { type: ['string','null'] },
          } }),
          ...errorResponses([405]),
        },
      },
    },
    '/api/contact': {
      post: {
        tags: ['First-party only'], operationId: 'submitContactForm', summary: 'Send a human contact form message',
        description: 'First-party form submission only. Requires same-origin request, a valid Cloudflare Turnstile token bound to this hostname/action, honeypot, UUID submission id, and configured mail delivery. Rate-limited to five attempts per 60 seconds per hashed IP address and per hashed sender email; no public API keys or automated sender integration are offered. The handler returns JSON and never stores a public contact message.',
        parameters: [origin],
        requestBody: {
          required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: false,
            required: ['name','email','website','token','submission'],
            properties: {
              name: { type: 'string', minLength: 1, maxLength: 100 },
              email: { type: 'string', format: 'email', maxLength: 254 },
              message: { type: 'string', maxLength: 4000, description: 'Optional plain-text message.' },
              website: { type: 'string', const: '', description: 'Must be empty (spam honeypot).' },
              token: { type: 'string', minLength: 1, maxLength: 2048, description: 'Fresh Cloudflare Turnstile token from the site widget.' },
              submission: { type: 'string', format: 'uuid', description: 'Client-generated version 4 UUID used for idempotency.' },
              contentVersion: { type: 'integer', minimum: 0, description: 'Optional nonnegative CMS content version.' },
            },
          } } },
        },
        responses: {
          200: jsonResponse('Message sent', { type: 'object', required: ['ok'], properties: { ok: { type: 'boolean', const: true } } }),
          ...errorResponses([400,403,405,409,413,415,503], contactError),
          429: {
            ...jsonResponse('Form submission rate-limited. Respect Retry-After before retrying.', contactError),
            headers: {
              'Retry-After': { description: 'Minimum seconds to wait after a denied submission.', schema: { type: 'integer', minimum: 0 } },
              'RateLimit': { description: 'Contact quota is exhausted for this request: r=0 and t=60 seconds.', schema: { type: 'string' } },
              'RateLimit-Policy': { description: 'Five submissions per 60 seconds per hashed IP or sender email.', schema: { type: 'string' } },
            },
          },
        },
      },
    },
    '/api/event': {
      post: {
        tags: ['First-party only'], operationId: 'recordConsentedSiteEvent', summary: 'Record one consented website event',
        description: 'Optional first-party telemetry, disabled unless explicitly configured. Rejects cross-origin use, missing/denied consent, GPC/DNT and unknown data. Not a public analytics ingestion API. Maximum body is 256 bytes.',
        parameters: [origin, eventConsent, { name:'oy_privacy', in:'cookie', required:true, description:'Consent cookie, value v1.allow; GPC and DNT still override it.', schema:{type:'string',const:'v1.allow'} }],
        requestBody: { required:true, content:{'application/json':{schema:{
          type:'object', additionalProperties:false, required:['event','page'],
          properties:{
            event:{type:'string',enum:['page_view','joy','bubble_complete','project_open']},
            page:{type:'string',description:'Exact indexable site path from the sitemap.'},
          },
        }}}},
        responses: {
          204: { description: 'Event accepted; no response body.' },
          ...errorResponses([400,403,405,413,415,503]),
        },
      },
    },
    '/data/cards.json': {
      get: {
        tags:['Workshop'],operationId:'listWorkshopCards',summary:'Read prewritten workshop cards',
        description:'Returns the publicly published set of humor, encouragement, pause and playful roast cards. Cards are editorial content, not individualized advice. They can change when the owner publishes CMS updates.',
        responses:{
          200: jsonResponse('Public card list',{type:'array',items:{$ref:'#/components/schemas/Card'}}),
          ...errorResponses([405]),
        },
      },
    },
    '/data/runtime.json': {
      get: {
        tags:['Workshop'],operationId:'getWorkshopRuntime',summary:'Read published workshop runtime settings',
        description:'The publicly published workshop runtime settings. The content may be updated through the owner-only CMS; no configuration writes are exposed.',
        responses:{
          200: jsonResponse('Runtime data',{type:'object',additionalProperties:true}),
          ...errorResponses([405]),
        },
      },
    },
    '/data/cards/{id}.json': {
      get: {
        tags:['Workshop'],operationId:'getPublishedWorkshopCard',summary:'Read a CMS-published individual card',
        description:'Available when a matching card has been published through the owner-only CMS. Not all installations or card IDs have a dedicated URL.',
        parameters:[{name:'id',in:'path',required:true,schema:{type:'string',pattern:'^[a-z0-9-]{1,80}$'},description:'Published card identifier.'}],
        responses:{
          200: jsonResponse('Single public card',{$ref:'#/components/schemas/Card'}),
          ...errorResponses([404,405]),
        },
      },
    },
  },
  components: {
    schemas: {
      Card: {type:'object', required:['id','flavor','text'], properties: {
        id:{type:'string'}, flavor:{type:'string',enum:['kind','joke','pause','roast']},text:{type:'string'},
      }},
      Error: {type:'object',required:['error','code','hint'],properties:{
        error:{type:'string'},code:{type:'string'},hint:{type:'string'},
      }},
      ContactError: {type:'object',required:['ok','message','code','hint'],properties:{
        ok:{type:'boolean',const:false},message:{type:'string'},code:{type:'string'},hint:{type:'string'},
      }},
    },
  },
};

// Every documented operation accepts an optional typed major-version header.
// No fictitious /v1 path or API-key scheme is advertised; the Worker enforces
// this header and echoes the effective version for real public operations.
const apiVersionHeader = {
  name: 'API-Version', in: 'header', required: false,
  description: 'HTTP API major version. Omit for backwards-compatible version 1, or explicitly send API-Version: 1. Other versions return a structured HTTP 400 error. See /developers/ for deprecation and Sunset policy.',
  schema: { type: 'string', enum: ['1'], default: '1' },
};
const currentApiVersion = {
  description: 'The effective supported public HTTP API major version.',
  schema: { type: 'string', const: '1' },
};
for (const pathMethods of Object.values(openApi.paths)) {
  for (const [method, operation] of Object.entries(pathMethods)) {
    if (!['get','post','put','patch','delete'].includes(method)) continue;
    operation.parameters = [apiVersionHeader, ...(operation.parameters ?? [])];
    for (const response of Object.values(operation.responses))
      response.headers = { ...(response.headers ?? {}), 'API-Version': currentApiVersion };
  }
}
