import { useState, useEffect } from 'react';
import {
  Sliders,
  Home,
  Trash2,
  LineChart,
  Target,
  Activity,
  Zap,
  Play,
  Pause,
  Shuffle,
  Ruler,
  PenTool,
  Scissors,
  Eye,
  EyeOff,
  Grid,
  RotateCcw,
} from 'lucide-react';
import { Pivot, TrajectoryPoint } from '../types';
 
interface SidebarRightProps {
  activeTab?: 'MG996R' | 'ST3215';
  angleA1: number;
  angleA2: number;
  onAngleA1Change: (val: number) => void;
  onAngleA2Change: (val: number) => void;
  pivots: Pivot[];
  solvedPositions: Record<string, { x: number; y: number; z: number }> | null;
  simEditorOpen: boolean;
  onToggleSimEditor: () => void;
  // Trail Management
  onClearTrail: () => void;
  trajectory: TrajectoryPoint[];
  // Home Settings
  onSetHome: () => void;
  onGoToHome: () => void;
  homeA1: number;
  homeA2: number;
  // Gait simulation
  gaitRunning: boolean;
  onToggleGaitSim: () => void;
  // Set Target enhancements
  setTargetMode: boolean;
  onToggleSetTargetMode: () => void;
  isTargetUnreachable: boolean;
  hasTarget: boolean;
  onResetTarget: () => void;
  ikSpeed: number;
  onChangeIkSpeed: (val: number) => void;
  originalFootPos?: { x: number; y: number } | null;
  // Limits
  limitA1Min: number;
  limitA1Max: number;
  limitA2Min: number;
  limitA2Max: number;
  onLimitA1MinChange: (val: number) => void;
  onLimitA1MaxChange: (val: number) => void;
  onLimitA2MinChange: (val: number) => void;
  onLimitA2MaxChange: (val: number) => void;
  // Elevated CAD/HUD Props
  cadTool: 'none' | 'construction_p1' | 'construction_p2' | 'delete' | 'angle_seg1' | 'angle_seg2' | 'angle_drag';
  onCadToolChange: (val: 'none' | 'construction_p1' | 'construction_p2' | 'delete' | 'angle_seg1' | 'angle_seg2' | 'angle_drag') => void;
  dimMode: 'idle' | 'p1' | 'p2' | 'seg_selected' | 'drag';
  onDimModeChange: (val: 'idle' | 'p1' | 'p2' | 'seg_selected' | 'drag') => void;
  showActuatorLabels: boolean;
  onShowActuatorLabelsChange: (val: boolean) => void;
  showSpacingLabels: boolean;
  onShowSpacingLabelsChange: (val: boolean) => void;
  showLengthLabels: boolean;
  onShowLengthLabelsChange: (val: boolean) => void;
  showCustomDimLabels: boolean;
  onShowCustomDimLabelsChange: (val: boolean) => void;
  showToeTipLabel: boolean;
  onShowToeTipLabelChange: (val: boolean) => void;
  showDisplaySettings: boolean;
  onShowDisplaySettingsChange: (val: boolean) => void;
  dimensions: any;
  onDimensionChange: (key: string, val: number) => void;
  onRestoreDefaultAnnotations?: () => void;
}
 
export default function SidebarRight({
  activeTab = 'MG996R',
  angleA1,
  angleA2,
  onAngleA1Change,
  onAngleA2Change,
  pivots,
  solvedPositions,
  simEditorOpen,
  onToggleSimEditor,
  onClearTrail,
  trajectory,
  onSetHome,
  onGoToHome,
  homeA1,
  homeA2,
  gaitRunning,
  onToggleGaitSim,
  setTargetMode,
  onToggleSetTargetMode,
  isTargetUnreachable,
  hasTarget,
  onResetTarget,
  ikSpeed,
  onChangeIkSpeed,
  originalFootPos,
  limitA1Min,
  limitA1Max,
  limitA2Min,
  limitA2Max,
  onLimitA1MinChange,
  onLimitA1MaxChange,
  onLimitA2MinChange,
  onLimitA2MaxChange,
  cadTool,
  onCadToolChange,
  dimMode,
  onDimModeChange,
  showActuatorLabels,
  onShowActuatorLabelsChange,
  showSpacingLabels,
  onShowSpacingLabelsChange,
  showLengthLabels,
  onShowLengthLabelsChange,
  showCustomDimLabels,
  onShowCustomDimLabelsChange,
  showToeTipLabel,
  onShowToeTipLabelChange,
  showDisplaySettings,
  onShowDisplaySettingsChange,
  dimensions,
  onDimensionChange,
  onRestoreDefaultAnnotations,
}: SidebarRightProps) {
  // Simulate vertical foot weight (in Newtons) for Torque transpose calculations
  const [testPayload, setTestPayload] = useState(12);

  // Local string state to handle typing decimals and negatives naturally without interference
  const [localA1, setLocalA1] = useState(angleA1.toFixed(1));
  const [localA2, setLocalA2] = useState(angleA2.toFixed(1));

  // Local limit states
  const [localLimitA1Min, setLocalLimitA1Min] = useState(String(limitA1Min));
  const [localLimitA1Max, setLocalLimitA1Max] = useState(String(limitA1Max));
  const [localLimitA2Min, setLocalLimitA2Min] = useState(String(limitA2Min));
  const [localLimitA2Max, setLocalLimitA2Max] = useState(String(limitA2Max));

  const [localSpeedStr, setLocalSpeedStr] = useState(String(ikSpeed));

  useEffect(() => {
    setLocalSpeedStr(String(ikSpeed));
  }, [ikSpeed]);

  const handleLocalSpeedChange = (valStr: string) => {
    setLocalSpeedStr(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed >= 5 && parsed <= 500) {
      onChangeIkSpeed(parsed);
    }
  };

  const handleSpeedBlur = () => {
    const parsed = parseFloat(localSpeedStr);
    if (isNaN(parsed) || parsed < 5) {
      onChangeIkSpeed(5);
      setLocalSpeedStr("5");
    } else if (parsed > 500) {
      onChangeIkSpeed(500);
      setLocalSpeedStr("500");
    } else {
      onChangeIkSpeed(parsed);
      setLocalSpeedStr(String(parsed));
    }
  };

  // Keep local values in sync when angle changes from sliders or IK/Gait loops
  useEffect(() => {
    setLocalA1(angleA1.toFixed(1));
  }, [angleA1]);

  useEffect(() => {
    setLocalA2(angleA2.toFixed(1));
  }, [angleA2]);

  // Keep local limits in sync when props change
  useEffect(() => { setLocalLimitA1Min(String(limitA1Min)); }, [limitA1Min]);
  useEffect(() => { setLocalLimitA1Max(String(limitA1Max)); }, [limitA1Max]);
  useEffect(() => { setLocalLimitA2Min(String(limitA2Min)); }, [limitA2Min]);
  useEffect(() => { setLocalLimitA2Max(String(limitA2Max)); }, [limitA2Max]);

  const handleLocalA1Change = (valStr: string) => {
    setLocalA1(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      onAngleA1Change(parsed);
    }
  };

  const handleLocalA2Change = (valStr: string) => {
    setLocalA2(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      onAngleA2Change(parsed);
    }
  };

  const handleA1Blur = () => {
    setLocalA1(angleA1.toFixed(1));
  };

  const handleA2Blur = () => {
    setLocalA2(angleA2.toFixed(1));
  };

  const handleLimitA1MinChange = (valStr: string) => {
    setLocalLimitA1Min(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      onLimitA1MinChange(parsed);
    }
  };

  const handleLimitA1MaxChange = (valStr: string) => {
    setLocalLimitA1Max(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      onLimitA1MaxChange(parsed);
    }
  };

  const handleLimitA2MinChange = (valStr: string) => {
    setLocalLimitA2Min(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      onLimitA2MinChange(parsed);
    }
  };

  const handleLimitA2MaxChange = (valStr: string) => {
    setLocalLimitA2Max(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed)) {
      onLimitA2MaxChange(parsed);
    }
  };

  const handleLimitA1MinBlur = () => {
    if (isNaN(parseFloat(localLimitA1Min))) {
      setLocalLimitA1Min(String(limitA1Min));
    }
  };

  const handleLimitA1MaxBlur = () => {
    if (isNaN(parseFloat(localLimitA1Max))) {
      setLocalLimitA1Max(String(limitA1Max));
    }
  };

  const handleLimitA2MinBlur = () => {
    if (isNaN(parseFloat(localLimitA2Min))) {
      setLocalLimitA2Min(String(limitA2Min));
    }
  };

  const handleLimitA2MaxBlur = () => {
    if (isNaN(parseFloat(localLimitA2Max))) {
      setLocalLimitA2Max(String(limitA2Max));
    }
  };

  // Local string states for actuator coordinates
  const [localA1x, setLocalA1x] = useState(String(dimensions?.a1x !== undefined ? dimensions.a1x : 0.0));
  const [localA1y, setLocalA1y] = useState(String(dimensions?.a1y !== undefined ? dimensions.a1y : 0.0));
  const [localA2x, setLocalA2x] = useState(String(dimensions?.a2x !== undefined ? dimensions.a2x : (dimensions?.dx_actuators ?? 20.0)));
  const [localA2y, setLocalA2y] = useState(String(dimensions?.a2y !== undefined ? dimensions.a2y : (dimensions?.dy_actuators ?? 21.0)));

  useEffect(() => {
    setLocalA1x(String(dimensions?.a1x !== undefined ? dimensions.a1x : 0.0));
  }, [dimensions?.a1x]);

  useEffect(() => {
    setLocalA1y(String(dimensions?.a1y !== undefined ? dimensions.a1y : 0.0));
  }, [dimensions?.a1y]);

  useEffect(() => {
    setLocalA2x(String(dimensions?.a2x !== undefined ? dimensions.a2x : (dimensions?.dx_actuators ?? 20.0)));
  }, [dimensions?.a2x, dimensions?.dx_actuators]);

  useEffect(() => {
    setLocalA2y(String(dimensions?.a2y !== undefined ? dimensions.a2y : (dimensions?.dy_actuators ?? 21.0)));
  }, [dimensions?.a2y, dimensions?.dy_actuators]);

  const handleA1xChange = (valStr: string) => {
    setLocalA1x(valStr);
  };

  const handleA1yChange = (valStr: string) => {
    setLocalA1y(valStr);
  };

  const handleA2xChange = (valStr: string) => {
    setLocalA2x(valStr);
  };

  const handleA2yChange = (valStr: string) => {
    setLocalA2y(valStr);
  };

  const handleA1xBlur = () => {
    const defaultVal = dimensions?.a1x !== undefined ? dimensions.a1x : 0.0;
    const parsed = parseFloat(localA1x);
    if (isNaN(parsed)) {
      setLocalA1x(String(defaultVal));
    } else {
      onDimensionChange('a1x', parsed);
    }
  };

  const handleA1yBlur = () => {
    const defaultVal = dimensions?.a1y !== undefined ? dimensions.a1y : 0.0;
    const parsed = parseFloat(localA1y);
    if (isNaN(parsed)) {
      setLocalA1y(String(defaultVal));
    } else {
      onDimensionChange('a1y', parsed);
    }
  };

  const handleA2xBlur = () => {
    const defaultVal = dimensions?.a2x !== undefined ? dimensions.a2x : (dimensions?.dx_actuators ?? 20.0);
    const parsed = parseFloat(localA2x);
    if (isNaN(parsed)) {
      setLocalA2x(String(defaultVal));
    } else {
      onDimensionChange('a2x', parsed);
    }
  };

  const handleA2yBlur = () => {
    const defaultVal = dimensions?.a2y !== undefined ? dimensions.a2y : (dimensions?.dy_actuators ?? 21.0);
    const parsed = parseFloat(localA2y);
    if (isNaN(parsed)) {
      setLocalA2y(String(defaultVal));
    } else {
      onDimensionChange('a2y', parsed);
    }
  };

  const footPos = solvedPositions?.['P_foot'] || null;

  // Compute static joint torques using Transpose Jacobian
  // Assuming a holding load F = (0, -testPayload) N (downward pull)
  let torqueA1 = 0;
  let torqueA2 = 0;

  if (solvedPositions) {
    const t2_rad = (angleA2 * Math.PI) / 180;
    // Calculate Chank angle derivative reference
    // Chank TR direction approx TR - A2
    const pA2 = solvedPositions['A2'];
    const pTR = solvedPositions['P_chank_TR'];
    if (pA2 && pTR) {
      const dx_tr = pTR.x - pA2.x;
      const dy_tr = pTR.y - pA2.y;
      const psi_chank = Math.atan2(dy_tr, dx_tr); // angle of TR pivot relative to A2

      // Jacobian elements for F_y (vertical load):
      // J_12 (dY/d_theta2) = L_femur * cos(theta2)
      // J_22 (dY/d_chank) = - L_femur * cos(psi_chank)
      const L_femur = dimensions?.L_femur_servo ?? 60.0;
      const J_12 = L_femur * Math.cos(t2_rad);
      const J_22 = -L_femur * Math.cos(psi_chank);

      // Torque = J^T * F_col. Since F_x = 0, and F_y = -testPayload (in N):
      // Torques are in N*mm. Divide by 1000 to get N*m (Newton-meters)
      torqueA2 = Math.abs((J_12 * -testPayload) / 1000);
      torqueA1 = Math.abs((J_22 * -testPayload) / 1000);
    }
  }

  // Clamping torque percentage (max rated MG996R / ST3215 capacity)
  const torqueA1KgCm = torqueA1 * 10.19716;
  const torqueA2KgCm = torqueA2 * 10.19716;
  const maxRatedTorqueKgCm = activeTab === 'ST3215' ? 30.0 : 11.0;
  const torqueA1Pct = Math.min(100, (torqueA1KgCm / maxRatedTorqueKgCm) * 100);
  const torqueA2Pct = Math.min(100, (torqueA2KgCm / maxRatedTorqueKgCm) * 100);

  return (
    <div className="w-80 bg-sleek-aside border-l border-sleek-border flex flex-col h-full text-sleek-text" id="sidebar-right-root">
      {/* Title Header */}
      <div className="p-4 border-b border-sleek-border bg-sleek-header flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-sleek-blue flex items-center justify-center shadow-sm">
          <Sliders className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold tracking-wider text-sleek-text uppercase">TELEMETRY & CONTROLS</h1>
          <p className="text-[10px] text-sleek-text-muted font-mono mt-0.5 uppercase tracking-widest">ACTUATOR DRIVERS {activeTab}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {/* Sliders Driver Panel */}
        <div className="p-4 bg-sleek-subcard border border-sleek-border rounded-xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sleek-text flex items-center gap-1.5 uppercase tracking-wider font-mono">
              <Activity className="w-3.5 h-3.5 text-sleek-blue animate-pulse" /> Servo Driver Board
            </span>
            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25 font-bold">
              ● ACTIVE
            </span>
          </div>

          <div className="flex gap-2 font-mono">
            <button
              onClick={onToggleSimEditor}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                simEditorOpen
                  ? 'bg-sleek-blue hover:bg-blue-600 text-white shadow-sm font-bold'
                  : 'bg-sleek-subcard border border-sleek-border text-sleek-text hover:bg-sleek-border/20'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> {simEditorOpen ? 'Sim Editor Edit' : 'Sim Editor'}
            </button>
            <button
              onClick={onToggleGaitSim}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                gaitRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm font-bold'
                  : 'bg-sleek-subcard border border-sleek-border text-sleek-text hover:bg-sleek-border/20'
              }`}
            >
              {gaitRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />} Sim Gait
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 font-mono">
            <button
              onClick={onToggleSetTargetMode}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                setTargetMode
                  ? 'bg-red-600 border-red-700 text-white shadow-md animate-pulse'
                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40 dark:border-red-500/25'
              }`}
              title="Click here, then click anywhere on the 2D canvas to place a targets"
            >
              <Target className={`w-3.5 h-3.5 ${setTargetMode ? 'text-white' : 'text-red-500'}`} /> {setTargetMode ? 'Cancel Set' : 'Set Target'}
            </button>
            <button
              onClick={onResetTarget}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                hasTarget
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700 shadow-sm'
                  : 'bg-transparent text-sleek-text-muted/40 border-sleek-border/20 cursor-not-allowed'
              }`}
              disabled={!hasTarget}
            >
              <Trash2 className="w-3.5 h-3.5" /> Reset Target
            </button>
          </div>

          {/* Interpolation / Glide Speed controls */}
          <div className="p-3 bg-slate-100/40 dark:bg-slate-800/20 border border-sleek-border/40 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-sleek-text-muted font-sans font-medium flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-emerald-500" /> Glide Speed
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={localSpeedStr}
                  onChange={(e) => handleLocalSpeedChange(e.target.value)}
                  onBlur={handleSpeedBlur}
                  className="w-12 text-center bg-sleek-subcard border border-sleek-border/80 rounded py-0.5 text-xs text-emerald-500 font-bold font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-sleek-text-muted font-mono">mm/s</span>
              </div>
            </div>
            
            <input
              type="range"
              min="5"
              max="300"
              step="5"
              value={ikSpeed > 300 ? 300 : ikSpeed}
              onChange={(e) => onChangeIkSpeed(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
            />
            
            <div className="flex justify-between text-[8.5px] text-sleek-text-muted/65 font-mono">
              <span>Cinematic (5)</span>
              <span>Robot Default (80)</span>
              <span>Limit (300)</span>
            </div>
          </div>

          {/* Real-time Toe Tip Translation Telemetry */}
          {hasTarget && originalFootPos && solvedPositions && solvedPositions['P_foot'] && (
            <div className="p-3 bg-slate-100/40 dark:bg-slate-800/20 border border-sleek-border/40 rounded-xl space-y-2 font-mono text-xs">
              <div className="text-[10px] text-sleek-text-muted/80 uppercase tracking-wider font-sans font-bold flex items-center gap-1.5 border-b border-sleek-border/30 pb-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Toe Tip Translation Telemetry
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-sleek-subcard border border-sleek-border/30 rounded p-1.5 text-center">
                  <div className="text-[8px] text-orange-500 font-bold uppercase tracking-wide">ΔX (Horiz)</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {(solvedPositions['P_foot'].x - originalFootPos.x).toFixed(1)} <span className="text-[8px] font-normal text-slate-400">mm</span>
                  </div>
                </div>
                <div className="bg-sleek-subcard border border-sleek-border/30 rounded p-1.5 text-center">
                  <div className="text-[8px] text-cyan-500 font-bold uppercase tracking-wide">ΔY (Vert)</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {(solvedPositions['P_foot'].y - originalFootPos.y).toFixed(1)} <span className="text-[8px] font-normal text-slate-400">mm</span>
                  </div>
                </div>
                <div className="bg-sleek-subcard border border-sleek-border/30 rounded p-1.5 text-center">
                  <div className="text-[8px] text-pink-500 font-bold uppercase tracking-wide">ΔC (Total)</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {Math.hypot(
                      solvedPositions['P_foot'].x - originalFootPos.x,
                      solvedPositions['P_foot'].y - originalFootPos.y
                    ).toFixed(1)} <span className="text-[8px] font-normal text-slate-400">mm</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actuator Origins/Coordinates configuration block */}
          <div className="p-3 bg-slate-100/40 dark:bg-slate-800/20 border border-sleek-border/40 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs text-sleek-text/90 font-bold uppercase tracking-wider font-sans border-b border-sleek-border/30 pb-1.5">
              <Grid className="w-3.5 h-3.5 text-sleek-blue" /> Origin Coordinates (mm)
            </div>
            
            <div className="space-y-3.5">
              {/* Tibia Actuator A1 */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-sleek-text-muted">A1 (Tibia Servo)</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex items-center bg-sleek-subcard border border-sleek-border/80 hover:border-sleek-border rounded-xl px-2.5 py-1.5">
                    <span className="text-[10px] text-sleek-text-muted/60 font-bold mr-2 select-none">X</span>
                    <input
                      type="text"
                      className="w-full bg-transparent font-bold text-center text-sleek-text focus:outline-none"
                      value={localA1x}
                      onChange={(e) => handleA1xChange(e.target.value)}
                      onBlur={handleA1xBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center bg-sleek-subcard border border-sleek-border/80 hover:border-sleek-border rounded-xl px-2.5 py-1.5">
                    <span className="text-[10px] text-sleek-text-muted/60 font-bold mr-2 select-none">Y</span>
                    <input
                      type="text"
                      className="w-full bg-transparent font-bold text-center text-sleek-text focus:outline-none"
                      value={localA1y}
                      onChange={(e) => handleA1yChange(e.target.value)}
                      onBlur={handleA1yBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Femur Actuator A2 */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-sleek-text-muted">A2 (Femur Servo)</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex items-center bg-sleek-subcard border border-sleek-border/80 hover:border-sleek-border rounded-xl px-2.5 py-1.5">
                    <span className="text-[10px] text-sleek-text-muted/60 font-bold mr-2 select-none">X</span>
                    <input
                      type="text"
                      className="w-full bg-transparent font-bold text-center text-sleek-text focus:outline-none"
                      value={localA2x}
                      onChange={(e) => handleA2xChange(e.target.value)}
                      onBlur={handleA2xBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center bg-sleek-subcard border border-sleek-border/80 hover:border-sleek-border rounded-xl px-2.5 py-1.5">
                    <span className="text-[10px] text-sleek-text-muted/60 font-bold mr-2 select-none">Y</span>
                    <input
                      type="text"
                      className="w-full bg-transparent font-bold text-center text-sleek-text focus:outline-none"
                      value={localA2y}
                      onChange={(e) => handleA2yChange(e.target.value)}
                      onBlur={handleA2yBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actuator Sliders (Disabled in editor or Gait mode to avoid state fighting) */}
          <div className="space-y-4">
            {/* Actuator A1 Slider */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-sleek-text/80 font-semibold font-sans">MG996R Tibia Servo (A1)</span>
                <div className="flex items-center gap-0.5 font-mono text-sleek-blue border border-sleek-border px-1.5 rounded-md py-0.5 font-bold bg-sleek-subcard shadow-sm hover:border-sleek-border/80 focus-within:border-sleek-blue transition-all">
                  <input
                    type="text"
                    value={localA1}
                    disabled={gaitRunning}
                    onChange={(e) => handleLocalA1Change(e.target.value)}
                    onBlur={handleA1Blur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-12 text-right bg-transparent focus:outline-none p-0 text-sleek-blue font-bold text-xs"
                  />
                  <span className="text-[10px] text-sleek-blue/70">°</span>
                </div>
              </div>
              <input
                type="range"
                min={limitA1Min}
                max={limitA1Max}
                step="0.5"
                value={angleA1}
                disabled={gaitRunning}
                onChange={(e) => onAngleA1Change(Number(e.target.value))}
                className="w-full accent-sleek-blue cursor-pointer disabled:opacity-45"
              />
              <div className="flex justify-between items-center gap-2 text-[10px] text-sleek-text-muted border border-sleek-border/30 rounded-lg p-1 transition-all">
                <div className="flex items-center gap-1 px-1.5 py-1 focus-within:text-sleek-blue transition-colors flex-1 min-w-0 justify-center">
                  <span className="font-semibold text-[8px] uppercase tracking-wider text-sleek-text-muted/75 shrink-0">Min:</span>
                  <input
                    type="text"
                    value={localLimitA1Min}
                    onChange={(e) => handleLimitA1MinChange(e.target.value)}
                    onBlur={handleLimitA1MinBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-10 text-center bg-transparent focus:outline-none p-0 text-sleek-text font-bold text-xs"
                  />
                  <span className="text-[9px] text-sleek-text-muted/60 shrink-0">°</span>
                </div>
                <div className="h-4 w-px bg-sleek-border/20 shrink-0" />
                <div className="flex items-center gap-1 px-1.5 py-1 focus-within:text-sleek-blue transition-colors flex-1 min-w-0 justify-center">
                  <span className="font-semibold text-[8px] uppercase tracking-wider text-sleek-text-muted/75 shrink-0">Max:</span>
                  <input
                    type="text"
                    value={localLimitA1Max}
                    onChange={(e) => handleLimitA1MaxChange(e.target.value)}
                    onBlur={handleLimitA1MaxBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-10 text-center bg-transparent focus:outline-none p-0 text-sleek-text font-bold text-xs"
                  />
                  <span className="text-[9px] text-sleek-text-muted/60 shrink-0">°</span>
                </div>
              </div>
            </div>

            {/* Actuator A2 Slider */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-sleek-text/80 font-semibold font-sans">MG996R Femur Servo (A2)</span>
                <div className="flex items-center gap-0.5 font-mono text-sleek-blue border border-sleek-border px-1.5 rounded-md py-0.5 font-bold bg-sleek-subcard shadow-sm hover:border-sleek-border/80 focus-within:border-sleek-blue transition-all">
                  <input
                    type="text"
                    value={localA2}
                    disabled={gaitRunning}
                    onChange={(e) => handleLocalA2Change(e.target.value)}
                    onBlur={handleA2Blur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-12 text-right bg-transparent focus:outline-none p-0 text-sleek-blue font-bold text-xs"
                  />
                  <span className="text-[10px] text-sleek-blue/70">°</span>
                </div>
              </div>
              <input
                type="range"
                min={limitA2Min}
                max={limitA2Max}
                step="0.5"
                value={angleA2}
                disabled={gaitRunning}
                onChange={(e) => onAngleA2Change(Number(e.target.value))}
                className="w-full accent-sleek-blue cursor-pointer disabled:opacity-45"
              />
              <div className="flex justify-between items-center gap-2 text-[10px] text-sleek-text-muted border border-sleek-border/30 rounded-lg p-1 transition-all">
                <div className="flex items-center gap-1 px-1.5 py-1 focus-within:text-sleek-blue transition-colors flex-1 min-w-0 justify-center">
                  <span className="font-semibold text-[8px] uppercase tracking-wider text-sleek-text-muted/75 shrink-0">Min:</span>
                  <input
                    type="text"
                    value={localLimitA2Min}
                    onChange={(e) => handleLimitA2MinChange(e.target.value)}
                    onBlur={handleLimitA2MinBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-10 text-center bg-transparent focus:outline-none p-0 text-sleek-text font-bold text-xs"
                  />
                  <span className="text-[9px] text-[#A0A0A0]/60 shrink-0">°</span>
                </div>
                <div className="h-4 w-px bg-sleek-border/20 shrink-0" />
                <div className="flex items-center gap-1 px-1.5 py-1 focus-within:text-sleek-blue transition-colors flex-1 min-w-0 justify-center">
                  <span className="font-semibold text-[8px] uppercase tracking-wider text-sleek-text-muted/75 shrink-0">Max:</span>
                  <input
                    type="text"
                    value={localLimitA2Max}
                    onChange={(e) => handleLimitA2MaxChange(e.target.value)}
                    onBlur={handleLimitA2MaxBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-10 text-center bg-transparent focus:outline-none p-0 text-sleek-text font-bold text-xs"
                  />
                  <span className="text-[9px] text-[#A0A0A0]/60 shrink-0">°</span>
                </div>
              </div>
            </div>
          </div>

          {/* Home Position Management */}
          <div className="pt-3 border-t border-sleek-border/60 grid grid-cols-2 gap-2 text-xs font-semibold font-mono">
            <button
               onClick={onSetHome}
               className="py-1.5 px-2.5 rounded-lg border border-sleek-border bg-sleek-subcard hover:bg-sleek-border/10 text-sleek-text flex items-center justify-center gap-1.5 transition-all cursor-pointer"
             >
               Set Home
             </button>
             <button
               onClick={onGoToHome}
               className="py-1.5 px-2.5 rounded-lg bg-sleek-blue hover:bg-blue-600 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
             >
               <Home className="w-3.5 h-3.5" /> Go to Home
             </button>
          </div>
        </div>

        {/* CAD & Display Settings Card */}
        <div className="p-4 bg-sleek-subcard border border-sleek-border rounded-xl space-y-4 shadow-sm" id="cad-controls-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sleek-text flex items-center gap-1.5 uppercase tracking-wider font-mono">
              <Ruler className="w-3.5 h-3.5 text-blue-500" /> CAD & Measurement Controls
            </span>
          </div>

          <div className="flex flex-col gap-2 font-mono">
            {/* Smart Dimension Button */}
            <button
              onClick={() => {
                if (dimMode !== 'idle' || cadTool === 'angle_seg1' || cadTool === 'angle_seg2' || cadTool === 'angle_drag') {
                  onDimModeChange('idle');
                  onCadToolChange('none');
                } else {
                  onDimModeChange('p1');
                  onCadToolChange('none');
                }
              }}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer border ${
                dimMode !== 'idle' || cadTool === 'angle_seg1' || cadTool === 'angle_seg2' || cadTool === 'angle_drag'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                  : 'bg-sleek-subcard border border-sleek-border/70 text-sleek-text hover:text-slate-900 dark:hover:text-white hover:bg-sleek-border/20'
              }`}
              title="Click a joint pivot to measure distance, or a link segment to measure angle (CAD Style)"
            >
              <span className="flex items-center gap-2">📐 Smart Dimension</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                dimMode !== 'idle' || cadTool === 'angle_seg1' || cadTool === 'angle_seg2' || cadTool === 'angle_drag'
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold'
                  : 'bg-sleek-border text-sleek-text-muted font-bold'
              }`}>
                {dimMode !== 'idle' ? 'ACTIVE' : 'IDLE'}
              </span>
            </button>

            {/* Construction Line Button */}
            <button
              onClick={() => {
                onDimModeChange('idle');
                if (cadTool === 'construction_p1' || cadTool === 'construction_p2') {
                  onCadToolChange('none');
                } else {
                  onCadToolChange('construction_p1');
                }
              }}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer border ${
                cadTool === 'construction_p1' || cadTool === 'construction_p2'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400 font-bold shadow-sm'
                  : 'bg-sleek-subcard border border-sleek-border/70 text-sleek-text hover:text-slate-900 dark:hover:text-white hover:bg-sleek-border/20'
              }`}
              title="Click on a joint as the start, then click on another joint or any empty space to position it. CAD-style auto-horizontal/vertical snapping enabled."
            >
              <span className="flex items-center gap-2">➕ Construction Line</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                cadTool === 'construction_p1' || cadTool === 'construction_p2'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
                  : 'bg-sleek-border text-sleek-text-muted font-bold'
              }`}>
                {cadTool === 'construction_p1' || cadTool === 'construction_p2' ? 'ACTIVE' : 'IDLE'}
              </span>
            </button>

            {/* Delete Tool Button */}
            <button
              onClick={() => {
                onDimModeChange('idle');
                if (cadTool === 'delete') {
                  onCadToolChange('none');
                } else {
                  onCadToolChange('delete');
                }
              }}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer border ${
                cadTool === 'delete'
                  ? 'bg-red-500/20 border-red-500 text-red-600 dark:text-red-400 font-bold scale-[1.01] shadow-md shadow-red-500/5'
                  : 'bg-sleek-subcard border border-sleek-border/70 text-sleek-text hover:text-slate-900 dark:hover:text-white hover:bg-sleek-border/20'
              }`}
              title="Click on any construction line, angle dimension, or reference dimension to delete it"
            >
              <span className="flex items-center gap-2">❌ Delete Tool</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                cadTool === 'delete'
                  ? 'bg-red-500/20 text-red-600 dark:text-red-400 font-bold'
                  : 'bg-sleek-border text-sleek-text-muted font-bold'
              }`}>
                {cadTool === 'delete' ? 'ACTIVE' : 'IDLE'}
              </span>
            </button>

            {/* Reset Default Annotations Button */}
            {onRestoreDefaultAnnotations && (
              <button
                onClick={() => {
                  onRestoreDefaultAnnotations();
                  onCadToolChange('none');
                  onDimModeChange('idle');
                }}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer border bg-blue-500 hover:bg-blue-600 border-blue-600 text-white shadow-sm hover:shadow"
                title="Restore default construction lines and angles for the parallelogram layout"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-white animate-pulse" /> Restore Default CAD
                </span>
                <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-bold text-white">
                  RESET
                </span>
              </button>
            )}

            {/* Display HUD Toggle Button - acts as an accordion header */}
            <button
              onClick={() => onShowDisplaySettingsChange(!showDisplaySettings)}
              className={`w-full py-2 px-3 mt-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer border ${
                showDisplaySettings
                  ? 'bg-slate-500/20 border-slate-500 text-slate-700 dark:text-slate-300 font-bold'
                  : 'bg-sleek-subcard border border-sleek-border/70 text-sleek-text hover:text-slate-900 dark:hover:text-white hover:bg-sleek-border/20'
              }`}
            >
              <span className="flex items-center gap-2">
                {showDisplaySettings ? <EyeOff className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <Eye className="w-3.5 h-3.5 text-sleek-text/50" />} Display HUD Settings
              </span>
              <span className="text-[10px] text-sleek-text-muted">
                {showDisplaySettings ? '▲ Hide' : '▼ Expand'}
              </span>
            </button>
          </div>

          {/* HUD Settings Panel */}
          {showDisplaySettings && (
            <div className="p-3 bg-sleek-subcard/50 border border-sleek-border/40 rounded-xl space-y-2.5 text-sleek-text font-mono">
              <div className="text-[10px] font-bold text-sleek-text-muted uppercase tracking-widest border-b border-sleek-border/20 pb-1 mb-1 shadow-sm">
                HUD Legibility / HUD Visibility
              </div>

              <label className="flex items-center justify-between text-[11px] hover:text-sleek-blue cursor-pointer select-none">
                <span>Actuator Angles</span>
                <input
                  type="checkbox"
                  checked={showActuatorLabels}
                  onChange={(e) => onShowActuatorLabelsChange(e.target.checked)}
                  className="rounded border border-sleek-border bg-sleek-subcard text-blue-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-blue-500"
                />
              </label>

              <label className="flex items-center justify-between text-[11px] hover:text-sleek-blue cursor-pointer select-none">
                <span>Servo Spacings</span>
                <input
                  type="checkbox"
                  checked={showSpacingLabels}
                  onChange={(e) => onShowSpacingLabelsChange(e.target.checked)}
                  className="rounded border border-sleek-border bg-sleek-subcard text-blue-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-blue-500"
                />
              </label>

              <label className="flex items-center justify-between text-[11px] hover:text-sleek-blue cursor-pointer select-none">
                <span>Linkage Lengths</span>
                <input
                  type="checkbox"
                  checked={showLengthLabels}
                  onChange={(e) => onShowLengthLabelsChange(e.target.checked)}
                  className="rounded border border-sleek-border bg-sleek-subcard text-blue-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-blue-500"
                />
              </label>

              <label className="flex items-center justify-between text-[11px] hover:text-sleek-blue cursor-pointer select-none">
                <span>Smart Dimensions</span>
                <input
                  type="checkbox"
                  checked={showCustomDimLabels}
                  onChange={(e) => onShowCustomDimLabelsChange(e.target.checked)}
                  className="rounded border border-sleek-border bg-sleek-subcard text-blue-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-blue-500"
                />
              </label>

              <label className="flex items-center justify-between text-[11px] hover:text-sleek-blue cursor-pointer select-none">
                <span>Toe Tip Position</span>
                <input
                  type="checkbox"
                  checked={showToeTipLabel}
                  onChange={(e) => onShowToeTipLabelChange(e.target.checked)}
                  className="rounded border border-sleek-border bg-sleek-subcard text-blue-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer accent-blue-500"
                />
              </label>
            </div>
          )}
        </div>

        {/* Real-time coordinates */}
        <div className="p-4 bg-sleek-subcard border border-sleek-border rounded-xl space-y-3 shadow-sm">
          <span className="text-[10px] text-sleek-text-muted font-mono uppercase tracking-wider block font-bold">Real-time Coordinates</span>
          {footPos ? (
            <div className="grid grid-cols-2 gap-3 text-center font-mono">
              <div className="bg-sleek-subcard/50 border border-sleek-border p-2.5 rounded-xl">
                <span className="text-[10px] text-sleek-text-muted uppercase font-mono">Toe Tip (X)</span>
                <span className="block text-lg font-bold font-mono text-sleek-blue mt-0.5">{footPos.x.toFixed(2)} <span className="text-xs font-normal text-sleek-text-muted font-sans font-medium">mm</span></span>
              </div>
              <div className="bg-sleek-subcard/50 border border-sleek-border p-2.5 rounded-xl">
                <span className="text-[10px] text-sleek-text-muted uppercase font-mono">Toe Tip (Y)</span>
                <span className="block text-lg font-bold font-mono text-sleek-blue mt-0.5">{footPos.y.toFixed(2)} <span className="text-xs font-normal text-sleek-text-muted font-sans font-medium">mm</span></span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-rose-500 font-semibold italic font-mono block p-1 bg-rose-500/10 border border-rose-500/25 rounded-lg text-center font-medium">Structure out of limits / Singular</span>
          )}
        </div>

        {/* Torque transpose & Mechanical Strain Monitor */}
        <div className="p-4 bg-sleek-subcard border border-sleek-border rounded-xl space-y-4 shadow-sm">
          <span className="text-xs font-bold text-sleek-text flex items-center gap-1.5 uppercase tracking-wider font-mono">
            <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Load Torque estimation
          </span>

          <div className="space-y-2 font-mono">
            <div className="flex justify-between text-[11px] text-sleek-text-muted">
              <span className="font-sans font-medium text-sleek-text">Gravity Force Payload</span>
              <span className="font-bold text-sleek-blue">{testPayload} N</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={testPayload}
              onChange={(e) => setTestPayload(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="space-y-3.5 text-xs font-mono">
            {/* Torque A1 */}
            <div className="p-3 bg-sleek-subcard/50 border border-sleek-border rounded-xl shadow-inner">
              <div className="flex justify-between text-[11px] text-sleek-text-muted mb-1.5">
                <span>Servo {activeTab} A1 (ID 41) torque:</span>
                <span className="font-bold text-sleek-text">{torqueA1KgCm.toFixed(2)} kg·cm ({torqueA1.toFixed(3)} N·m)</span>
              </div>
              <div className="w-full h-2 bg-sleek-border rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-350 ${
                    torqueA1Pct > 75 ? 'bg-red-500' : torqueA1Pct > 45 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${torqueA1Pct}%` }}
                />
              </div>
            </div>

            {/* Torque A2 */}
            <div className="p-3 bg-sleek-subcard/50 border border-sleek-border rounded-xl shadow-inner">
              <div className="flex justify-between text-[11px] text-sleek-text-muted mb-1.5">
                <span>Servo {activeTab} A2 (ID 42) torque:</span>
                <span className="font-bold text-sleek-text">{torqueA2KgCm.toFixed(2)} kg·cm ({torqueA2.toFixed(3)} N·m)</span>
              </div>
              <div className="w-full h-2 bg-sleek-border rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-350 ${
                    torqueA2Pct > 75 ? 'bg-red-500' : torqueA2Pct > 45 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${torqueA2Pct}%` }}
                />
              </div>
            </div>
          </div>
          <span className="text-[10px] text-sleek-text-muted italic font-mono leading-normal pl-2 border-l border-sleek-border block">
            Calculated torque vector represents static hold equilibrium: <span className="font-bold italic">τ = Jᵀ · F_load</span>. Max continuous holding limit: {activeTab === 'ST3215' ? '30.0 kg·cm (2.942 N·m) based on ST3215' : '11.0 kg·cm (1.078 N·m) based on MG996R'} servo specs.
          </span>
        </div>
      </div>
    </div>
  );
}
