import { Document } from '@thrivereflections/realtime-tool-gateway';

export const sampleDocuments: Document[] = [
  {
    id: 'doc-1',
    text: 'Our company was founded in 2020 with the mission to democratize AI technology and make it accessible to everyone. We believe that artificial intelligence should be a tool that empowers people, not replaces them. Our team consists of world-class engineers, researchers, and designers who are passionate about creating innovative solutions.',
    source: 'Company History',
    metadata: {
      category: 'company',
      type: 'history',
      lastUpdated: '2024-01-15'
    }
  },
  {
    id: 'doc-2',
    text: 'Our flagship product is an AI-powered voice assistant that can understand natural language and respond in real-time. It supports multiple languages, has a 99.9% uptime guarantee, and can process up to 10,000 requests per minute. The assistant can help with customer support, scheduling, information retrieval, and task automation.',
    source: 'Product Overview',
    metadata: {
      category: 'product',
      type: 'overview',
      lastUpdated: '2024-01-20'
    }
  },
  {
    id: 'doc-3',
    text: 'We offer three pricing tiers: Basic ($29/month) for individuals, Professional ($99/month) for small teams, and Enterprise ($299/month) for large organizations. All plans include 24/7 support, API access, and regular updates. Enterprise customers get dedicated account managers and custom integrations.',
    source: 'Pricing Information',
    metadata: {
      category: 'pricing',
      type: 'plans',
      lastUpdated: '2024-01-10'
    }
  },
  {
    id: 'doc-4',
    text: 'Our API supports REST and GraphQL endpoints with comprehensive documentation. Authentication is handled via API keys or OAuth 2.0. Rate limits are 1000 requests per hour for Basic, 10,000 for Professional, and 100,000 for Enterprise. All API calls are logged and monitored for security.',
    source: 'API Documentation',
    metadata: {
      category: 'technical',
      type: 'api',
      lastUpdated: '2024-01-18'
    }
  },
  {
    id: 'doc-5',
    text: 'We take security seriously and are SOC 2 Type II compliant. All data is encrypted in transit and at rest using AES-256 encryption. We never store personal conversations permanently and all data is automatically deleted after 30 days unless explicitly requested otherwise by the customer.',
    source: 'Security & Privacy',
    metadata: {
      category: 'security',
      type: 'compliance',
      lastUpdated: '2024-01-12'
    }
  },
  {
    id: 'doc-6',
    text: 'Our customer support team is available 24/7 via chat, email, and phone. Average response time is under 2 minutes for chat, 4 hours for email, and immediate for phone calls. We also have a comprehensive knowledge base with video tutorials and step-by-step guides.',
    source: 'Support Information',
    metadata: {
      category: 'support',
      type: 'contact',
      lastUpdated: '2024-01-14'
    }
  },
  {
    id: 'doc-7',
    text: 'We offer a 14-day free trial with full access to all features. No credit card required to start. During the trial, you can test all functionality, integrate with your existing systems, and get hands-on support from our team. Most customers see value within the first 48 hours.',
    source: 'Free Trial',
    metadata: {
      category: 'trial',
      type: 'offer',
      lastUpdated: '2024-01-16'
    }
  },
  {
    id: 'doc-8',
    text: 'Our AI models are trained on diverse datasets and are regularly updated to improve accuracy and reduce bias. We use advanced techniques like few-shot learning and reinforcement learning to ensure our models understand context and provide helpful responses. All models are tested for safety and fairness.',
    source: 'AI Technology',
    metadata: {
      category: 'technical',
      type: 'ai',
      lastUpdated: '2024-01-19'
    }
  },
  {
    id: 'doc-9',
    text: 'We integrate with over 50 popular tools including Slack, Microsoft Teams, Salesforce, HubSpot, and Zapier. Custom integrations are available for Enterprise customers. Our webhook system allows real-time data synchronization and event notifications.',
    source: 'Integrations',
    metadata: {
      category: 'integrations',
      type: 'tools',
      lastUpdated: '2024-01-17'
    }
  },
  {
    id: 'doc-10',
    text: 'Our roadmap includes advanced analytics dashboard, multi-language voice synthesis, custom model training, and enterprise SSO integration. We release new features monthly and gather feedback through our community forum and user surveys. Customer suggestions are regularly incorporated into our development process.',
    source: 'Product Roadmap',
    metadata: {
      category: 'product',
      type: 'roadmap',
      lastUpdated: '2024-01-21'
    }
  }
];

export const documentCategories = [
  'company',
  'product', 
  'pricing',
  'technical',
  'security',
  'support',
  'trial',
  'integrations'
];

export function getDocumentsByCategory(category: string): Document[] {
  return sampleDocuments.filter(doc => doc.metadata?.category === category);
}

export function getDocumentById(id: string): Document | undefined {
  return sampleDocuments.find(doc => doc.id === id);
}

export function searchDocumentsByText(query: string): Document[] {
  const lowercaseQuery = query.toLowerCase();
  return sampleDocuments.filter(doc => 
    doc.text.toLowerCase().includes(lowercaseQuery) ||
    doc.source.toLowerCase().includes(lowercaseQuery)
  );
}
