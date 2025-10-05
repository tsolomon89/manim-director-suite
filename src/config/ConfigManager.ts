/**
 * Configuration Manager
 * Loads, validates, and provides access to all configuration values
 */

import type { ValidateFunction } from 'ajv';
import type { ConfigState, DefaultsConfig, PresetsConfig, UserSettings, ValidationRules } from './types';

export class ConfigManager {
  private config: ConfigState;
  private validators: Map<string, ValidateFunction> = new Map();

  constructor() {
    // Ajv will be initialized when needed for validation
    this.config = {
      defaults: {} as DefaultsConfig,
      presets: {
        'grid-styles': [],
        'color-schemes': [],
        'easing-curves': [],
        'warps': [],
      },
      userSettings: {} as UserSettings,
      validationRules: {} as ValidationRules,
    };
  }

  /**
   * Load all configuration files from the public/config directory
   */
  async loadAll(): Promise<void> {
    try {
      // Load defaults
      const defaultsResponse = await fetch('/config/defaults.json');
      this.config.defaults = await defaultsResponse.json();

      // Load validation rules
      const validationResponse = await fetch('/config/validation-rules.json');
      this.config.validationRules = await validationResponse.json();

      // Load user settings (with fallback to defaults if not found)
      try {
        const userSettingsResponse = await fetch('/config/user-settings.json');
        this.config.userSettings = await userSettingsResponse.json();
      } catch {
        this.config.userSettings = this.getDefaultUserSettings();
      }

      // Load all presets
      await this.loadPresets('grid-styles');
      await this.loadPresets('color-schemes');
      await this.loadPresets('easing-curves');
      await this.loadPresets('warps');

      console.log('✅ Configuration loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      throw new Error(`Configuration loading failed: ${error}`);
    }
  }

  /**
   * Load all preset files of a specific category
   */
  private async loadPresets(category: keyof PresetsConfig): Promise<void> {
    try {
      // Fetch the index file that lists all presets in this category
      const indexResponse = await fetch(`/config/presets/${category}/index.json`);
      const index: { files: string[] } = await indexResponse.json();

      // Load each preset file
      const presets = await Promise.all(
        index.files.map(async (filename) => {
          const response = await fetch(`/config/presets/${category}/${filename}`);
          return response.json();
        })
      );

      this.config.presets[category] = presets;
    } catch (error) {
      console.warn(`⚠️ Failed to load presets for ${category}:`, error);
      this.config.presets[category] = [];
    }
  }

  /**
   * Get a configuration value using dot notation
   * Examples:
   *   - config.get('camera.zoomMin')
   *   - config.get('grid.defaultStyleId')
   */
  get<T = any>(path: string): T {
    const keys = path.split('.');
    let value: any = this.config.defaults;

    for (const key of keys) {
      if (value === undefined || value === null) {
        throw new Error(`Configuration path not found: ${path}`);
      }
      value = value[key];
    }

    if (value === undefined) {
      throw new Error(`Configuration value not found: ${path}`);
    }

    return value as T;
  }

  /**
   * Set a configuration value using dot notation
   * Note: This only updates runtime state, not persisted files
   */
  set(path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();

    if (!lastKey) {
      throw new Error('Invalid configuration path');
    }

    let target: any = this.config.defaults;
    for (const key of keys) {
      if (!target[key]) {
        target[key] = {};
      }
      target = target[key];
    }

    target[lastKey] = value;
  }

  /**
   * Get all presets of a specific category
   */
  getPresets<T>(category: keyof PresetsConfig): T[] {
    return this.config.presets[category] as T[];
  }

  /**
   * Get a specific preset by ID
   */
  getPreset<T>(category: keyof PresetsConfig, id: string): T | undefined {
    return this.config.presets[category].find((preset: any) => preset.id === id) as T | undefined;
  }

  /**
   * Add a new preset to a category
   */
  addPreset(category: keyof PresetsConfig, preset: any): void {
    this.config.presets[category].push(preset);
  }

  /**
   * Get user settings
   */
  getUserSettings(): UserSettings {
    return this.config.userSettings;
  }

  /**
   * Update user settings
   */
  updateUserSettings(updates: Partial<UserSettings>): void {
    this.config.userSettings = {
      ...this.config.userSettings,
      ...updates,
    };
  }

  /**
   * Get validation rules
   */
  getValidationRules(): ValidationRules {
    return this.config.validationRules;
  }

  /**
   * Validate data against a schema
   */
  validate(schemaName: string, data: any): { valid: boolean; errors?: string[] } {
    const validator = this.validators.get(schemaName);

    if (!validator) {
      return { valid: true }; // If no validator, assume valid
    }

    const valid = validator(data);

    if (!valid && validator.errors) {
      const errors = validator.errors.map(
        (err) => `${err.instancePath}: ${err.message}`
      );
      return { valid: false, errors };
    }

    return { valid: true };
  }

  /**
   * Export current configuration state as JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Get default user settings
   */
  private getDefaultUserSettings(): UserSettings {
    return {
      theme: 'auto',
      autoSave: true,
      autoSaveIntervalMs: 30000,
      recentProjects: [],
      viewport: {
        renderMode: 'high',
        showFps: false,
      },
    };
  }

  /**
   * Get the full config state (for debugging)
   */
  getFullConfig(): ConfigState {
    return this.config;
  }
}

// Singleton instance
export const configManager = new ConfigManager();
