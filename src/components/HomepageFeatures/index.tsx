import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Кроссплатформенная IDE',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Работайте на Windows, Linux или macOS. CodeLab построен на Flutter,
        обеспечивая нативную производительность на всех платформах.
      </>
    ),
  },
  {
    title: 'AI-Powered разработка',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Встроенный AI ассистент помогает писать код, рефакторить и отлаживать.
        Поддержка OpenAI, Anthropic Claude и локальных моделей через Ollama.
      </>
    ),
  },
  {
    title: 'Микросервисная архитектура',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Модульная архитектура с разделением на Gateway, Agent Runtime и LLM Proxy.
        Легко масштабируется и расширяется под ваши нужды.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
