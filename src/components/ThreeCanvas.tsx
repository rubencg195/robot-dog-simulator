import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Pivot, Link, TrajectoryPoint, CustomDimension, ConstructionLine, AngleDimension } from '../types';
import { Home, Eye, EyeOff, Lock, Unlock } from 'lucide-react';

const DIM_GEOMETRY_MAP: Record<string, { p1: string; p2: string; type: 'distance' | 'horizontal' | 'vertical' | 'angle' }> = {
  'lbl-link-tibia-servo': { p1: 'A1', p2: 'P1', type: 'distance' },
  'lbl-link-second-tibia': { p1: 'P1', p2: 'P_chank_TL', type: 'distance' },
  'lbl-link-femur-servo': { p1: 'A2', p2: 'P2', type: 'distance' },
  'lbl-link-rear-tibia': { p1: 'P_chank_TR', p2: 'P_tibia_rear', type: 'distance' },
  'lbl-link-tibia-ext': { p1: 'P_tibia_rear', p2: 'P2', type: 'distance' },
  'lbl-link-tibia-main': { p1: 'P2', p2: 'P_foot', type: 'distance' },
  'lbl-link-chank-top': { p1: 'P_chank_TL', p2: 'P_chank_TR', type: 'distance' },
  'lbl-link-chank-left': { p1: 'A2', p2: 'P_chank_TL', type: 'distance' },
  'lbl-link-chank-right': { p1: 'A2', p2: 'P_chank_TR', type: 'distance' },
  'lbl-dim-h': { p1: 'A1', p2: 'A2', type: 'horizontal' },
  'lbl-dim-v': { p1: 'A1', p2: 'A2', type: 'vertical' },
  'lbl-actuator-A1': { p1: 'A1', p2: 'P1', type: 'angle' },
  'lbl-actuator-A2': { p1: 'A2', p2: 'P2', type: 'angle' },
};

interface ThreeCanvasProps {
  theme: 'light' | 'dark';
  pivots: Pivot[];
  links: Link[];
  solvedPositions: Record<string, { x: number; y: number; z: number }> | null;
  trajectory: TrajectoryPoint[];
  targetIK: { x: number; y: number } | null;
  onTargetDrag: (x: number, y: number) => void;
  ikActive: boolean;
  originalFootPos: { x: number; y: number } | null;
  gridSnapping: boolean;
  gridSize: number;
  angleA1: number;
  angleA2: number;
  labelOffsets: Record<string, { dx: number; dy: number }>;
  onLabelOffsetsChange: (offsets: Record<string, { dx: number; dy: number }>) => void;
  dimensions: any;
  onDimensionChange: (name: string, value: number) => void;
  onAngleA1Change: (val: number) => void;
  onAngleA2Change: (val: number) => void;
  customDimensions: CustomDimension[];
  onCustomDimensionsChange: (dims: CustomDimension[]) => void;
  constructionLines: ConstructionLine[];
  onConstructionLinesChange: (lines: ConstructionLine[]) => void;
  angleDimensions: AngleDimension[];
  onAngleDimensionsChange: (angs: AngleDimension[]) => void;
  setTargetMode: boolean;
  onSetTargetModeChange: (val: boolean) => void;
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
  simEditorOpen?: boolean;
  gaitWaypoints?: Array<{ id: string; x: number; y: number }>;
  selectedWaypointId?: string | null;
  onWaypointSelect?: (id: string | null) => void;
  onWaypointDrag?: (id: string, x: number, y: number) => void;
  activeTab?: 'MG996R' | 'ST3215';
  onTabChange?: (tab: 'MG996R' | 'ST3215') => void;
}

export default function ThreeCanvas({
  theme,
  pivots,
  links,
  solvedPositions,
  trajectory,
  targetIK,
  onTargetDrag,
  ikActive,
  originalFootPos,
  gridSnapping,
  gridSize,
  angleA1,
  angleA2,
  labelOffsets,
  onLabelOffsetsChange,
  dimensions,
  onDimensionChange,
  onAngleA1Change,
  onAngleA2Change,
  customDimensions,
  onCustomDimensionsChange,
  constructionLines,
  onConstructionLinesChange,
  angleDimensions,
  onAngleDimensionsChange,
  setTargetMode,
  onSetTargetModeChange,
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
  simEditorOpen = false,
  gaitWaypoints = [],
  selectedWaypointId = null,
  onWaypointSelect,
  onWaypointDrag,
  activeTab = 'MG996R',
  onTabChange,
}: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onTargetDragRef = useRef(onTargetDrag);

  // Keep callback ref updated to prevent unnecessary re-effects
  useEffect(() => {
    onTargetDragRef.current = onTargetDrag;
  }, [onTargetDrag]);

  const solvedPositionsRef = useRef(solvedPositions);
  const angleA1Ref = useRef(angleA1);
  const angleA2Ref = useRef(angleA2);
  const labelOffsetsRef = useRef(labelOffsets);
  const customDimensionsRef = useRef(customDimensions);
  const updateFloatingLabelsRef = useRef<() => void>(() => {});

  // Synchronously update refs on every render to prevent single-frame lag / stale closure bugs when changing tabs or parameters
  solvedPositionsRef.current = solvedPositions;
  angleA1Ref.current = angleA1;
  angleA2Ref.current = angleA2;
  labelOffsetsRef.current = labelOffsets;
  customDimensionsRef.current = customDimensions;

  // Caching container size to prevent layout thrashing and lag during panning/zooming
  const containerSizeRef = useRef({ w: 800, h: 600 });

  // Camera/Orbit modification tracking state to force React re-renders on custom SVG overlays (e.g. angle dimensions / construction lines)
  const [orbitRev, setOrbitRev] = useState(0);

  // Accessibility refs for animation loop
  const showActuatorLabelsRef = useRef(showActuatorLabels);
  const showSpacingLabelsRef = useRef(showSpacingLabels);
  const showLengthLabelsRef = useRef(showLengthLabels);
  const showCustomDimLabelsRef = useRef(showCustomDimLabels);
  const showToeTipLabelRef = useRef(showToeTipLabel);

  const pt1Ref = useRef<string | null>(null);
  const pt2Ref = useRef<string | null>(null);
  const hoveredJointRef = useRef<string | null>(null);
  const dimModeRef = useRef<'idle' | 'p1' | 'p2' | 'seg_selected' | 'drag'>('idle');

  useEffect(() => {
    showActuatorLabelsRef.current = showActuatorLabels;
    showSpacingLabelsRef.current = showSpacingLabels;
    showLengthLabelsRef.current = showLengthLabels;
    showCustomDimLabelsRef.current = showCustomDimLabels;
    showToeTipLabelRef.current = showToeTipLabel;
  }, [showActuatorLabels, showSpacingLabels, showLengthLabels, showCustomDimLabels, showToeTipLabel]);



  // Inline editing parameter state
  const [editingParam, setEditingParam] = useState<{
    id: string; // e.g. 'L_tibia_servo' or 'angleA1'
    originalValue: number;
    currentInputValue: string;
  } | null>(null);

  const [hoveredJoint, setHoveredJoint] = useState<string | null>(null);
  const [pt1, setPt1] = useState<string | null>(null);
  const [pt2, setPt2] = useState<string | null>(null);
  const [tempMousePos, setTempMousePos] = useState<{ x: number; y: number } | null>(null);

  // New CAD state variables
  const [constPt1, setConstPt1] = useState<string | null>(null);
  const [constPt2, setConstPt2] = useState<string | null>(null);
  const [angleSeg1, setAngleSeg1] = useState<[string, string] | null>(null);
  const [angleSeg2, setAngleSeg2] = useState<[string, string] | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<{ label: string; p1: string; p2: string; type: 'link' | 'construction'; id?: string } | null>(null);
  const [hoveredDeleteTarget, setHoveredDeleteTarget] = useState<{ type: 'construction' | 'angle' | 'custom'; id: string } | null>(null);

  const [isViewLocked, setIsViewLocked] = useState(true);

  const cadToolRef = useRef(cadTool);
  const constPt1Ref = useRef(constPt1);
  const constPt2Ref = useRef(constPt2);
  const angleSeg1Ref = useRef(angleSeg1);
  const angleSeg2Ref = useRef(angleSeg2);
  const hoveredSegmentRef = useRef(hoveredSegment);
  const constructionLinesRef = useRef(constructionLines);
  const angleDimensionsRef = useRef(angleDimensions);
  const hoveredDeleteTargetRef = useRef(hoveredDeleteTarget);

  // Sync prop changes for cadTool and dimMode to the refs
  useEffect(() => {
    cadToolRef.current = cadTool;
  }, [cadTool]);

  useEffect(() => {
    dimModeRef.current = dimMode;
  }, [dimMode]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enableRotate = !isViewLocked;
      controlsRef.current.enablePan = !isViewLocked;
    }
  }, [isViewLocked]);

  // Watch outer prop changes to reset inner wizard steps
  useEffect(() => {
    if (cadTool === 'none') {
      setConstPt1(null);
      setConstPt2(null);
      setAngleSeg1(null);
      setAngleSeg2(null);
      setHoveredSegment(null);
      setHoveredDeleteTarget(null);
    }
  }, [cadTool]);

  useEffect(() => {
    if (dimMode === 'idle') {
      setPt1(null);
      setPt2(null);
      setTempMousePos(null);
    }
  }, [dimMode]);

  const updateDimMode = (val: 'idle' | 'p1' | 'p2' | 'seg_selected' | 'drag') => {
    onDimModeChange(val);
    dimModeRef.current = val;
  };

  const updatePt1 = (val: string | null) => {
    setPt1(val);
    pt1Ref.current = val;
  };

  const updatePt2 = (val: string | null) => {
    setPt2(val);
    pt2Ref.current = val;
  };

  const updateHoveredJoint = (val: string | null) => {
    setHoveredJoint(val);
    hoveredJointRef.current = val;
  };

  const updateCadTool = (val: 'none' | 'construction_p1' | 'construction_p2' | 'delete' | 'angle_seg1' | 'angle_seg2' | 'angle_drag') => {
    onCadToolChange(val);
    cadToolRef.current = val;
  };

  const updateConstPt1 = (val: string | null) => {
    setConstPt1(val);
    constPt1Ref.current = val;
  };

  const updateConstPt2 = (val: string | null) => {
    setConstPt2(val);
    constPt2Ref.current = val;
  };

  const updateHoveredSegment = (val: { label: string; p1: string; p2: string; type: 'link' | 'construction'; id?: string } | null) => {
    setHoveredSegment(val);
    hoveredSegmentRef.current = val;
  };

  const updateHoveredDeleteTarget = (val: { type: 'construction' | 'angle' | 'custom'; id: string } | null) => {
    setHoveredDeleteTarget(val);
    hoveredDeleteTargetRef.current = val;
  };

  useEffect(() => {
    pt1Ref.current = pt1;
    pt2Ref.current = pt2;
    hoveredJointRef.current = hoveredJoint;
    dimModeRef.current = dimMode;
    
    cadToolRef.current = cadTool;
    constPt1Ref.current = constPt1;
    constPt2Ref.current = constPt2;
    angleSeg1Ref.current = angleSeg1;
    angleSeg2Ref.current = angleSeg2;
    hoveredSegmentRef.current = hoveredSegment;
    constructionLinesRef.current = constructionLines;
    angleDimensionsRef.current = angleDimensions;
    hoveredDeleteTargetRef.current = hoveredDeleteTarget;
  }, [pt1, pt2, hoveredJoint, dimMode, cadTool, constPt1, constPt2, angleSeg1, angleSeg2, hoveredSegment, constructionLines, angleDimensions, hoveredDeleteTarget]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        updateDimMode('idle');
        updatePt1(null);
        updatePt2(null);
        updateHoveredJoint(null);
        setTempMousePos(null);
        
        // Cancel all CAD tools
        updateCadTool('none');
        updateConstPt1(null);
        updateConstPt2(null);
        setAngleSeg1(null);
        setAngleSeg2(null);
        updateHoveredSegment(null);
        updateHoveredDeleteTarget(null);
      } else if (e.key === 'Enter') {
        if (cadToolRef.current === 'construction_p2' && constPt1Ref.current && constPt2Ref.current) {
          // Check if it already exists to prevent duplicate construction lines
          const exists = constructionLinesRef.current.some(
            cl => (cl.p1 === constPt1Ref.current && cl.p2 === constPt2Ref.current) || (cl.p1 === constPt2Ref.current && cl.p2 === constPt1Ref.current)
          );
          if (!exists) {
            let constraint: 'horizontal' | 'vertical' | undefined = undefined;
            const endPt = getJointPos2D(constPt2Ref.current!);
            if (endPt) {
              const snapStatus = getSnappedPosition(endPt.px, endPt.py);
              if (snapStatus.snapped === 'horizontal') constraint = 'horizontal';
              else if (snapStatus.snapped === 'vertical') constraint = 'vertical';
            }
            const newLine: ConstructionLine = {
              id: 'const-' + Date.now(),
              p1: constPt1Ref.current!,
              p2: constPt2Ref.current!,
              constraint
            };
            onConstructionLinesChange([...constructionLinesRef.current, newLine]);
          }
          // Reset
          updateCadTool('none');
          updateConstPt1(null);
          updateConstPt2(null);
        } else if (cadToolRef.current === 'angle_drag' && angleSeg1Ref.current && angleSeg2Ref.current) {
          // Find vertex
          let vertexId = '';
          const s1 = angleSeg1Ref.current;
          const s2 = angleSeg2Ref.current;
          if (s1[0] === s2[0] || s1[0] === s2[1]) vertexId = s1[0];
          else if (s1[1] === s2[0] || s1[1] === s2[1]) vertexId = s1[1];
          else vertexId = s1[0]; // fallback

          const m_vertex = getJointPos2D(vertexId);
          if (m_vertex && tempMousePos) {
            // Find scale mm/px
            const currentSolved = solvedPositionsRef.current || solvedPositions;
            const ptA_id = s1[0] === vertexId ? s1[1] : s1[0];
            const ptA = currentSolved ? currentSolved[ptA_id] : null;
            const v = currentSolved ? currentSolved[vertexId] : null;
            
            let scale = 1.0;
            if (ptA && v) {
              const dist_3d = Math.hypot(ptA.x - v.x, ptA.y - v.y);
              const m_A = getJointPos2D(ptA_id);
              if (m_A) {
                const dist_2d = Math.hypot(m_A.px - m_vertex.px, m_A.py - m_vertex.py);
                if (dist_2d > 0.1) {
                  scale = dist_3d / dist_2d;
                }
              }
            }

            const r_px = Math.hypot(tempMousePos.x - m_vertex.px, tempMousePos.y - m_vertex.py);
            const r_mm = Math.max(5, r_px * scale); // minimum 5mm radius

            const newAngDim: AngleDimension = {
              id: 'angle-' + Date.now(),
              seg1: s1,
              seg2: s2,
              vertexId,
              radius: r_mm
            };
            onAngleDimensionsChange([...angleDimensionsRef.current, newAngDim]);
          }

          // Reset
          updateCadTool('none');
          setAngleSeg1(null);
          setAngleSeg2(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConstructionLinesChange, onAngleDimensionsChange, tempMousePos, solvedPositions]);

  const getJoint3DPos = (id: string | null) => {
    if (!id) return null;
    if (id.startsWith('virtual_')) {
      const parts = id.split('_');
      const valX = parseFloat(parts[1]);
      const valY = parseFloat(parts[2]);
      if (!isNaN(valX) && !isNaN(valY)) {
        return { x: valX, y: valY, z: 0 };
      }
    }
    const currentSolved = solvedPositionsRef.current || solvedPositions;
    if (!currentSolved) return null;
    return currentSolved[id] || null;
  };

  const getJointPos2D = (id: string) => {
    if (id.startsWith('virtual_')) {
      const parts = id.split('_');
      const valX = parseFloat(parts[1]);
      const valY = parseFloat(parts[2]);
      if (!isNaN(valX) && !isNaN(valY)) {
        return project3DTo2D(valX, valY, 0);
      }
    }
    const currentSolved = solvedPositionsRef.current || solvedPositions;
    if (!currentSolved) return null;
    const pt = currentSolved[id];
    if (!pt) return null;
    return project3DTo2D(pt.x, pt.y, pt.z);
  };

  const get3DPosFrom2D = (px: number, py: number) => {
    if (!cameraRef.current || !containerRef.current) return null;
    const { w, h } = containerSizeRef.current;
    if (w === 0 || h === 0) return null;

    // Convert pixel to NDC
    const ndcX = (px / w) * 2 - 1;
    const ndcY = -(py / h) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    return { x: intersection.x, y: intersection.y, z: intersection.z };
  };

  interface SnappedPoint {
    px: number;
    py: number;
    worldX: number;
    worldY: number;
    snapped: 'none' | 'horizontal' | 'vertical' | 'both';
  }

  const getSnappedPosition = (mouseX: number, mouseY: number): SnappedPoint => {
    // Default: unsnapped 3D point
    const raw3D = get3DPosFrom2D(mouseX, mouseY) || { x: 0, y: 0, z: 0 };
    const result: SnappedPoint = {
      px: mouseX,
      py: mouseY,
      worldX: raw3D.x,
      worldY: raw3D.y,
      snapped: 'none'
    };

    if (cadToolRef.current !== 'construction_p2' || !constPt1Ref.current) {
      return result;
    }

    const m1 = getJointPos2D(constPt1Ref.current);
    const pos1 = getJoint3DPos(constPt1Ref.current);
    if (!m1 || !pos1) return result;

    const snapThresholdPx = 15;
    const isCloseX = Math.abs(mouseX - m1.px) < snapThresholdPx;
    const isCloseY = Math.abs(mouseY - m1.py) < snapThresholdPx;

    if (isCloseX && isCloseY) {
      result.px = m1.px;
      result.py = m1.py;
      result.worldX = pos1.x;
      result.worldY = pos1.y;
      result.snapped = 'both';
    } else if (isCloseX) {
      result.px = m1.px;
      result.worldX = pos1.x;
      result.snapped = 'vertical';
    } else if (isCloseY) {
      result.py = m1.py;
      result.worldY = pos1.y;
      result.snapped = 'horizontal';
    }

    return result;
  };

  const getPixelRadius = (vertexId: string | null | undefined, r_mm: number) => {
    const JOINT_IDS = ['A1', 'A2', 'P1', 'P2', 'P_chank_TL', 'P_chank_TR', 'P_tibia_rear', 'P_foot'];
    const currentSolved = solvedPositionsRef.current || solvedPositions;
    if (!currentSolved) return r_mm;
    
    // Try finding scale based on joint ID first
    if (vertexId && currentSolved[vertexId]) {
      for (const otherId of JOINT_IDS) {
        if (otherId === vertexId) continue;
        const ptA = currentSolved[otherId];
        const v = currentSolved[vertexId];
        if (ptA && v) {
          const dist_3d = Math.hypot(ptA.x - v.x, ptA.y - v.y);
          const m_A = getJointPos2D(otherId);
          const m_vertex = getJointPos2D(vertexId);
          if (m_A && m_vertex) {
            const dist_2d = Math.hypot(m_A.px - m_vertex.px, m_A.py - m_vertex.py);
            if (dist_2d > 0.1 && dist_3d > 0.1) {
              const scale = dist_3d / dist_2d; // ratio mm/px
              return r_mm / scale; // return px radius
            }
          }
        }
      }
    }

    // Generalized scale lookup if vertexId is missing or doesn't exist
    let pt1_id = '';
    let pt2_id = '';
    for (const id of JOINT_IDS) {
      if (currentSolved[id]) {
        if (!pt1_id) pt1_id = id;
        else if (!pt2_id) {
          pt2_id = id;
          break;
        }
      }
    }

    if (pt1_id && pt2_id) {
      const p1 = currentSolved[pt1_id];
      const p2 = currentSolved[pt2_id];
      const dist_3d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const m1 = getJointPos2D(pt1_id);
      const m2 = getJointPos2D(pt2_id);
      if (m1 && m2) {
        const dist_2d = Math.hypot(m1.px - m2.px, m1.py - m2.py);
        if (dist_2d > 0.1 && dist_3d > 0.1) {
          const scale = dist_3d / dist_2d;
          return r_mm / scale;
        }
      }
    }
    return r_mm; // fallback
  };

  const resolveAngleGeometry = (ad: { seg1: [string, string]; seg2: [string, string]; vertexId?: string; radius: number; sectorRays?: [string, string] }, currentSolved: any) => {
    if (!currentSolved) return null;

    const getSolvedPos = (id: string) => {
      if (id.startsWith('virtual_')) {
        const parts = id.split('_');
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        if (!isNaN(x) && !isNaN(y)) return { x, y, z: 0 };
      }
      return currentSolved[id];
    };

    // Check if they share a joint ID
    const s1 = ad.seg1;
    const s2 = ad.seg2;
    let v_id = ad.vertexId || '';
    if (!v_id) {
      if (s1[0] === s2[0] || s1[0] === s2[1]) v_id = s1[0];
      else if (s1[1] === s2[0] || s1[1] === s2[1]) v_id = s1[1];
    }

    let vx = 0, vy = 0, vz = 0;
    let px = 0, py = 0;
    let ax = 0, ay = 0, az = 0, a_px = 0, a_py = 0;
    let bx = 0, by = 0, bz = 0, b_px = 0, b_py = 0;
    let isValid = false;

    const v_pos = getSolvedPos(v_id);
    if (v_id && v_pos) {
      // Shared joint case
      vx = v_pos.x;
      vy = v_pos.y;
      vz = v_pos.z || 0;
      const m_v = getJointPos2D(v_id);
      if (m_v) {
        px = m_v.px;
        py = m_v.py;
      }

      const ptA_id = s1[0] === v_id ? s1[1] : s1[0];
      const ptB_id = s2[0] === v_id ? s2[1] : s2[0];

      const pA = getSolvedPos(ptA_id);
      const pB = getSolvedPos(ptB_id);
      if (pA && pB) {
        ax = pA.x; ay = pA.y; az = pA.z || 0;
        bx = pB.x; by = pB.y; bz = pB.z || 0;
        const m_A = getJointPos2D(ptA_id);
        const m_B = getJointPos2D(ptB_id);
        if (m_A && m_B) {
          a_px = m_A.px; a_py = m_A.py;
          b_px = m_B.px; b_py = m_B.py;
          isValid = true;
        }
      }
    } else {
      // Disjoint lines case (intersect them in 2D or model space)
      const p1 = getSolvedPos(s1[0]);
      const p2 = getSolvedPos(s1[1]);
      const q1 = getSolvedPos(s2[0]);
      const q2 = getSolvedPos(s2[1]);

      if (p1 && p2 && q1 && q2) {
        const dx1 = p2.x - p1.x;
        const dy1 = p2.y - p1.y;
        const dx2 = q2.x - q1.x;
        const dy2 = q2.y - q1.y;

        const det = dx1 * dy2 - dy1 * dx2;
        if (Math.abs(det) > 1e-6) {
          const t = ((q1.x - p1.x) * dy2 - (q1.y - p1.y) * dx2) / det;
          vx = p1.x + t * dx1;
          vy = p1.y + t * dy1;
          vz = p1.z !== undefined ? p1.z : 0;

          const screenV = project3DTo2D(vx, vy, vz);
          if (screenV) {
            px = screenV.px;
            py = screenV.py;

            // Define directional points along each line radiating from intersection vertex V
            const mid1_x = (p1.x + p2.x) / 2;
            const mid1_y = (p1.y + p2.y) / 2;
            const mid2_x = (q1.x + q2.x) / 2;
            const mid2_y = (q1.y + q2.y) / 2;

            let d1x = mid1_x - vx;
            let d1y = mid1_y - vy;
            if (Math.hypot(d1x, d1y) < 1e-3) {
              d1x = p2.x - vx;
              d1y = p2.y - vy;
            }

            let d2x = mid2_x - vx;
            let d2y = mid2_y - vy;
            if (Math.hypot(d2x, d2y) < 1e-3) {
              d2x = q2.x - vx;
              d2y = q2.y - vy;
            }

            const len1 = Math.hypot(d1x, d1y);
            const len2 = Math.hypot(d2x, d2y);
            if (len1 > 1e-3 && len2 > 1e-3) {
              ax = vx + d1x;
              ay = vy + d1y;
              az = vz;

              bx = vx + d2x;
              by = vy + d2y;
              bz = vz;

              const screenA = project3DTo2D(ax, ay, az);
              const screenB = project3DTo2D(bx, by, bz);
              if (screenA && screenB) {
                a_px = screenA.px;
                a_py = screenA.py;
                b_px = screenB.px;
                b_py = screenB.py;
                isValid = true;
              }
            }
          }
        }
      }
    }

    if (!isValid) return null;

    // Check if sectorRays is provided for quadrant choice
    if (ad.sectorRays) {
      const label1 = ad.sectorRays[0];
      const label2 = ad.sectorRays[1];

      // Original vectors from vertex in 2D
      const o1_px = a_px - px;
      const o1_py = a_py - py;
      const o2_px = b_px - px;
      const o2_py = b_py - py;

      // Original vectors from vertex in 3D
      const o1_x = ax - vx;
      const o1_y = ay - vy;
      const o2_x = bx - vx;
      const o2_y = by - vy;

      // Determine vector for ray 1
      let rx1_px = o1_px, rx1_py = o1_py;
      let rx1_x = o1_x, rx1_y = o1_y;
      if (label1 === 'OA') {
        rx1_px = -o1_px; rx1_py = -o1_py;
        rx1_x = -o1_x; rx1_y = -o1_y;
      } else if (label1 === 'B') {
        rx1_px = o2_px; rx1_py = o2_py;
        rx1_x = o2_x; rx1_y = o2_y;
      } else if (label1 === 'OB') {
        rx1_px = -o2_px; rx1_py = -o2_py;
        rx1_x = -o2_x; rx1_y = -o2_y;
      }

      // Determine vector for ray 2
      let rx2_px = o2_px, rx2_py = o2_py;
      let rx2_x = o2_x, rx2_y = o2_y;
      if (label2 === 'A') {
        rx2_px = o1_px; rx2_py = o1_py;
        rx2_x = o1_x; rx2_y = o1_y;
      } else if (label2 === 'OA') {
        rx2_px = -o1_px; rx2_py = -o1_py;
        rx2_x = -o1_x; rx2_y = -o1_y;
      } else if (label2 === 'OB') {
        rx2_px = -o2_px; rx2_py = -o2_py;
        rx2_x = -o2_x; rx2_y = -o2_y;
      }

      // Update screen and 3D positions
      a_px = px + rx1_px;
      a_py = py + rx1_py;
      ax = vx + rx1_x;
      ay = vy + rx1_y;

      b_px = px + rx2_px;
      b_py = py + rx2_py;
      bx = vx + rx2_x;
      by = vy + rx2_y;
    }

    // Compute angle value
    let angleDeg = 0;
    const ux = ax - vx;
    const uy = ay - vy;
    const vx_dir = bx - vx;
    const vy_dir = by - vy;

    const dot = ux * vx_dir + uy * vy_dir;
    const lenU = Math.hypot(ux, uy);
    const lenV = Math.hypot(vx_dir, vy_dir);
    if (lenU > 1e-4 && lenV > 1e-4) {
      const cosTheta = Math.max(-1, Math.min(1, dot / (lenU * lenV)));
      angleDeg = Math.acos(cosTheta) * 180 / Math.PI;
    }

    return {
      vertex: { x: vx, y: vy, z: vz, px, py },
      ptA: { x: ax, y: ay, z: az, px: a_px, py: a_py },
      ptB: { x: bx, y: by, z: bz, px: b_px, py: b_py },
      angleDeg
    };
  };

  const getAngleValueInDegrees = (ad: AngleDimension, currentSolved: any) => {
    const geom = resolveAngleGeometry(ad, currentSolved);
    return geom ? geom.angleDeg : 0;
  };

  const getHoveredJoint = (mouseX: number, mouseY: number) => {
    let closestId: string | null = null;
    let minDistance = 20; // 20 pixels hover range

    const JOINT_IDS = ['A1', 'A2', 'P1', 'P2', 'P_chank_TL', 'P_chank_TR', 'P_tibia_rear', 'P_foot'];
    for (const id of JOINT_IDS) {
      if (dimMode === 'p2' && id === pt1) continue;
      const pos = getJointPos2D(id);
      if (!pos) continue;
      const d = Math.hypot(mouseX - pos.px, mouseY - pos.py);
      if (d < minDistance) {
        minDistance = d;
        closestId = id;
      }
    }
    return closestId;
  };

  const distanceToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  };

  const getAvailableSegments = () => {
    const segs: { label: string; p1: string; p2: string; type: 'link' | 'construction'; id?: string }[] = [];
    
    // Straight and triangle links
    links.forEach(l => {
      if (l.isTriangle) {
        if (l.pivotIds.length >= 3) {
          segs.push({ label: `${l.name} Side A`, p1: l.pivotIds[0], p2: l.pivotIds[1], type: 'link' });
          segs.push({ label: `${l.name} Side B`, p1: l.pivotIds[1], p2: l.pivotIds[2], type: 'link' });
          segs.push({ label: `${l.name} Side C`, p1: l.pivotIds[2], p2: l.pivotIds[0], type: 'link' });
        }
      } else {
        if (l.pivotIds.length >= 2) {
          for (let i = 0; i < l.pivotIds.length - 1; i++) {
            const label = l.pivotIds.length > 2 ? `${l.name} Segment ${i + 1}` : l.name;
            segs.push({ label, p1: l.pivotIds[i], p2: l.pivotIds[i + 1], type: 'link' });
          }
        }
      }
    });

    // Construction lines
    constructionLines.forEach(cl => {
      segs.push({ id: cl.id, label: `Construction Line`, p1: cl.p1, p2: cl.p2, type: 'construction' });
    });

    return segs;
  };

  const getHoveredSegment = (mouseX: number, mouseY: number) => {
    const segs = getAvailableSegments();
    let closestSeg: typeof segs[0] | null = null;
    let minDistance = 15; // 15 pixels pickup range

    segs.forEach(seg => {
      const m1 = getJointPos2D(seg.p1);
      const m2 = getJointPos2D(seg.p2);
      if (!m1 || !m2) return;
      const d = distanceToSegment(mouseX, mouseY, m1.px, m1.py, m2.px, m2.py);
      if (d < minDistance) {
        minDistance = d;
        closestSeg = seg;
      }
    });

    return closestSeg;
  };

  const getHoveredDeleteTarget = (x: number, y: number) => {
    const currentSolved = solvedPositionsRef.current || solvedPositions;

    // Check angle dimensions first
    for (const ad of angleDimensions) {
      const geom = resolveAngleGeometry(ad, currentSolved);
      if (geom) {
        const vertex = geom.vertex;
        const R = getPixelRadius(ad.vertexId, ad.radius);
        const alpha1 = Math.atan2(geom.ptA.py - vertex.py, geom.ptA.px - vertex.px);
        const alpha2 = Math.atan2(geom.ptB.py - vertex.py, geom.ptB.px - vertex.px);
        let diff = alpha2 - alpha1;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        const alphaMid = alpha1 + diff / 2;
        const lx = vertex.px + (R + 16) * Math.cos(alphaMid);
        const ly = vertex.py + (R + 16) * Math.sin(alphaMid);

        const dist = Math.hypot(x - lx, y - ly);
        if (dist < 32) {
          return { type: 'angle' as const, id: ad.id };
        }
      }
    }

    // Check custom dimensions
    for (const cd of customDimensions) {
      const m1 = currentSolved[cd.p1];
      const m2 = currentSolved[cd.p2];
      if (m1 && m2) {
        const mx = (m1.x + m2.x) / 2;
        const my = (m1.y + m2.y) / 2;
        const mz = (m1.z + m2.z) / 2;
        const scr = project3DTo2D(mx, my, mz);
        if (scr) {
          const off = labelOffsets[cd.id] || { dx: 0, dy: 0 };
          const lx = scr.px + off.dx;
          const ly = scr.py + off.dy;
          const dist = Math.hypot(x - lx, y - ly);
          if (dist < 32) {
            return { type: 'custom' as const, id: cd.id };
          }
        }
      }
    }

    // Check construction lines
    const seg = getHoveredSegment(x, y);
    if (seg && seg.type === 'construction' && seg.id) {
      return { type: 'construction' as const, id: seg.id };
    }

    return null;
  };

  // Dragging HUD refs
  const activeDragRef = useRef<{ id: string; startX: number; startY: number; initialDx: number; initialDy: number } | null>(null);

  const startDragHud = (id: string, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    const element = e.target as HTMLElement;
    if (element.tagName === 'INPUT') return; // Don't drag when selecting inputs!

    const currentOffset = labelOffsets[id] || { dx: 0, dy: 0 };
    activeDragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialDx: currentOffset.dx,
      initialDy: currentOffset.dy
    };
    e.stopPropagation();
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!activeDragRef.current) return;
      const { id, startX, startY, initialDx, initialDy } = activeDragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      onLabelOffsetsChange({
        ...labelOffsets,
        [id]: { dx: initialDx + dx, dy: initialDy + dy }
      });
    };

    const handleGlobalMouseUp = () => {
      activeDragRef.current = null;
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [labelOffsets, onLabelOffsetsChange]);

  const handleDoubleClickLabel = (paramKey: string, currentValue: number) => {
    setEditingParam({
      id: paramKey,
      originalValue: currentValue,
      currentInputValue: String(currentValue)
    });
  };

  const handleFinishEdit = (e?: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (!editingParam) return;

    const newValue = parseFloat(editingParam.currentInputValue);
    if (!isNaN(newValue)) {
      const key = editingParam.id;
      if (key === 'angleA1') {
        onAngleA1Change(newValue);
      } else if (key === 'angleA2') {
        onAngleA2Change(newValue);
      } else {
        onDimensionChange(key, newValue);
      }
    }
    setEditingParam(null);
  };

  const project3DTo2D = (x: number, y: number, z: number) => {
    if (!cameraRef.current) return null;
    
    // Always keep matrices perfectly up to date
    cameraRef.current.updateMatrixWorld(true);
    cameraRef.current.matrixWorldInverse.copy(cameraRef.current.matrixWorld).invert();
    
    // Check if point is in front of the camera plane in camera-space (view-space)
    // Camera looks down the negative Z axis, so Z must be <= 0 to be in front
    const localV = new THREE.Vector3(x, y, z).applyMatrix4(cameraRef.current.matrixWorldInverse);
    if (localV.z >= 0) return null;
    
    // Project vector to Normalized Device Coordinates (NDC)
    const tempV = new THREE.Vector3(x, y, z);
    tempV.project(cameraRef.current);

    const { w, h } = containerSizeRef.current;
    if (w === 0 || h === 0) return null;

    return {
      px: (tempV.x * 0.5 + 0.5) * w,
      py: (-(tempV.y * 0.5) + 0.5) * h
    };
  };

  const getDimensionLineData = (
    p1Id: string,
    p2Id: string,
    labelId: string,
    type: 'distance' | 'horizontal' | 'vertical'
  ) => {
    const currentSolved = solvedPositionsRef.current || solvedPositions;
    if (!currentSolved) return null;
    
    // Get 3D points
    const pt1_3d = currentSolved[p1Id];
    const pt2_3d = currentSolved[p2Id];
    if (!pt1_3d || !pt2_3d) return null;

    // Project to 2D screen coords (px, py)
    const m1 = project3DTo2D(pt1_3d.x, pt1_3d.y, pt1_3d.z);
    const m2 = project3DTo2D(pt2_3d.x, pt2_3d.y, pt2_3d.z);
    if (!m1 || !m2) return null;

    // Get current label offset / displacement
    const currentOffset = labelOffsetsRef.current[labelId] || { dx: 0, dy: 0 };
    const dx = currentOffset.dx;
    const dy = currentOffset.dy;

    // Midpoint of the original linkage points
    let midX = (m1.px + m2.px) / 2;
    let midY = (m1.py + m2.py) / 2;

    // Vector from A to B
    let dx_link = m2.px - m1.px;
    let dy_link = m2.py - m1.py;

    if (type === 'horizontal') {
      dy_link = 0; // force horizontal dimension line
    } else if (type === 'vertical') {
      dx_link = 0; // force vertical dimension line
    }

    const L_px = Math.hypot(dx_link, dy_link);
    let ux = 1, uy = 0;
    if (L_px > 0.1) {
      ux = dx_link / L_px;
      uy = dy_link / L_px;
    }

    // Normal vector pointing outwards
    const nx = -uy;
    const ny = ux;

    // Perpendicular height displacement from midpoint
    const h = dx * nx + dy * ny;

    // Dimension line endpoints (parallel to link or aligned to axes)
    let A_prime, B_prime;
    if (type === 'horizontal') {
      A_prime = {
        x: m1.px + h * nx,
        y: midY + h * ny
      };
      B_prime = {
        x: m2.px + h * nx,
        y: midY + h * ny
      };
    } else if (type === 'vertical') {
      A_prime = {
        x: midX + h * nx,
        y: m1.py + h * ny
      };
      B_prime = {
        x: midX + h * nx,
        y: m2.py + h * ny
      };
    } else {
      A_prime = {
        x: m1.px + h * nx,
        y: m1.py + h * ny
      };
      B_prime = {
        x: m2.px + h * nx,
        y: m2.py + h * ny
      };
    }

    // Extension line starts and ends
    const sign_h = Math.sign(h) || 1;
    const offset_start = 3 * sign_h;
    const offset_end = 6 * sign_h; // overlap beyond the dimension line

    const A_ext_start = {
      x: m1.px + offset_start * nx,
      y: m1.py + offset_start * ny
    };
    const A_ext_end = {
      x: A_prime.x + offset_end * nx,
      y: A_prime.y + offset_end * ny
    };

    const B_ext_start = {
      x: m2.px + offset_start * nx,
      y: m2.py + offset_start * ny
    };
    const B_ext_end = {
      x: B_prime.x + offset_end * nx,
      y: B_prime.y + offset_end * ny
    };

    // Arrowhead calculations
    const arrow_A = `M ${A_prime.x} ${A_prime.y} L ${A_prime.x + 8 * ux + 2.5 * nx} ${A_prime.y + 8 * uy + 2.5 * ny} L ${A_prime.x + 8 * ux - 2.5 * nx} ${A_prime.y + 8 * uy - 2.5 * ny} Z`;
    const arrow_B = `M ${B_prime.x} ${B_prime.y} L ${B_prime.x - 8 * ux + 2.5 * nx} ${B_prime.y - 8 * uy + 2.5 * ny} L ${B_prime.x - 8 * ux - 2.5 * nx} ${B_prime.y - 8 * uy - 2.5 * ny} Z`;

    return {
      A_ext_start,
      A_ext_end,
      B_ext_start,
      B_ext_end,
      A_prime,
      B_prime,
      arrow_A,
      arrow_B,
      ux, uy, nx, ny, h
    };
  };

  const domCacheRef = useRef<Record<string, HTMLElement | null>>({});

  const getCachedElement = (id: string): HTMLElement | null => {
    let el = domCacheRef.current[id];
    if (!el || !el.isConnected) {
      el = document.getElementById(id) as HTMLElement | null;
      if (el) {
        domCacheRef.current[id] = el;
      }
    }
    return el;
  };

  const updateFloatingLabels = () => {
    const currentSolved = solvedPositionsRef.current;
    
    // Cache the root layout panels and special indicators
    const elLinesLayer = getCachedElement('cad-lines-layer');
    const elHudLabels = getCachedElement('dynamic-overlay-hud-labels');
    const elP1 = getCachedElement('p1-select-circle');
    const elP2 = getCachedElement('p2-select-circle');
    const elHover = getCachedElement('hover-circle');
    const elTarget = getCachedElement('red-target-circle');

    if (!currentSolved || !cameraRef.current || !rendererRef.current || !containerRef.current) {
      if (elLinesLayer) elLinesLayer.style.display = 'none';
      if (elHudLabels) elHudLabels.style.display = 'none';
      if (elP1) elP1.style.display = 'none';
      if (elP2) elP2.style.display = 'none';
      if (elHover) elHover.style.display = 'none';
      if (elTarget) elTarget.style.display = 'none';
      return;
    }

    // Restore visibilities of root overlays
    if (elLinesLayer) elLinesLayer.style.display = 'block';
    if (elHudLabels) elHudLabels.style.display = 'block';

    // Synchronize selected point and hovered point indicators in 2D Space in lockstep with rendering
    const isDimActive = dimModeRef.current !== 'idle';
    const isCadActive = cadToolRef.current !== 'none';
    const isHoverActive = (isDimActive && (dimModeRef.current === 'p1' || dimModeRef.current === 'p2' || dimModeRef.current === 'seg_selected')) ||
                          (isCadActive && (cadToolRef.current === 'construction_p1' || cadToolRef.current === 'construction_p2'));

    const p1Id = isDimActive ? pt1Ref.current : (isCadActive ? constPt1Ref.current : null);
    if (elP1) {
      if (p1Id) {
        const ptPos = currentSolved[p1Id];
        const scrPt = ptPos ? project3DTo2D(ptPos.x, ptPos.y, ptPos.z) : null;
        if (scrPt) {
          elP1.style.transform = `translate3d(${scrPt.px}px, ${scrPt.py}px, 0px) translate(-50%, -50%)`;
          elP1.style.left = '0px';
          elP1.style.top = '0px';
          elP1.style.display = 'block';
        } else {
          elP1.style.display = 'none';
        }
      } else {
        elP1.style.display = 'none';
      }
    }

    const p2Id = isDimActive ? pt2Ref.current : (isCadActive ? constPt2Ref.current : null);
    if (elP2) {
      if (p2Id) {
        const ptPos = currentSolved[p2Id];
        const scrPt = ptPos ? project3DTo2D(ptPos.x, ptPos.y, ptPos.z) : null;
        if (scrPt) {
          elP2.style.transform = `translate3d(${scrPt.px}px, ${scrPt.py}px, 0px) translate(-50%, -50%)`;
          elP2.style.left = '0px';
          elP2.style.top = '0px';
          elP2.style.display = 'block';
        } else {
          elP2.style.display = 'none';
        }
      } else {
        elP2.style.display = 'none';
      }
    }

    if (elHover) {
      if (isHoverActive && hoveredJointRef.current && hoveredJointRef.current !== p1Id) {
        const ptPos = currentSolved[hoveredJointRef.current];
        const scrPt = ptPos ? project3DTo2D(ptPos.x, ptPos.y, ptPos.z) : null;
        if (scrPt) {
          elHover.style.transform = `translate3d(${scrPt.px}px, ${scrPt.py}px, 0px) translate(-50%, -50%)`;
          elHover.style.left = '0px';
          elHover.style.top = '0px';
          elHover.style.display = 'block';
        } else {
          elHover.style.display = 'none';
        }
      } else {
        elHover.style.display = 'none';
      }
    }

    if (elTarget) {
      if (ikActive && targetIK) {
        const scrPt = project3DTo2D(targetIK.x, targetIK.y, 0);
        if (scrPt) {
          elTarget.style.transform = `translate3d(${scrPt.px}px, ${scrPt.py}px, 0px) translate(-50%, -50%)`;
          elTarget.style.left = '0px';
          elTarget.style.top = '0px';
          elTarget.style.display = 'block';
        } else {
          elTarget.style.display = 'none';
        }
      } else {
        elTarget.style.display = 'none';
      }
    }

    try {

    const getOffset = (id: string) => {
      return labelOffsetsRef.current[id] || { dx: 0, dy: 0 };
    };

    const posA1 = currentSolved['A1'] || { x: 0, y: 0, z: 0 };
    const posA2 = currentSolved['A2'] || { x: 20, y: 21, z: 0 };

    const updateEl = (id: string, x: number, y: number, z: number, defaultDy = 0, defaultDx = 0) => {
      const el = getCachedElement(id);
      if (el) {
        let visible = true;
        if (id.includes('actuator') && !showActuatorLabelsRef.current) visible = false;
        else if (id.includes('lbl-dim-') && !showSpacingLabelsRef.current) visible = false;
        else if (id.includes('lbl-link-') && !showLengthLabelsRef.current) visible = false;
        else if (id === 'lbl-btn-foot' && !showToeTipLabelRef.current) visible = false;
        else if (id.startsWith('custom-') && !showCustomDimLabelsRef.current) visible = false;

        const scr = project3DTo2D(x, y, z);
        if (scr && visible) {
          const off = getOffset(id);
          el.style.transform = `translate3d(${scr.px + defaultDx + off.dx}px, ${scr.py + defaultDy + off.dy}px, 0px) translate(-50%, -50%)`;
          el.style.left = '0px';
          el.style.top = '0px';
          el.style.display = 'block';
        } else {
          el.style.display = 'none';
        }
      }
    };

    const updateDimLines = (
      id: string,
      p1Id: string,
      p2Id: string,
      type: 'distance' | 'horizontal' | 'vertical' | 'angle'
    ) => {
      let visible = true;
      if (id.includes('actuator') && !showActuatorLabelsRef.current) visible = false;
      else if (id.includes('lbl-dim-') && !showSpacingLabelsRef.current) visible = false;
      else if (id.includes('lbl-link-') && !showLengthLabelsRef.current) visible = false;
      else if (id.startsWith('custom-') && !showCustomDimLabelsRef.current) visible = false;

      const elExtA = getCachedElement(`ext-A-${id}`) as unknown as SVGPathElement | null;
      const elExtB = getCachedElement(`ext-B-${id}`) as unknown as SVGPathElement | null;
      const elDimLine = getCachedElement(`dim-line-${id}`) as unknown as SVGPathElement | null;
      const elArrowA = getCachedElement(`arrow-A-${id}`) as unknown as SVGPathElement | null;
      const elArrowB = getCachedElement(`arrow-B-${id}`) as unknown as SVGPathElement | null;

      if (type === 'angle') {
        const elArc = getCachedElement(`arc-${id}`) as unknown as SVGPathElement | null;
        const elRefLine = getCachedElement(`ref-line-${id}`) as unknown as SVGPathElement | null;
        const elActiveLine = getCachedElement(`act-line-${id}`) as unknown as SVGPathElement | null;

        if (!visible) {
          if (elArc) elArc.style.display = 'none';
          if (elRefLine) elRefLine.style.display = 'none';
          if (elActiveLine) elActiveLine.style.display = 'none';
          return;
        }

        const pt = currentSolved[p1Id];
        const p2 = currentSolved[p2Id];
        if (!pt || !p2) return;

        const scrP = project3DTo2D(pt.x, pt.y, pt.z);
        const scrQ = project3DTo2D(p2.x, p2.y, p2.z);
        if (!scrP || !scrQ) return;

        const angleVal = p1Id === 'A1' ? angleA1Ref.current : angleA2Ref.current;
        const angleRad = (angleVal * Math.PI) / 180;

        if (elRefLine) {
          elRefLine.setAttribute('d', `M ${scrP.px} ${scrP.py} L ${scrP.px + 45} ${scrP.py}`);
          elRefLine.style.display = 'block';
        }
        if (elActiveLine) {
          const dqx = scrQ.px - scrP.px;
          const dqy = scrQ.py - scrP.py;
          const lenQ = Math.hypot(dqx, dqy);
          if (lenQ > 0.1) {
            elActiveLine.setAttribute('d', `M ${scrP.px} ${scrP.py} L ${scrP.px + (45 * dqx / lenQ)} ${scrP.py + (45 * dqy / lenQ)}`);
            elActiveLine.style.display = 'block';
          }
        }
        if (elArc) {
          const R = 30;
          const startX = scrP.px + R;
          const startY = scrP.py;
          const endX = scrP.px + R * Math.cos(angleRad);
          const endY = scrP.py - R * Math.sin(angleRad);

          const largeArc = Math.abs(angleVal) > 180 ? 1 : 0;
          const sweepFlag = angleVal >= 0 ? 0 : 1;

          elArc.setAttribute('d', `M ${startX} ${startY} A ${R} ${R} 0 ${largeArc} ${sweepFlag} ${endX} ${endY}`);
          elArc.style.display = 'block';
        }

        if (elExtA) elExtA.style.display = 'none';
        if (elExtB) elExtB.style.display = 'none';
        if (elDimLine) elDimLine.style.display = 'none';
        if (elArrowA) elArrowA.style.display = 'none';
        if (elArrowB) elArrowB.style.display = 'none';
        return;
      }

      const elArc = getCachedElement(`arc-${id}`) as unknown as SVGPathElement | null;
      const elRefLine = getCachedElement(`ref-line-${id}`) as unknown as SVGPathElement | null;
      const elActiveLine = getCachedElement(`act-line-${id}`) as unknown as SVGPathElement | null;
      if (elArc) elArc.style.display = 'none';
      if (elRefLine) elRefLine.style.display = 'none';
      if (elActiveLine) elActiveLine.style.display = 'none';

      const data = getDimensionLineData(p1Id, p2Id, id, type);
      if (visible && data && elExtA && elExtB && elDimLine && elArrowA && elArrowB) {
        elExtA.setAttribute('d', `M ${data.A_ext_start.x} ${data.A_ext_start.y} L ${data.A_ext_end.x} ${data.A_ext_end.y}`);
        elExtB.setAttribute('d', `M ${data.B_ext_start.x} ${data.B_ext_start.y} L ${data.B_ext_end.x} ${data.B_ext_end.y}`);
        elDimLine.setAttribute('d', `M ${data.A_prime.x} ${data.A_prime.y} L ${data.B_prime.x} ${data.B_prime.y}`);
        elArrowA.setAttribute('d', data.arrow_A);
        elArrowB.setAttribute('d', data.arrow_B);

        elExtA.style.display = 'block';
        elExtB.style.display = 'block';
        elDimLine.style.display = 'block';
        elArrowA.style.display = 'block';
        elArrowB.style.display = 'block';
      } else {
        if (elExtA) elExtA.style.display = 'none';
        if (elExtB) elExtB.style.display = 'none';
        if (elDimLine) elDimLine.style.display = 'none';
        if (elArrowA) elArrowA.style.display = 'none';
        if (elArrowB) elArrowB.style.display = 'none';
      }
    };

    // A1
    updateEl('lbl-actuator-A1', posA1.x, posA1.y, posA1.z, -30, 0);
    // A2
    updateEl('lbl-actuator-A2', posA2.x, posA2.y, posA2.z, -30, 0);
    // Dim H
    updateEl('lbl-dim-h', (posA1.x + posA2.x) / 2, posA1.y, -1.5, 15, 0);
    // Dim V
    updateEl('lbl-dim-v', posA2.x, (posA1.y + posA2.y) / 2, -1.5, 0, 45);

    // TS Link
    const posP1 = currentSolved['P1'];
    if (posP1) updateEl('lbl-link-tibia-servo', (posA1.x + posP1.x) / 2, (posA1.y + posP1.y) / 2, (posA1.z + posP1.z) / 2, 0, 0);

    // ST Link
    const posTL = currentSolved['P_chank_TL'];
    if (posP1 && posTL) updateEl('lbl-link-second-tibia', (posP1.x + posTL.x) / 2, (posP1.y + posTL.y) / 2, (posP1.z + posTL.z) / 2, 0, 0);

    // FS Link
    const posP2 = currentSolved['P2'];
    if (posP2) updateEl('lbl-link-femur-servo', (posA2.x + posP2.x) / 2, (posA2.y + posP2.y) / 2, (posA2.z + posP2.z) / 2, 0, 0);

    // RT Link
    const posTR = currentSolved['P_chank_TR'];
    const posTRear = currentSolved['P_tibia_rear'];
    if (posTR && posTRear) updateEl('lbl-link-rear-tibia', (posTR.x + posTRear.x) / 2, (posTR.y + posTRear.y) / 2, (posTR.z + posTRear.z) / 2, 0, 0);

    // TE Link
    if (posTRear && posP2) updateEl('lbl-link-tibia-ext', (posTRear.x + posP2.x) / 2, (posTRear.y + posP2.y) / 2, (posTRear.z + posP2.z) / 2, 0, 0);

    // TM Link
    const posFoot = currentSolved['P_foot'];
    if (posP2 && posFoot) updateEl('lbl-link-tibia-main', (posP2.x + posFoot.x) / 2, (posP2.y + posFoot.y) / 2, (posP2.z + posFoot.z) / 2, 0, 0);

    // CT Link
    if (posTL && posTR) updateEl('lbl-link-chank-top', (posTL.x + posTR.x) / 2, (posTL.y + posTR.y) / 2, (posTL.z + posTR.z) / 2, 0, 0);

    // CL Link
    if (posTL) updateEl('lbl-link-chank-left', (posA2.x + posTL.x) / 2, (posA2.y + posTL.y) / 2, (posA2.z + posTL.z) / 2, 0, 0);

    // CR Link
    if (posTR) updateEl('lbl-link-chank-right', (posA2.x + posTR.x) / 2, (posA2.y + posTR.y) / 2, (posA2.z + posTR.z) / 2, 0, 0);

    // Foot
    if (posFoot) updateEl('lbl-btn-foot', posFoot.x, posFoot.y, posFoot.z, 25, 0);

    // Default dimensions arrows & extension lines
    Object.entries(DIM_GEOMETRY_MAP).forEach(([lblId, mapping]) => {
      updateDimLines(lblId, mapping.p1, mapping.p2, mapping.type);
    });

    // Custom dimensions arrows & extension lines
    customDimensionsRef.current.forEach((cd) => {
      const m1 = currentSolved[cd.p1];
      const m2 = currentSolved[cd.p2];
      if (m1 && m2) {
        updateEl(cd.id, (m1.x + m2.x) / 2, (m1.y + m2.y) / 2, (m1.z + m2.z) / 2, 0, 0);
        updateDimLines(cd.id, cd.p1, cd.p2, 'distance');
      }
    });

    // Dynamic Translation Triangle Floating Legends
    if (ikActive && originalFootPos && currentSolved && currentSolved['P_foot'] && dimMode === 'idle') {
      const p_orig = originalFootPos;
      const p_curr = currentSolved['P_foot'];

      const dx = Math.abs(p_curr.x - p_orig.x);
      const dy = Math.abs(p_curr.y - p_orig.y);
      const dc = Math.hypot(p_curr.x - p_orig.x, p_curr.y - p_orig.y);

      const elDx = getCachedElement('lbl-triangle-dx');
      if (elDx) elDx.textContent = `ΔX: ${dx.toFixed(1)} mm`;

      const elDy = getCachedElement('lbl-triangle-dy');
      if (elDy) elDy.textContent = `ΔY: ${dy.toFixed(1)} mm`;

      const elDc = getCachedElement('lbl-triangle-dc');
      if (elDc) elDc.textContent = `ΔC: ${dc.toFixed(1)} mm`;

      // Position them on their respective midpoints with subtle text separation offsets
      updateEl('lbl-triangle-dx', (p_orig.x + p_curr.x) / 2, p_orig.y, 0.1, -12, 0);
      updateEl('lbl-triangle-dy', p_curr.x, (p_orig.y + p_curr.y) / 2, 0.1, 0, 0);
      updateEl('lbl-triangle-dc', (p_orig.x + p_curr.x) / 2, (p_orig.y + p_curr.y) / 2, 0.15, 12, 0);
    } else {
      const elDx = getCachedElement('lbl-triangle-dx');
      const elDy = getCachedElement('lbl-triangle-dy');
      const elDc = getCachedElement('lbl-triangle-dc');
      if (elDx) elDx.style.display = 'none';
      if (elDy) elDy.style.display = 'none';
      if (elDc) elDc.style.display = 'none';
    }

    } catch (err) {
      console.error('Error in updateFloatingLabels:', err);
    }
  };

  useEffect(() => {
    updateFloatingLabelsRef.current = updateFloatingLabels;
  });

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  
  const [showAxis, setShowAxis] = useState(false);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);

  useEffect(() => {
    if (axesHelperRef.current) {
      axesHelperRef.current.visible = showAxis;
    }
  }, [showAxis]);

  // Recreate GridHelper when gridSize or theme changes to update visual size/density
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (gridHelperRef.current) {
      scene.remove(gridHelperRef.current);
      gridHelperRef.current.dispose();
    }

    const gridMajorCol = theme === 'light' ? 0x94a3b8 : 0x475569;
    const gridMinorCol = theme === 'light' ? 0xcbd5e1 : 0x1e293b;

    // gridSize represents physical mm of each segment
    const totalSize = 400;
    const divisions = Math.max(2, Math.round(totalSize / gridSize));

    const gridHelper = new THREE.GridHelper(totalSize, divisions, gridMajorCol, gridMinorCol);
    gridHelper.rotation.x = Math.PI / 2; // Lie flat in XY plane
    gridHelper.position.z = -8; // Push slightly backward helper layer
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;
  }, [gridSize, theme]);

  // Synchronize 3D scene visual theme dynamically
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (theme === 'light') {
      scene.background = new THREE.Color(0xf1f5f9);
    } else {
      scene.background = new THREE.Color(0x0e131f);
    }
  }, [theme]);

  // Group to hold all dynamic linkage meshes
  const linkageGroupRef = useRef<THREE.Group | null>(null);
  const trailMeshRef = useRef<THREE.Line | null>(null);
  const targetSphereRef = useRef<THREE.Mesh | null>(null);
  const originalSphereRef = useRef<THREE.Mesh | null>(null);
  const translationXLineRef = useRef<THREE.Line | null>(null);
  const translationYLineRef = useRef<THREE.Line | null>(null);
  const translationCLineRef = useRef<THREE.Line | null>(null);

  // Gait waypoints refs
  const gaitWaypointsGroupRef = useRef<THREE.Group | null>(null);
  const gaitWaypointsMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const isDraggingWaypointRef = useRef<string | null>(null);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const planeZRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // CAD 3D Viewcube References & smooth transition targets
  const cubeRef = useRef<HTMLDivElement>(null);
  const transitionTargetPosRef = useRef<THREE.Vector3 | null>(null);
  const transitionTargetLookRef = useRef<THREE.Vector3 | null>(null);

  // Smooth camera orientation transition function
  const transitionToView = (viewName: 'front' | 'back' | 'top' | 'bottom' | 'right' | 'left' | 'home') => {
    if (!controlsRef.current || !cameraRef.current) return;
    
    const target = new THREE.Vector3(30, 15, 0); // Center of mechanism workspace
    const currentPos = cameraRef.current.position.clone();
    const currentTarget = controlsRef.current.target.clone();
    
    // Maintain standard camera orbit distance
    const distance = currentPos.distanceTo(currentTarget) || 720;
    const targetPos = new THREE.Vector3();
    
    switch (viewName) {
      case 'front': // Looking down Z axis (Y points up, X points right)
        targetPos.set(target.x, target.y, target.z + distance);
        break;
      case 'back': // Looking down negative Z axis
        targetPos.set(target.x, target.y, target.z - distance);
        break;
      case 'right': // Looking down positive X axis
        targetPos.set(target.x + distance, target.y, target.z);
        break;
      case 'left': // Looking down negative X axis
        targetPos.set(target.x - distance, target.y, target.z);
        break;
      case 'top': // Looking down positive Y axis
        targetPos.set(target.x, target.y + distance, target.z + 0.01);
        break;
      case 'bottom': // Looking down negative Y axis
        targetPos.set(target.x, target.y - distance, target.z - 0.01);
        break;
      case 'home':
      default:
        targetPos.set(40, -40, 720);
        break;
    }
    
    transitionTargetPosRef.current = targetPos;
    transitionTargetLookRef.current = target;
  };

  // Mouse move handler for dragging target or waypoints
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. Drag target sphere in IK Drag mode
      if (isDraggingRef.current && cameraRef.current && canvasRef.current && ikActive) {
        const rect = canvasRef.current.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersectionPoint = new THREE.Vector3();
        raycasterRef.current.ray.intersectPlane(planeZRef.current, intersectionPoint);

        let targetX = intersectionPoint.x;
        let targetY = intersectionPoint.y;

        if (gridSnapping) {
          targetX = Math.round(targetX / gridSize) * gridSize;
          targetY = Math.round(targetY / gridSize) * gridSize;
        }

        onTargetDragRef.current(targetX, targetY);
        return;
      }

      // 2. Drag gait waypoint in Sim Editor mode
      if (isDraggingWaypointRef.current && cameraRef.current && canvasRef.current && simEditorOpen) {
        const rect = canvasRef.current.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersectionPoint = new THREE.Vector3();
        raycasterRef.current.ray.intersectPlane(planeZRef.current, intersectionPoint);

        let targetX = intersectionPoint.x;
        let targetY = intersectionPoint.y;

        if (gridSnapping) {
          targetX = Math.round(targetX / gridSize) * gridSize;
          targetY = Math.round(targetY / gridSize) * gridSize;
        }

        onWaypointDrag?.(isDraggingWaypointRef.current, Number(targetX.toFixed(1)), Number(targetY.toFixed(1)));
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isDraggingWaypointRef.current = null;
      if (controlsRef.current) {
        controlsRef.current.enabled = true; // Re-enable orbit camera
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [ikActive, simEditorOpen, gridSnapping, gridSize, onWaypointDrag]);

  // Initial Scene Setup
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // 1. Scene & Background Style
    const scene = new THREE.Scene();
    const initialBgColor = theme === 'light' ? 0xf1f5f9 : 0x0e131f;
    scene.background = new THREE.Color(initialBgColor);
    sceneRef.current = scene;

    // No fog for maximum schematic clarity and crisp high contrast

        // 2. Camera Setup
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    containerSizeRef.current = { w: width, h: height };
    const camera = new THREE.PerspectiveCamera(10, width / height, 1, 3000);
    camera.position.set(30, 15, 720); // Centered front-view position aligned with target (30, 15, 0)
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Restrict camera below the grid
    controls.minDistance = 100;
    controls.maxDistance = 2000;
    controls.target.set(30, 15, 0); // Center around typical mechanism workspace
    controls.enableRotate = false; // Enabled by default on front view, so starts as locked (false)
    controlsRef.current = controls;

    // React to camera changes and instantly update 2D SVG dimension overlays and 3D HTML labels in lockstep
    controls.addEventListener('change', () => {
      if (updateFloatingLabelsRef.current) {
        updateFloatingLabelsRef.current();
      }
      setOrbitRev(prev => prev + 1);
    });

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0x222a3a, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(60, 100, 80);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x4a90e2, 1.5); // Futuristic cyan tint fill light
    dirLight2.position.set(-80, -40, 40);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x38bdf8, 2, 80);
    pointLight.position.set(30, 15, 10);
    scene.add(pointLight);

    // 6. Grid display (custom futuristic coordinate map style)
    const gridMajorCol = theme === 'light' ? 0x94a3b8 : 0x475569;
    const gridMinorCol = theme === 'light' ? 0xcbd5e1 : 0x1e293b;
    const gridHelper = new THREE.GridHelper(400, 80, gridMajorCol, gridMinorCol);
    gridHelper.rotation.x = Math.PI / 2; // Lie flat in XY plane
    gridHelper.position.z = -8; // Push slightly backward helper layer
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Minor reference helper at Z = 0
    const axesHelper = new THREE.AxesHelper(30);
    axesHelper.position.set(0, 0, -0.2);
    axesHelper.visible = showAxis;
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    // 7. Dynamic Group
    const linkageGroup = new THREE.Group();
    scene.add(linkageGroup);
    linkageGroupRef.current = linkageGroup;

    // Gait Waypoints group
    const gaitWaypointsGroup = new THREE.Group();
    scene.add(gaitWaypointsGroup);
    gaitWaypointsGroupRef.current = gaitWaypointsGroup;

    // 8. Trajectory Trail Drawing Setup
    const maxTrailPoints = 300;
    const trailPositions = new Float32Array(maxTrailPoints * 3);
    const trailColors = new Float32Array(maxTrailPoints * 3);

    // Pre-fill smooth gradient colors
    for (let i = 0; i < maxTrailPoints; i++) {
      const ratio = i / maxTrailPoints;
      // Fade into neon blue/amber-pink
      trailColors[i * 3] = 0.22; // R
      trailColors[i * 3 + 1] = 0.72; // G
      trailColors[i * 3 + 2] = 0.99; // B
    }

    const trailGeom = new THREE.BufferGeometry();
    trailGeom.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeom.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

    const trailMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      linewidth: 3, // Canvas line width representation
    });

    const trailMesh = new THREE.Line(trailGeom, trailMat);
    trailMesh.visible = false; // Hide blue lines representing trajectory shown when moving tibia
    scene.add(trailMesh);
    trailMeshRef.current = trailMesh;

    // 9. Interactive IK Target Sphere Mesh
    const targetGeom = new THREE.SphereGeometry(4, 32, 32);
    const targetMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Glowing emerald green
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x059669,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.9,
    });
    const targetSphere = new THREE.Mesh(targetGeom, targetMat);
    scene.add(targetSphere);
    targetSphereRef.current = targetSphere;

    // Ring around target
    const targetRingGeom = new THREE.RingGeometry(5, 6, 32);
    const targetRingMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const targetRing = new THREE.Mesh(targetRingGeom, targetRingMat);
    targetSphere.add(targetRing);

    // Red Original position indicator
    const origGeom = new THREE.SphereGeometry(3.5, 32, 32);
    const origMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0xdc2626,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.9,
    });
    const originalSphere = new THREE.Mesh(origGeom, origMat);
    originalSphere.visible = false;
    scene.add(originalSphere);
    originalSphereRef.current = originalSphere;

    const origRingGeom = new THREE.RingGeometry(4.2, 5.2, 32);
    const origRingMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const origRing = new THREE.Mesh(origRingGeom, origRingMat);
    originalSphere.add(origRing);

    // X Translation Line
    const lineXGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    const lineXMat = new THREE.LineBasicMaterial({ color: 0xf97316, linewidth: 2 }); // Orange
    const lineX = new THREE.Line(lineXGeom, lineXMat);
    lineX.visible = false;
    scene.add(lineX);
    translationXLineRef.current = lineX;

    // Y Translation Line
    const lineYGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    const lineYMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 2 }); // Cyan
    const lineY = new THREE.Line(lineYGeom, lineYMat);
    lineY.visible = false;
    scene.add(lineY);
    translationYLineRef.current = lineY;

    // C Translation Line
    const lineCGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    const lineCMat = new THREE.LineBasicMaterial({ color: 0xec4899, linewidth: 3 }); // Pink/Magenta
    const lineC = new THREE.Line(lineCGeom, lineCMat);
    lineC.visible = false;
    scene.add(lineC);
    translationCLineRef.current = lineC;

    // Container Resize observer to detect sidebar toggling & layout changes instantly
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;

      containerSizeRef.current = { w, h };
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);

      // Instantly redraw overlays at new dimensions
      if (updateFloatingLabelsRef.current) {
        updateFloatingLabelsRef.current();
      }
      setOrbitRev(prev => prev + 1);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // 10. Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Smooth camera perspective transition LERP
      if (transitionTargetPosRef.current && cameraRef.current && controlsRef.current) {
        const cam = cameraRef.current;
        const targetPos = transitionTargetPosRef.current;
        const lookTarget = transitionTargetLookRef.current || new THREE.Vector3(30, 15, 0);

        // Interpolate camera position and target center
        cam.position.lerp(targetPos, 0.15);
        controlsRef.current.target.lerp(lookTarget, 0.15);

        // Standardize distance threshold to end transition
        if (cam.position.distanceTo(targetPos) < 0.2 && controlsRef.current.target.distanceTo(lookTarget) < 0.2) {
          cam.position.copy(targetPos);
          controlsRef.current.target.copy(lookTarget);
          transitionTargetPosRef.current = null;
          transitionTargetLookRef.current = null;
        }
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Live update CSS 3D Cube transformation matrix matching viewport angles
      if (cubeRef.current && cameraRef.current && controlsRef.current) {
        const cam = cameraRef.current;
        const target = controlsRef.current.target;
        const dir = new THREE.Vector3().subVectors(cam.position, target);
        const len = dir.length() || 1;
        
        const phi = Math.acos(Math.max(-1, Math.min(1, dir.y / len)));
        const theta = Math.atan2(dir.x, dir.z);
        
        const pitchDeg = (phi - Math.PI / 2) * (180 / Math.PI);
        const yawDeg = -theta * (180 / Math.PI);
        
        cubeRef.current.style.transform = `rotateX(${pitchDeg}deg) rotateY(${yawDeg}deg)`;
      }

      // Rotate target ring for sci-fi look
      if (targetRing) {
        targetRing.rotation.z += 0.02;
      }
      if (origRing) {
        origRing.rotation.z -= 0.02;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      if (updateFloatingLabelsRef.current) {
        updateFloatingLabelsRef.current();
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Update IK active target position & handle mouse interactions
  useEffect(() => {
    if (!targetSphereRef.current) return;

    if (ikActive && targetIK && dimMode === 'idle') {
      targetSphereRef.current.visible = true;
      targetSphereRef.current.position.set(targetIK.x, targetIK.y, 0);
    } else {
      targetSphereRef.current.visible = false;
    }
  }, [ikActive, targetIK, dimMode]);

  // Update original start position indicators and dynamic translation triangle
  useEffect(() => {
    const originalSphere = originalSphereRef.current;
    const lineX = translationXLineRef.current;
    const lineY = translationYLineRef.current;
    const lineC = translationCLineRef.current;

    if (!originalSphere || !lineX || !lineY || !lineC) return;

    if (ikActive && originalFootPos && solvedPositions && solvedPositions['P_foot'] && dimMode === 'idle') {
      const p_orig = originalFootPos;
      const p_curr = solvedPositions['P_foot'];

      // 1. Red start sphere
      originalSphere.position.set(p_orig.x, p_orig.y, 0);
      originalSphere.visible = true;

      // 2. Horizontal (Orange) translation line
      // From originalFootPos (p_orig) to (p_curr.x, p_orig.y)
      const pointsX = [
        new THREE.Vector3(p_orig.x, p_orig.y, 0.1),
        new THREE.Vector3(p_curr.x, p_orig.y, 0.1),
      ];
      lineX.geometry.setFromPoints(pointsX);
      lineX.visible = true;

      // 3. Vertical (Cyan) translation line
      // From (p_curr.x, p_orig.y) to (p_curr.x, p_curr.y)
      const pointsY = [
        new THREE.Vector3(p_curr.x, p_orig.y, 0.1),
        new THREE.Vector3(p_curr.x, p_curr.y, 0.1),
      ];
      lineY.geometry.setFromPoints(pointsY);
      lineY.visible = true;

      // 4. Hypotenuse (Pink) translation line
      // From originalFootPos (p_orig) to (p_curr.x, p_curr.y)
      const pointsC = [
        new THREE.Vector3(p_orig.x, p_orig.y, 0.15),
        new THREE.Vector3(p_curr.x, p_curr.y, 0.15),
      ];
      lineC.geometry.setFromPoints(pointsC);
      lineC.visible = true;
    } else {
      originalSphere.visible = false;
      lineX.visible = false;
      lineY.visible = false;
      lineC.visible = false;
    }
  }, [ikActive, originalFootPos, solvedPositions, dimMode]);

  // If IK active becomes true, cancel dimension and CAD tools to prevent state collision
  useEffect(() => {
    if (ikActive) {
      updateDimMode('idle');
      updatePt1(null);
      updatePt2(null);
      updateHoveredJoint(null);
      setTempMousePos(null);
      
      updateCadTool('none');
      setConstPt1(null);
      setConstPt2(null);
      setAngleSeg1(null);
      setAngleSeg2(null);
      setHoveredSegment(null);
    }
  }, [ikActive]);

  // Handle Drag Click down on the target or waypoints
  const handleMouseDown = (e: React.MouseEvent) => {
    if (setTargetMode) {
      if (!cameraRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
      const intersectionPoint = new THREE.Vector3();
      raycasterRef.current.ray.intersectPlane(planeZRef.current, intersectionPoint);

      let targetX = intersectionPoint.x;
      let targetY = intersectionPoint.y;

      if (gridSnapping) {
        targetX = Math.round(targetX / gridSize) * gridSize;
        targetY = Math.round(targetY / gridSize) * gridSize;
      }

      onTargetDrag(targetX, targetY);
      onSetTargetModeChange?.(false);
      e.stopPropagation();
      return;
    }

    // A. Intercept clicking on gait diamonds if the Sim Editor is open
    if (simEditorOpen && cameraRef.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
      const meshes = Array.from(gaitWaypointsMeshesRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const clickedId = hitMesh.userData.waypointId;
        onWaypointSelect?.(clickedId);
        isDraggingWaypointRef.current = clickedId;

        if (controlsRef.current) {
          controlsRef.current.enabled = false; // Stop camera orbits during drags
        }
        e.stopPropagation();
        return;
      }
    }

    // B. Default standard target sphere drag
    if (!ikActive || !cameraRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    if (targetSphereRef.current) {
      const intersects = raycasterRef.current.intersectObject(targetSphereRef.current);
      if (intersects.length > 0) {
        isDraggingRef.current = true;
        if (controlsRef.current) {
          controlsRef.current.enabled = false; // Turn off orbit trackball so we drag smoothly
        }
      }
    }
  };

  // Re-render Dynamic Linkage Geometry whenever positions are updated
  useEffect(() => {
    const linkageGroup = linkageGroupRef.current;
    if (!linkageGroup || !solvedPositions) return;

    // Clear old elements
    while (linkageGroup.children.length > 0) {
      const obj = linkageGroup.children[0];
      linkageGroup.remove(obj);
    }

    // Add custom dashed dimension lines between A1 and A2
    const posA1 = solvedPositions['A1'] || { x: 0, y: 0, z: 0 };
    const posA2 = solvedPositions['A2'] || { x: 20, y: 21, z: 0 };

    const addDashedLine = (from: THREE.Vector3, to: THREE.Vector3, color: number) => {
      const geom = new THREE.BufferGeometry().setFromPoints([from, to]);
      const mat = new THREE.LineDashedMaterial({
        color: color,
        dashSize: 2.2,
        gapSize: 1.5,
        transparent: true,
        opacity: theme === 'light' ? 0.6 : 0.4,
      });
      const line = new THREE.Line(geom, mat);
      line.computeLineDistances();
      linkageGroup.add(line);
    };

    const c_col = theme === 'light' ? 0x475569 : 0x00f5ff; // cyber blue / slate gray
    addDashedLine(new THREE.Vector3(posA1.x, posA1.y, -1.5), new THREE.Vector3(posA2.x, posA1.y, -1.5), c_col);
    addDashedLine(new THREE.Vector3(posA2.x, posA1.y, -1.5), new THREE.Vector3(posA2.x, posA2.y, -1.5), c_col);

    // Material definitions for high-performance metallic look
    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Gold / brass
      metalness: 0.15,
      roughness: 0.85,
      name: 'brass',
    });

    const steelMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Matte steel
      metalness: 0.15,
      roughness: 0.85,
      name: 'steel',
    });

    const carbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark carbon-rod grey
      metalness: 0.1,
      roughness: 0.9,
      name: 'carbon',
    });

    const activeActuatorMaterial = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Matte active red actuator
      metalness: 0.15,
      roughness: 0.85,
      emissive: 0xef4444,
      emissiveIntensity: 0.05,
      name: 'actuatorActive',
    });

    // Helper: Build cylindrical link bar
    const create3DBar = (p1: { x: number; y: number; z: number }, p2: { x: number; y: number; z: number }, colorHex: number) => {
      const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
      const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);
      const dist = v1.distanceTo(v2);

      if (dist < 0.1) return;

      const barGeom = new THREE.CylinderGeometry(1.65, 1.65, dist, 12);
      const barMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        metalness: 0.15,
        roughness: 0.85,
      });

      const mesh = new THREE.Mesh(barGeom, barMat);

      // Positions
      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
      mesh.position.copy(mid);

      // Rotations
      const up = new THREE.Vector3(0, 1, 0);
      const direction = new THREE.Vector3().subVectors(v2, v1).normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
      mesh.quaternion.copy(quaternion);

      linkageGroup.add(mesh);
    };

    // Render Pin/Joint bearings
    Object.entries(solvedPositions).forEach(([id, pos]) => {
      const pivotDef = pivots.find((p) => p.id === id);
      const isActuator = pivotDef?.type === 'actuator';

      // Pivot spherical cap or circular plate
      const jointGeom = new THREE.CylinderGeometry(
        isActuator ? 4.5 : 2.625,
        isActuator ? 4.5 : 2.625,
        isActuator ? 2.5 : 3.0,
        24
      );
      const jointMesh = new THREE.Mesh(
        jointGeom,
        isActuator ? activeActuatorMaterial : brassMaterial
      );
      jointMesh.position.set(pos.x, pos.y, pos.z);
      jointMesh.rotation.x = Math.PI / 2; // face forward flat in grid
      linkageGroup.add(jointMesh);

      // Inner shaft spacer
      const shaftGeom = new THREE.SphereGeometry(isActuator ? 1.25 : 0.9, 16, 16);
      const shaftMesh = new THREE.Mesh(shaftGeom, steelMaterial);
      shaftMesh.position.set(pos.x, pos.y, pos.z + (isActuator ? 1.5 : 1.875));
      linkageGroup.add(shaftMesh);
    });

    // Render mechanical linkages
    links.forEach((link) => {
      // 1. Triangle links (e.g. Chank rigid body layout)
      if (link.isTriangle && link.pivotIds.length === 3) {
        const p1 = solvedPositions[link.pivotIds[0]];
        const p2 = solvedPositions[link.pivotIds[1]];
        const p3 = solvedPositions[link.pivotIds[2]];

        if (p1 && p2 && p3) {
          // Extrude triangle shape along Z offset to create metallic bracket plates
          const shape = new THREE.Shape();
          shape.moveTo(p1.x, p1.y);
          shape.lineTo(p2.x, p2.y);
          shape.lineTo(p3.x, p3.y);
          shape.closePath();

          const thickness = link.thickness || 3;
          const extrudeSettings = {
            depth: thickness,
            bevelEnabled: true,
            bevelThickness: 0.8,
            bevelSize: 0.4,
            bevelSegments: 3,
            steps: 1,
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          const linkColor = link.color ? parseInt(link.color.replace('#', '0x')) : 0xb5ca8d;

          const plateMat = new THREE.MeshStandardMaterial({
            color: linkColor,
            metalness: 0.15,
            roughness: 0.85,
            transparent: true,
            opacity: 0.88,
          });

          const mesh = new THREE.Mesh(geometry, plateMat);
          mesh.position.z = p1.z - thickness / 2; // Center extruded plate vertically around Z offset
          linkageGroup.add(mesh);
        }
      }
      // 2. Straight link bars (handles sequential/collinear pivots as consecutive cylinders)
      else if (link.pivotIds.length >= 2) {
        const linkColor = link.color ? parseInt(link.color.replace('#', '0x')) : 0x4aa3eb;
        for (let i = 0; i < link.pivotIds.length - 1; i++) {
          const p1 = solvedPositions[link.pivotIds[i]];
          const p2 = solvedPositions[link.pivotIds[i + 1]];
          if (p1 && p2) {
            create3DBar(p1, p2, linkColor);
          }
        }
      }
    });

  }, [solvedPositions, links, pivots]);

  // Update Trajectory trail line history
  useEffect(() => {
    const trailMesh = trailMeshRef.current;
    if (!trailMesh || trajectory.length === 0) return;

    const positions = trailMesh.geometry.attributes.position.array as Float32Array;
    const colors = trailMesh.geometry.attributes.color.array as Float32Array;
    const maxPoints = positions.length / 3;

    // Fill buffer from trajectory array
    for (let i = 0; i < maxPoints; i++) {
      if (i < trajectory.length) {
        const pt = trajectory[trajectory.length - 1 - i]; // Reverse order so newest is brightest
        positions[i * 3] = pt.x;
        positions[i * 3 + 1] = pt.y;
        positions[i * 3 + 2] = pt.z;

        // Gradient fading
        const fadeRatio = 1.0 - i / Math.min(trajectory.length, maxPoints);
        colors[i * 3] = 0.22 + fadeRatio * 0.4;     // Neon cyber cyan fade
        colors[i * 3 + 1] = 0.72 + fadeRatio * 0.28;
        colors[i * 3 + 2] = 0.99;
      } else {
        // Hide unused points at the end of the line
        const lastValid = trajectory[0];
        positions[i * 3] = lastValid.x;
        positions[i * 3 + 1] = lastValid.y;
        positions[i * 3 + 2] = lastValid.z;

        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0;
        colors[i * 3 + 2] = 0;
      }
    }

    trailMesh.geometry.attributes.position.needsUpdate = true;
    trailMesh.geometry.attributes.color.needsUpdate = true;
  }, [trajectory]);

  const labels: Array<{
    id: string;
    paramKey: string;
    value: number;
    prefix: string;
    format: (v: number) => string;
    themeClass: string;
    isBlock?: boolean;
  }> = [
    {
      id: 'lbl-link-tibia-servo',
      paramKey: 'L_tibia_servo',
      value: dimensions.L_tibia_servo,
      prefix: 'L = ',
      format: (v: number) => `${v.toFixed(1)} mm`,
      themeClass: theme === 'light' ? 'bg-white/90 border-slate-300 text-slate-600' : 'bg-slate-950/80 border-white/10 text-slate-300'
    },
    {
      id: 'lbl-link-second-tibia',
      paramKey: 'L_second_tibia',
      value: dimensions.L_second_tibia,
      prefix: 'L = ',
      format: (v: number) => `${v.toFixed(1)} mm`,
      themeClass: theme === 'light' ? 'bg-white/90 border-slate-300 text-slate-600' : 'bg-slate-950/80 border-white/10 text-slate-300'
    },
    {
      id: 'lbl-link-femur-servo',
      paramKey: 'L_femur_servo',
      value: dimensions.L_femur_servo,
      prefix: 'L = ',
      format: (v: number) => `${v.toFixed(1)} mm`,
      themeClass: theme === 'light' ? 'bg-white/90 border-slate-300 text-slate-600' : 'bg-slate-950/80 border-white/10 text-slate-300'
    },
    {
      id: 'lbl-link-rear-tibia',
      paramKey: 'L_rear_tibia',
      value: dimensions.L_rear_tibia,
      prefix: 'L = ',
      format: (v: number) => `${v.toFixed(1)} mm`,
      themeClass: theme === 'light' ? 'bg-white/90 border-slate-300 text-slate-600' : 'bg-slate-950/80 border-white/10 text-slate-300'
    },
    {
      id: 'lbl-link-tibia-ext',
      paramKey: 'L_tibia_offset',
      value: dimensions.L_tibia_offset,
      prefix: 'L = ',
      format: (v: number) => `${v.toFixed(1)} mm`,
      themeClass: theme === 'light' ? 'bg-white/90 border-slate-200 text-slate-500' : 'bg-slate-950/80 border-white/10 text-slate-400'
    },
    {
      id: 'lbl-link-tibia-main',
      paramKey: 'L_tibia_total',
      value: dimensions.L_tibia_total,
      prefix: 'L = ',
      format: (v: number) => `${v.toFixed(1)} mm`,
      themeClass: theme === 'light' ? 'bg-white/90 border-slate-300 text-slate-600' : 'bg-slate-950/80 border-white/10 text-slate-300'
    },
    {
      id: 'lbl-link-chank-top',
      paramKey: 'L_chank_top',
      value: dimensions.L_chank_top,
      prefix: 'L_chank_top = ',
      format: (v: number) => `${v.toFixed(1)} mm`,
      themeClass: theme === 'light' ? 'bg-white/90 border-slate-300 text-slate-600' : 'bg-slate-950/80 border-white/10 text-slate-300'
    },
    {
      id: 'lbl-link-chank-left',
      paramKey: 'L_chank_left',
      value: dimensions.L_chank_left,
      prefix: 'L_chank_left = ',
      format: (v: number) => `${v.toFixed(1)} mm`,
      themeClass: theme === 'light' ? 'bg-white/90 border-slate-300 text-slate-600' : 'bg-slate-950/80 border-white/10 text-slate-300'
    },
    {
      id: 'lbl-link-chank-right',
      paramKey: 'L_chank_right',
      value: dimensions.L_chank_right,
      prefix: 'L_chank_right = ',
      format: (v: number) => `${v.toFixed(1)} mm`,
      themeClass: theme === 'light' ? 'bg-white/90 border-slate-300 text-slate-600' : 'bg-slate-950/80 border-white/10 text-slate-300'
    }
  ];

  const handleDimMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setTempMousePos({ x, y });

    if (dimMode === 'p1') {
      const joint = getHoveredJoint(x, y);
      if (joint) {
        updateHoveredJoint(joint);
        updateHoveredSegment(null);
      } else {
        updateHoveredJoint(null);
        const seg = getHoveredSegment(x, y);
        updateHoveredSegment(seg);
      }
    } else if (dimMode === 'p2') {
      const joint = getHoveredJoint(x, y);
      updateHoveredJoint(joint);
      updateHoveredSegment(null);
    } else if (dimMode === 'seg_selected') {
      updateHoveredJoint(null);
      const seg = getHoveredSegment(x, y);
      if (seg) {
        // Ensure we don't select Segment 1 itself
        const isSelf = angleSeg1 && (
          (seg.p1 === angleSeg1[0] && seg.p2 === angleSeg1[1]) ||
          (seg.p1 === angleSeg1[1] && seg.p2 === angleSeg1[0])
        );
        if (!isSelf) {
          updateHoveredSegment(seg);
          setAngleSeg2([seg.p1, seg.p2]);
        } else {
          updateHoveredSegment(null);
          setAngleSeg2(null);
        }
      } else {
        updateHoveredSegment(null);
        setAngleSeg2(null);
      }
    } else {
      updateHoveredJoint(null);
      updateHoveredSegment(null);
    }
  };

  const handleDimMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click only
    if (!containerRef.current || !tempMousePos) return;

    if (dimMode === 'p1') {
      if (hoveredJoint) {
        updatePt1(hoveredJoint);
        updateDimMode('p2');
        updateHoveredJoint(null);
        updateHoveredSegment(null);
      } else if (hoveredSegment) {
        // Segment clicked
        updatePt1(hoveredSegment.p1);
        updatePt2(hoveredSegment.p2);
        setAngleSeg1([hoveredSegment.p1, hoveredSegment.p2]);
        updateDimMode('seg_selected');
        updateHoveredSegment(null);
        updateHoveredJoint(null);
      }
    } else if (dimMode === 'p2') {
      if (hoveredJoint && hoveredJoint !== pt1) {
        updatePt2(hoveredJoint);
        updateDimMode('drag');
        updateHoveredJoint(null);
        updateHoveredSegment(null);
      }
    } else if (dimMode === 'seg_selected') {
      if (hoveredSegment) {
        // Clicked second segment -> transition to angle drag!
        const s2: [string, string] = [hoveredSegment.p1, hoveredSegment.p2];
        const s1 = angleSeg1!;
        const same = (s1[0] === s2[0] && s1[1] === s2[1]) || (s1[0] === s2[1] && s1[1] === s2[0]);
        if (!same) {
          setAngleSeg2(s2);
          updateCadTool('angle_drag');
          updateDimMode('idle');
          updateHoveredSegment(null);
        }
      } else {
        // Clicked empty space while segment selected -> place reference dimensions (segment length)
        const m1 = getJointPos2D(pt1!);
        const m2 = getJointPos2D(pt2!);
        if (m1 && m2) {
          const midX = (m1.px + m2.px) / 2;
          const midY = (m1.py + m2.py) / 2;
          const dx = tempMousePos.x - midX;
          const dy = tempMousePos.y - midY;

          const newDim: CustomDimension = {
            id: 'custom-' + Date.now(),
            p1: pt1!,
            p2: pt2!,
            dx,
            dy,
            name: `RD ${customDimensions.length + 1}`
          };
          onCustomDimensionsChange([...customDimensions, newDim]);
        }
        // Reset
        updateDimMode('idle');
        updatePt1(null);
        updatePt2(null);
        setAngleSeg1(null);
        setAngleSeg2(null);
        updateHoveredJoint(null);
        updateHoveredSegment(null);
        setTempMousePos(null);
      }
    } else if (dimMode === 'drag') {
      // Set the offset for custom dimension
      const m1 = getJointPos2D(pt1!);
      const m2 = getJointPos2D(pt2!);
      if (m1 && m2) {
        const midX = (m1.px + m2.px) / 2;
        const midY = (m1.py + m2.py) / 2;
        const dx = tempMousePos.x - midX;
        const dy = tempMousePos.y - midY;

        const newDim: CustomDimension = {
          id: 'custom-' + Date.now(),
          p1: pt1!,
          p2: pt2!,
          dx,
          dy,
          name: `RD ${customDimensions.length + 1}`
        };
        onCustomDimensionsChange([...customDimensions, newDim]);
      }
      // Reset
      updateDimMode('idle');
      updatePt1(null);
      updatePt2(null);
      setAngleSeg1(null);
      setAngleSeg2(null);
      updateHoveredJoint(null);
      updateHoveredSegment(null);
      setTempMousePos(null);
    }
    e.stopPropagation();
  };

  const handleCadMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const currentCad = cadToolRef.current;
    if (currentCad === 'construction_p2') {
      const snapped = getSnappedPosition(x, y);
      setTempMousePos({ x: snapped.px, y: snapped.py });
      const joint = getHoveredJoint(snapped.px, snapped.py);
      updateHoveredJoint(joint);
    } else {
      setTempMousePos({ x, y });
      if (currentCad === 'construction_p1') {
        const joint = getHoveredJoint(x, y);
        updateHoveredJoint(joint);
      } else if (currentCad === 'delete') {
        const target = getHoveredDeleteTarget(x, y);
        updateHoveredDeleteTarget(target);
        if (target && target.type === 'construction') {
          const seg = constructionLinesRef.current.find(cl => cl.id === target.id);
          if (seg) {
            updateHoveredSegment({ label: 'Construction Line', p1: seg.p1, p2: seg.p2, type: 'construction', id: seg.id });
          } else {
            updateHoveredSegment(null);
          }
        } else {
          updateHoveredSegment(null);
        }
      } else if (currentCad === 'angle_seg1' || currentCad === 'angle_seg2') {
        const seg = getHoveredSegment(x, y);
        updateHoveredSegment(seg);
      }
    }
  };

  const handleCadMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click only
    if (!containerRef.current || !tempMousePos) return;

    const currentCad = cadToolRef.current;
    if (currentCad === 'construction_p1') {
      if (hoveredJointRef.current) {
        updateConstPt1(hoveredJointRef.current);
        updateCadTool('construction_p2');
        updateHoveredJoint(null);
      }
    } else if (currentCad === 'construction_p2') {
      let pt2Id = hoveredJointRef.current;
      const snapped = getSnappedPosition(tempMousePos.x, tempMousePos.y);
      if (!pt2Id) {
        pt2Id = `virtual_${snapped.worldX.toFixed(4)}_${snapped.worldY.toFixed(4)}`;
      }

      if (pt2Id && pt2Id !== constPt1Ref.current) {
        const exists = constructionLinesRef.current.some(
          cl => (cl.p1 === constPt1Ref.current && cl.p2 === pt2Id) || (cl.p1 === pt2Id && cl.p2 === constPt1Ref.current)
        );
        if (!exists) {
          let constraint: 'horizontal' | 'vertical' | undefined = undefined;
          if (snapped.snapped === 'horizontal') constraint = 'horizontal';
          else if (snapped.snapped === 'vertical') constraint = 'vertical';

          const newLine: ConstructionLine = {
            id: 'const-' + Date.now(),
            p1: constPt1Ref.current!,
            p2: pt2Id,
            constraint
          };
          onConstructionLinesChange([...constructionLinesRef.current, newLine]);
        }
        updateCadTool('none');
        updateConstPt1(null);
        updateConstPt2(null);
        updateHoveredJoint(null);
      }
    } else if (currentCad === 'delete') {
      const target = hoveredDeleteTargetRef.current;
      if (target) {
        if (target.type === 'construction') {
          // Delete construction line
          const filtered = constructionLinesRef.current.filter(cl => cl.id !== target.id);
          onConstructionLinesChange(filtered);
          
          // Clean up dependent angles
          const updatedAngles = angleDimensionsRef.current.filter(ad => {
            const matchSeg = (seg: [string, string], targetClId: string) => {
              const cl = constructionLinesRef.current.find(c => c.id === targetClId);
              if (!cl) return false;
              return (seg[0] === cl.p1 && seg[1] === cl.p2) || (seg[0] === cl.p2 && seg[1] === cl.p1);
            };
            return !matchSeg(ad.seg1, target.id) && !matchSeg(ad.seg2, target.id);
          });
          if (updatedAngles.length !== angleDimensionsRef.current.length) {
            onAngleDimensionsChange(updatedAngles);
          }
        } else if (target.type === 'angle') {
          // Delete angle dimension
          const filtered = angleDimensionsRef.current.filter(ad => ad.id !== target.id);
          onAngleDimensionsChange(filtered);
        } else if (target.type === 'custom') {
          // Delete custom dimension
          const filtered = customDimensionsRef.current.filter(cd => cd.id !== target.id);
          onCustomDimensionsChange(filtered);
        }

        updateHoveredSegment(null);
        updateHoveredDeleteTarget(null);
        updateCadTool('none');
      }
    } else if (currentCad === 'angle_seg1') {
      const currentSegment = hoveredSegmentRef.current;
      if (currentSegment) {
        setAngleSeg1([currentSegment.p1, currentSegment.p2]);
        updateCadTool('angle_seg2');
        updateHoveredSegment(null);
      }
    } else if (currentCad === 'angle_seg2') {
      const currentSegment = hoveredSegmentRef.current;
      if (currentSegment) {
        const s2: [string, string] = [currentSegment.p1, currentSegment.p2];
        const s1 = angleSeg1!;
        const same = (s1[0] === s2[0] && s1[1] === s2[1]) || (s1[0] === s2[1] && s1[1] === s2[0]);
        if (!same) {
          setAngleSeg2(s2);
          updateCadTool('angle_drag');
          updateHoveredSegment(null);
        }
      }
    } else if (currentCad === 'angle_drag') {
      // Confirm on click
      if (angleSeg1 && angleSeg2) {
        const dummyAd: AngleDimension = {
          id: 'dummy',
          seg1: angleSeg1,
          seg2: angleSeg2,
          vertexId: '',
          radius: 10
        };
        const currentSolved = solvedPositionsRef.current || solvedPositions;
        const geom = resolveAngleGeometry(dummyAd, currentSolved);
        if (geom) {
          const JOINT_IDS = ['A1', 'A2', 'P1', 'P2', 'P_chank_TL', 'P_chank_TR', 'P_tibia_rear', 'P_foot'];
          let scale = 1.0;
          let pt1_id = '';
          let pt2_id = '';
          for (const id of JOINT_IDS) {
            if (currentSolved[id]) {
              if (!pt1_id) pt1_id = id;
              else if (!pt2_id) {
                pt2_id = id;
                break;
              }
            }
          }

          if (pt1_id && pt2_id) {
            const p1 = currentSolved[pt1_id];
            const p2 = currentSolved[pt2_id];
            const dist_3d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            const m1 = getJointPos2D(pt1_id);
            const m2 = getJointPos2D(pt2_id);
            if (m1 && m2) {
              const dist_2d = Math.hypot(m1.px - m2.px, m1.py - m2.py);
              if (dist_2d > 0.1) {
                scale = dist_3d / dist_2d; // ratio mm/px
              }
            }
          }

          const vertexPxX = geom.vertex.px;
          const vertexPxY = geom.vertex.py;

          // Determine sectorRays using cursor position
          const m1 = geom.ptA;
          const m2 = geom.ptB;
          const thetaA = Math.atan2(m1.py - vertexPxY, m1.px - vertexPxX);
          const thetaB = Math.atan2(m2.py - vertexPxY, m2.px - vertexPxX);
          const thetaOA = thetaA + Math.PI;
          const thetaOB = thetaB + Math.PI;

          const norm2pi = (angle: number) => {
            let a = angle;
            while (a < 0) a += 2 * Math.PI;
            while (a >= 2 * Math.PI) a -= 2 * Math.PI;
            return a;
          };

          const rays = [
            { angle: norm2pi(thetaA), label: 'A' },
            { angle: norm2pi(thetaB), label: 'B' },
            { angle: norm2pi(thetaOA), label: 'OA' },
            { angle: norm2pi(thetaOB), label: 'OB' }
          ];
          rays.sort((r1, r2) => r1.angle - r2.angle);

          const thetaCursor = norm2pi(Math.atan2(tempMousePos.y - vertexPxY, tempMousePos.x - vertexPxX));

          let sectorIndex = 3;
          if (thetaCursor >= rays[0].angle && thetaCursor < rays[1].angle) sectorIndex = 0;
          else if (thetaCursor >= rays[1].angle && thetaCursor < rays[2].angle) sectorIndex = 1;
          else if (thetaCursor >= rays[2].angle && thetaCursor < rays[3].angle) sectorIndex = 2;

          const rA = rays[sectorIndex];
          const rB = rays[(sectorIndex + 1) % 4];
          const activeSectorRays: [string, string] = [rA.label, rB.label];

          // Compute final geometry with correct rays to get accurate radius in mm
          const tempAd: AngleDimension = {
            id: 'dummy',
            seg1: angleSeg1,
            seg2: angleSeg2,
            vertexId: '',
            radius: 10,
            sectorRays: activeSectorRays
          };
          const resolvedGeom = resolveAngleGeometry(tempAd, currentSolved) || geom;
          const finalVertex = resolvedGeom.vertex;
          const r_px = Math.hypot(tempMousePos.x - finalVertex.px, tempMousePos.y - finalVertex.py);
          const r_mm = Math.max(5, r_px * scale); // minimum 5mm radius

          // Store shared joint ID if one exists, otherwise empty string representing virtual intersection
          let vertexId = '';
          if (angleSeg1[0] === angleSeg2[0] || angleSeg1[0] === angleSeg2[1]) vertexId = angleSeg1[0];
          else if (angleSeg1[1] === angleSeg2[0] || angleSeg1[1] === angleSeg2[1]) vertexId = angleSeg1[1];

          const newAngDim: AngleDimension = {
            id: 'angle-' + Date.now(),
            seg1: angleSeg1,
            seg2: angleSeg2,
            vertexId,
            radius: r_mm,
            sectorRays: activeSectorRays
          };
          onAngleDimensionsChange([...angleDimensionsRef.current, newAngDim]);
        }
      }

      // Reset
      updateCadTool('none');
      setAngleSeg1(null);
      setAngleSeg2(null);
    }
    e.stopPropagation();
  };

  // Render and update gait waypoints (diamonds)
  useEffect(() => {
    const grp = gaitWaypointsGroupRef.current;
    if (!grp) return;

    // Clear old elements from this group
    while (grp.children.length > 0) {
      grp.remove(grp.children[0]);
    }
    gaitWaypointsMeshesRef.current.clear();

    if (!simEditorOpen || !gaitWaypoints || gaitWaypoints.length === 0) return;

    // 1. Render diamonds for each waypoint
    const geom = new THREE.OctahedronGeometry(3.5, 0); // double-pyramid shape (exact diamond)
    gaitWaypoints.forEach((wp) => {
      const isSelected = wp.id === selectedWaypointId;
      const mat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0xef4444 : 0xec4899, // Highlight selected with bright red, others with pink/magenta
        roughness: 0.1,
        metalness: 0.9,
        emissive: isSelected ? 0xef4444 : 0xaa2266,
        emissiveIntensity: isSelected ? 0.9 : 0.4,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(wp.x, wp.y, 4.0); // stand out nicely in Z context
      mesh.userData = { waypointId: wp.id };
      grp.add(mesh);
      gaitWaypointsMeshesRef.current.set(wp.id, mesh);

      // Add a small outer halo ring for selected point
      if (isSelected) {
        const ringGeom = new THREE.RingGeometry(4.5, 5.5, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.z = 0.1;
        mesh.add(ring);
      }
    });

    // 2. Render connecting red line Loop representing the gait loop trajectory path
    if (gaitWaypoints.length >= 2) {
      const points = gaitWaypoints.map((w) => new THREE.Vector3(w.x, w.y, 2.0));
      // Connect back to the start to close the loop
      points.push(new THREE.Vector3(gaitWaypoints[0].x, gaitWaypoints[0].y, 2.0));

      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xef4444, // Bright red construction line
        linewidth: 2,
      });
      const line = new THREE.Line(lineGeom, lineMat);
      grp.add(line);
    }
  }, [simEditorOpen, gaitWaypoints, selectedWaypointId, theme]);

  const posFoot = solvedPositions ? solvedPositions['P_foot'] : null;

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden select-none" id="renderer-container">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        className={`block w-full h-full outline-none ${
          setTargetMode 
            ? 'cursor-crosshair bg-red-500/5' 
            : isViewLocked
            ? 'cursor-default'
            : 'cursor-grab active:cursor-grabbing'
        }`}
        id="three-canvas-root"
      />

      {/* Smart Dimension Interactive Overlay Click Catcher */}
      {dimMode !== 'idle' && (
        <div 
          className="absolute inset-0 cursor-crosshair z-30 select-none bg-black/5"
          onMouseMove={handleDimMouseMove}
          onMouseLeave={() => setHoveredJoint(null)}
          onMouseDown={handleDimMouseDown}
        />
      )}

      {/* CAD Tool Interactive Overlay Click Catcher */}
      {cadTool !== 'none' && (
        <div 
          className={`absolute inset-0 cursor-crosshair select-none bg-black/5 ${
            cadTool === 'delete' ? 'z-5' : 'z-30'
          }`}
          onMouseMove={handleCadMouseMove}
          onMouseLeave={() => {
            updateHoveredJoint(null);
            updateHoveredSegment(null);
          }}
          onMouseDown={handleCadMouseDown}
        />
      )}

      {/* CAD Overlay lines layer */}
      <svg id="cad-lines-layer" className="absolute inset-0 pointer-events-none select-none z-10 w-full h-full">
        {/* Default dimension paths */}
        {labels.map((label) => (
          <g key={`paths-${label.id}`}>
            {/* Extension Line A */}
            <path id={`ext-A-${label.id}`} className="stroke-slate-400/60 dark:stroke-slate-500/60 stroke-[4]" />
            {/* Extension Line B */}
            <path id={`ext-B-${label.id}`} className="stroke-slate-400/60 dark:stroke-slate-500/60 stroke-[4]" />
            {/* Dimension Line itself */}
            <path id={`dim-line-${label.id}`} className="stroke-slate-500/90 dark:stroke-slate-300/90 stroke-[4.4]" />
            {/* Arrowhead A */}
            <path id={`arrow-A-${label.id}`} className="fill-slate-500/90 dark:fill-slate-300/90" />
            {/* Arrowhead B */}
            <path id={`arrow-B-${label.id}`} className="fill-slate-500/90 dark:fill-slate-300/90" />

            {/* Angle support */}
            <path id={`arc-${label.id}`} className="stroke-[#f43f5e]/90 dark:stroke-[#f43f5e]/90 stroke-[4.4] fill-none stroke-dasharray-[3,3]" />
            <path id={`ref-line-${label.id}`} className="stroke-slate-400/70 dark:stroke-slate-500/70 stroke-[4] stroke-dasharray-[4,4]" />
            <path id={`act-line-${label.id}`} className="stroke-[#f43f5e]/70 dark:stroke-[#f43f5e]/70 stroke-[4] stroke-dasharray-[4,4]" />
          </g>
        ))}

        {/* Custom dimension paths */}
        {customDimensions.map((cd) => (
          <g key={`paths-${cd.id}`}>
            <path id={`ext-A-${cd.id}`} className="stroke-amber-400/50 dark:stroke-amber-500/50 stroke-[4]" />
            <path id={`ext-B-${cd.id}`} className="stroke-amber-400/50 dark:stroke-amber-500/50 stroke-[4]" />
            <path id={`dim-line-${cd.id}`} className="stroke-[#f59e0b]/90 dark:stroke-[#f59e0b]/90 stroke-[5.0]" />
            <path id={`arrow-A-${cd.id}`} className="fill-[#f59e0b]/90 dark:fill-[#f59e0b]/90" />
            <path id={`arrow-B-${cd.id}`} className="fill-[#f59e0b]/90 dark:fill-[#f59e0b]/90" />
          </g>
        ))}

        {/* SVG Drawing of Construction Lines */}
        {constructionLines.map((cl) => {
          const m1 = getJointPos2D(cl.p1);
          const m2 = getJointPos2D(cl.p2);
          if (!m1 || !m2) return null;
          
          const isDeleteHovered = hoveredDeleteTarget && hoveredDeleteTarget.type === 'construction' && hoveredDeleteTarget.id === cl.id;
          const isHovered = (hoveredSegment && hoveredSegment.type === 'construction' && hoveredSegment.id === cl.id) || isDeleteHovered;

          // Determine constraint dynamically on the fly based on current joint positions.
          // Only show key indicators if they are actually aligned horizontally or vertically currently.
          let constraint: 'horizontal' | 'vertical' | undefined = undefined;
          const pos1 = getJoint3DPos(cl.p1);
          const pos2 = getJoint3DPos(cl.p2);
          if (pos1 && pos2) {
            if (Math.abs(pos1.x - pos2.x) < 0.15) {
              constraint = 'vertical';
            } else if (Math.abs(pos1.y - pos2.y) < 0.15) {
              constraint = 'horizontal';
            }
          }

          const drawX2 = m2.px;
          const drawY2 = m2.py;

          const midX = (m1.px + m2.px) / 2;
          const midY = (m1.py + m2.py) / 2;

          const dx = m2.px - m1.px;
          const dy = m2.py - m1.py;
          const len = Math.hypot(dx, dy);

          let iconX = midX;
          let iconY = midY;
          if (len > 0.1) {
            const nx = -dy / len;
            const ny = dx / len;
            const offsetDist = 14;
            iconX = midX + nx * offsetDist;
            iconY = midY + ny * offsetDist;
          }

          return (
            <g key={cl.id}>
              {/* Thicker transparent line to make clicking / deleted pickup very easy */}
              <line 
                x1={m1.px} 
                y1={m1.py} 
                x2={drawX2} 
                y2={drawY2} 
                className="stroke-transparent stroke-[12] cursor-pointer pointer-events-auto"
                onMouseEnter={() => {
                  if (cadTool === 'delete') {
                    updateHoveredDeleteTarget({ type: 'construction', id: cl.id });
                    updateHoveredSegment({ id: cl.id, label: 'Construction Line', p1: cl.p1, p2: cl.p2, type: 'construction' });
                  }
                }}
                onMouseLeave={() => {
                  if (cadTool === 'delete') {
                    updateHoveredDeleteTarget(null);
                    updateHoveredSegment(null);
                  }
                }}
                onClick={(e) => {
                  if (cadTool === 'delete') {
                    const filtered = constructionLines.filter(item => item.id !== cl.id);
                    onConstructionLinesChange(filtered);
                    
                    const filteredAngles = angleDimensions.filter(ad => {
                      const match = (seg: [string, string]) => 
                        (seg[0] === cl.p1 && seg[1] === cl.p2) || (seg[0] === cl.p2 && seg[1] === cl.p1);
                      return !match(ad.seg1) && !match(ad.seg2);
                    });
                    onAngleDimensionsChange(filteredAngles);
                    updateHoveredSegment(null);
                    updateHoveredDeleteTarget(null);
                    updateCadTool('none');
                    e.stopPropagation();
                  }
                }}
              />
              <line 
                x1={m1.px} 
                y1={m1.py} 
                x2={drawX2} 
                y2={drawY2} 
                className={`stroke-[6] transition-all ${
                  isDeleteHovered
                    ? 'stroke-red-500 stroke-[8] drop-shadow-[0_0_4px_rgba(239,68,68,0.8)] animate-pulse'
                    : isHovered
                    ? 'stroke-red-500 stroke-[7] drop-shadow-[0_0_2px_rgba(239,68,68,0.5)]'
                    : 'stroke-amber-500/95 dark:stroke-amber-400/95'
                }`}
                strokeDasharray="4,4"
              />
              <circle cx={m1.px} cy={m1.py} r={4.5} className={isDeleteHovered ? "fill-red-500" : "fill-amber-500"} />
              <circle cx={drawX2} cy={drawY2} r={4.5} className={isDeleteHovered ? "fill-red-500" : "fill-amber-500"} />

              {/* Constraint icon */}
              {constraint && (
                <g transform={`translate(${iconX}, ${iconY})`} className="pointer-events-none select-none">
                  {/* Rounded square background */}
                  <rect
                    x="-8"
                    y="-8"
                    width="16"
                    height="16"
                    rx="3"
                    className={`${
                      theme === 'light'
                        ? 'fill-[#e6f4ea] stroke-[#137333]/80'
                        : 'fill-emerald-950/90 stroke-emerald-500/60'
                    } stroke-[1.2] shadow-sm`}
                  />
                  {/* Horizontal or Vertical Line Icon */}
                  {constraint === 'horizontal' ? (
                    <line
                      x1="-5"
                      y1="0"
                      x2="5"
                      y2="0"
                      className={`${
                        theme === 'light' ? 'stroke-[#137333]' : 'stroke-emerald-400'
                      } stroke-[2.2] stroke-linecap-round`}
                    />
                  ) : (
                    <line
                      x1="0"
                      y1="-5"
                      x2="0"
                      y2="5"
                      className={`${
                        theme === 'light' ? 'stroke-[#137333]' : 'stroke-emerald-400'
                      } stroke-[2.2] stroke-linecap-round`}
                    />
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* Construction Line draft preview */}
        {(cadTool === 'construction_p1' || cadTool === 'construction_p2') && constPt1 && tempMousePos && (() => {
          const m1 = getJointPos2D(constPt1);
          if (!m1) return null;
          const endPt = constPt2 ? getJointPos2D(constPt2) : tempMousePos;
          if (!endPt) return null;

          const endX = (endPt as any).px !== undefined ? (endPt as any).px : endPt.x;
          const endY = (endPt as any).py !== undefined ? (endPt as any).py : endPt.y;

          // Check snap status for visual feedback
          const snapStatus = getSnappedPosition(tempMousePos.x, tempMousePos.y);
          const isSnapped = snapStatus.snapped !== 'none';
          const snapColor = isSnapped 
            ? 'stroke-emerald-400 drop-shadow-[0_0_3px_rgba(52,211,153,0.8)]' 
            : 'stroke-amber-400';

          const midX = (m1.px + endX) / 2;
          const midY = (m1.py + endY) / 2;
          const dx = endX - m1.px;
          const dy = endY - m1.py;
          const len = Math.hypot(dx, dy);

          let previewIconX = midX;
          let previewIconY = midY;
          if (len > 0.1) {
            const nx = -dy / len;
            const ny = dx / len;
            const offsetDist = 14;
            previewIconX = midX + nx * offsetDist;
            previewIconY = midY + ny * offsetDist;
          }

          return (
            <g key="construction-preview">
              {/* If snapped, draw infinite/long horizontal/vertical reference dashline */}
              {snapStatus.snapped === 'vertical' && (
                <line
                  x1={m1.px}
                  y1={0}
                  x2={m1.px}
                  y2={containerSizeRef.current.h}
                  className="stroke-emerald-500/60 stroke-[4]"
                  strokeDasharray="3,6"
                />
              )}
              {snapStatus.snapped === 'horizontal' && (
                <line
                  x1={0}
                  y1={m1.py}
                  x2={containerSizeRef.current.w}
                  y2={m1.py}
                  className="stroke-emerald-500/60 stroke-[4]"
                  strokeDasharray="3,6"
                />
              )}

              <line 
                x1={m1.px} 
                y1={m1.py} 
                x2={endX} 
                y2={endY} 
                className={`${snapColor} stroke-[7] transition-colors`} 
                strokeDasharray="4,4"
              />
              <circle cx={m1.px} cy={m1.py} r={4.5} className="fill-emerald-500 stroke-emerald-200 stroke animate-pulse" />
              {(!constPt2) && (
                <circle 
                  cx={endX} 
                  cy={endY} 
                  r={isSnapped ? 5 : 3.5} 
                  className={isSnapped ? "fill-emerald-400 stroke-white stroke-[1]" : "fill-amber-400/80"} 
                />
              )}

              {/* Draft preview constraint icon */}
              {isSnapped && (
                <g transform={`translate(${previewIconX}, ${previewIconY})`} className="pointer-events-none select-none">
                  {/* Rounded square background */}
                  <rect
                    x="-8"
                    y="-8"
                    width="16"
                    height="16"
                    rx="3"
                    className={`${
                      theme === 'light'
                        ? 'fill-[#e6f4ea] stroke-[#137333]/80'
                        : 'fill-emerald-950/90 stroke-emerald-500/60'
                    } stroke-[1.2] shadow-sm`}
                  />
                  {/* Horizontal or Vertical Line Icon */}
                  {snapStatus.snapped === 'horizontal' ? (
                    <line
                      x1="-5"
                      y1="0"
                      x2="5"
                      y2="0"
                      className={`${
                        theme === 'light' ? 'stroke-[#137333]' : 'stroke-emerald-400'
                      } stroke-[2.2] stroke-linecap-round`}
                    />
                  ) : (
                    <line
                      x1="0"
                      y1="-5"
                      x2="0"
                      y2="5"
                      className={`${
                        theme === 'light' ? 'stroke-[#137333]' : 'stroke-emerald-400'
                      } stroke-[2.2] stroke-linecap-round`}
                    />
                  )}
                </g>
              )}

              {/* Snapping labels / guidelines overlay */}
              {isSnapped && (
                <g transform={`translate(${endX + 16}, ${endY + 12})`}>
                  <rect 
                    x={-4} 
                    y={-11} 
                    width={72} 
                    height={15} 
                    rx={2} 
                    className="fill-emerald-950/90 stroke-emerald-500/50 stroke-px" 
                  />
                  <text 
                    className="fill-emerald-300 font-mono text-[8.5px] font-bold" 
                    y={0} 
                    x={4}
                  >
                    {snapStatus.snapped === 'vertical' ? '📐 VERTICAL' : '📐 HORIZONTAL'}
                  </text>
                </g>
              )}
            </g>
          );
        })()}

        {/* Angle dimensions curves */}
        {angleDimensions.map((ad) => {
          const currentSolved = solvedPositions;
          const geom = resolveAngleGeometry(ad, currentSolved);
          if (!geom) return null;

          const mVertex = geom.vertex;
          const m1 = geom.ptA;
          const m2 = geom.ptB;

          // R is the radius in pixels
          const R = getPixelRadius(ad.vertexId, ad.radius);

          const alpha1 = Math.atan2(m1.py - mVertex.py, m1.px - mVertex.px);
          const alpha2 = Math.atan2(m2.py - mVertex.py, m2.px - mVertex.px);

          let diff = alpha2 - alpha1;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          while (diff > Math.PI) diff -= 2 * Math.PI;

          const sweep = diff >= 0 ? 1 : 0;
          const startX = mVertex.px + R * Math.cos(alpha1);
          const startY = mVertex.py + R * Math.sin(alpha1);
          const endX = mVertex.px + R * Math.cos(alpha2);
          const endY = mVertex.py + R * Math.sin(alpha2);

          const alphaMid = alpha1 + diff / 2;
          const offset = labelOffsets[ad.id] || { dx: 0, dy: 0 };
          const lx = mVertex.px + (R + 16) * Math.cos(alphaMid) + offset.dx;
          const ly = mVertex.py + (R + 16) * Math.sin(alphaMid) + offset.dy;

          const isDeleteHovered = hoveredDeleteTarget && hoveredDeleteTarget.type === 'angle' && hoveredDeleteTarget.id === ad.id;

          return (
            <g key={ad.id}>
              {/* Thicker overlay arc for easier hover & click deleting */}
              {cadTool === 'delete' && (
                <path
                  d={`M ${startX} ${startY} A ${R} ${R} 0 0 ${sweep} ${endX} ${endY}`}
                  className="stroke-transparent stroke-[12] fill-none cursor-pointer pointer-events-auto"
                  onMouseEnter={() => {
                    updateHoveredDeleteTarget({ type: 'angle', id: ad.id });
                  }}
                  onMouseLeave={() => {
                    updateHoveredDeleteTarget(null);
                  }}
                  onClick={(e) => {
                    const filtered = angleDimensions.filter((item) => item.id !== ad.id);
                    onAngleDimensionsChange(filtered);
                    updateHoveredDeleteTarget(null);
                    updateCadTool('none');
                    e.stopPropagation();
                  }}
                />
              )}
              <line 
                x1={mVertex.px} 
                y1={mVertex.py} 
                x2={mVertex.px + (R + 10) * Math.cos(alpha1)} 
                y2={mVertex.py + (R + 10) * Math.sin(alpha1)} 
                className={`transition-colors ${isDeleteHovered ? 'stroke-red-500/80' : 'stroke-indigo-500/70 dark:stroke-indigo-400/70'} stroke-[3.6]`} 
                strokeDasharray="3,3"
              />
              <line 
                x1={mVertex.px} 
                y1={mVertex.py} 
                x2={mVertex.px + (R + 10) * Math.cos(alpha2)} 
                y2={mVertex.py + (R + 10) * Math.sin(alpha2)} 
                className={`transition-colors ${isDeleteHovered ? 'stroke-red-500/80' : 'stroke-indigo-500/70 dark:stroke-indigo-400/70'} stroke-[3.6]`} 
                strokeDasharray="3,3"
              />
              <path 
                d={`M ${startX} ${startY} A ${R} ${R} 0 0 ${sweep} ${endX} ${endY}`} 
                className={`transition-colors fill-none ${isDeleteHovered ? 'stroke-red-500 stroke-[7.0] drop-shadow-[0_0_3px_rgba(239,68,68,0.7)] animate-pulse' : 'stroke-indigo-500 dark:stroke-indigo-400 stroke-[5.6]'}`} 
              />
              <g 
                transform={`translate(${lx}, ${ly})`}
                className={cadTool === 'delete' ? 'cursor-pointer pointer-events-auto' : 'cursor-grab active:cursor-grabbing pointer-events-auto'}
                onMouseEnter={() => {
                  if (cadTool === 'delete') {
                    updateHoveredDeleteTarget({ type: 'angle', id: ad.id });
                  }
                }}
                onMouseLeave={() => {
                  if (cadTool === 'delete') {
                    updateHoveredDeleteTarget(null);
                  }
                }}
                onMouseDown={(e) => {
                  if (cadTool === 'delete') return;
                  startDragHud(ad.id, e);
                }}
                onClick={(e) => {
                  if (cadTool === 'delete') {
                    const filtered = angleDimensions.filter((item) => item.id !== ad.id);
                    onAngleDimensionsChange(filtered);
                    updateHoveredDeleteTarget(null);
                    updateCadTool('none');
                    e.stopPropagation();
                  }
                }}
              >
                <rect x={-24} y={-8} width={48} height={14} rx={2} className={`${isDeleteHovered ? (theme === 'light' ? 'fill-red-100 stroke-red-500' : 'fill-red-950/90 stroke-red-500') : (theme === 'light' ? 'fill-indigo-50/95 stroke-indigo-400' : 'fill-[#121A2E]/90 stroke-indigo-500/40')} stroke-px transition-colors`} />
                <text textAnchor="middle" className={`${isDeleteHovered ? (theme === 'light' ? 'fill-red-800' : 'fill-red-200') : (theme === 'light' ? 'fill-indigo-900' : 'fill-indigo-300')} font-mono text-[9px] font-bold transition-colors`} y={2}>
                  {`${geom.angleDeg.toFixed(1)}°`}
                </text>
              </g>
            </g>
          );
        })}

        {/* Selected segment 1 highlight for angle/length dimension */}
        {(dimMode === 'seg_selected' || cadTool === 'angle_seg2' || cadTool === 'angle_drag') && angleSeg1 && (() => {
          const m1 = getJointPos2D(angleSeg1[0]);
          const m2 = getJointPos2D(angleSeg1[1]);
          if (!m1 || !m2) return null;
          return (
            <line 
              x1={m1.px} 
              y1={m1.py} 
              x2={m2.px} 
              y2={m2.py} 
              className="stroke-indigo-500 stroke-[5.0] opacity-85" 
            />
          );
        })()}

        {/* Hovered segment indicator highlights */}
        {(dimMode === 'p1' || dimMode === 'seg_selected' || cadTool === 'angle_seg1' || cadTool === 'angle_seg2' || cadTool === 'delete') && hoveredSegment && (() => {
          const m1 = getJointPos2D(hoveredSegment.p1);
          const m2 = getJointPos2D(hoveredSegment.p2);
          if (!m1 || !m2) return null;
          return (
            <line 
              x1={m1.px} 
              y1={m1.py} 
              x2={m2.px} 
              y2={m2.py} 
              className={`stroke-[7.0] ${
                cadTool === 'delete' ? 'stroke-red-500' : 'stroke-indigo-400'
              } opacity-70 animate-pulse`} 
            />
          );
        })()}

        {/* Angle tool dragging sweep arc preview */}
        {(cadTool === 'angle_drag' || (dimMode === 'seg_selected' && hoveredSegment)) && angleSeg1 && angleSeg2 && tempMousePos && (() => {
          const dummyBase: AngleDimension = {
            id: 'dummy',
            seg1: angleSeg1,
            seg2: angleSeg2,
            vertexId: '',
            radius: 10
          };
          const currentSolved = solvedPositions;
          // Get basic vertex geometry first to find vertex px/py and rays
          const baseGeom = resolveAngleGeometry(dummyBase, currentSolved);
          if (!baseGeom) return null;

          const mVertex = baseGeom.vertex;
          const m1 = baseGeom.ptA;
          const m2 = baseGeom.ptB;

          // Compute ray angles
          const thetaA = Math.atan2(m1.py - mVertex.py, m1.px - mVertex.px);
          const thetaB = Math.atan2(m2.py - mVertex.py, m2.px - mVertex.px);
          const thetaOA = thetaA + Math.PI;
          const thetaOB = thetaB + Math.PI;

          const norm2pi = (angle: number) => {
            let a = angle;
            while (a < 0) a += 2 * Math.PI;
            while (a >= 2 * Math.PI) a -= 2 * Math.PI;
            return a;
          };

          const rays = [
            { angle: norm2pi(thetaA), label: 'A' },
            { angle: norm2pi(thetaB), label: 'B' },
            { angle: norm2pi(thetaOA), label: 'OA' },
            { angle: norm2pi(thetaOB), label: 'OB' }
          ];
          rays.sort((r1, r2) => r1.angle - r2.angle);

          const thetaCursor = norm2pi(Math.atan2(tempMousePos.y - mVertex.py, tempMousePos.x - mVertex.px));

          let sectorIndex = 3;
          if (thetaCursor >= rays[0].angle && thetaCursor < rays[1].angle) sectorIndex = 0;
          else if (thetaCursor >= rays[1].angle && thetaCursor < rays[2].angle) sectorIndex = 1;
          else if (thetaCursor >= rays[2].angle && thetaCursor < rays[3].angle) sectorIndex = 2;

          const rA = rays[sectorIndex];
          const rB = rays[(sectorIndex + 1) % 4];
          const activeSectorRays: [string, string] = [rA.label, rB.label];

          // Re-resolve geometry with the activeSectorRays to get updated ptA/ptB/angleDeg!
          const dummyAd: AngleDimension = {
            id: 'dummy',
            seg1: angleSeg1,
            seg2: angleSeg2,
            vertexId: '',
            radius: 10,
            sectorRays: activeSectorRays
          };
          const geom = resolveAngleGeometry(dummyAd, currentSolved);
          if (!geom) return null;

          const finalVertex = geom.vertex;
          const finalPtA = geom.ptA;
          const finalPtB = geom.ptB;

          const R_px = Math.hypot(tempMousePos.x - finalVertex.px, tempMousePos.y - finalVertex.py);
          if (R_px < 5) return null;

          const alpha1 = Math.atan2(finalPtA.py - finalVertex.py, finalPtA.px - finalVertex.px);
          const alpha2 = Math.atan2(finalPtB.py - finalVertex.py, finalPtB.px - finalVertex.px);

          let diff = alpha2 - alpha1;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          while (diff > Math.PI) diff -= 2 * Math.PI;

          const sweep = diff >= 0 ? 1 : 0;
          const startX = finalVertex.px + R_px * Math.cos(alpha1);
          const startY = finalVertex.py + R_px * Math.sin(alpha1);
          const endX = finalVertex.px + R_px * Math.cos(alpha2);
          const endY = finalVertex.py + R_px * Math.sin(alpha2);

          const alphaMid = alpha1 + diff / 2;
          const lx = finalVertex.px + (R_px + 16) * Math.cos(alphaMid);
          const ly = finalVertex.py + (R_px + 16) * Math.sin(alphaMid);

          const trueAngDeg = geom.angleDeg;

          return (
            <g key="angle-drag-preview">
              <line x1={finalVertex.px} y1={finalVertex.py} x2={finalVertex.px + (R_px + 10) * Math.cos(alpha1)} y2={finalVertex.py + (R_px + 10) * Math.sin(alpha1)} className="stroke-indigo-400/80 stroke-[4]" strokeDasharray="3,3" />
              <line x1={finalVertex.px} y1={finalVertex.py} x2={finalVertex.px + (R_px + 10) * Math.cos(alpha2)} y2={finalVertex.py + (R_px + 10) * Math.sin(alpha2)} className="stroke-indigo-400/80 stroke-[4]" strokeDasharray="3,3" />
              
              <path d={`M ${startX} ${startY} A ${R_px} ${R_px} 0 0 ${sweep} ${endX} ${endY}`} className="stroke-indigo-500 stroke-[7.0] fill-none" />

              <g transform={`translate(${lx}, ${ly})`}>
                <rect x={-24} y={-8} width={48} height={14} rx={2} className={`${theme === 'light' ? 'fill-indigo-50/95 stroke-indigo-400' : 'fill-[#121A2E]/90 stroke-indigo-500/40'} stroke-px`} />
                <text textAnchor="middle" className={`${theme === 'light' ? 'fill-indigo-900' : 'fill-indigo-300'} font-mono text-[9px] font-bold`} y={2}>
                  {`${trueAngDeg.toFixed(1)}°`}
                </text>
              </g>
            </g>
          );
        })()}

        {/* Temporary drag dimension line preview before clicking to place */}
        {(dimMode === 'drag' || (dimMode === 'seg_selected' && !hoveredSegment)) && pt1 && pt2 && tempMousePos && (() => {
          const m1 = getJointPos2D(pt1);
          const m2 = getJointPos2D(pt2);
          if (!m1 || !m2) return null;

          const midX = (m1.px + m2.px) / 2;
          const midY = (m1.py + m2.py) / 2;

          const dx_link = m2.px - m1.px;
          const dy_link = m2.py - m1.py;
          const L_px = Math.hypot(dx_link, dy_link);
          let ux = 1, uy = 0;
          if (L_px > 0.1) {
            ux = dx_link / L_px;
            uy = dy_link / L_px;
          }
          const nx = -uy;
          const ny = ux;

          const dx_mouse = tempMousePos.x - midX;
          const dy_mouse = tempMousePos.y - midY;
          const h = dx_mouse * nx + dy_mouse * ny;

          const A_p = { x: m1.px + h * nx, y: m1.py + h * ny };
          const B_p = { x: m2.px + h * nx, y: m2.py + h * ny };

          const sign_h = Math.sign(h) || 1;
          const offset_start = 3 * sign_h;
          const offset_end = 6 * sign_h;

           const arrow_A = `M ${A_p.x} ${A_p.y} L ${A_p.x + 8 * ux + 2.5 * nx} ${A_p.y + 8 * uy + 2.5 * ny} L ${A_p.x + 8 * ux - 2.5 * nx} ${A_p.y + 8 * uy - 2.5 * ny} Z`;
          const arrow_B = `M ${B_p.x} ${B_p.y} L ${B_p.x - 8 * ux + 2.5 * nx} ${B_p.y - 8 * uy + 2.5 * ny} L ${B_p.x - 8 * ux - 2.5 * nx} ${B_p.y - 8 * uy - 2.5 * ny} Z`;

          const currentSolved = solvedPositions;
          const pt1Val = currentSolved ? currentSolved[pt1] : null;
          const pt2Val = currentSolved ? currentSolved[pt2] : null;
          const actualMmVal = pt1Val && pt2Val ? Math.hypot(pt2Val.x - pt1Val.x, pt2Val.y - pt1Val.y) : 0;

          return (
            <g key="drag-preview">
              {/* Extension lines */}
              <line x1={m1.px + offset_start * nx} y1={m1.py + offset_start * ny} x2={A_p.x + offset_end * nx} y2={A_p.y + offset_end * ny} className="stroke-blue-400/80 stroke-[4]" strokeDasharray="3,3" />
              <line x1={m2.px + offset_start * nx} y1={m2.py + offset_start * ny} x2={B_p.x + offset_end * nx} y2={B_p.y + offset_end * ny} className="stroke-blue-400/80 stroke-[4]" strokeDasharray="3,3" />
              
              {/* Dimension line */}
              <line x1={A_p.x} y1={A_p.y} x2={B_p.x} y2={B_p.y} className="stroke-blue-500 stroke-[6]" />
              <path d={arrow_A} className="fill-blue-500" />
              <path d={arrow_B} className="fill-blue-500" />

              {/* Text label preview */}
              <g transform={`translate(${tempMousePos.x}, ${tempMousePos.y - 12})`}>
                <rect x={-35} y={-10} width={70} height={16} rx={3} className={`${theme === 'light' ? 'fill-blue-50/95 stroke-blue-400' : 'fill-[#121A2E]/90 stroke-blue-500/40'} stroke-px`} />
                <text textAnchor="middle" className={`${theme === 'light' ? 'fill-blue-900' : 'fill-blue-300'} font-mono text-[9px] font-bold`} y={2}>
                  {`(${actualMmVal.toFixed(1)} mm)`}
                </text>
              </g>
            </g>
          );
        })()}
      </svg>

      {/* Dynamic CAD-Overlay floating labels */}
      <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden" id="dynamic-overlay-hud-labels">
        {labels.map((label) => {
          const isEditing = editingParam && editingParam.id === label.paramKey;

          return (
            <div
              key={label.id}
              id={label.id}
              onMouseDown={(e) => startDragHud(label.id, e)}
              className={`absolute px-2 py-0.5 rounded border text-[9px] font-mono transform -translate-x-1/2 -translate-y-1/2 backdrop-blur shadow-md hover:border-blue-500/50 transition-colors duration-150 pointer-events-auto cursor-grab active:cursor-grabbing ${label.themeClass}`}
              title="Double click to edit value directly, click and drag to move"
            >
              {isEditing ? (
                <div className="flex items-center gap-1 select-text pointer-events-auto">
                  <span className="text-[8px] opacity-60">{label.paramKey}:</span>
                  <input
                    type="text"
                    value={editingParam.currentInputValue}
                    onChange={(e) => setEditingParam({ ...editingParam, currentInputValue: e.target.value })}
                    onBlur={() => handleFinishEdit()}
                    onKeyDown={(e) => handleFinishEdit(e)}
                    className="bg-slate-900 border border-blue-500 rounded px-1 text-white w-14 text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 py-px text-[9px] pointer-events-auto"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                </div>
              ) : (
                <div onDoubleClick={() => handleDoubleClickLabel(label.paramKey, label.value)}>
                  {label.isBlock ? (
                    <div className="text-left font-mono">
                      <div className="font-bold border-b border-white/10 pb-0.5 mb-1 text-[9px] uppercase tracking-wider">{label.prefix}</div>
                      <div className="whitespace-pre text-[9px]">{label.format(label.value)}</div>
                    </div>
                  ) : (
                    <span>{label.prefix}<span className="font-bold underline text-blue-400 cursor-pointer">{label.format(label.value)}</span></span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Custom user-added reference dimensions */}
        {customDimensions.map((cd) => {
          const m1 = getJoint3DPos(cd.p1);
          const m2 = getJoint3DPos(cd.p2);
          let distanceVal = 0;
          if (m1 && m2) {
            distanceVal = Math.hypot(m2.x - m1.x, m2.y - m1.y);
          }

          const isDeleteHovered = hoveredDeleteTarget && hoveredDeleteTarget.type === 'custom' && hoveredDeleteTarget.id === cd.id;

          return (
            <div
              key={cd.id}
              id={cd.id}
              onMouseDown={(e) => {
                if (cadTool === 'delete') return;
                startDragHud(cd.id, e);
              }}
              onMouseEnter={() => {
                if (cadTool === 'delete') {
                  updateHoveredDeleteTarget({ type: 'custom', id: cd.id });
                }
              }}
              onMouseLeave={() => {
                if (cadTool === 'delete') {
                  updateHoveredDeleteTarget(null);
                }
              }}
              onClick={(e) => {
                if (cadTool === 'delete') {
                  const filtered = customDimensions.filter((d) => d.id !== cd.id);
                  onCustomDimensionsChange(filtered);
                  updateHoveredDeleteTarget(null);
                  updateCadTool('none');
                  e.stopPropagation();
                }
              }}
              className={`absolute px-2 py-0.5 rounded border text-[9px] font-mono transform -translate-x-1/2 -translate-y-1/2 backdrop-blur shadow-md transition-all duration-150 pointer-events-auto group ${
                isDeleteHovered
                  ? (theme === 'light' ? 'bg-red-100 border-red-500 text-red-800 cursor-pointer animate-pulse font-bold' : 'bg-red-950/95 border-red-500 text-red-200 cursor-pointer animate-pulse')
                  : cadTool === 'delete'
                  ? (theme === 'light' ? 'bg-red-50 border-red-400/30 text-red-700 cursor-pointer hover:border-red-500 hover:text-red-800' : 'bg-red-950/20 border-red-500/20 text-red-400/80 cursor-pointer hover:border-red-500/50 hover:text-red-300')
                  : (theme === 'light' ? 'bg-amber-50 border-amber-500/50 text-amber-850 cursor-grab active:cursor-grabbing hover:border-amber-500' : 'bg-slate-900/90 border-[#f59e0b]/40 text-[#f59e0b] cursor-grab active:cursor-grabbing hover:border-[#f59e0b]/80')
              }`}
              title={cadTool === 'delete' ? 'Click to delete this reference dimension' : 'Click and drag to move, hover and click \'×\' to delete'}
            >
              <div className="flex items-center gap-1">
                <span>({cd.name || 'RD'}: <span className="font-bold">{distanceVal.toFixed(2)} mm</span>)</span>
                {cadTool !== 'delete' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const filtered = customDimensions.filter((d) => d.id !== cd.id);
                      onCustomDimensionsChange(filtered);
                    }}
                    className="hidden group-hover:flex items-center justify-center w-3 h-3 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white ml-1 text-[8px] cursor-pointer transition-colors px-1"
                    title="Delete Reference"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Dynamic Toe coordinate HUD marker */}
        <div
          id="lbl-btn-foot"
          onMouseDown={(e) => startDragHud('lbl-btn-foot', e)}
          className={`absolute px-2.5 py-1 rounded-full border text-[9px] font-mono font-bold transform -translate-x-1/2 -translate-y-1/2 backdrop-blur shadow-lg pointer-events-auto cursor-grab active:cursor-grabbing ${
            theme === 'light'
             ? 'bg-emerald-50 border-emerald-500/50 text-emerald-800'
             : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-500'
          }`}
          title="Click and drag to move"
        >
          {posFoot ? `TOE TIP (${posFoot.x.toFixed(1)}, ${posFoot.y.toFixed(1)})` : 'TOE TIP'}
        </div>

        {/* Temporary highlights for selected p1 and hovered joints as hardware-accelerated 3D HTML elements */}
        <div
          id="p1-select-circle"
          className="absolute top-0 left-0 w-5 h-5 rounded-full border-2 border-blue-500 bg-blue-500/10 pointer-events-none z-30 animate-pulse"
          style={{ display: 'none' }}
        />

        <div
          id="p2-select-circle"
          className="absolute top-0 left-0 w-5 h-5 rounded-full border-2 border-amber-500 bg-amber-500/10 pointer-events-none z-30 animate-pulse"
          style={{ display: 'none' }}
        />

        <div
          id="hover-circle"
          className="absolute top-0 left-0 w-6 h-6 pointer-events-none z-30"
          style={{ display: 'none' }}
        >
          <div className="w-full h-full rounded-full border border-dashed border-cyan-400 bg-cyan-400/5 animate-[spin_6s_linear_infinite]" />
        </div>

        <div
          id="red-target-circle"
          className="absolute top-0 left-0 w-8 h-8 pointer-events-none z-30 flex items-center justify-center"
          style={{ display: 'none' }}
        >
          {/* External crosshair dashed ring */}
          <div className="absolute w-8 h-8 rounded-full border-2 border-dashed border-red-500 bg-red-500/10 animate-[spin_8s_linear_infinite]" />
          {/* Center pinpoint dot */}
          <div className="absolute w-2 h-2 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />
          {/* Pulsing ring */}
          <div className="absolute w-8 h-8 rounded-full border border-red-500 animate-ping opacity-40 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
        </div>

        {/* Dynamic Translation Triangle Floating Legends */}
        <div
          id="lbl-triangle-dx"
          className="absolute px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold transform -translate-x-1/2 -translate-y-1/2 shadow-md bg-white/95 dark:bg-slate-900/90 border-orange-500 text-orange-600 dark:text-orange-400 pointer-events-none"
          style={{ display: 'none' }}
        >
          ΔX: 0.0 mm
        </div>
        <div
          id="lbl-triangle-dy"
          className="absolute px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold transform -translate-x-1/2 -translate-y-1/2 shadow-md bg-white/95 dark:bg-slate-900/90 border-cyan-500 text-cyan-600 dark:text-cyan-400 pointer-events-none"
          style={{ display: 'none' }}
        >
          ΔY: 0.0 mm
        </div>
        <div
          id="lbl-triangle-dc"
          className="absolute px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold transform -translate-x-1/2 -translate-y-1/2 shadow-md bg-white/95 dark:bg-slate-900/90 border-pink-500 text-pink-600 dark:text-pink-400 pointer-events-none animate-pulse"
          style={{ display: 'none' }}
        >
          ΔC: 0.0 mm
        </div>
      </div>

      {dimMode !== 'idle' && (
        <div className="absolute top-14 left-4 z-40 bg-blue-950/90 border border-blue-500/40 px-3 py-2 rounded-lg backdrop-blur text-blue-200 text-xs font-mono shadow-xl flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-center gap-2 font-bold text-white uppercase text-[10px] tracking-wider text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Smart Dimension Tool active
          </div>
          <span>
            {dimMode === 'p1' && "Click a joint pivot to measure point-to-point, OR select any link segment..."}
            {dimMode === 'p2' && `Selected Pivot 1: ${pt1}. Click a second joint pivot to measure point-to-point distance.`}
            {dimMode === 'seg_selected' && (hoveredSegment ? `Selected Segment. Click ${hoveredSegment.label} to create an angle dimension!` : `Selected Segment. Drag away and click to place segment length dimension, or click another segment for angle.`)}
            {dimMode === 'drag' && `Selected Points: ${pt1} to ${pt2}. Drag mouse and click to confirm dimension placement.`}
          </span>
          <span className="text-[10px] text-white/40 italic font-sans">Press ESC to cancel / exit dimension tool.</span>
        </div>
      )}

      {dimMode === 'idle' && (cadTool === 'angle_seg1' || cadTool === 'angle_seg2' || cadTool === 'angle_drag') && (
        <div className="absolute top-[128px] left-4 z-40 bg-blue-950/90 border border-blue-500/40 px-3 py-2 rounded-lg backdrop-blur text-blue-200 text-xs font-mono shadow-xl flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-center gap-2 font-bold text-white uppercase text-[10px] tracking-wider text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Smart Dimension Tool: Angle active
          </div>
          <span>
            {cadTool === 'angle_seg1' && "Click first link segment..."}
            {cadTool === 'angle_seg2' && "Selected Segment 1. Click second link segment to sweep angle..."}
            {cadTool === 'angle_drag' && "Segments selected. Drag mouse to place angle sweep arc & click to place..."}
          </span>
          <span className="text-[10px] text-white/40 italic font-sans">Press ESC to cancel / exit dimension tool.</span>
        </div>
      )}

      {dimMode === 'idle' && (cadTool === 'construction_p1' || cadTool === 'construction_p2') && (
        <div className="absolute top-[128px] left-4 z-40 bg-amber-950/95 border border-amber-500/40 px-3 py-2 rounded-lg backdrop-blur text-amber-200 text-xs font-mono shadow-xl flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-center gap-2 font-bold text-white uppercase text-[10px] tracking-wider text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Construction Line Tool active
          </div>
          <span className="text-[11px]">
            {cadTool === 'construction_p1' && "Click on any joint/pivot to start drawing..."}
            {cadTool === 'construction_p2' && "Click second joint OR click empty space to place line. Snapping to axes holds line horizontal/vertical."}
          </span>
          <span className="text-[10px] text-white/40 italic font-sans">Press ESC to cancel / exit construction tool.</span>
        </div>
      )}

      {cadTool === 'delete' && (
        <div className="absolute top-[128px] left-4 z-40 bg-red-950/95 border border-red-500/40 px-3.5 py-2.5 rounded-lg backdrop-blur text-red-200 text-xs font-mono shadow-xl flex flex-col gap-1 pointer-events-auto max-w-sm">
          <div className="flex items-center gap-2 font-bold text-white uppercase text-[10px] tracking-wider text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Delete Tool active
          </div>
          <span className="text-[11px] leading-relaxed">
            Hover over any construction line, angle dimension, or custom reference dimension, then click to delete it.
          </span>
          <span className="text-[10px] text-white/35 italic mt-1 font-sans">Click tool again or press ESC to exit.</span>
        </div>
      )}

      {setTargetMode && (
        <div className="absolute top-[128px] left-4 z-40 bg-red-950/95 border border-red-500/40 px-3.5 py-2.5 rounded-lg backdrop-blur text-red-200 text-xs font-mono shadow-xl flex flex-col gap-1 pointer-events-auto max-w-sm">
          <div className="flex items-center gap-2 font-bold text-white uppercase text-[10px] tracking-wider text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Set Target Mode Active
          </div>
          <span className="text-[11px] leading-relaxed">
            Click anywhere on the 2D canvas workspace to set a red target point. The tibia's end tip will automatically solve Inverse Kinematics to reach it.
          </span>
          <span className="text-[10px] text-white/35 italic mt-1 font-sans">Click "Set Target" again to exit.</span>
        </div>
      )}
      
      {/* 🧪 Extensible Active Config Tab Selector */}
      <div 
        className={`absolute top-4 left-4 z-40 p-1 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-1.5 pointer-events-auto select-none border ${
          theme === 'light' 
            ? 'bg-white border-slate-200/90 shadow-slate-100' 
            : 'bg-[#1a1f2c]/95 border-white/10'
        }`} 
        id="viewport-tab-selector"
      >
        {([
          { id: 'MG996R', label: 'MG996R Tab' },
          { id: 'ST3215', label: 'ST3215 Tab' }
        ] as const).map((tabOpt) => {
          const isActive = activeTab === tabOpt.id;
          return (
            <button
              key={tabOpt.id}
              onClick={() => onTabChange?.(tabOpt.id)}
              className={`px-3 py-1.5 h-7 font-sans font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center cursor-pointer ${
                isActive
                  ? 'bg-sleek-blue text-white shadow shadow-blue-500/20'
                  : theme === 'light'
                    ? 'text-slate-800 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
                    : 'text-white/40 hover:text-white/80 bg-white/5 hover:bg-white/10'
              }`}
              id={`viewport-tab-select-${tabOpt.id.toLowerCase()}`}
            >
              {tabOpt.label}
            </button>
          );
        })}
      </div>

      {/* Viewport Floating Watermark / Status Header */}
      <div className="absolute top-[68px] left-4 flex flex-col gap-1 pointer-events-none z-10 select-none" id="viewport-id-watermark">
        <span className={`text-[10px] font-mono uppercase tracking-[0.2em] font-bold ${
          theme === 'light' ? 'text-slate-900/50' : 'text-white/40'
        }`}>VIEWPORT / SCHEMATIC</span>
      </div>

      {ikActive && (
        <div className="absolute top-[128px] left-4 pointer-events-none bg-emerald-950/80 border border-emerald-500/30 px-3 py-1.5 rounded-md backdrop-blur text-emerald-400 text-xs font-mono uppercase tracking-wider flex items-center gap-2 z-10 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Dragging Target Mode (IK Resolving)
        </div>
      )}

      {/* 🧊 Interactive CAD Viewcube Overlay Widget */}
      <div 
        className="absolute bottom-4 right-4 bg-sleek-nav/95 border border-sleek-border p-3 rounded-xl backdrop-blur-md shadow-2xl flex flex-col items-center gap-2.5 select-none z-10 transition-colors duration-200 text-sleek-text" 
        style={{ width: '125px' }} 
        id="viewcube-widget-root"
      >
        {/* Widget Title Bar */}
        <div className="w-full flex items-center justify-between">
          <span className="text-[9px] text-sleek-text-muted font-mono uppercase tracking-wider font-extrabold">VIEW GIZMO</span>
          <button
            onClick={() => transitionToView('home')}
            className="p-1 rounded bg-sleek-subcard hover:bg-sleek-btn-hover border border-sleek-border text-sleek-text-muted hover:text-sleek-text transition-colors cursor-pointer group"
            title="Reset View"
          >
            <Home className="w-3 h-3" />
          </button>
        </div>

        {/* CSS 3D View Cube */}
        <div className="relative w-20 h-20 flex items-center justify-center bg-sleek-subcard rounded-lg border border-sleek-border/60 overflow-hidden shadow-inner">
          {/* Circular Compass Grid Segment Line Rings */}
          <div className="absolute w-16 h-16 rounded-full border border-dashed border-sleek-border/40 animate-[spin_40s_linear_infinite]" />
          
          {/* Compass Axis Indicators (Z direction in Blue, X direction in Red) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center font-mono opacity-80">
            {/* Z axis segment line */}
            <div className="absolute w-[1px] h-12 bg-blue-500/30 bottom-1/2 transform rotate-12 origin-bottom">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] text-blue-600 dark:text-blue-400 font-extrabold">Z</span>
            </div>
            {/* X axis segment line */}
            <div className="absolute h-[1px] w-12 bg-red-500/30 left-1/2 transform -rotate-12 origin-left">
              <span className="absolute -right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-red-500 dark:text-red-405 font-extrabold">X</span>
            </div>
          </div>

          <div className="w-10 h-10" style={{ perspective: '300px' }}>
            <div
              ref={cubeRef}
              className="w-full h-full relative select-none"
              style={{
                transformStyle: 'preserve-3d',
                transform: 'rotateX(-20deg) rotateY(45deg)',
              }}
            >
              {/* Cube Face: FRONT */}
              <div
                onClick={() => transitionToView('front')}
                className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white border border-blue-400/40 bg-sleek-blue/80 hover:bg-sleek-blue cursor-pointer select-none transition-all rounded-sm shadow-sm"
                style={{
                  transform: 'translateZ(20px)',
                  backfaceVisibility: 'hidden',
                }}
              >
                FRONT
              </div>
              {/* Cube Face: BACK */}
              <div
                onClick={() => transitionToView('back')}
                className="absolute inset-0 flex items-center justify-center text-[8px] font-bold border bg-sleek-subcard border-sleek-border text-sleek-text/80 hover:bg-sleek-btn-hover cursor-pointer select-none transition-colors rounded-sm"
                style={{
                  transform: 'rotateY(180deg) translateZ(20px)',
                  backfaceVisibility: 'hidden',
                }}
              >
                BACK
              </div>
              {/* Cube Face: LEFT */}
              <div
                onClick={() => transitionToView('left')}
                className="absolute inset-0 flex items-center justify-center text-[8px] font-bold border bg-sleek-subcard border-sleek-border text-sleek-text/80 hover:bg-sleek-btn-hover cursor-pointer select-none transition-colors rounded-sm"
                style={{
                  transform: 'rotateY(-90deg) translateZ(20px)',
                  backfaceVisibility: 'hidden',
                }}
              >
                LEFT
              </div>
              {/* Cube Face: RIGHT */}
              <div
                onClick={() => transitionToView('right')}
                className="absolute inset-0 flex items-center justify-center text-[8px] font-bold border bg-sleek-subcard border-sleek-border text-sleek-text/80 hover:bg-sleek-btn-hover cursor-pointer select-none transition-colors rounded-sm"
                style={{
                  transform: 'rotateY(90deg) translateZ(20px)',
                  backfaceVisibility: 'hidden',
                }}
              >
                RIGHT
              </div>
              {/* Cube Face: TOP */}
              <div
                onClick={() => transitionToView('top')}
                className="absolute inset-0 flex items-center justify-center text-[8px] font-bold border bg-sleek-subcard border-sleek-border text-sleek-text/80 hover:bg-sleek-btn-hover cursor-pointer select-none transition-colors rounded-sm"
                style={{
                  transform: 'rotateX(90deg) translateZ(20px)',
                  backfaceVisibility: 'hidden',
                }}
              >
                TOP
              </div>
              {/* Cube Face: BOTTOM */}
              <div
                onClick={() => transitionToView('bottom')}
                className="absolute inset-0 flex items-center justify-center text-[8px] font-bold border bg-sleek-subcard border-sleek-border text-sleek-text/80 hover:bg-sleek-btn-hover cursor-pointer select-none transition-colors rounded-sm"
                style={{
                  transform: 'rotateX(-90deg) translateZ(20px)',
                  backfaceVisibility: 'hidden',
                }}
              >
                BTM
              </div>
            </div>
          </div>
        </div>

        {/* Orthogonal Snap Buttons Row */}
        <div className="grid grid-cols-3 gap-1 w-full text-[9px] font-bold text-center">
          <button
            onClick={() => transitionToView('front')}
            className="py-1 rounded bg-sleek-subcard hover:bg-sleek-blue hover:text-white border border-sleek-border hover:border-transparent text-sleek-text transition-all cursor-pointer font-mono active:scale-95"
            title="Snap Front view"
          >
            FRONT
          </button>
          <button
            onClick={() => transitionToView('top')}
            className="py-1 rounded bg-sleek-subcard hover:bg-sleek-blue hover:text-white border border-sleek-border hover:border-transparent text-sleek-text transition-all cursor-pointer font-mono active:scale-95"
            title="Snap Top view"
          >
            TOP
          </button>
          <button
            onClick={() => transitionToView('right')}
            className="py-1 rounded bg-sleek-subcard hover:bg-sleek-blue hover:text-white border border-sleek-border hover:border-transparent text-sleek-text transition-all cursor-pointer font-mono active:scale-95"
            title="Snap Right view"
          >
            RIGHT
          </button>
        </div>

        {/* Lock View Button */}
        <button
          onClick={() => {
            const nextVal = !isViewLocked;
            setIsViewLocked(nextVal);
            if (nextVal) {
              transitionToView('front');
            }
          }}
          className={`w-full py-1 px-1.5 rounded flex items-center justify-center gap-1 border transition-all text-[9px] font-bold tracking-wide uppercase font-mono cursor-pointer active:scale-95 shadow-sm ${
            isViewLocked
              ? 'bg-blue-500/10 border-blue-500/35 text-blue-600 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-400'
              : 'bg-sleek-subcard border-sleek-border text-sleek-text-muted hover:bg-sleek-btn-hover hover:text-sleek-text hover:border-sleek-border-hover'
          }`}
          title={isViewLocked ? "Unlock standard 3D rotation" : "Lock to straight 2D schematic viewpoint"}
        >
          {isViewLocked ? (
            <>
              <Lock className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
              <span>Locked 2D</span>
            </>
          ) : (
            <>
              <Unlock className="w-2.5 h-2.5 text-sleek-text-muted" />
              <span>Lock View</span>
            </>
          )}
        </button>

        {/* Show Origin Axis Toggle */}
        <button
          onClick={() => setShowAxis(!showAxis)}
          className={`w-full py-1 px-1.5 rounded flex items-center justify-center gap-1 border transition-all text-[9px] font-bold tracking-wide uppercase font-mono cursor-pointer active:scale-95 shadow-sm ${
            showAxis
              ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400'
              : 'bg-sleek-subcard border-sleek-border text-sleek-text-muted hover:bg-sleek-btn-hover hover:text-sleek-text hover:border-sleek-border-hover'
          }`}
          title={showAxis ? "Hide origin axes" : "Show origin axes"}
          id="toggle-show-axis"
        >
          <div className={`w-1.5 h-1.5 rounded-full ${showAxis ? 'bg-emerald-500 animate-pulse' : 'bg-sleek-text-muted'}`}></div>
          <span>show axis</span>
        </button>
      </div>
    </div>
  );
}
