import { useState, useEffect } from 'react';
import {
  Wrench,
  Grid,
  Layers,
  Trash2,
  Plus,
  Play,
  RotateCcw,
  Sliders,
  Settings,
  Flame,
  Zap,
} from 'lucide-react';
import { Pivot, Link, MechanismPresetType } from '../types';

interface SidebarLeftProps {
  preset: MechanismPresetType;
  onPresetChange: (preset: MechanismPresetType) => void;
  pivots: Pivot[];
  links: Link[];
  onAddActuator: (x: number, y: number, name: string, actuatorId: 'A1' | 'A2') => void;
  onAddStraightLink: (p1Id: string, p2Id: string, name: string, color: string) => void;
  onAddTriangleLink: (p1Id: string, p2Id: string, p3Id: string, name: string, color: string) => void;
  onRemovePivot: (id: string) => void;
  onRemoveLink: (id: string) => void;
  gridSnapping: boolean;
  onToggleGridSnapping: () => void;
  gridSize: number;
  onGridSizeChange: (val: number) => void;
  // Dimensions for custom default link adjustments
  dimensions: {
    L_tibia_servo: number;
    L_second_tibia: number;
    L_femur_servo: number;
    L_chank_left: number;
    L_chank_right: number;
    L_chank_top: number;
    L_rear_tibia: number;
    L_tibia_total: number;
    L_tibia_offset: number;
    dx_actuators: number;
    dy_actuators: number;
  };
  onDimensionChange: (key: string, val: number) => void;
  assemblyTabEnabled: boolean;
}

export default function SidebarLeft({
  preset,
  onPresetChange,
  pivots,
  links,
  onAddActuator,
  onAddStraightLink,
  onAddTriangleLink,
  onRemovePivot,
  onRemoveLink,
  gridSnapping,
  onToggleGridSnapping,
  gridSize,
  onGridSizeChange,
  dimensions,
  onDimensionChange,
  assemblyTabEnabled,
}: SidebarLeftProps) {
  const [activeTab, setActiveTab] = useState<'build' | 'dimensions' | 'preset'>('preset');

  useEffect(() => {
    if (!assemblyTabEnabled && activeTab === 'build') {
      setActiveTab('preset');
    }
  }, [assemblyTabEnabled, activeTab]);

  // Input states for builder forms
  const [actuatorName, setActuatorName] = useState('Actuator A3');
  const [actuatorX, setActuatorX] = useState(0);
  const [actuatorY, setActuatorY] = useState(0);
  const [actuatorIdSel, setActuatorIdSel] = useState<'A1' | 'A2'>('A1');

  const [straightName, setStraightName] = useState('New Straight Link');
  const [strP1, setStrP1] = useState('');
  const [strP2, setStrP2] = useState('');
  const [straightColor, setStraightColor] = useState('#3b82f6');

  const [triangleName, setTriangleName] = useState('New Triangle Link');
  const [triP1, setTriP1] = useState('');
  const [triP2, setTriP2] = useState('');
  const [triP3, setTriP3] = useState('');
  const [triangleColor, setTriangleColor] = useState('#eab308');

  return (
        <div className="w-80 bg-sleek-aside border-r border-sleek-border flex flex-col h-full text-sleek-text" id="sidebar-left-root">
      {/* Title Header */}
      <div className="p-4 border-b border-sleek-border bg-sleek-header flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-sleek-blue flex items-center justify-center">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold tracking-wider text-sleek-text uppercase">PROPERTIES & SPEC</h1>
          <p className="text-[10px] text-sleek-text-muted font-mono mt-0.5 uppercase tracking-widest">ROBOLEG DESIGN ENGINE</p>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex border-b border-sleek-border text-xs font-semibold bg-sleek-subcard/50">
        <button
          onClick={() => setActiveTab('preset')}
          className={`flex-1 py-3 text-center transition-all border-b-2 font-mono tracking-wide ${
            activeTab === 'preset'
              ? 'border-sleek-blue text-sleek-blue bg-sleek-aside'
              : 'border-transparent text-sleek-text-muted hover:text-sleek-text hover:bg-sleek-subcard'
          }`}
        >
          PRESETS
        </button>
        <button
          onClick={() => setActiveTab('dimensions')}
          className={`flex-1 py-3 text-center transition-all border-b-2 font-mono tracking-wide ${
            activeTab === 'dimensions'
              ? 'border-sleek-blue text-sleek-blue bg-sleek-aside'
              : 'border-transparent text-sleek-text-muted hover:text-sleek-text hover:bg-sleek-subcard'
          }`}
        >
          DIMENSIONS
        </button>
        {assemblyTabEnabled && (
          <button
            onClick={() => setActiveTab('build')}
            className={`flex-1 py-3 text-center transition-all border-b-2 font-mono tracking-wide ${
              activeTab === 'build'
                ? 'border-sleek-blue text-sleek-blue bg-sleek-aside'
                : 'border-transparent text-sleek-text-muted hover:text-sleek-text hover:bg-sleek-subcard'
            }`}
          >
            ASSEMBLY
          </button>
        )}
      </div>

      {/* Panel Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {/* PRESET TAB */}
        {activeTab === 'preset' && (
          <div className="space-y-4">
            {/* Grid & Alignment Parameters */}
            <div className="p-4 bg-sleek-subcard border border-sleek-border rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Grid className="w-3.5 h-3.5 text-sleek-blue" />
                <span className="text-xs font-bold text-sleek-text">Grid Alignment & Snapping</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-sleek-text">Snap to Grid</span>
                <input
                  type="checkbox"
                  checked={gridSnapping}
                  onChange={onToggleGridSnapping}
                  className="w-4 h-4 text-sleek-blue bg-sleek-subcard border-sleek-border rounded accent-sleek-blue cursor-pointer"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-sleek-text-muted font-mono">
                  <span>Grid Segment Size</span>
                  <span className="font-bold text-sleek-blue">{gridSize} mm</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={gridSize}
                  onChange={(e) => onGridSizeChange(Number(e.target.value))}
                  className="w-full accent-sleek-blue cursor-pointer"
                />
              </div>
            </div>

            {/* Explanations block */}
            <div className="p-4 border border-sleek-border bg-sleek-subcard rounded-xl shadow-sm">
              <span className="text-[11px] text-sleek-blue font-bold block uppercase tracking-wider font-mono">Design Insight</span>
              <p className="text-[11px] text-sleek-text/70 mt-1.5 leading-relaxed">
                Notice that the triangular **Chank** shares the pivot point A2 with the **Femur Servo Link**, but they rotate independently. This allows dual actuator decoupling similar to the MIT Cheetah and Ghost Robotics legs.
              </p>
            </div>
          </div>
        )}

        {/* DIMENSIONS TAB */}
        {activeTab === 'dimensions' && (
          <div className="space-y-4">
            <span className="text-[10px] text-sleek-text-muted font-mono uppercase tracking-wider block mb-2 font-bold font-mono">Link Dimensions (Precision Tuning)</span>

            {preset === 'parallelogram_leg' ? (
              <div className="space-y-3 pb-6">
                {/* Servo Horizontal Offset */}
                <div className="space-y-2 p-3 bg-sleek-subcard border border-sleek-border/60 rounded-xl hover:border-sleek-border transition-all animate-fade-in shadow-sm">
                  <div className="flex justify-between items-center text-xs text-sleek-text">
                    <span className="font-medium">Actuator Horizontal dx (Fixed spacing)</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 text-right px-1 text-xs border border-sleek-border rounded font-bold font-mono focus:outline-none focus:border-sleek-blue py-0.5"
                      value={dimensions.dx_actuators}
                      onChange={(e) => onDimensionChange('dx_actuators', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="0.5"
                    value={dimensions.dx_actuators}
                    onChange={(e) => onDimensionChange('dx_actuators', Number(e.target.value))}
                    className="w-full accent-sleek-blue cursor-pointer"
                  />
                </div>

                {/* Servo Vertical Offset */}
                <div className="space-y-2 p-3 bg-sleek-subcard border border-sleek-border/60 rounded-xl hover:border-sleek-border transition-all animate-fade-in shadow-sm">
                  <div className="flex justify-between items-center text-xs text-sleek-text">
                    <span className="font-medium">Actuator Vertical dy (Fixed spacing)</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 text-right px-1 text-xs border border-sleek-border rounded font-bold font-mono focus:outline-none focus:border-sleek-blue py-0.5"
                      value={dimensions.dy_actuators}
                      onChange={(e) => onDimensionChange('dy_actuators', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="0.5"
                    value={dimensions.dy_actuators}
                    onChange={(e) => onDimensionChange('dy_actuators', Number(e.target.value))}
                    className="w-full accent-sleek-blue cursor-pointer"
                  />
                </div>

                {/* Tibia Servo Link */}
                <div className="space-y-2 p-3 bg-sleek-subcard border border-sleek-border/60 rounded-xl hover:border-sleek-border transition-all shadow-sm">
                  <div className="flex justify-between items-center text-xs text-sleek-text">
                    <span className="font-medium">Tibia Servo Link (A1 Pivot)</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 text-right px-1 text-xs border border-sleek-border rounded font-bold font-mono focus:outline-none focus:border-sleek-blue py-0.5"
                      value={dimensions.L_tibia_servo}
                      onChange={(e) => onDimensionChange('L_tibia_servo', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="45"
                    step="0.5"
                    value={dimensions.L_tibia_servo}
                    onChange={(e) => onDimensionChange('L_tibia_servo', Number(e.target.value))}
                    className="w-full accent-sleek-blue cursor-pointer"
                  />
                </div>

                {/* Second Tibia Link */}
                <div className="space-y-2 p-3 bg-sleek-subcard border border-sleek-border/60 rounded-xl hover:border-sleek-border transition-all shadow-sm">
                  <div className="flex justify-between items-center text-xs text-sleek-text">
                    <span className="font-medium">Second Tibia Link</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 text-right px-1 text-xs border border-sleek-border rounded font-bold font-mono focus:outline-none focus:border-sleek-blue py-0.5"
                      value={dimensions.L_second_tibia}
                      onChange={(e) => onDimensionChange('L_second_tibia', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    step="0.5"
                    value={dimensions.L_second_tibia}
                    onChange={(e) => onDimensionChange('L_second_tibia', Number(e.target.value))}
                    className="w-full accent-sleek-blue cursor-pointer"
                  />
                </div>

                {/* Femur Servo Link */}
                <div className="space-y-2 p-3 bg-sleek-subcard border border-sleek-border/60 rounded-xl hover:border-sleek-border transition-all shadow-sm">
                  <div className="flex justify-between items-center text-xs text-sleek-text">
                    <span className="font-medium">Femur Servo Link (A2 Pivot)</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 text-right px-1 text-xs border border-sleek-border rounded font-bold font-mono focus:outline-none focus:border-sleek-blue py-0.5"
                      value={dimensions.L_femur_servo}
                      onChange={(e) => onDimensionChange('L_femur_servo', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    step="0.5"
                    value={dimensions.L_femur_servo}
                    onChange={(e) => onDimensionChange('L_femur_servo', Number(e.target.value))}
                    className="w-full accent-sleek-blue cursor-pointer"
                  />
                </div>

                {/* Chank Left Side */}
                <div className="space-y-2 p-3 bg-sleek-subcard border border-sleek-border/60 rounded-xl hover:border-sleek-border transition-all shadow-sm">
                  <div className="flex justify-between items-center text-xs text-sleek-text">
                    <span className="font-medium">Chank Left Leg (L_chank_left)</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 text-right px-1 text-xs border border-sleek-border rounded font-bold font-mono focus:outline-none focus:border-sleek-blue py-0.5"
                      value={dimensions.L_chank_left}
                      onChange={(e) => onDimensionChange('L_chank_left', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    step="0.5"
                    value={dimensions.L_chank_left}
                    onChange={(e) => onDimensionChange('L_chank_left', Number(e.target.value))}
                    className="w-full accent-sleek-blue cursor-pointer"
                  />
                </div>

                {/* Chank Right Side */}
                <div className="space-y-2 p-3 bg-sleek-subcard border border-sleek-border/60 rounded-xl hover:border-sleek-border transition-all shadow-sm">
                  <div className="flex justify-between items-center text-xs text-sleek-text">
                    <span className="font-medium">Chank Right Leg (L_chank_right)</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 text-right px-1 text-xs border border-sleek-border rounded font-bold font-mono focus:outline-none focus:border-sleek-blue py-0.5"
                      value={dimensions.L_chank_right}
                      onChange={(e) => onDimensionChange('L_chank_right', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    step="0.5"
                    value={dimensions.L_chank_right}
                    onChange={(e) => onDimensionChange('L_chank_right', Number(e.target.value))}
                    className="w-full accent-sleek-blue cursor-pointer"
                  />
                </div>

                {/* Chank Top Side */}
                <div className="space-y-2 p-3 bg-sleek-subcard border border-sleek-border/60 rounded-xl hover:border-sleek-border transition-all shadow-sm">
                  <div className="flex justify-between items-center text-xs text-sleek-text">
                    <span className="font-medium">Chank Top Base (L_chank_top)</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 text-right px-1 text-xs border border-sleek-border rounded font-bold font-mono focus:outline-none focus:border-sleek-blue py-0.5"
                      value={dimensions.L_chank_top}
                      onChange={(e) => onDimensionChange('L_chank_top', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    step="0.5"
                    value={dimensions.L_chank_top}
                    onChange={(e) => onDimensionChange('L_chank_top', Number(e.target.value))}
                    className="w-full accent-sleek-blue cursor-pointer"
                  />
                </div>

                {/* Rear Tibia Link */}
                <div className="space-y-2 p-3 bg-sleek-subcard border border-sleek-border/60 rounded-xl hover:border-sleek-border transition-all shadow-sm">
                  <div className="flex justify-between items-center text-xs text-sleek-text">
                    <span className="font-medium">Rear Tibia Link</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 text-right px-1 text-xs border border-sleek-border rounded font-bold font-mono focus:outline-none focus:border-sleek-blue py-0.5"
                      value={dimensions.L_rear_tibia}
                      onChange={(e) => onDimensionChange('L_rear_tibia', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    step="0.5"
                    value={dimensions.L_rear_tibia}
                    onChange={(e) => onDimensionChange('L_rear_tibia', Number(e.target.value))}
                    className="w-full accent-sleek-blue cursor-pointer"
                  />
                </div>

                {/* Tibia Link Total */}
                <div className="space-y-2 p-3 bg-sleek-subcard border border-sleek-border/60 rounded-xl hover:border-sleek-border transition-all shadow-sm">
                  <div className="flex justify-between items-center text-xs text-sleek-text">
                    <span className="font-medium">Tibia Link (Total Segment)</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 text-right px-1 text-xs border border-sleek-border rounded font-bold font-mono focus:outline-none focus:border-sleek-blue py-0.5"
                      value={dimensions.L_tibia_total}
                      onChange={(e) => onDimensionChange('L_tibia_total', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="120"
                    step="0.5"
                    value={dimensions.L_tibia_total}
                    onChange={(e) => onDimensionChange('L_tibia_total', Number(e.target.value))}
                    className="w-full accent-sleek-blue cursor-pointer"
                  />
                </div>

                {/* Tibia Pin offset */}
                <div className="space-y-2 p-3 bg-sleek-subcard border border-sleek-border/60 rounded-xl border-dashed hover:border-sleek-border transition-all shadow-sm">
                  <div className="flex justify-between items-center text-xs text-sleek-text">
                    <span className="font-medium">Tibia Parallel Offset (Pin-to-Pin)</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-16 text-right px-1 text-xs border border-sleek-border rounded font-bold font-mono focus:outline-none focus:border-sleek-blue py-0.5"
                      value={dimensions.L_tibia_offset}
                      onChange={(e) => onDimensionChange('L_tibia_offset', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="35"
                    step="0.5"
                    value={dimensions.L_tibia_offset}
                    onChange={(e) => onDimensionChange('L_tibia_offset', Number(e.target.value))}
                    className="w-full accent-sleek-blue cursor-pointer"
                  />
                  <span className="text-[10px] text-sleek-text-muted italic font-mono leading-tight block mt-1">
                    Must coordinate with Chank Left Leg (current: {dimensions.L_chank_left} mm) to maintain flawless parallelogram alignment.
                  </span>
                </div>

                {/* 📐 DRIVEN / REFERENCE DIMENSIONS (GEOMETRY STATUS PANEL) */}
                <div className="p-4 bg-sleek-subcard border border-sleek-border rounded-xl space-y-3 mt-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-sleek-border/60 pb-1.5">
                    <span className="text-[10px] text-amber-500 font-bold tracking-wider uppercase font-mono">Reference Spec</span>
                    <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-1.5 py-0.5 rounded font-mono">DRIVEN</span>
                  </div>

                  {/* Spacing reference */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-sleek-text/70">Actuator direct distance:</span>
                    <span className="text-sleek-text font-bold">({Math.sqrt(dimensions.dx_actuators**2 + dimensions.dy_actuators**2).toFixed(1)} mm)</span>
                  </div>
                  <div className="text-[10px] text-sleek-text-muted leading-normal pl-2 border-l border-sleek-border font-mono">
                    Computed as <code className="text-amber-500 font-mono">√(dx² + dy²)</code> from {dimensions.dx_actuators}mm horiz. &amp; {dimensions.dy_actuators}mm vert. offsets.
                  </div>

                  {/* Chank top edge reference */}
                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <span className="text-sleek-text/70">Chank Triangle Top Base:</span>
                    <span className="text-sleek-text font-bold">({dimensions.L_chank_top.toFixed(1)} mm)</span>
                  </div>
                  <div className="text-[10px] text-sleek-text-muted leading-normal pl-2 border-l border-sleek-border font-mono">
                    Calculated for custom Chank triangle geometry.
                  </div>

                  {/* Parallel reference */}
                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <span className="text-sleek-text/70">Parallel Error Tolerance:</span>
                    {Math.abs(dimensions.L_chank_left - dimensions.L_tibia_offset) < 0.1 ? (
                      <span className="text-emerald-500 font-semibold text-[10px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded font-mono">✓ 0.0 mm (Aligned)</span>
                    ) : (
                      <span className="text-rose-500 font-semibold text-[10px] px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/25 rounded font-mono font-bold">Unbalanced ({Math.abs(dimensions.L_chank_left - dimensions.L_tibia_offset).toFixed(1)} mm)</span>
                    )}
                  </div>
                  <div className="text-[10px] text-sleek-text-muted leading-normal pl-2 border-l border-sleek-border font-mono">
                    The Tibia parallel offset ({dimensions.L_tibia_offset}mm) must equal Chank left leg ({dimensions.L_chank_left}mm) to avoid shear stresses.
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-sleek-text-muted italic font-mono p-2 animate-fade-in font-medium">
                Dimensions for custom mechanisms are governed by raw coordinate assemblies under the **Raw Assembly** tab.
              </p>
            )}
          </div>
        )}

        {/* RAW BUILD TAB */}
        {activeTab === 'build' && assemblyTabEnabled && (
          <div className="space-y-4">
            {/* 1. Add Actuator / Pivot */}
            <div className="p-4 bg-sleek-subcard border border-sleek-border rounded-xl space-y-3 shadow-sm">
              <span className="text-xs font-bold text-sleek-text block">Add Node or Servo Actuator</span>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-sleek-text-muted font-mono block mb-1">Actuator Name</label>
                  <input
                    type="text"
                    value={actuatorName}
                    onChange={(e) => setActuatorName(e.target.value)}
                    className="w-full bg-sleek-subcard border border-sleek-border rounded py-1 px-2 mb-1 text-sleek-text outline-none focus:border-sleek-blue font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-sleek-text-muted font-mono block mb-1 font-mono">X Coord (mm)</label>
                    <input
                      type="number"
                      value={actuatorX}
                      onChange={(e) => setActuatorX(Number(e.target.value))}
                      className="w-full bg-sleek-subcard border border-sleek-border rounded py-1 px-2 text-sleek-text outline-none focus:border-sleek-blue font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-sleek-text-muted font-mono block mb-1 font-mono">Y Coord (mm)</label>
                    <input
                      type="number"
                      value={actuatorY}
                      onChange={(e) => setActuatorY(Number(e.target.value))}
                      className="w-full bg-sleek-subcard border border-sleek-border rounded py-1 px-2 text-sleek-text outline-none focus:border-sleek-blue font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-sleek-text-muted font-mono block mb-1">Actuator Map Binding</label>
                  <select
                    value={actuatorIdSel}
                    onChange={(e) => setActuatorIdSel(e.target.value as 'A1' | 'A2')}
                    className="w-full bg-sleek-subcard border border-sleek-border rounded py-1 px-2 text-sleek-text outline-none focus:border-sleek-blue font-mono"
                  >
                    <option value="A1">Servo A1 Sliders Driver</option>
                    <option value="A2">Servo A2 Sliders Driver</option>
                  </select>
                </div>
                <button
                  onClick={() => onAddActuator(actuatorX, actuatorY, actuatorName, actuatorIdSel)}
                  className="w-full bg-sleek-blue hover:bg-blue-600 font-semibold py-1.5 rounded-lg transition-colors text-white flex items-center justify-center gap-1.5 mt-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Actuator
                </button>
              </div>
            </div>

            {/* 2. Add Straight Link */}
            <div className="p-4 bg-sleek-subcard border border-sleek-border rounded-xl space-y-3 shadow-sm">
              <span className="text-xs font-bold text-sleek-text block">Add Flat Straight Link</span>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-sleek-text-muted font-mono block mb-1">Link Name</label>
                  <input
                    type="text"
                    value={straightName}
                    onChange={(e) => setStraightName(e.target.value)}
                    className="w-full bg-sleek-subcard border border-sleek-border rounded py-1 px-2 text-sleek-text outline-none focus:border-sleek-blue font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-sleek-text-muted font-mono block mb-1">Pivot 1</label>
                    <select
                      value={strP1}
                      onChange={(e) => setStrP1(e.target.value)}
                      className="w-full bg-sleek-subcard border border-sleek-border rounded py-1 px-2 text-sleek-text outline-none focus:border-sleek-blue font-mono select-aside"
                    >
                      <option value="">--Select--</option>
                      {pivots.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-sleek-text-muted font-mono block mb-1">Pivot 2</label>
                    <select
                      value={strP2}
                      onChange={(e) => setStrP2(e.target.value)}
                      className="w-full bg-sleek-subcard border border-sleek-border rounded py-1 px-2 text-sleek-text outline-none focus:border-sleek-blue font-mono"
                    >
                      <option value="">--Select--</option>
                      {pivots.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-sleek-text-muted font-mono block mb-1">Color Highlight (hex)</label>
                  <input
                    type="color"
                    value={straightColor}
                    onChange={(e) => setStraightColor(e.target.value)}
                    className="w-full h-8 bg-sleek-subcard border border-sleek-border rounded p-1 cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => onAddStraightLink(strP1, strP2, straightName, straightColor)}
                  className="w-full bg-sleek-blue hover:bg-blue-600 font-semibold py-1.5 rounded-lg transition-colors text-white flex items-center justify-center gap-1.5 mt-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Link
                </button>
              </div>
            </div>

            {/* 3. Add Triangle Link */}
            <div className="p-4 bg-sleek-subcard border border-sleek-border rounded-xl space-y-3 shadow-sm">
              <span className="text-xs font-bold text-sleek-text block">Add Triangular Rigid Gusset</span>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-sleek-text-muted font-mono block mb-1">Rigid Gusset Name</label>
                  <input
                    type="text"
                    value={triangleName}
                    onChange={(e) => setTriangleName(e.target.value)}
                    className="w-full bg-sleek-subcard border border-sleek-border rounded py-1 px-2 text-sleek-text outline-none focus:border-sleek-blue font-mono"
                  />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="text-[9px] text-sleek-text-muted font-mono block mb-1">Pivot 1</label>
                    <select
                      value={triP1}
                      onChange={(e) => setTriP1(e.target.value)}
                      className="w-full bg-sleek-subcard border border-sleek-border rounded py-0.5 px-1 text-[11px] outline-none focus:border-sleek-blue"
                    >
                      <option value="">--Sel--</option>
                      {pivots.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-sleek-text-muted font-mono block mb-1">Pivot 2</label>
                    <select
                      value={triP2}
                      onChange={(e) => setTriP2(e.target.value)}
                      className="w-full bg-sleek-subcard border border-sleek-border rounded py-0.5 px-1 text-[11px] outline-none focus:border-sleek-blue"
                    >
                      <option value="">--Sel--</option>
                      {pivots.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-sleek-text-muted font-mono block mb-1">Pivot 3</label>
                    <select
                      value={triP3}
                      onChange={(e) => setTriP3(e.target.value)}
                      className="w-full bg-sleek-subcard border border-sleek-border rounded py-0.5 px-1 text-[11px] outline-none focus:border-sleek-blue"
                    >
                      <option value="">--Sel--</option>
                      {pivots.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-sleek-text-muted font-mono block mb-1">Color Highlight</label>
                  <input
                    type="color"
                    value={triangleColor}
                    onChange={(e) => setTriangleColor(e.target.value)}
                    className="w-full h-8 bg-sleek-subcard border border-sleek-border rounded p-1 cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => onAddTriangleLink(triP1, triP2, triP3, triangleName, triangleColor)}
                  className="w-full bg-sleek-blue hover:bg-blue-600 font-semibold py-1.5 rounded-lg transition-colors text-white flex items-center justify-center gap-1.5 mt-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Triangle
                </button>
              </div>
            </div>

            {/* 4. Structural components list tree */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] text-sleek-text-muted font-mono uppercase tracking-wider block font-bold">Components Inventory</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-sleek-border rounded-xl p-2 bg-sleek-subcard/50 custom-scrollbar font-mono text-[11px] shadow-inner">
                {pivots.length === 0 && links.length === 0 && (
                  <span className="text-xs text-sleek-text-muted block italic p-2.5">Workspace Empty.</span>
                )}
                {pivots.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs p-2 bg-sleek-subcard border border-sleek-border rounded-lg mb-1 animate-fade-in hover:bg-sleek-subcard shadow-sm">
                    <span className="truncate max-w-[140px] font-mono text-sleek-text font-medium">📍 {p.name}</span>
                    <button
                      onClick={() => onRemovePivot(p.id)}
                      disabled={preset !== 'parallelogram_leg' ? false : true} // disable deletions for default model
                      className="text-sleek-text-muted hover:text-red-500 rounded p-1 disabled:opacity-30 disabled:hover:text-sleek-text-muted transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {links.map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-xs p-2 bg-sleek-subcard border border-sleek-border rounded-lg mb-1 animate-fade-in hover:bg-sleek-subcard shadow-sm">
                    <span className="truncate max-w-[140px] font-mono font-medium" style={{ color: l.color }}>
                      {l.isTriangle ? '📐' : '🔗'} {l.name}
                    </span>
                    <button
                      onClick={() => onRemoveLink(l.id)}
                      disabled={preset !== 'parallelogram_leg' ? false : true}
                      className="text-sleek-text-muted hover:text-red-500 rounded p-1 disabled:opacity-30 disabled:hover:text-sleek-text-muted transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {preset === 'parallelogram_leg' && (
                <span className="text-[10px] text-sleek-text-muted italic block font-mono pl-1">
                  🔒 Inventory modification disabled when locked into default leg template.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
