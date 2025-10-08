import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { configManager } from './config/ConfigManager';
import { DEFAULT_FUNCTION_STEP } from './constants';
import { Toolbar } from './ui/Toolbar';
import { ViewportContainer } from './ui/ViewportContainer';
import { ParametersSidebar } from './ui/ParametersSidebar';
import { FunctionsSidebar } from './ui/FunctionsSidebar';
import { KeyframesSidebar } from './ui/KeyframesSidebar';
import { VisualSettingsSidebar } from './ui/VisualSettingsSidebar';
import { TimelineView } from './ui/TimelineView';
import { TimelineControls } from './ui/TimelineControls';
import { DesmosImportDialog } from './ui/DesmosImportDialog';
import { SaveLoadDialog } from './ui/SaveLoadDialog';
import { ExportDialog } from './ui/ExportDialog';
import { ManimExportDialog } from './ui/ManimExportDialog';
import { useLayoutManager } from './ui/useLayoutManager';
import type { SidebarId } from './ui/layout-types';
import type { RendererType } from './ui/RendererToggle';
import { Viewport } from './scene/Viewport';
import { Camera } from './scene/Camera';
import { ParameterManager } from './engine/ParameterManager';
import { FunctionManager } from './engine/FunctionManager';
import { ExpressionEngine } from './engine/ExpressionEngine';
import { Binder } from './engine/Binder';
import { IndependentVariableManager } from './engine/IndependentVariableManager';
import { KeyframeManager, KeyframeSnapshotBuilder } from './timeline/KeyframeManager';
import { TweeningEngine } from './timeline/TweeningEngine';
import { PlaybackController } from './timeline/PlaybackController';
import { easingRegistry } from './timeline/EasingRegistry';
import { getDefaultGridConfig } from './scene/GridConfig';
import { ProjectIO } from './state/ProjectIO';
import type { UIControlType } from './engine/types';
import type { PlottedFunction } from './scene/FunctionPlotter';
import type { FunctionDefinition } from './engine/expression-types';
import type { GridRenderConfig } from './scene/GridConfig';
import type { TimelineState } from './timeline/types';
import type { ImportResult } from './import/types';
import type { ProjectMetadata } from './state/types';
import './App.css';

function App() {
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGridStyle, setSelectedGridStyle] = useState<string>('cartesian-dark');
  const [camera, setCamera] = useState<Camera | null>(null);
  const [cameraInfo, setCameraInfo] = useState({ x: 0, y: 0, zoom: 1 });
  const [parameters, setParameters] = useState<any[]>([]);
  const [functionDefs, setFunctionDefs] = useState<FunctionDefinition[]>([]);
  const [gridConfig, setGridConfig] = useState<GridRenderConfig>(getDefaultGridConfig());
  const [complexMode, setComplexMode] = useState<boolean>(false);

  // Timeline state
  const [timelineState, setTimelineState] = useState<TimelineState | null>(null);
  const [keyframes, setKeyframes] = useState<any[]>([]);
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);

  // Desmos import state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Save/Load state
  const [showSaveLoadDialog, setShowSaveLoadDialog] = useState<'save' | 'load' | null>(null);
  const [projectMetadata, setProjectMetadata] = useState<Partial<ProjectMetadata>>({
    name: 'Untitled Project',
    created: new Date().toISOString(),
  });

  // Export state
  const [showExportDialog, setShowExportDialog] = useState<'png' | 'manim' | null>(null);
  const viewportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Renderer state
  const [currentRenderer, setCurrentRenderer] = useState<RendererType>('canvas');
  const [manimAvailable, setManimAvailable] = useState(false);
  const [rendererStats, setRendererStats] = useState<{ latencyMs?: number; cacheStats?: any }>({});

  // Engine managers
  const parameterManagerRef = useRef<ParameterManager>(new ParameterManager());
  const expressionEngineRef = useRef<ExpressionEngine>(new ExpressionEngine());
  const independentVarManagerRef = useRef<IndependentVariableManager>(new IndependentVariableManager());
  const functionManagerRef = useRef<FunctionManager>(
    new FunctionManager({
      expressionEngine: expressionEngineRef.current,
      binder: new Binder(expressionEngineRef.current),
      independentVarManager: independentVarManagerRef.current,
    })
  );

  // Timeline managers
  const keyframeManagerRef = useRef<KeyframeManager>(new KeyframeManager());
  const tweeningEngineRef = useRef<TweeningEngine>(new TweeningEngine());
  const playbackControllerRef = useRef<PlaybackController | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        await configManager.loadAll();
        const defaultStyleId = configManager.get<string>('grid.defaultStyleId') || 'cartesian-dark';
        setSelectedGridStyle(defaultStyleId);

        // Initialize timeline
        easingRegistry.loadFromConfig();
        const controller = new PlaybackController();
        playbackControllerRef.current = controller;
        setTimelineState(controller.getState());

        // Subscribe to timeline updates
        controller.subscribe((state) => {
          setTimelineState(state);
        });

        // Check Manim availability
        checkManimAvailability();

        setIsConfigLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
        console.error('Configuration load error:', err);
      }
    };

    loadConfig();

    // Cleanup
    return () => {
      playbackControllerRef.current?.destroy();
    };
  }, []);

  // Check if Manim backend service is available
  const checkManimAvailability = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/manim/health');
      const data = await response.json();
      setManimAvailable(data.manimAvailable || false);

      if (data.manimAvailable) {
        console.log(`✅ Manim available: v${data.manimVersion}`);
      } else {
        console.warn('⚠️ Manim backend service running but Manim not installed');
      }
    } catch (error) {
      console.warn('⚠️ Manim backend service not reachable (is server running on port 3001?)');
      setManimAvailable(false);
    }
  };

  // Get current parameter values for function plotting (memoized)
  // If timeline is playing, interpolate values from keyframes
  const parameterValues = useMemo(() => {
    const values: Record<string, number> = {};

    // If we have keyframes and timeline is active, interpolate
    if (timelineState && keyframes.length > 0 && (timelineState.isPlaying || keyframes.length > 0)) {
      const tweenResult = tweeningEngineRef.current.getStateAtTime(
        timelineState.currentTime,
        keyframes
      );

      // Use interpolated values
      parameters.forEach((p) => {
        values[p.name] = tweenResult.parameters[p.id] ?? p.value;
      });
    } else {
      // Use current parameter values
      parameters.forEach((p) => {
        values[p.name] = p.value;
      });
    }

    return values;
  }, [parameters, timelineState, keyframes]);

  // Convert FunctionDefinition to PlottedFunction for Viewport rendering
  const plottedFunctions = useMemo((): PlottedFunction[] => {
    return functionDefs.map((func) => {
      const indepVar = independentVarManagerRef.current.getVariable(func.independentVarId);
      const displayName = functionManagerRef.current.getDisplayName(func);

      return {
        id: func.id,
        name: displayName,
        expression: func.expression,
        color: func.style.color,
        lineWidth: func.style.lineWidth,
        visible: func.visible,
        domain: indepVar ? {
          min: indepVar.domain.min,
          max: indepVar.domain.max,
          step: indepVar.domain.step,
        } : {
          min: configManager.get('scene.bounds').xMin,
          max: configManager.get('scene.bounds').xMax,
          step: DEFAULT_FUNCTION_STEP,
        },
      };
    });
  }, [functionDefs, parameters]); // Added 'parameters' dependency to react to domain changes

  // All callbacks must be defined before any conditional returns
  const handleCameraChange = useCallback((cam: Camera) => {
    setCamera(cam);
    const state = cam.getState();
    setCameraInfo({ x: state.x, y: state.y, zoom: state.zoom });
  }, []);

  const handleResetCamera = useCallback(() => {
    if (camera) {
      camera.reset();
      const state = camera.getState();
      setCameraInfo({ x: state.x, y: state.y, zoom: state.zoom });
    }
  }, [camera]);

  const handleCameraXChange = useCallback((x: number) => {
    if (camera) {
      camera.setState({ x });
      setCameraInfo({ ...cameraInfo, x });
    }
  }, [camera, cameraInfo]);

  const handleCameraYChange = useCallback((y: number) => {
    if (camera) {
      camera.setState({ y });
      setCameraInfo({ ...cameraInfo, y });
    }
  }, [camera, cameraInfo]);

  const handleCameraZoomChange = useCallback((zoom: number) => {
    if (camera) {
      camera.setState({ zoom });
      setCameraInfo({ ...cameraInfo, zoom });
    }
  }, [camera, cameraInfo]);

  const handleParameterCreate = useCallback((name: string, value: number, controlType: UIControlType) => {
    const pm = parameterManagerRef.current;
    const defaults = configManager.get('parameters.defaults');

    const param = pm.createParameter(name, value, {
      uiControl: {
        type: controlType,
        min: defaults.min,
        max: defaults.max,
        step: defaults.step,
      },
    });

    if (param) {
      setParameters(pm.getAllParameters());
    }
  }, []);

  const handleParameterChange = useCallback((id: string, value: number) => {
    const pm = parameterManagerRef.current;
    pm.updateValue(id, value);
    setParameters(pm.getAllParameters());
  }, []);

  const handleParameterDelete = useCallback((id: string) => {
    const pm = parameterManagerRef.current;
    if (pm.deleteParameter(id)) {
      setParameters(pm.getAllParameters());
    }
  }, []);

  const handleParameterUpdateValue = useCallback((id: string, value: number) => {
    const pm = parameterManagerRef.current;
    if (pm.updateValue(id, value)) {
      setParameters(pm.getAllParameters());
    }
  }, []);

  const handleParameterUpdateDomain = useCallback((id: string, domain: { min: number; max: number; step: number }) => {
    const pm = parameterManagerRef.current;
    const ivm = independentVarManagerRef.current;
    const param = pm.getParameter(id);

    if (param) {
      param.domain = domain;
      // Also update uiControl to reflect new domain
      if (param.uiControl) {
        param.uiControl.min = domain.min;
        param.uiControl.max = domain.max;
        param.uiControl.step = domain.step;
      }

      // If this parameter is an independent variable, update its domain too
      const indepVar = ivm.getVariableByName(param.name);
      if (indepVar) {
        ivm.updateDomain(indepVar.id, {
          min: domain.min,
          max: domain.max,
          step: domain.step
        });
      }

      setParameters(pm.getAllParameters());
      // Force a re-render by updating a timestamp or counter
      setParameters([...pm.getAllParameters()]);
    }
  }, []);

  const handleParameterClearValue = useCallback((id: string) => {
    const pm = parameterManagerRef.current;
    const param = pm.getParameter(id);
    if (param) {
      // Set value to undefined to make it implicit/domain-only
      param.value = undefined;
      setParameters([...pm.getAllParameters()]);
    }
  }, []);

  const handleConvertToFunction = useCallback((paramId: string) => {
    const pm = parameterManagerRef.current;
    const fm = functionManagerRef.current;

    // Get the parameter
    const param = pm.getParameter(paramId);
    if (!param) {
      console.error('Parameter not found:', paramId);
      return;
    }

    // Create a function with the parameter's name as the LHS
    // For a parameter like "k = 5", create function "k = 5"
    const expression = `${param.name} = ${param.value ?? 0}`;

    // Build parameter map
    const paramMap = new Map(pm.getAllParameters().map(p => [p.name, p.id]));

    // Auto-create parameter callback
    const onCreateParameter = (name: string) => {
      const defaults = configManager.get('parameters.defaults');
      return pm.createParameter(name, 1, {
        domain: { min: defaults.min, max: defaults.max, step: defaults.step },
        uiControl: { type: 'slider', min: defaults.min, max: defaults.max, step: defaults.step },
        metadata: { source: 'auto', created: new Date().toISOString() }
      })!;
    };

    // Create the function
    const result = fm.createFunction(expression, paramMap, onCreateParameter);
    if (result && 'success' in result && !result.success) {
      console.error('Failed to convert parameter to function:', result.error || 'Unknown error');
      return;
    }

    // Delete the parameter
    pm.deleteParameter(paramId);

    // Update both states
    setParameters(pm.getAllParameters());
    setFunctionDefs(fm.getAllFunctions());
  }, []);

  const handleDemoteToParameter = useCallback((functionId: string) => {
    const fm = functionManagerRef.current;
    const pm = parameterManagerRef.current;

    // Get the function
    const func = fm.getFunction(functionId);
    if (!func) {
      console.error('Function not found:', functionId);
      return;
    }

    // Only allow demotion for 0-arity functions (no arguments)
    if (func.lhs.arity !== undefined && func.lhs.arity > 0) {
      console.error('Cannot demote function with arguments to parameter');
      return;
    }

    // Evaluate the RHS to get a numeric value
    const engine = expressionEngineRef.current;
    const evaluatedValue = engine.evaluate(func.expression);

    if (typeof evaluatedValue !== 'number') {
      console.error('Cannot demote function: RHS does not evaluate to a number');
      return;
    }

    // Create a parameter with the function's name
    const defaults = configManager.get('parameters.defaults');
    const newParam = pm.createParameter(func.lhs.name, evaluatedValue, {
      domain: {
        min: defaults.min,
        max: defaults.max,
        step: defaults.step,
      },
      uiControl: {
        type: 'number',
        min: defaults.min,
        max: defaults.max,
        step: defaults.step,
      },
      metadata: { source: 'demoted-function', created: new Date().toISOString() }
    });

    if (!newParam) {
      console.error('Failed to create parameter from function');
      return;
    }

    // Delete the function
    fm.deleteFunction(functionId);

    // Update both states
    setParameters(pm.getAllParameters());
    setFunctionDefs(fm.getAllFunctions());
  }, []);

  // Function handlers (using FunctionManager for spec compliance)
  const handleFunctionCreate = useCallback((fullExpression: string, color: string) => {
    const fm = functionManagerRef.current;
    const pm = parameterManagerRef.current;
    const ivm = independentVarManagerRef.current;

    // Build parameter map for auto-parameterization
    const paramMap = new Map(pm.getAllParameters().map(p => [p.name, p.id]));

    // Get default independent variable (x) - should already exist from constructor
    let defaultIndepVar = ivm.getVariableByName('x');
    if (!defaultIndepVar) {
      const bounds = configManager.get('scene.bounds');
      const created = ivm.createVariable('x', {
        min: bounds.xMin,
        max: bounds.xMax,
        step: DEFAULT_FUNCTION_STEP,
      });
      if (!created) {
        console.error('Failed to create default independent variable');
        return { success: false, errors: ['Failed to create default independent variable'] };
      }
      defaultIndepVar = created;
    }

    // Create function with implicit multiplication, auto-params, and anonymous plot support
    const result = fm.createFunction(
      fullExpression,
      paramMap,
      (name: string) => {
        // Auto-create parameter callback with BOTH value AND domain per spec
        const defaults = configManager.get('parameters.defaults');
        return pm.createParameter(name, 1, {
          domain: {
            min: defaults.min,
            max: defaults.max,
            step: defaults.step,
          },
          uiControl: {
            type: 'slider',
            min: defaults.min,
            max: defaults.max,
            step: defaults.step,
          },
          metadata: { source: 'auto', created: new Date().toISOString() }
        })!;
      }
    );

    if (result.success && result.function) {
      // Apply color to the created function
      result.function.style.color = color;

      // Update function definitions state
      setFunctionDefs(fm.getAllFunctions());

      // If auto-parameters were created, refresh parameter list
      if (result.autoParams?.created && result.autoParams.created.length > 0) {
        setParameters(pm.getAllParameters());
      }
    }

    return result;
  }, []);

  const handleFunctionUpdate = useCallback((id: string, updates: Partial<FunctionDefinition>) => {
    const fm = functionManagerRef.current;
    const func = fm.getFunction(id);
    if (!func) return;

    // Apply updates (style, visibility, etc.)
    if (updates.style) {
      Object.assign(func.style, updates.style);
    }
    if (updates.visible !== undefined) {
      func.visible = updates.visible;
    }

    setFunctionDefs(fm.getAllFunctions());
  }, []);

  const handleFunctionUpdateExpression = useCallback((id: string, newExpression: string) => {
    const fm = functionManagerRef.current;
    const pm = parameterManagerRef.current;

    // Build parameter map
    const paramMap = new Map(pm.getAllParameters().map(p => [p.name, p.id]));

    // Update expression with implicit multiplication and auto-param support
    const result = fm.updateExpression(
      id,
      newExpression,
      paramMap,
      (name) => {
        // Auto-create parameter callback with BOTH value AND domain per spec
        const defaults = configManager.get('parameters.defaults');
        return pm.createParameter(name, 1, {
          domain: {
            min: defaults.min,
            max: defaults.max,
            step: defaults.step,
          },
          uiControl: {
            type: 'slider',
            min: defaults.min,
            max: defaults.max,
            step: defaults.step,
          },
          metadata: { source: 'auto', created: new Date().toISOString() }
        })!;
      }
    );

    if (result.success) {
      setFunctionDefs(fm.getAllFunctions());

      // If auto-parameters were created, refresh parameter list
      if (result.autoParams?.created && result.autoParams.created.length > 0) {
        setParameters(pm.getAllParameters());
      }
    }

    return result;
  }, []);

  const handleFunctionDelete = useCallback((id: string) => {
    const fm = functionManagerRef.current;
    if (fm.deleteFunction(id)) {
      setFunctionDefs(fm.getAllFunctions());
    }
  }, []);

  const handleFunctionToggle = useCallback((id: string) => {
    const fm = functionManagerRef.current;
    const func = fm.getFunction(id);
    if (func) {
      func.visible = !func.visible;
      setFunctionDefs(fm.getAllFunctions());
    }
  }, []);

  const handleChangeIndependentVariable = useCallback((functionId: string, independentVarId: string) => {
    const fm = functionManagerRef.current;
    const func = fm.getFunction(functionId);
    if (func) {
      func.independentVarId = independentVarId;
      setFunctionDefs(fm.getAllFunctions());
    }
  }, []);

  // Timeline handlers
  const handleCreateKeyframe = useCallback((label: string | null) => {
    if (!timelineState || !camera) return;

    const km = keyframeManagerRef.current;
    const pm = parameterManagerRef.current;

    // Build snapshot from current state
    const builder = new KeyframeSnapshotBuilder();

    // Capture all parameters
    const allParams = pm.getAllParameters();
    const paramData: Record<string, { value: number; include?: boolean; easing?: string }> = {};
    allParams.forEach((p) => {
      // For now, only support scalar values in keyframes (arrays not supported yet)
      const scalarValue = typeof p.value === 'number' ? p.value : (Array.isArray(p.value) ? p.value[0] ?? 0 : 0);
      paramData[p.id] = { value: scalarValue, include: true, easing: 'smoothstep' };
    });
    builder.withParameters(paramData);

    // Capture camera
    builder.withCamera(camera.getState(), true);

    // Capture warp (default identity for now)
    builder.withWarp('identity', {}, false);

    // Create keyframe
    km.createKeyframe(timelineState.currentTime, label, builder.build());
    setKeyframes(km.getAllKeyframes());
  }, [timelineState, camera]);

  const handleUpdateKeyframe = useCallback((id: string, label: string) => {
    const km = keyframeManagerRef.current;
    if (km.updateKeyframe(id, { label })) {
      setKeyframes(km.getAllKeyframes());
    }
  }, []);

  const handleDeleteKeyframe = useCallback((id: string) => {
    const km = keyframeManagerRef.current;
    if (km.deleteKeyframe(id)) {
      setKeyframes(km.getAllKeyframes());
      if (selectedKeyframeId === id) {
        setSelectedKeyframeId(null);
      }
    }
  }, [selectedKeyframeId]);

  const handleCloneKeyframe = useCallback((id: string) => {
    if (!timelineState) return;

    const km = keyframeManagerRef.current;
    const _cloned = km.cloneKeyframe(id, timelineState.currentTime);
    if (_cloned) {
      setKeyframes(km.getAllKeyframes());
    }
  }, [timelineState]);

  const handleKeyframeMove = useCallback((id: string, newTime: number) => {
    const km = keyframeManagerRef.current;
    if (km.updateKeyframe(id, { time: newTime })) {
      setKeyframes(km.getAllKeyframes());
    }
  }, []);

  const handleTimeChange = useCallback((time: number) => {
    playbackControllerRef.current?.setCurrentTime(time);
  }, []);

  const handlePlay = useCallback(() => {
    playbackControllerRef.current?.play();
  }, []);

  const handlePause = useCallback(() => {
    playbackControllerRef.current?.pause();
  }, []);

  const handleStop = useCallback(() => {
    playbackControllerRef.current?.stop();
  }, []);

  const handleJumpToStart = useCallback(() => {
    playbackControllerRef.current?.jumpToStart();
  }, []);

  const handleJumpToEnd = useCallback(() => {
    playbackControllerRef.current?.jumpToEnd();
  }, []);

  const handleStepForward = useCallback(() => {
    playbackControllerRef.current?.stepForward();
  }, []);

  const handleStepBackward = useCallback(() => {
    playbackControllerRef.current?.stepBackward();
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    playbackControllerRef.current?.setPlaybackSpeed(speed);
  }, []);

  const handleLoopModeChange = useCallback((mode: 'once' | 'loop' | 'pingpong') => {
    playbackControllerRef.current?.setLoopMode(mode);
  }, []);

  // Desmos import handlers
  const handleImportComplete = useCallback((result: ImportResult) => {
    setShowImportDialog(false);

    if (result.success) {
      // Refresh parameter list
      setParameters(parameterManagerRef.current.getAllParameters());

      // Show success message
      const msg = `✅ Successfully imported ${result.parametersCreated} parameter${result.parametersCreated !== 1 ? 's' : ''}`;
      setImportMessage(msg);

      // Clear message after 5 seconds
      setTimeout(() => setImportMessage(null), 5000);
    } else {
      // Show error
      const msg = `❌ Import failed:\n${result.errors.join('\n')}`;
      setImportMessage(msg);
    }

    // Log warnings if any
    if (result.warnings.length > 0) {
      console.warn('Desmos import warnings:', result.warnings);
    }
  }, []);

  const handleApplyViewport = useCallback((bounds: { xMin: number; xMax: number; yMin: number; yMax: number }) => {
    // Update scene bounds from Desmos viewport
    if (camera) {
      // Use typical viewport dimensions (will be adjusted by viewport component)
      camera.fitToBounds(bounds, 1200, 800);
      const state = camera.getState();
      setCameraInfo({ x: state.x, y: state.y, zoom: state.zoom });
    }

    // Update grid config with new bounds
    setGridConfig(prev => ({
      ...prev,
      showGrid: true,
    }));

    console.log('Applied Desmos viewport bounds:', bounds);
  }, [camera]);

  // Save/Load handlers
  const handleSaveProject = useCallback((metadata: ProjectMetadata) => {
    if (!camera || !playbackControllerRef.current) return;

    try {
      const jsonString = ProjectIO.serialize(
        parameterManagerRef.current,
        keyframeManagerRef.current,
        playbackControllerRef.current,
        camera,
        functionManagerRef.current,
        independentVarManagerRef.current,
        selectedGridStyle,
        gridConfig,
        metadata,
        { pretty: true }
      );

      const filename = `${metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pkstudio`;
      ProjectIO.saveToFile(jsonString, filename);

      setProjectMetadata(metadata);
      setShowSaveLoadDialog(null);
      setImportMessage('✅ Project saved successfully!');
      setTimeout(() => setImportMessage(null), 3000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save project';
      setImportMessage(`❌ ${msg}`);
    }
  }, [camera, selectedGridStyle, gridConfig]);

  const handleLoadProject = useCallback(async (file: File) => {
    if (!camera || !playbackControllerRef.current) return;

    try {
      const project = await ProjectIO.loadFromFile(file);

      // Apply state to managers
      const sceneData = ProjectIO.applyState(
        project,
        parameterManagerRef.current,
        keyframeManagerRef.current,
        playbackControllerRef.current,
        camera,
        functionManagerRef.current,
        independentVarManagerRef.current
      );

      // Update UI state
      setParameters(parameterManagerRef.current.getAllParameters());
      setKeyframes(keyframeManagerRef.current.getAllKeyframes());
      setFunctionDefs(functionManagerRef.current.getAllFunctions());
      setSelectedGridStyle(sceneData.gridStyleId);
      setGridConfig(sceneData.gridConfig);
      setProjectMetadata(project.metadata);

      // Update camera info
      const state = camera.getState();
      setCameraInfo({ x: state.x, y: state.y, zoom: state.zoom });

      setShowSaveLoadDialog(null);
      setImportMessage(`✅ Loaded project: ${project.metadata.name}`);
      setTimeout(() => setImportMessage(null), 3000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to load project';
      setImportMessage(`❌ ${msg}`);
    }
  }, [camera]);

  // Layout manager - must be before conditional returns
  const { layout, setSidebarPosition, toggleFooter } = useLayoutManager();

  // Helper to toggle sidebar visibility
  const handleToggleSidebar = useCallback((id: SidebarId) => {
    const currentPosition = layout.sidebars[id].position;
    if (currentPosition === 'closed') {
      // Reopen to default position
      setSidebarPosition(id, layout.sidebars[id].defaultPosition);
    } else {
      // Close it
      setSidebarPosition(id, 'closed');
    }
  }, [layout, setSidebarPosition]);

  // Sidebar visibility states for toolbar
  const sidebarStates = useMemo(() => ({
    parameters: layout.sidebars.parameters.position !== 'closed',
    functions: layout.sidebars.functions.position !== 'closed',
    keyframes: layout.sidebars.keyframes.position !== 'closed',
    'visual-settings': layout.sidebars['visual-settings'].position !== 'closed',
  }), [layout]);

  // Conditional returns AFTER all hooks
  if (error) {
    return (
      <div className="app-error">
        <h1>⚠️ Configuration Error</h1>
        <p>{error}</p>
        <p>Please check that all configuration files are present in the public/config directory.</p>
      </div>
    );
  }

  if (!isConfigLoaded) {
    return (
      <div className="app-loading">
        <h1>Loading configuration...</h1>
      </div>
    );
  }

  return (
    <div className="app">
      <Toolbar
        projectName={projectMetadata.name || 'Parametric Keyframe Studio'}
        onSave={() => setShowSaveLoadDialog('save')}
        onLoad={() => setShowSaveLoadDialog('load')}
        onImport={() => setShowImportDialog(true)}
        onExportPNG={() => setShowExportDialog('png')}
        onExportManim={() => setShowExportDialog('manim')}
        onToggleSidebar={handleToggleSidebar}
        onToggleFooter={toggleFooter}
        sidebarStates={sidebarStates}
        footerVisible={layout.footerVisible}
      />

      {/* Import success/error message */}
      {importMessage && (
        <div className={`import-message ${importMessage.startsWith('✅') ? 'success' : 'error'}`}>
          {importMessage}
        </div>
      )}

      <ViewportContainer
        layout={layout}
        onSidebarPositionChange={setSidebarPosition}
        sidebarContent={{
          parameters: (
            <ParametersSidebar
              parameters={parameters}
              functions={functionDefs}
              onParameterCreate={handleParameterCreate}
              onParameterChange={handleParameterChange}
              onParameterDelete={handleParameterDelete}
              onParameterUpdateValue={handleParameterUpdateValue}
              onParameterClearValue={handleParameterClearValue}
              onParameterUpdateDomain={handleParameterUpdateDomain}
              onConvertToFunction={handleConvertToFunction}
            />
          ),
          functions: (
            <FunctionsSidebar
              functions={functionDefs}
              independentVariables={independentVarManagerRef.current.getAllVariables()}
              onFunctionCreate={handleFunctionCreate}
              onFunctionUpdate={handleFunctionUpdate}
              onFunctionUpdateExpression={handleFunctionUpdateExpression}
              onFunctionDelete={handleFunctionDelete}
              onFunctionToggle={handleFunctionToggle}
              onChangeIndependentVariable={handleChangeIndependentVariable}
              onDemoteToParameter={handleDemoteToParameter}
            />
          ),
          keyframes: (
            <KeyframesSidebar
              keyframes={keyframes}
              selectedKeyframeId={selectedKeyframeId}
              currentTime={timelineState?.currentTime ?? 0}
              onCreateKeyframe={handleCreateKeyframe}
              onUpdateKeyframe={handleUpdateKeyframe}
              onDeleteKeyframe={handleDeleteKeyframe}
              onCloneKeyframe={handleCloneKeyframe}
              onSelectKeyframe={setSelectedKeyframeId}
            />
          ),
          'visual-settings': (
            <VisualSettingsSidebar
              camera={camera}
              cameraInfo={cameraInfo}
              onResetCamera={handleResetCamera}
              onCameraXChange={handleCameraXChange}
              onCameraYChange={handleCameraYChange}
              onCameraZoomChange={handleCameraZoomChange}
              gridConfig={gridConfig}
              onGridConfigChange={setGridConfig}
              currentRenderer={currentRenderer}
              onRendererChange={setCurrentRenderer}
              manimAvailable={manimAvailable}
              rendererStats={rendererStats}
              complexMode={complexMode}
              onComplexModeChange={setComplexMode}
            />
          ),
        }}
        viewportContent={
          <Viewport
            gridStyleId={selectedGridStyle}
            gridConfig={gridConfig}
            functions={plottedFunctions}
            parameterValues={parameterValues}
            renderer={currentRenderer}
            onCameraChange={handleCameraChange}
            onCanvasReady={(canvas) => {
              viewportCanvasRef.current = canvas;
            }}
            onRendererStatsUpdate={setRendererStats}
          />
        }
        footerContent={
          timelineState ? (
            <>
              <TimelineControls
                timelineState={timelineState}
                onPlay={handlePlay}
                onPause={handlePause}
                onStop={handleStop}
                onJumpToStart={handleJumpToStart}
                onJumpToEnd={handleJumpToEnd}
                onStepForward={handleStepForward}
                onStepBackward={handleStepBackward}
                onSpeedChange={handleSpeedChange}
                onLoopModeChange={handleLoopModeChange}
              />
              <TimelineView
                timelineState={timelineState}
                keyframes={keyframes}
                onTimeChange={handleTimeChange}
                onKeyframeSelect={setSelectedKeyframeId}
                onKeyframeMove={handleKeyframeMove}
                selectedKeyframeId={selectedKeyframeId}
              />
            </>
          ) : null
        }
      />

      {/* Desmos Import Dialog */}
      {showImportDialog && (
        <DesmosImportDialog
          parameterManager={parameterManagerRef.current}
          onImportComplete={handleImportComplete}
          onClose={() => setShowImportDialog(false)}
          onApplyViewport={handleApplyViewport}
        />
      )}

      {/* Save/Load Dialog */}
      {showSaveLoadDialog && (
        <SaveLoadDialog
          mode={showSaveLoadDialog}
          currentMetadata={projectMetadata}
          onSave={handleSaveProject}
          onLoad={handleLoadProject}
          onClose={() => setShowSaveLoadDialog(null)}
        />
      )}

      {/* Export Dialogs */}
      {showExportDialog === 'png' && (
        <ExportDialog
          canvas={viewportCanvasRef.current}
          onClose={() => setShowExportDialog(null)}
          onExport={(filename) => {
            setImportMessage(`✅ Exported: ${filename}`);
            setTimeout(() => setImportMessage(null), 3000);
          }}
        />
      )}

      {showExportDialog === 'manim' && camera && (
        <ManimExportDialog
          keyframes={keyframes}
          parameters={parameters}
          functions={functionDefs}
          camera={camera.getState()}
          projectName={projectMetadata.name || 'animation'}
          onClose={() => setShowExportDialog(null)}
          onExport={(_scriptContent, filename) => {
            setImportMessage(`✅ Generated Manim script: ${filename}`);
            setTimeout(() => setImportMessage(null), 3000);
          }}
        />
      )}
    </div>
  );
}

export default App;
