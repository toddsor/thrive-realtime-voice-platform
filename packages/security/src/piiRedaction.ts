export interface PIIPattern {
  name: string;
  pattern: RegExp;
  replacement: string;
  description: string;
}

export interface RedactionResult {
  originalText: string;
  redactedText: string;
  redactions: Array<{
    type: string;
    original: string;
    replacement: string;
    position: number;
  }>;
}

export const PII_PATTERNS: PIIPattern[] = [
  {
    name: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL_REDACTED]',
    description: 'Email addresses'
  },
  {
    name: 'phone',
    pattern: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    replacement: '[PHONE_REDACTED]',
    description: 'Phone numbers'
  },
  {
    name: 'creditCard',
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    replacement: '[CARD_REDACTED]',
    description: 'Credit card numbers'
  },
  {
    name: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN_REDACTED]',
    description: 'Social Security Numbers'
  },
  {
    name: 'ipAddress',
    pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    replacement: '[IP_REDACTED]',
    description: 'IP addresses'
  },
  {
    name: 'streetAddress',
    pattern: /\b\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Circle|Cir|Court|Ct)\b/gi,
    replacement: '[ADDRESS_REDACTED]',
    description: 'Street addresses'
  },
  {
    name: 'zipCode',
    pattern: /\b\d{5}(?:-\d{4})?\b/g,
    replacement: '[ZIP_REDACTED]',
    description: 'ZIP codes'
  }
];

export class PIIRedactor {
  private patterns: PIIPattern[];
  private enabled: boolean;

  constructor(patterns: PIIPattern[] = PII_PATTERNS, enabled: boolean = true) {
    this.patterns = patterns;
    this.enabled = enabled;
  }

  redact(text: string): RedactionResult {
    if (!this.enabled || !text) {
      return {
        originalText: text,
        redactedText: text,
        redactions: []
      };
    }

    let redactedText = text;
    const redactions: Array<{
      type: string;
      original: string;
      replacement: string;
      position: number;
    }> = [];

    for (const pattern of this.patterns) {
      const matches = Array.from(text.matchAll(pattern.pattern));
      
      for (const match of matches) {
        if (match.index !== undefined) {
          const original = match[0];
          const replacement = pattern.replacement;
          
          // Replace in the redacted text
          redactedText = redactedText.replace(original, replacement);
          
          // Track the redaction
          redactions.push({
            type: pattern.name,
            original,
            replacement,
            position: match.index
          });
        }
      }
    }

    return {
      originalText: text,
      redactedText,
      redactions
    };
  }

  redactMultiple(texts: string[]): RedactionResult[] {
    return texts.map(text => this.redact(text));
  }

  isPIIPresent(text: string): boolean {
    if (!this.enabled || !text) {
      return false;
    }

    for (const pattern of this.patterns) {
      if (pattern.pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  getPIITypes(text: string): string[] {
    if (!this.enabled || !text) {
      return [];
    }

    const foundTypes: string[] = [];
    
    for (const pattern of this.patterns) {
      if (pattern.pattern.test(text)) {
        foundTypes.push(pattern.name);
      }
    }

    return foundTypes;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  addPattern(pattern: PIIPattern): void {
    this.patterns.push(pattern);
  }

  removePattern(name: string): void {
    this.patterns = this.patterns.filter(p => p.name !== name);
  }

  getPatterns(): PIIPattern[] {
    return [...this.patterns];
  }
}

// Singleton instance
export const piiRedactor = new PIIRedactor();

// Helper function for simple redaction
export function redactPII(text: string): string {
  return piiRedactor.redact(text).redactedText;
}

// Enhanced redaction function for database persistence
const PHONE = /(\+\d{1,3}[-.\s]?)?(\(\d{1,4}\)|\d{1,4})[-.\s]?\d{2,4}[-.\s]?\d{2,4}/g;
const ADDRESS_HINTS = /(street|st\.|road|rd\.|avenue|ave\.|väg|gatan|gata|plaza|suite|apt\.?|floor)/i;

export function redact(text: string): string {
  let t = text.replace(PHONE, "[redacted-phone]");
  
  // Lightweight address masking
  t = t.split(/\n/).map(line => {
    if (ADDRESS_HINTS.test(line) && /\d/.test(line)) {
      return line.replace(/\d/g, "●");
    }
    return line;
  }).join("\n");
  
  return t;
}

// Helper function to check if text contains PII
export function containsPII(text: string): boolean {
  return piiRedactor.isPIIPresent(text);
}

// Helper function to get PII types in text
export function getPIITypes(text: string): string[] {
  return piiRedactor.getPIITypes(text);
}

// Configuration for different redaction levels
export const REDACTION_LEVELS = {
  NONE: 'none',
  BASIC: 'basic',
  STRICT: 'strict'
} as const;

export type RedactionLevel = typeof REDACTION_LEVELS[keyof typeof REDACTION_LEVELS];

export function createRedactorForLevel(level: RedactionLevel): PIIRedactor {
  switch (level) {
    case REDACTION_LEVELS.NONE:
      return new PIIRedactor([], false);
    
    case REDACTION_LEVELS.BASIC:
      return new PIIRedactor(PII_PATTERNS.slice(0, 3), true); // Email, phone, credit card
    
    case REDACTION_LEVELS.STRICT:
      return new PIIRedactor(PII_PATTERNS, true); // All patterns
    
    default:
      return new PIIRedactor(PII_PATTERNS, true);
  }
}
