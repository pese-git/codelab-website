import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Основная документация
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Начало работы',
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/system-requirements',
      ],
    },
    {
      type: 'category',
      label: 'Архитектура',
      items: [
        'architecture/overview',
        'architecture/ide-architecture',
        'architecture/ai-service-architecture',
        'architecture/integration',
      ],
    },
    {
      type: 'category',
      label: 'API',
      items: [
        'api/websocket-protocol',
        'api/agent-protocol',
        'api/multi-agent-system',
        'api/tools-specification',
        'api/gateway',
        'api/agent-runtime',
        'api/llm-proxy',
        'api/auth-service',
      ],
    },
    {
      type: 'category',
      label: 'Руководства',
      items: [
        'guides/auth-integration',
        'guides/multi-agent-integration',
      ],
    },
    {
      type: 'category',
      label: 'Разработка',
      items: [
        'development/ide',
        'development/ai-service',
        'development/contributing',
        'development/testing',
      ],
    },
  ],
};

export default sidebars;
