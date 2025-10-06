import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { configManager } from './config/ConfigManager';
import { DEFAULT_FUNCTION_STEP } from './constants';
import { ParameterPanel } from './ui/ParameterPanel';
import { FunctionPanelNew } from './ui/FunctionPanelNew';
import { GridConfigPanel } from './ui/GridConfigPanel';
import { TimelineView } from './ui/TimelineView';
import { TimelineControls } from './ui/TimelineControls';
import { KeyframePanel } from './ui/KeyframePanel';
import { DesmosImportDialog } from './ui/DesmosImportDialog';
import { SaveLoadDialog } from './ui/SaveLoadDialog';
import { ExportDialog } from './ui/ExportDialog';
import { ManimExportDialog } from './ui/ManimExportDialog';
import { RendererToggle, type RendererType } from './ui/RendererToggle';
import { Viewport } from './scene/Viewport';
import { ValueControl } from './ui/ValueControl';
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
  }, [functionDefs]);

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
      const scalarValue = typeof p.value === 'number' ? p.value : p.value[0] ?? 0;
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
      <header className="app-header">
        <div>
          <h1>Parametric Keyframe Studio</h1>
          <p className="subtitle">Phase 8: Save/Load + Full MVP</p>
        </div>
        <div className="header-buttons">
          <button
            className="header-button"
            onClick={() => setShowSaveLoadDialog('save')}
            title="Save Project"
          >
            💾 Save
          </button>
          <button
            className="header-button"
            onClick={() => setShowSaveLoadDialog('load')}
            title="Load Project"
          >
            📂 Load
          </button>
          <button
            className="header-button import-button"
            onClick={() => setShowImportDialog(true)}
            title="Import from Desmos JSON"
          >
            📥 Import
          </button>
          <button
            className="header-button"
            onClick={() => setShowExportDialog('png')}
            title="Export current frame as PNG"
          >
            📸 PNG
          </button>
          <button
            className="header-button"
            onClick={() => setShowExportDialog('manim')}
            title="Export animation as Manim script"
          >
            🎬 Manim
          </button>
          <Link to="/docs" className="header-button docs-link" title="View Documentation">
            📖 Docs
          </Link>
        </div>
      </header>

      {/* Import success/error message */}
      {importMessage && (
        <div className={`import-message ${importMessage.startsWith('✅') ? 'success' : 'error'}`}>
          {importMessage}
        </div>
      )}

      <div className="app-content">
        <aside className="sidebar-left">
          <ParameterPanel
            parameters={parameters}
            functions={functionDefs}
            onParameterCreate={handleParameterCreate}
            onParameterChange={handleParameterChange}
            onParameterDelete={handleParameterDelete}
            onParameterUpdateValue={handleParameterUpdateValue}
          />
        </aside>

        <main className="main-content viewport-main">
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
          <RendererToggle
            currentRenderer={currentRenderer}
            onRendererChange={setCurrentRenderer}
            manimAvailable={manimAvailable}
            cacheStats={rendererStats.cacheStats}
            latencyMs={rendererStats.latencyMs}
          />
        </main>

        <aside className="sidebar-right">
          <KeyframePanel
            keyframes={keyframes}
            selectedKeyframeId={selectedKeyframeId}
            currentTime={timelineState?.currentTime ?? 0}
            onCreateKeyframe={handleCreateKeyframe}
            onUpdateKeyframe={handleUpdateKeyframe}
            onDeleteKeyframe={handleDeleteKeyframe}
            onCloneKeyframe={handleCloneKeyframe}
            onSelectKeyframe={setSelectedKeyframeId}
          />

          <FunctionPanelNew
            functions={functionDefs}
            independentVariables={independentVarManagerRef.current.getAllVariables()}
            onFunctionCreate={handleFunctionCreate}
            onFunctionUpdate={handleFunctionUpdate}
            onFunctionUpdateExpression={handleFunctionUpdateExpression}
            onFunctionDelete={handleFunctionDelete}
            onFunctionToggle={handleFunctionToggle}
            onChangeIndependentVariable={handleChangeIndependentVariable}
          />

          <GridConfigPanel
            config={gridConfig}
            onChange={setGridConfig}
          />

          <div className="controls-section">
            <h3>Camera Controls</h3>

            <div className="control-group">
              <button className="reset-button" onClick={handleResetCamera}>
                Reset Camera
              </button>
            </div>

            <div className="camera-controls">
              <h4>Position</h4>
              <ValueControl
                label="X"
                value={cameraInfo.x}
                onChange={handleCameraXChange}
                showSlider={false}
                stepAmount={1}
                precision={2}
              />
              <ValueControl
                label="Y"
                value={cameraInfo.y}
                onChange={handleCameraYChange}
                showSlider={false}
                stepAmount={1}
                precision={2}
              />
              <ValueControl
                label="Zoom"
                value={cameraInfo.zoom}
                onChange={handleCameraZoomChange}
                min={configManager.get<number>('camera.zoomMin')}
                max={configManager.get<number>('camera.zoomMax')}
                showSlider={true}
                step={0.1}
                stepAmount={0.5}
                precision={2}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Timeline Section */}
      {timelineState && (
        <footer className="timeline-section">
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
        </footer>
      )}

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
