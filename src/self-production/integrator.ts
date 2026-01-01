/**
 * Code Integrator
 *
 * Applies approved code changes to Atlas.
 * Creates proper git commits and maintains audit trail.
 */

import * as fs from 'fs';
import * as path from 'path';
import { GeneratedCode, InsertionPoint } from './code-generator';
import { ReviewItem } from './review-queue';

/**
 * Integration result
 */
export interface IntegrationResult {
  success: boolean;
  itemId: string;
  generatedCodeId: string;
  targetFile: string;
  action: 'created' | 'modified' | 'failed';
  error?: string;
  backup?: string;
  timestamp: Date;
}

/**
 * Integration history entry
 */
export interface IntegrationHistoryEntry {
  id: string;
  reviewItemId: string;
  generatedCodeId: string;
  type: string;
  name: string;
  targetFile: string;
  integratedAt: Date;
  integratedBy: string;
  gitCommit?: string;
  canRollback: boolean;
  backupPath?: string;
}

/**
 * Integrator configuration
 */
export interface IntegratorConfig {
  /** Base directory for Atlas source */
  baseDir: string;
  /** Create backups before modification */
  createBackups: boolean;
  /** Backup directory */
  backupDir: string;
  /** Dry run (don't actually modify files) */
  dryRun: boolean;
}

const DEFAULT_CONFIG: IntegratorConfig = {
  baseDir: process.cwd(),
  createBackups: true,
  backupDir: '.atlas-backups',
  dryRun: false,
};

/**
 * Code Integrator
 */
export class Integrator {
  private config: IntegratorConfig;
  private history: IntegrationHistoryEntry[] = [];

  constructor(config: Partial<IntegratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Ensure backup directory exists
    if (this.config.createBackups) {
      const backupPath = path.join(this.config.baseDir, this.config.backupDir);
      if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
      }
    }
  }

  /**
   * Integrate approved code from a review item
   */
  async integrate(reviewItem: ReviewItem): Promise<IntegrationResult> {
    if (!reviewItem.generatedCode) {
      return {
        success: false,
        itemId: reviewItem.id,
        generatedCodeId: '',
        targetFile: '',
        action: 'failed',
        error: 'No generated code in review item',
        timestamp: new Date(),
      };
    }

    const generated = reviewItem.generatedCode;
    const targetPath = path.join(this.config.baseDir, generated.targetFile);

    try {
      // Create backup if file exists
      let backupPath: string | undefined;
      if (this.config.createBackups && fs.existsSync(targetPath)) {
        backupPath = await this.createBackup(targetPath, generated.id);
      }

      // Apply the code
      const action = await this.applyCode(generated);

      // Record in history
      const historyEntry: IntegrationHistoryEntry = {
        id: `int_${Date.now()}`,
        reviewItemId: reviewItem.id,
        generatedCodeId: generated.id,
        type: generated.type,
        name: generated.name,
        targetFile: generated.targetFile,
        integratedAt: new Date(),
        integratedBy: reviewItem.reviewer || 'system',
        canRollback: !!backupPath,
        backupPath,
      };
      this.history.push(historyEntry);

      return {
        success: true,
        itemId: reviewItem.id,
        generatedCodeId: generated.id,
        targetFile: generated.targetFile,
        action,
        backup: backupPath,
        timestamp: new Date(),
      };

    } catch (error) {
      return {
        success: false,
        itemId: reviewItem.id,
        generatedCodeId: generated.id,
        targetFile: generated.targetFile,
        action: 'failed',
        error: String(error),
        timestamp: new Date(),
      };
    }
  }

  /**
   * Apply generated code to target file
   */
  private async applyCode(generated: GeneratedCode): Promise<'created' | 'modified'> {
    const targetPath = path.join(this.config.baseDir, generated.targetFile);
    const insertion = generated.insertionPoint;

    if (this.config.dryRun) {
      console.log(`[DRY RUN] Would apply to ${targetPath}`);
      console.log(`[DRY RUN] Code:\n${generated.code.slice(0, 200)}...`);
      return fs.existsSync(targetPath) ? 'modified' : 'created';
    }

    // If file doesn't exist, create it
    if (!fs.existsSync(targetPath)) {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(targetPath, this.wrapNewFile(generated));
      return 'created';
    }

    // Read existing file
    let content = fs.readFileSync(targetPath, 'utf-8');

    // Apply insertion
    content = this.applyInsertion(content, generated.code, insertion);

    // Write back
    fs.writeFileSync(targetPath, content);
    return 'modified';
  }

  /**
   * Apply insertion point logic
   */
  private applyInsertion(content: string, newCode: string, insertion: InsertionPoint): string {
    if (insertion.append) {
      return content + '\n' + newCode;
    }

    if (insertion.replace) {
      return content.replace(insertion.replace, newCode);
    }

    if (insertion.after) {
      const afterIndex = content.indexOf(insertion.after);
      if (afterIndex === -1) {
        // Marker not found, append with marker
        return content + `\n\n// AUTO-GENERATED CODE BELOW\n${newCode}`;
      }
      const insertAt = afterIndex + insertion.after.length;
      return content.slice(0, insertAt) + '\n' + newCode + content.slice(insertAt);
    }

    if (insertion.before) {
      const beforeIndex = content.indexOf(insertion.before);
      if (beforeIndex === -1) {
        // Marker not found, prepend
        return newCode + '\n\n' + content;
      }
      return content.slice(0, beforeIndex) + newCode + '\n' + content.slice(beforeIndex);
    }

    // Default: append
    return content + '\n' + newCode;
  }

  /**
   * Wrap code for a new file
   */
  private wrapNewFile(generated: GeneratedCode): string {
    const header = `/**
 * ${generated.name}
 *
 * ${generated.description}
 *
 * @generated by Atlas Self-Production Engine
 * @date ${new Date().toISOString()}
 * @source gap: ${generated.sourceGap.id}
 */

`;

    return header + generated.code;
  }

  /**
   * Create a backup of a file
   */
  private async createBackup(filePath: string, generatedId: string): Promise<string> {
    const backupDir = path.join(this.config.baseDir, this.config.backupDir);
    const fileName = path.basename(filePath);
    const timestamp = Date.now();
    const backupName = `${fileName}.${timestamp}.${generatedId}.bak`;
    const backupPath = path.join(backupDir, backupName);

    fs.copyFileSync(filePath, backupPath);

    return backupPath;
  }

  /**
   * Rollback an integration
   */
  async rollback(integrationId: string): Promise<boolean> {
    const entry = this.history.find(h => h.id === integrationId);
    if (!entry) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    if (!entry.canRollback || !entry.backupPath) {
      throw new Error(`Integration ${integrationId} cannot be rolled back`);
    }

    const targetPath = path.join(this.config.baseDir, entry.targetFile);

    if (this.config.dryRun) {
      console.log(`[DRY RUN] Would rollback ${targetPath} from ${entry.backupPath}`);
      return true;
    }

    // Restore from backup
    fs.copyFileSync(entry.backupPath, targetPath);

    // Mark as rolled back
    entry.canRollback = false;

    return true;
  }

  /**
   * Get integration history
   */
  getHistory(): IntegrationHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Get recent integrations
   */
  getRecent(count: number = 10): IntegrationHistoryEntry[] {
    return this.history
      .sort((a, b) => b.integratedAt.getTime() - a.integratedAt.getTime())
      .slice(0, count);
  }

  /**
   * Find integrations by type
   */
  findByType(type: string): IntegrationHistoryEntry[] {
    return this.history.filter(h => h.type === type);
  }

  /**
   * Export history (for persistence)
   */
  exportHistory(): IntegrationHistoryEntry[] {
    return this.history;
  }

  /**
   * Import history (from persistence)
   */
  importHistory(entries: IntegrationHistoryEntry[]): void {
    for (const entry of entries) {
      entry.integratedAt = new Date(entry.integratedAt);
      this.history.push(entry);
    }
  }

  /**
   * Generate a git commit message for an integration
   */
  generateCommitMessage(entry: IntegrationHistoryEntry): string {
    return `feat(self-production): Add ${entry.type} "${entry.name}"

Auto-generated by Atlas Self-Production Engine.

- Review ID: ${entry.reviewItemId}
- Generated: ${entry.generatedCodeId}
- Target: ${entry.targetFile}
- Integrated by: ${entry.integratedBy}

This code was generated from detected gap in the framework
and approved through the review queue.

🤖 Generated with Atlas Self-Production
`;
  }

  /**
   * Check if a file has pending integrations
   */
  hasPendingIntegrations(filePath: string): boolean {
    // Normalize path
    const normalized = filePath.replace(/\\/g, '/');
    return this.history.some(h =>
      h.targetFile.replace(/\\/g, '/') === normalized &&
      h.canRollback
    );
  }

  /**
   * Validate that generated code compiles (basic syntax check)
   */
  async validateSyntax(code: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic TypeScript syntax checks
    const checks = [
      { pattern: /export\s+(const|class|interface|type|function|enum)\s+\w+/, required: true, message: 'Must have at least one export' },
      { pattern: /\{[^}]*$/, required: false, message: 'Unclosed brace detected' },
      { pattern: /\([^)]*$/, required: false, message: 'Unclosed parenthesis detected' },
    ];

    for (const check of checks) {
      const matches = check.pattern.test(code);
      if (check.required && !matches) {
        errors.push(check.message);
      } else if (!check.required && matches) {
        errors.push(check.message);
      }
    }

    // Check for balanced braces
    const braceBalance = (code.match(/\{/g) || []).length - (code.match(/\}/g) || []).length;
    if (braceBalance !== 0) {
      errors.push(`Unbalanced braces: ${braceBalance > 0 ? 'missing closing' : 'extra closing'}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Create a summary of integrations
 */
export function summarizeIntegrations(entries: IntegrationHistoryEntry[]): string {
  const byType: Record<string, number> = {};

  for (const entry of entries) {
    byType[entry.type] = (byType[entry.type] || 0) + 1;
  }

  const lines = [
    `Integration Summary`,
    `==================`,
    `Total: ${entries.length}`,
    ``,
    `By Type:`,
  ];

  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${type}: ${count}`);
  }

  const rollbackable = entries.filter(e => e.canRollback).length;
  lines.push(``);
  lines.push(`Rollbackable: ${rollbackable}`);

  return lines.join('\n');
}
