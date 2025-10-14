export interface SafetyCheck {
  name: string;
  check: (text: string) => boolean;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface SafetyResult {
  isSafe: boolean;
  violations: Array<{
    check: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    position?: number;
  }>;
  score: number; // 0-100, higher is safer
}

export interface ContentSafetyConfig {
  maxLength: number;
  enableProfanityFilter: boolean;
  enableInjectionDetection: boolean;
  enableHarmfulContentDetection: boolean;
  customPatterns: Array<{
    name: string;
    pattern: RegExp;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

export const DEFAULT_SAFETY_CONFIG: ContentSafetyConfig = {
  maxLength: 10000, // 10KB max
  enableProfanityFilter: true,
  enableInjectionDetection: true,
  enableHarmfulContentDetection: true,
  customPatterns: []
};

// Basic profanity patterns (very basic, in production you'd use a proper library)
const PROFANITY_PATTERNS = [
  /\b(shit|damn|hell|fuck|bitch|asshole)\b/gi,
  /\b(crap|piss|darn|dang)\b/gi
];

// Injection attempt patterns
const INJECTION_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi
];

// Potentially harmful content patterns
const HARMFUL_PATTERNS = [
  /\b(suicide|kill\s+yourself|self\s+harm)\b/gi,
  /\b(bomb|explosive|weapon)\b/gi,
  /\b(hate|racist|discrimination)\b/gi
];

export class ContentSafetyValidator {
  private config: ContentSafetyConfig;
  private checks: SafetyCheck[];

  constructor(config: ContentSafetyConfig = DEFAULT_SAFETY_CONFIG) {
    this.config = config;
    this.checks = this.buildSafetyChecks();
  }

  private buildSafetyChecks(): SafetyCheck[] {
    const checks: SafetyCheck[] = [];

    // Length check
    checks.push({
      name: 'length',
      check: (text: string) => text.length <= this.config.maxLength,
      severity: 'medium',
      description: `Text exceeds maximum length of ${this.config.maxLength} characters`
    });

    // Profanity filter
    if (this.config.enableProfanityFilter) {
      checks.push({
        name: 'profanity',
        check: (text: string) => !PROFANITY_PATTERNS.some(pattern => pattern.test(text)),
        severity: 'low',
        description: 'Text contains potentially inappropriate language'
      });
    }

    // Injection detection
    if (this.config.enableInjectionDetection) {
      checks.push({
        name: 'injection',
        check: (text: string) => !INJECTION_PATTERNS.some(pattern => pattern.test(text)),
        severity: 'high',
        description: 'Text contains potential injection attempts'
      });
    }

    // Harmful content detection
    if (this.config.enableHarmfulContentDetection) {
      checks.push({
        name: 'harmful',
        check: (text: string) => !HARMFUL_PATTERNS.some(pattern => pattern.test(text)),
        severity: 'high',
        description: 'Text contains potentially harmful content'
      });
    }

    // Custom patterns
    for (const customPattern of this.config.customPatterns) {
      checks.push({
        name: customPattern.name,
        check: (text: string) => !customPattern.pattern.test(text),
        severity: customPattern.severity,
        description: customPattern.description
      });
    }

    return checks;
  }

  validate(text: string): SafetyResult {
    if (!text || text.trim().length === 0) {
      return {
        isSafe: true,
        violations: [],
        score: 100
      };
    }

    const violations: Array<{
      check: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      position?: number;
    }> = [];

    for (const check of this.checks) {
      if (!check.check(text)) {
        violations.push({
          check: check.name,
          severity: check.severity,
          description: check.description
        });
      }
    }

    // Calculate safety score
    const score = this.calculateSafetyScore(violations);
    const isSafe = violations.filter(v => v.severity === 'high').length === 0;

    return {
      isSafe,
      violations,
      score
    };
  }

  private calculateSafetyScore(violations: Array<{ severity: 'low' | 'medium' | 'high' }>): number {
    if (violations.length === 0) {
      return 100;
    }

    let penalty = 0;
    for (const violation of violations) {
      switch (violation.severity) {
        case 'low':
          penalty += 10;
          break;
        case 'medium':
          penalty += 25;
          break;
        case 'high':
          penalty += 50;
          break;
      }
    }

    return Math.max(0, 100 - penalty);
  }

  isSafe(text: string): boolean {
    return this.validate(text).isSafe;
  }

  getSafetyScore(text: string): number {
    return this.validate(text).score;
  }

  updateConfig(newConfig: Partial<ContentSafetyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.checks = this.buildSafetyChecks();
  }

  addCustomPattern(pattern: {
    name: string;
    pattern: RegExp;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }): void {
    this.config.customPatterns.push(pattern);
    this.checks = this.buildSafetyChecks();
  }

  removeCustomPattern(name: string): void {
    this.config.customPatterns = this.config.customPatterns.filter(p => p.name !== name);
    this.checks = this.buildSafetyChecks();
  }
}

// Singleton instance
export const contentSafetyValidator = new ContentSafetyValidator();

// Helper functions
export function isContentSafe(text: string): boolean {
  return contentSafetyValidator.isSafe(text);
}

export function getContentSafetyScore(text: string): number {
  return contentSafetyValidator.getSafetyScore(text);
}

export function validateContent(text: string): SafetyResult {
  return contentSafetyValidator.validate(text);
}

// Predefined safety configurations
export const SAFETY_CONFIGS = {
  STRICT: {
    ...DEFAULT_SAFETY_CONFIG,
    maxLength: 5000,
    enableProfanityFilter: true,
    enableInjectionDetection: true,
    enableHarmfulContentDetection: true
  },
  
  MODERATE: {
    ...DEFAULT_SAFETY_CONFIG,
    maxLength: 10000,
    enableProfanityFilter: true,
    enableInjectionDetection: true,
    enableHarmfulContentDetection: false
  },
  
  LENIENT: {
    ...DEFAULT_SAFETY_CONFIG,
    maxLength: 20000,
    enableProfanityFilter: false,
    enableInjectionDetection: true,
    enableHarmfulContentDetection: false
  }
} as const;
