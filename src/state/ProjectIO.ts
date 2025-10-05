/**
 * ProjectIO - Save and load project files
 * Phase 8: Testing & Polish - Project persistence
 *
 * Handles serialization, validation, and file I/O for projects
 */

import type {
  ProjectState,
  ProjectMetadata,
  ValidationResult,
  ProjectIOOptions,
} from './types';
import type { ParameterManager } from '../engine/ParameterManager';
import type { KeyframeManager } from '../timeline/KeyframeManager';
import type { PlaybackController } from '../timeline/PlaybackController';
import type { Camera } from '../scene/Camera';
import type { GridRenderConfig } from '../scene/GridConfig';
import type { FunctionManager } from '../engine/FunctionManager';
import type { IndependentVariableManager } from '../engine/IndependentVariableManager';

const PROJECT_VERSION = '1.0.0';

export class ProjectIO {
  /**
   * Serialize current project state to JSON
   */
  static serialize(
    parameterManager: ParameterManager,
    keyframeManager: KeyframeManager,
    playbackController: PlaybackController,
    camera: Camera,
    functionManager: FunctionManager,
    independentVarManager: IndependentVariableManager,
    gridStyleId: string,
    gridConfig: GridRenderConfig,
    metadata: Partial<ProjectMetadata>,
    options: ProjectIOOptions = {}
  ): string {
    const now = new Date().toISOString();

    const project: ProjectState = {
      version: PROJECT_VERSION,
      metadata: {
        name: metadata.name || 'Untitled Project',
        description: metadata.description,
        created: metadata.created || now,
        modified: now,
        author: metadata.author,
        tags: metadata.tags,
      },
      parameters: parameterManager.getAllParameters(),
      keyframes: keyframeManager.getAllKeyframes(),
      functions: functionManager.getAllFunctions(),
      independentVariables: independentVarManager.getAllVariables(),
      timeline: {
        duration: playbackController.getState().duration,
        currentTime: playbackController.getState().currentTime,
        playbackSpeed: playbackController.getState().playbackSpeed,
        loopMode: playbackController.getState().loopMode,
        fps: 60, // From config or state
      },
      scene: {
        spaceType: 'cartesian', // From scene config
        gridStyleId,
        gridConfig,
      },
      camera: camera.getState(),
      rendering: {
        resolution: '1920x1080',
        fps: 30,
        quality: 'medium',
      },
    };

    if (options.pretty) {
      return JSON.stringify(project, null, 2);
    }

    return JSON.stringify(project);
  }

  /**
   * Deserialize project from JSON string
   */
  static deserialize(jsonString: string): ProjectState {
    try {
      const project = JSON.parse(jsonString) as ProjectState;

      // Validate version
      if (!project.version) {
        throw new Error('Missing project version');
      }

      // Check for major version compatibility
      const [majorVersion] = project.version.split('.');
      const [currentMajor] = PROJECT_VERSION.split('.');

      if (majorVersion !== currentMajor) {
        throw new Error(
          `Incompatible project version: ${project.version} (expected ${PROJECT_VERSION})`
        );
      }

      return project;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate project structure
   */
  static validate(project: ProjectState): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // Required fields
    if (!project.version) {
      result.errors.push('Missing project version');
      result.valid = false;
    }

    if (!project.metadata) {
      result.errors.push('Missing metadata');
      result.valid = false;
    }

    if (!Array.isArray(project.parameters)) {
      result.errors.push('Invalid parameters array');
      result.valid = false;
    }

    if (!Array.isArray(project.keyframes)) {
      result.errors.push('Invalid keyframes array');
      result.valid = false;
    }

    // Warnings for missing optional data
    if (project.parameters.length === 0) {
      result.warnings.push('Project has no parameters');
    }

    if (project.keyframes.length === 0) {
      result.warnings.push('Project has no keyframes');
    }

    // Validate parameter references in keyframes
    const paramIds = new Set(project.parameters.map(p => p.id));
    for (const keyframe of project.keyframes) {
      if (keyframe.snapshot.parameters) {
        for (const paramId of Object.keys(keyframe.snapshot.parameters)) {
          if (!paramIds.has(paramId)) {
            result.warnings.push(
              `Keyframe "${keyframe.label}" references missing parameter: ${paramId}`
            );
          }
        }
      }
    }

    return result;
  }

  /**
   * Save project to file (browser download)
   */
  static saveToFile(
    jsonString: string,
    filename: string = 'project.pkstudio'
  ): void {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Load project from file (browser upload)
   */
  static async loadFromFile(file: File): Promise<ProjectState> {
    const text = await file.text();
    const project = this.deserialize(text);
    const validation = this.validate(project);

    if (!validation.valid) {
      throw new Error(`Invalid project file:\n${validation.errors.join('\n')}`);
    }

    if (validation.warnings.length > 0) {
      console.warn('Project warnings:', validation.warnings);
    }

    return project;
  }

  /**
   * Apply loaded project state to managers
   */
  static applyState(
    project: ProjectState,
    parameterManager: ParameterManager,
    keyframeManager: KeyframeManager,
    playbackController: PlaybackController,
    camera: Camera,
    functionManager: FunctionManager,
    independentVarManager: IndependentVariableManager
  ): {
    gridStyleId: string;
    gridConfig: GridRenderConfig;
  } {
    // Clear existing state
    parameterManager.clear();
    keyframeManager.clear();
    functionManager.clear();
    independentVarManager.clear();

    // Restore parameters FIRST (functions depend on them)
    for (const param of project.parameters) {
      parameterManager.createParameter(param.name, param.value, {
        uiControl: param.uiControl,
        domain: param.domain,
        role: param.role,
        metadata: param.metadata,
      });
    }

    // Restore independent variables SECOND (functions reference them)
    for (const indepVar of project.independentVariables || []) {
      independentVarManager.createVariable(indepVar.name, indepVar.domain);
    }

    // Restore functions THIRD (after params and indep vars exist)
    for (const func of project.functions || []) {
      functionManager.restoreFunction(func);
    }

    // Restore keyframes
    for (const keyframe of project.keyframes) {
      keyframeManager.createKeyframe(
        keyframe.time,
        keyframe.label,
        keyframe.snapshot
      );
    }

    // Restore timeline state
    playbackController.setDuration(project.timeline.duration);
    playbackController.setCurrentTime(project.timeline.currentTime);
    playbackController.setPlaybackSpeed(project.timeline.playbackSpeed);
    playbackController.setLoopMode(project.timeline.loopMode);

    // Restore camera
    camera.setState(project.camera);

    // Return scene data for caller to apply
    return {
      gridStyleId: project.scene.gridStyleId,
      gridConfig: project.scene.gridConfig,
    };
  }

  /**
   * Generate default project metadata
   */
  static createMetadata(name: string = 'Untitled Project'): ProjectMetadata {
    return {
      name,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    };
  }

  /**
   * Extract metadata from project
   */
  static getMetadata(project: ProjectState): ProjectMetadata {
    return { ...project.metadata };
  }

  /**
   * Update project metadata
   */
  static updateMetadata(
    project: ProjectState,
    updates: Partial<ProjectMetadata>
  ): ProjectState {
    return {
      ...project,
      metadata: {
        ...project.metadata,
        ...updates,
        modified: new Date().toISOString(),
      },
    };
  }
}
