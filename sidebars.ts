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
      label: '🚀 Начало работы',
      items: [
        'getting-started/overview',
        'getting-started/system-requirements',
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/first-project',
      ],
    },
    {
      type: 'category',
      label: '🏗️ Архитектура',
      items: [
        'architecture/overview',
        'architecture/ide-architecture',
        'architecture/ai-service-architecture',
        'architecture/integration',
        'architecture/event-driven',
        'architecture/security',
      ],
    },
    {
      type: 'category',
      label: '🤖 AI Ассистент',
      items: [
        'ai-assistant/overview',
        'ai-assistant/multi-agent-system',
        'ai-assistant/agents',
        'ai-assistant/tools',
        'ai-assistant/context-management',
        'ai-assistant/hitl',
      ],
    },
    {
      type: 'category',
      label: '🔌 API',
      items: [
        'api/overview',
        'api/gateway',
        'api/agent-runtime',
        'api/llm-proxy',
        'api/auth-service',
        'api/websocket-protocol',
        'api/agent-protocol',
        'api/approval-manager',
      ],
    },
    {
      type: 'category',
      label: '🚢 Развертывание',
      items: [
        'deployment/overview',
        'deployment/docker-compose',
        'deployment/kubernetes',
        'deployment/configuration',
        'deployment/monitoring',
        'deployment/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: '📖 Руководства',
      items: [
        'guides/auth-integration',
        'guides/multi-agent-integration',
        'guides/custom-tools',
        'guides/llm-providers',
        'guides/troubleshooting-approval-system',
      ],
    },
    {
      type: 'category',
      label: '💻 Разработка',
      items: [
        'development/overview',
        'development/ide',
        'development/ai-service',
        'development/code-style',
        'development/testing',
        'development/testing-approval-system',
        'development/benchmarking',
        'development/contributing',
      ],
    },
    {
      type: 'category',
      label: '📚 Справочник',
      items: [
        'reference/database-schema',
        'reference/environment-variables',
        'reference/cli-commands',
        'reference/error-codes',
      ],
    },
    {
      type: 'category',
      label: '🗺️ Backlog',
      items: [
        'backlog/roadmap',
      ],
    },
  ],
};

export default sidebars;
