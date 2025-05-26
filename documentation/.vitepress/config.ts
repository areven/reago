// =============================================================================
// Vitepress configuration
// =============================================================================

import {defineConfig} from 'vitepress';


export default defineConfig({
  title: 'Reago',
  titleTemplate: ':title | Reago',
  description: 'Reago is a typescript-first declarative state manager based on atoms.',
  lang: 'en-US',

  cleanUrls: true,
  metaChunk: true,

  head: [
    ['link', {rel: 'icon', href: '/favicon.ico'}]
  ],

  themeConfig: {
    siteTitle: 'Reago',

    nav: [
      {
        text: 'Quick guide',
        link: '/',
        activeMatch: '^(?!\/api\/).*',
      },
      {
        text: 'API reference',
        link: '/api/',
        activeMatch: '/api/',
      },
    ],

    sidebar: {
      '/': [
        {text: 'Introduction', link: '/'}
      ],
      '/api/': [
        {
          text: 'API reference',
          items: [
            {text: 'Functional atom', link: '/api/1'},
            {text: 'Generative atom', link: '/api/2'}
          ]
        }
      ]
    },

    search: {
      provider: 'local',
    },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/areven/reago'
      }
    ],

    editLink: {
      pattern: 'https://github.com/areven/reago/edit/main/documentation/:path',
      text: 'Propose changes to this page',
    }
  }
})
