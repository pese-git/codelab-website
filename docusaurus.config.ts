import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'CodeLab',
  tagline: 'AI-Powered Cross-Platform Development Environment',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://codelab.openidealab.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'openidealab', // Usually your GitHub org/user name.
  projectName: 'codelab-workspace', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'ru',
    locales: ['ru'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/openidealab/codelab-workspace/tree/main/website/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl:
            'https://github.com/openidealab/codelab-workspace/tree/main/website/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'CodeLab',
      logo: {
        alt: 'CodeLab Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Документация',
        },
        {
          href: 'https://github.com/openidealab/codelab-workspace',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Документация',
          items: [
            {
              label: 'Введение',
              to: '/docs/intro',
            },
            {
              label: 'Установка',
              to: '/docs/getting-started/installation',
            },
            {
              label: 'Архитектура',
              to: '/docs/architecture/overview',
            },
          ],
        },
        {
          title: 'Разработка',
          items: [
            {
              label: 'IDE (Flutter)',
              to: '/docs/development/ide',
            },
            {
              label: 'AI Service',
              to: '/docs/development/ai-service',
            },
            {
              label: 'Протоколы',
              to: '/docs/api/websocket-protocol',
            },
          ],
        },
        {
          title: 'Ссылки',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/openidealab/codelab-workspace',
            },
            {
              label: 'OpenIdeaLab',
              href: 'https://github.com/openidealab',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} OpenIdeaLab. Создано с помощью Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
