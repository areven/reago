// =============================================================================
// Vitepress configuration
// =============================================================================

import {defineConfig, type HeadConfig} from 'vitepress';
import {version as reagoVersion} from '../../package/reago/package.json'
import {version as reagoReactVersion} from '../../package/reago-react/package.json'


export default defineConfig({
  title: 'Reago',
  titleTemplate: ':title | Reago',
  description: 'Reago is a typescript-first declarative state manager based on atoms.',
  lang: 'en-US',

  appearance: 'force-auto',
  cleanUrls: true,
  metaChunk: true,
  lastUpdated: true,

  head: [
    ['link', {rel: 'icon', href: '/favicon.ico', sizes: '48x48'}],
    ['link', {rel: 'icon', href: '/favicon.svg', sizes: 'any', type: 'image/svg+xml'}],
    ...(process.env.NODE_ENV === 'production' ? [
      ['script', {
        defer: 'true',
        src: 'https://analytics.areven.com/script.js',
        'data-website-id': 'ae07b193-3848-413d-ac98-173c6ad79577'
      }] satisfies HeadConfig
    ] : [])
  ],

  sitemap: {
    hostname: 'https://reago.dev'
  },

  markdown: {
    container: {
      tipLabel: 'TIP',
      warningLabel: 'CAUTION',
      dangerLabel: 'DANGER',
      infoLabel: 'INFO',
      detailsLabel: 'Details'
    }
  },

  themeConfig: {
    siteTitle: false,
    logo: {
      light: '/logo-full.light.svg',
      dark: '/logo-full.dark.svg',
      alt: 'reago',
    },

    nav: [
      {
        text: 'Intro',
        link: '/'
      },
      {
        text: 'User guide',
        link: '/guide/',
        activeMatch: '/guide/',
      },
      {
        text: 'API reference',
        link: '/api/',
        activeMatch: '/api/',
      },
      {
        text: 'Resources',
        link: '/resource/license',
        activeMatch: '/resource/',
      }
    ].map(o => ({...o, text: `<div>${o.text}</div><div>${o.text}</div>`})),

    sidebar: {
      '/guide/': [
        {text: 'User guide', items: [
          {text: 'What is Reago?', link: '/guide/'},
          {text: 'Motivation', link: '/guide/motivation'},
          {text: 'Getting started', link: '/guide/getting-started'}
        ]},
        {text: 'The basics', items: [
          {text: 'Creating an atom', link: '/guide/basics/creating-atoms'},
          {text: 'Adding state to an atom', link: '/guide/basics/adding-state'},
          {text: 'Exploring other hooks', link: '/guide/basics/exploring-hooks'},
          {text: 'Subscribing to an atom', link: '/guide/basics/subscribing-to-atoms'},
          {text: 'Declaring side effects', link: '/guide/basics/declaring-side-effects'},
          {text: 'Using with frameworks', link: '/guide/basics/using-with-frameworks'}
        ]},
        {text: 'Going deeper', items: [
          {text: 'Dealing with Promises', link: '/guide/intermediate/dealing-with-promises'},
          {text: 'Creating a generative atom', link: '/guide/intermediate/creating-generative-atoms'},
          {text: 'Unpacking Promises with deasync', link: '/guide/intermediate/using-deasync'},
          {text: 'Using TypeScript', link: '/guide/intermediate/using-typescript'}
        ]},
        {text: 'Advanced features', items: [
          {text: 'Creating custom stores', link: '/guide/advanced/creating-custom-stores'},
          {text: 'Creating an atom family', link: '/guide/advanced/creating-atom-families'},
          {text: 'Using the AbortSignal', link: '/guide/advanced/using-the-abortsignal'},
          {text: 'Building a third-party integration', link: '/guide/advanced/building-integrations'},
        ]},
        {items: [{text: 'Continue to API reference', link: '/api/'}]}
      ],
      '/api/': [
        {text: 'API reference', items: [
          {text: 'Introduction', link: '/api/'},
          {text: 'Glossary', link: '/api/glossary'},
          {text: 'Versioning', link: '/api/versioning'}
        ]},
        {text: 'reago@' + reagoVersion, items: [
          {text: 'Core', items: [
            {text: 'read', link: '/api/reago/read'},
            {text: 'watch', link: '/api/reago/watch'},
            {text: 'dispatch', link: '/api/reago/dispatch'},
            {text: 'invalidate', link: '/api/reago/invalidate'},
            {text: 'deasync', link: '/api/reago/deasync'},
          ]},
          {text: 'Store', items: [
            {text: 'getDefaultStore', link: '/api/reago/get-default-store'},
            {text: 'createStore', link: '/api/reago/create-store'},
            {text: 'store.read', link: '/api/reago/store-read'},
            {text: 'store.watch', link: '/api/reago/store-watch'},
            {text: 'store.dispatch', link: '/api/reago/store-dispatch'},
            {text: 'store.invalidate', link: '/api/reago/store-invalidate'},
          ]},
          {text: 'Hooks', items: [
            {text: 'atomAbortSignal', link: '/api/reago/atom-abort-signal'},
            {text: 'atomAction', link: '/api/reago/atom-action'},
            {text: 'atomComputationEffect', link: '/api/reago/atom-computation-effect'},
            {text: 'atomMemo', link: '/api/reago/atom-memo'},
            {text: 'atomMountEffect', link: '/api/reago/atom-mount-effect'},
            {text: 'atomReducer', link: '/api/reago/atom-reducer'},
            {text: 'atomRef', link: '/api/reago/atom-ref'},
            {text: 'atomState', link: '/api/reago/atom-state'},
            {text: 'atomStore', link: '/api/reago/atom-store'}
          ]},
          {text: 'TypeScript types', collapsed: true, items: [
            {text: 'Core types', items: [
              {text: 'Store', link: '/api/reago/type/store'},
              {text: 'Atom', link: '/api/reago/type/atom'},
              {text: 'AnyAtom', link: '/api/reago/type/any-atom'},
              {text: 'AtomResultOf', link: '/api/reago/type/atom-result-of'},
              {text: 'AtomFamilyArgsOf', link: '/api/reago/type/atom-family-args-of'},
              {text: 'AtomActionArgsOf', link: '/api/reago/type/atom-action-args-of'}
            ]},
            {text: 'Observation types', items: [
              {text: 'AtomWatcher', link: '/api/reago/type/atom-watcher'},
              {text: 'AtomListener', link: '/api/reago/type/atom-listener'}
            ]},
            {text: 'Utils types', items: [
              {text: 'DeasyncAtom', link: '/api/reago/type/deasync-atom'},
              {text: 'DeasyncState', link: '/api/reago/type/deasync-state'}
            ]},
            {text: 'Hooks types', items: [
              {text: 'AtomAction', link: '/api/reago/type/atom-action'},
              {text: 'AtomComputationEffect', link: '/api/reago/type/atom-computation-effect'},
              {text: 'AtomComputationEffectCleanup', link: '/api/reago/type/atom-computation-effect-cleanup'},
              {text: 'AtomMountEffect', link: '/api/reago/type/atom-mount-effect'},
              {text: 'AtomMountEffectCleanup', link: '/api/reago/type/atom-mount-effect-cleanup'},
              {text: 'AtomReducer', link: '/api/reago/type/atom-reducer'},
              {text: 'AtomReducerReducer', link: '/api/reago/type/atom-reducer-reducer'},
              {text: 'AtomReducerDispatcher', link: '/api/reago/type/atom-reducer-dispatcher'},
              {text: 'AtomRef', link: '/api/reago/type/atom-ref'},
              {text: 'AtomState', link: '/api/reago/type/atom-state'},
              {text: 'AtomStateSetter', link: '/api/reago/type/atom-state-setter'}
            ]}
          ]}
        ]},
        {text: 'reago-react@' + reagoReactVersion, items: [
          {text: 'Store', items: [
            {text: 'StoreProvider', link: '/api/reago-react/store-provider'},
            {text: 'useStore', link: '/api/reago-react/use-store'},
          ]},
          {text: 'Atom hooks', items: [
            {text: 'useAtom', link: '/api/reago-react/use-atom'},
            {text: 'useReadAtom', link: '/api/reago-react/use-read-atom'},
            {text: 'useAsyncAtom', link: '/api/reago-react/use-async-atom'},
            {text: 'useReadAsyncAtom', link: '/api/reago-react/use-read-async-atom'},
            {text: 'useDeasyncAtom', link: '/api/reago-react/use-deasync-atom'},
            {text: 'useReadDeasyncAtom', link: '/api/reago-react/use-read-deasync-atom'},
            {text: 'useDispatchAtom', link: '/api/reago-react/use-dispatch-atom'}
          ]}
        ]}
      ],
      '/resource/': [
         {text: 'Documents', items: [
          {text: 'License (MIT)', link: '/resource/license'},
          {text: 'Security policy', link: '/resource/security-policy'}
        ]},
        {text: 'Changelogs', items: [
          {text: 'reago@' + reagoVersion, link: '/resource/changelog/reago'},
          {text: 'reago-react@' + reagoReactVersion, link: '/resource/changelog/reago-react'}
        ]}
      ]
    },

    outline: 'deep',
    search: {
      provider: 'local',
    },

    socialLinks: [
      {
        icon: 'linkedin',
        link: 'https://www.linkedin.com/company/arevenhq/'
      },
      {
        icon: 'github',
        link: 'https://github.com/areven/reago'
      },
      {
        icon: 'npm',
        link: 'https://www.npmjs.com/package/reago'
      }
    ],

    editLink: {
      pattern: 'https://github.com/areven/reago/edit/main/documentation/:path',
      text: 'Improve this page on GitHub',
    },

    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: "medium",
        timeStyle: undefined,
        forceLocale: true
      }
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: (
        'Copyright © <span id="current-year"></span> Areven' +
        '<script>' +
        'document.getElementById("current-year").textContent = new Date().getFullYear();' +
        '</script>'
      )
    }
  }
})
