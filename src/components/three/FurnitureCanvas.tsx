import React, { useRef, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { FurnitureConfig, FurniturePanel, FinishItem, MaterialItem, EdgeFinishItem, PanelLighting } from '../../types/furniture';
import { normalizeToFeet, createDefaultWardrobeSections } from '../../data/furnitureTemplates';
import { ZoomIn, ZoomOut, RotateCcw, Target, X, Layers, Settings2, GripHorizontal, Lightbulb, Box, Plus, Minus, Trash2, ChevronDown, ChevronRight, Ruler, Palette, Scissors, Sparkles } from 'lucide-react';



interface PortalDropdownItem {
  id: string;
  label: string;
}

interface PortalDropdownPickerProps {
  triggerLabel: string;
  options: PortalDropdownItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

// Custom Dropdown Picker Component using React Portal & viewport positioning so options list is never clipped by scrolling containers or screen boundaries
function PortalDropdownPicker({
  triggerLabel,
  options,
  selectedId,
  onSelect,
  disabled,
}: PortalDropdownPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; bottom: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    bottom: 0,
    left: 0,
    width: 200,
    placeAbove: false,
  });

  const handleOpen = () => {
    if (disabled) return;
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const placeAbove = spaceBelow < 210 && rect.top > 210;

      setCoords({
        top: rect.bottom + 4,
        bottom: window.innerHeight - rect.top + 4,
        left: Math.max(10, Math.min(rect.left, window.innerWidth - Math.max(180, rect.width) - 10)),
        width: Math.max(180, rect.width),
        placeAbove,
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className="w-full text-xs font-semibold bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 disabled:opacity-40 flex items-center justify-between transition-all focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer"
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
            <div
              style={{
                position: 'fixed',
                top: coords.placeAbove ? 'auto' : `${coords.top}px`,
                bottom: coords.placeAbove ? `${coords.bottom}px` : 'auto',
                left: `${coords.left}px`,
                width: `${coords.width}px`,
              }}
              className="z-[9999] bg-slate-950 border border-slate-700/90 rounded-xl shadow-2xl py-1 backdrop-blur-xl max-h-52 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100"
            >
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelect(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs font-medium flex items-center justify-between transition-colors ${selectedId === opt.id
                    ? 'bg-blue-600/20 text-blue-400 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {selectedId === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

interface PanelMeshProps {
  panel: FurniturePanel;
  position: [number, number, number];
  size: [number, number, number];
  finishesMap: Map<string, FinishItem>;
  edgesMap?: Map<string, EdgeFinishItem>;
  isSelected: boolean;
  onSelect: (panelId: string) => void;
}

function ProceduralTextureMesh({ panel, position, size, finishesMap, edgesMap, isSelected, onSelect }: PanelMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Helper to construct canvas textures for realistic wood finish or solid raw surface
  const getTextureForFinish = (finishId?: string, isEdge: boolean = false): THREE.Texture => {
    let colorHex = '#9CA3AF'; // Solid raw substrate color when finish is removed
    let isApplied = false;
    let finType = 'none';

    if (finishId && finishId !== 'fin-none' && finishId !== 'edge-none') {
      if (isEdge && edgesMap) {
        const edge = edgesMap.get(finishId);
        if (edge && edge.enabled) {
          colorHex = edge.colorHex || '#5C4033';
          isApplied = true;
          finType = 'edge';
        }
      } else {
        const fin = finishesMap.get(finishId);
        if (fin && fin.enabled && fin.type !== 'none') {
          colorHex = fin.colorHex || '#9CA3AF';
          isApplied = true;
          finType = fin.type;
        }
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Base background
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, 256, 256);

    // If wood laminate / veneer, add subtle wood grain noise lines
    if (isApplied && (finType === 'laminate' || finType === 'veneer')) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
      for (let i = 0; i < 256; i += 4) {
        const offset = Math.sin(i * 0.05) * 10;
        ctx.fillRect(i, 0, 2 + Math.random() * 2, 256 + offset);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  };

  // Materials array for 6 box faces: [Right(+X), Left(-X), Top(+Y), Bottom(-Y), Front(+Z), Back(-Z)]
  const materials = useMemo(() => {
    const topSurf = panel.surfaces.find(s => s.type === 'top' || s.type === 'outer' || s.type === 'front');
    const bottomSurf = panel.surfaces.find(s => s.type === 'bottom' || s.type === 'inner' || s.type === 'back');

    const topFinish = (topSurf && topSurf.enabled && topSurf.finishId !== 'fin-none') ? topSurf.finishId : undefined;
    const bottomFinish = (bottomSurf && bottomSurf.enabled && bottomSurf.finishId !== 'fin-none') ? bottomSurf.finishId : undefined;

    const frontEdge = panel.edges.find(e => e.type === 'front');
    const leftEdge = panel.edges.find(e => e.type === 'left');
    const rightEdge = panel.edges.find(e => e.type === 'right');
    const backEdge = panel.edges.find(e => e.type === 'back');

    const frontEdgeFinish = (frontEdge && frontEdge.enabled && frontEdge.finishId !== 'edge-none') ? frontEdge.finishId : undefined;
    const leftEdgeFinish = (leftEdge && leftEdge.enabled && leftEdge.finishId !== 'edge-none') ? leftEdge.finishId : undefined;
    const rightEdgeFinish = (rightEdge && rightEdge.enabled && rightEdge.finishId !== 'edge-none') ? rightEdge.finishId : undefined;
    const backEdgeFinish = (backEdge && backEdge.enabled && backEdge.finishId !== 'edge-none') ? backEdge.finishId : undefined;

    const topMat = new THREE.MeshStandardMaterial({ map: getTextureForFinish(topFinish, false), roughness: 0.4, metalness: 0.1 });
    const bottomMat = new THREE.MeshStandardMaterial({ map: getTextureForFinish(bottomFinish, false), roughness: 0.5, metalness: 0.05 });

    // Edge materials: if edge finish enabled -> show edge band texture; if disabled/removed -> show solid raw substrate color (#9CA3AF)
    const rightEdgeMat = new THREE.MeshStandardMaterial({ map: getTextureForFinish(rightEdgeFinish || frontEdgeFinish, true), roughness: 0.3, metalness: 0.1 });
    const leftEdgeMat = new THREE.MeshStandardMaterial({ map: getTextureForFinish(leftEdgeFinish || frontEdgeFinish, true), roughness: 0.3, metalness: 0.1 });
    const frontEdgeMat = new THREE.MeshStandardMaterial({ map: getTextureForFinish(frontEdgeFinish, true), roughness: 0.3, metalness: 0.1 });
    const backEdgeMat = new THREE.MeshStandardMaterial({ map: getTextureForFinish(backEdgeFinish, true), roughness: 0.3, metalness: 0.1 });

    const isVertical = panel.category === 'side' || panel.category === 'divider' || panel.id.includes('partition') || panel.id.includes('divider') || panel.id.includes('side') || size[1] > size[0];

    // 6 face materials array for Three.js BoxGeometry: [Right(+X), Left(-X), Top(+Y), Bottom(-Y), Front(+Z), Back(-Z)]
    // For vertical panels: broad faces are Right(+X) and Left(-X), while Top(+Y) and Bottom(-Y) are thin edges.
    // For horizontal panels: broad faces are Top(+Y) and Bottom(-Y), while Right(+X) and Left(-X) are thin edges.
    if (isVertical) {
      return [topMat, bottomMat, rightEdgeMat, leftEdgeMat, frontEdgeMat, backEdgeMat];
    }

    return [rightEdgeMat, leftEdgeMat, topMat, bottomMat, frontEdgeMat, backEdgeMat];
  }, [panel, finishesMap, edgesMap, size]);

  const isLightEnabled = panel.lighting?.enabled || false;
  const lightColor = panel.lighting?.colorTemp === '6000K' ? '#80E5FF' : panel.lighting?.colorTemp === '4000K' ? '#FFFFEE' : '#FFA033';
  const fixtureType = panel.lighting?.fixtureType || (panel.category === 'top' ? 'spotlight' : 'strip');

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(panel.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        material={materials}
      >
        <boxGeometry args={size} />
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
            <lineBasicMaterial color="#2563EB" linewidth={3} />
          </lineSegments>
        )}
        {hovered && !isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
            <lineBasicMaterial color="#93C5FD" linewidth={1.5} />
          </lineSegments>
        )}
      </mesh>

      {/* Integrated Panel 3D Light Fixture & Illumination */}
      {isLightEnabled && (
        <group position={[0, -size[1] / 2 - 0.005, 0]}>
          {fixtureType === 'spotlight' ? (
            <group position={[0, 0, 0]}>
              {/* Metallic Spotlight Puck Housing */}
              <mesh position={[0, -0.01, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
                <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
              </mesh>
              {/* Emissive Light Lens */}
              <mesh position={[0, -0.021, 0]}>
                <cylinderGeometry args={[0.065, 0.065, 0.005, 16]} />
                <meshBasicMaterial color={lightColor} />
              </mesh>
              {/* 3D Spotlight Beam */}
              <spotLight
                position={[0, -0.03, 0]}
                color={lightColor}
                intensity={3.5}
                distance={Math.max(3, size[1] * 6 + 4)}
                angle={0.65}
                penumbra={0.6}
              />
            </group>
          ) : (
            <group position={[0, 0, size[2] * 0.35]}>
              {/* LED Aluminum Strip Channel */}
              <mesh position={[0, -0.005, 0]}>
                <boxGeometry args={[Math.max(0.2, size[0] * 0.92), 0.01, 0.025]} />
                <meshBasicMaterial color={lightColor} />
              </mesh>
              {/* Glowing Linear Light Emission */}
              <pointLight
                position={[0, -0.04, 0]}
                color={lightColor}
                intensity={2.2}
                distance={Math.max(2.5, size[1] * 5 + 3)}
              />
            </group>
          )}
        </group>
      )}
    </group>
  );
}

export const formatDimValue = (feetVal: number, unit: 'ft' | 'inch' | 'mm') => {
  if (unit === 'inch') return parseFloat((feetVal * 12).toFixed(2));
  if (unit === 'mm') return parseFloat((feetVal * 304.8).toFixed(1));
  return parseFloat(feetVal.toFixed(2));
};

export const parseDimInputToFeet = (val: number, unit: 'ft' | 'inch' | 'mm') => {
  if (unit === 'inch') return val / 12;
  if (unit === 'mm') return val / 304.8;
  return val;
};

export const getCompartmentLabel = (
  compIdx: number,
  totalShelvesCount: number,
  subIdx?: number,
  partitionCount?: number,
  subLevelIdx?: number
): string => {
  const compNum = compIdx + 1;

  if (partitionCount && partitionCount > 0 && subIdx !== undefined) {
    const subNum = subIdx + 1;
    let label = `Comp ${compNum}#${subNum}`;
    if (subLevelIdx !== undefined) {
      const suffix = String.fromCharCode(65 + subLevelIdx); // A, B, C...
      label += `-${suffix}`;
    }
    return label;
  }

  if (totalShelvesCount === 0) {
    return 'Main Compartment';
  } else if (compIdx === 0) {
    return 'Bottom Compartment';
  } else if (compIdx === totalShelvesCount) {
    return 'Top Compartment';
  } else {
    return `Compartment #${compNum}`;
  }
};

interface FurnitureSceneProps {
  config: FurnitureConfig;
  materialsMaster?: MaterialItem[];
  finishesMaster: FinishItem[];
  edgesMaster?: EdgeFinishItem[];
  selectedPanelId: string | null;
  onSelectPanel: (panelId: string | null) => void;
  showDimensions: boolean;
  cameraPreset: '3D' | 'Front' | 'Back' | 'Left' | 'Right' | 'Top';
  onResetPreset?: () => void;
  onControlsReady?: (controls: any) => void;
  onChangeConfig?: (updated: FurnitureConfig) => void;
  activeEditComp?: { compIdx: number; subIdx?: number } | null;
  setActiveEditComp?: (val: { compIdx: number; subIdx?: number } | null) => void;
}

function SceneContent({
  config,
  finishesMaster,
  edgesMaster,
  selectedPanelId,
  onSelectPanel,
  showDimensions,
  cameraPreset,
  onControlsReady,
  onChangeConfig,
  activeEditComp,
  setActiveEditComp,
}: FurnitureSceneProps) {
  const controlsRef = useRef<any>(null);
  const finishesMap = useMemo(() => new Map(finishesMaster.map(f => [f.id, f])), [finishesMaster]);
  const edgesMap = useMemo(() => new Map((edgesMaster || []).map(e => [e.id, e])), [edgesMaster]);

  const w = normalizeToFeet(config.dimensions.width, config.dimensions.unit);
  const h = normalizeToFeet(config.dimensions.height, config.dimensions.unit);
  const d = normalizeToFeet(config.dimensions.depth, config.dimensions.unit);
  const panelThick = (config.panelThicknessMm || 18) / 304.8; // mm to ft

  // Handle camera preset positioning with right-side canvas framing & perspective view matching screenshot
  useEffect(() => {
    if (!controlsRef.current) return;
    const targetX = -w * 0.3;
    const center: [number, number, number] = [targetX, h * 0.45, 0];
    const dist = Math.max(w, h, d) * 2.8;
    const camera = controlsRef.current.object;

    if (cameraPreset === 'Front') {
      camera.position.set(targetX, h / 2, dist);
    } else if (cameraPreset === 'Back') {
      camera.position.set(targetX, h / 2, -dist);
    } else if (cameraPreset === 'Left') {
      camera.position.set(targetX - dist, h / 2, 0);
    } else if (cameraPreset === 'Right') {
      camera.position.set(targetX + dist, h / 2, 0);
    } else if (cameraPreset === 'Top') {
      camera.position.set(targetX, h * 3.2, 0.01);
    } else if (cameraPreset === '3D') {
      // 3/4 Perspective view matching screenshot angle
      camera.position.set(targetX + w * 1.8, h * 1.3, d * 3.2);
    }
    controlsRef.current.target.set(...center);
    controlsRef.current.update();
  }, [cameraPreset, w, h, d]);



  return (
    <>
      <OrbitControls
        ref={(node) => {
          controlsRef.current = node;
          if (onControlsReady) onControlsReady(node);
        }}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        zoomSpeed={0.35}
        rotateSpeed={0.8}
        minDistance={1.2}
        maxDistance={35}
      />

      {/* Studio Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={0.4} />

      {/* Floor Ground grid */}
      <gridHelper args={[20, 20, '#D1D5DB', '#E5E7EB']} position={[0, 0, 0]} />

      {/* Render Furniture Panels Parametrically with Dynamic Custom Dimensions */}
      <group position={[0, 0, 0]}>
        {/* Left Side */}
        {(() => {
          const leftPanel = config.panels.find((p) => p.id === 'panel-left-side') || config.panels[0];
          const leftThick = (leftPanel.thicknessMm || config.panelThicknessMm || 18) / 304.8;
          const leftH = leftPanel.heightFt || h;
          const leftD = leftPanel.depthFt || d;
          return (
            <ProceduralTextureMesh
              panel={leftPanel}
              position={[-w / 2 + leftThick / 2, leftH / 2, -d / 2 + leftD / 2]}
              size={[leftThick, leftH, leftD]}
              finishesMap={finishesMap}
              edgesMap={edgesMap}
              isSelected={selectedPanelId === 'panel-left-side'}
              onSelect={onSelectPanel}
            />
          );
        })()}

        {/* Right Side */}
        {(() => {
          const rightPanel = config.panels.find((p) => p.id === 'panel-right-side') || config.panels[0];
          const rightThick = (rightPanel.thicknessMm || config.panelThicknessMm || 18) / 304.8;
          const rightH = rightPanel.heightFt || h;
          const rightD = rightPanel.depthFt || d;
          return (
            <ProceduralTextureMesh
              panel={rightPanel}
              position={[w / 2 - rightThick / 2, rightH / 2, -d / 2 + rightD / 2]}
              size={[rightThick, rightH, rightD]}
              finishesMap={finishesMap}
              edgesMap={edgesMap}
              isSelected={selectedPanelId === 'panel-right-side'}
              onSelect={onSelectPanel}
            />
          );
        })()}

        {/* Top Panel */}
        {(() => {
          const topPanel = config.panels.find((p) => p.id === 'panel-top') || config.panels[0];
          const topThick = (topPanel.thicknessMm || config.panelThicknessMm || 18) / 304.8;
          const topW = topPanel.widthFt !== undefined ? topPanel.widthFt : w - panelThick * 2;
          const topD = topPanel.depthFt || (topPanel.heightFt !== h ? topPanel.heightFt : d);
          return (
            <ProceduralTextureMesh
              panel={topPanel}
              position={[0, h - topThick / 2, -d / 2 + topD / 2]}
              size={[topW, topThick, topD]}
              finishesMap={finishesMap}
              edgesMap={edgesMap}
              isSelected={selectedPanelId === 'panel-top'}
              onSelect={onSelectPanel}
            />
          );
        })()}

        {/* Bottom Panel */}
        {(() => {
          const bottomPanel = config.panels.find((p) => p.id === 'panel-bottom') || config.panels[0];
          const bottomThick = (bottomPanel.thicknessMm || config.panelThicknessMm || 18) / 304.8;
          const bottomW = bottomPanel.widthFt !== undefined ? bottomPanel.widthFt : w - panelThick * 2;
          const bottomD = bottomPanel.depthFt || (bottomPanel.heightFt !== h ? bottomPanel.heightFt : d);
          const hasSkirting = config.carcassSubType === 'wall-cabinet' || config.carcassSubType === 'tall-unit';
          const skirtH = hasSkirting ? normalizeToFeet(config.skirtingHeight ?? (config.dimensions.unit === 'mm' ? 100 : config.dimensions.unit === 'inch' ? 4 : 0.33), config.dimensions.unit) : 0;
          const bottomY = skirtH > 0 ? skirtH + bottomThick / 2 : bottomThick / 2;

          return (
            <>
              {/* Skirting Base Plinth Mesh */}
              {hasSkirting && skirtH > 0 && (
                <group position={[0, skirtH / 2, 0]}>
                  {/* Front Skirting Plinth */}
                  <mesh position={[0, 0, d / 2 - 0.08]}>
                    <boxGeometry args={[w * 0.96, skirtH, 0.06]} />
                    <meshStandardMaterial color="#1E293B" roughness={0.5} />
                  </mesh>
                  {/* Left Recessed Skirting Leg */}
                  <mesh position={[-w / 2 + panelThick + 0.08, 0, 0]}>
                    <boxGeometry args={[0.06, skirtH, d * 0.8]} />
                    <meshStandardMaterial color="#1E293B" roughness={0.5} />
                  </mesh>
                  {/* Right Recessed Skirting Leg */}
                  <mesh position={[w / 2 - panelThick - 0.08, 0, 0]}>
                    <boxGeometry args={[0.06, skirtH, d * 0.8]} />
                    <meshStandardMaterial color="#1E293B" roughness={0.5} />
                  </mesh>
                </group>
              )}

              <ProceduralTextureMesh
                panel={bottomPanel}
                position={[0, bottomY, -d / 2 + bottomD / 2]}
                size={[bottomW, bottomThick, bottomD]}
                finishesMap={finishesMap}
                edgesMap={edgesMap}
                isSelected={selectedPanelId === 'panel-bottom'}
                onSelect={onSelectPanel}
              />
            </>
          );
        })()}

        {/* Wardrobe Vertical Section Dividers & Multi-Bay Compartments */}
        {config.type === 'wardrobe' && (
          <group>
            {/* Render Vertical Partition Dividers */}
            {(() => {
              const secCount = config.sectionsCount || 2;
              if (secCount <= 1) return null;
              const dividerPanel = config.panels.find((p) => p.id === 'panel-vertical-dividers') || config.panels[0];
              const sectionWidth = (w - panelThick * 2) / secCount;

              return Array.from({ length: secCount - 1 }).map((_, i) => {
                const xPos = -w / 2 + panelThick + sectionWidth * (i + 1);
                return (
                  <ProceduralTextureMesh
                    key={`wardrobe-divider-${i}`}
                    panel={dividerPanel}
                    position={[xPos, h / 2, 0]}
                    size={[panelThick, h - panelThick * 2, d * 0.95]}
                    finishesMap={finishesMap}
                    edgesMap={edgesMap}
                    isSelected={selectedPanelId === 'panel-vertical-dividers'}
                    onSelect={onSelectPanel}
                  />
                );
              });
            })()}

            {/* Render 3D Compartment Modules (Hanging Rods, Shelves & Drawers per Section) */}
            {(() => {
              const secCount = config.sectionsCount || 2;
              const sections = config.wardrobeSections || [];

              return Array.from({ length: secCount }).map((_, secIdx) => {
                const sec = sections[secIdx];
                const sectionWidth = (w - panelThick * 2) / secCount;
                const secCenterX = -w / 2 + panelThick + sectionWidth * secIdx + sectionWidth / 2;

                if (!sec || !sec.compartments) return null;

                let currentY = panelThick;
                return (
                  <group key={`wardrobe-sec-modules-${secIdx}`}>
                    {sec.compartments.map((comp, compIdx) => {
                      const compY = currentY;
                      const compH = comp.heightFt;
                      currentY += compH;

                      const isSelectedComp = selectedPanelId === `comp-${secIdx + 1}-${compIdx + 1}`;

                      return (
                        <group key={comp.id || `comp-${compIdx}`} position={[secCenterX, compY + compH / 2, 0]}>
                          {/* Module Background Click Box */}
                          <mesh
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPanel(`comp-${secIdx + 1}-${compIdx + 1}`);
                            }}
                          >
                            <boxGeometry args={[sectionWidth * 0.96, compH * 0.96, d * 0.9]} />
                            <meshBasicMaterial
                              color={isSelectedComp ? '#3B82F6' : '#94A3B8'}
                              transparent
                              opacity={isSelectedComp ? 0.25 : 0.03}
                              wireframe={isSelectedComp}
                            />
                          </mesh>

                          {/* 1. Hanging Rod Module */}
                          {(comp.moduleType === 'hanging-single' || comp.moduleType === 'hanging-double') && (
                            <group>
                              {/* Hanging Rod Cylinder */}
                              <mesh position={[0, compH / 2 - 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
                                <cylinderGeometry args={[0.03, 0.03, sectionWidth * 0.92, 16]} />
                                <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.2} />
                              </mesh>
                              {/* Glowing LED sensor strip under hanging rod */}
                              <mesh position={[0, compH / 2 - 0.25, 0]}>
                                <boxGeometry args={[sectionWidth * 0.9, 0.015, 0.02]} />
                                <meshBasicMaterial color="#FFC87C" toneMapped={false} />
                              </mesh>

                              {/* Second Rod for Double Hanging */}
                              {comp.moduleType === 'hanging-double' && (
                                <mesh position={[0, -compH / 4, 0]} rotation={[0, 0, Math.PI / 2]}>
                                  <cylinderGeometry args={[0.03, 0.03, sectionWidth * 0.92, 16]} />
                                  <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.2} />
                                </mesh>
                              )}
                            </group>
                          )}

                          {/* 2. Shelf Separator */}
                          <mesh position={[0, compH / 2, 0]}>
                            <boxGeometry args={[sectionWidth, panelThick, d * 0.95]} />
                            <meshStandardMaterial color="#E2E8F0" />
                          </mesh>

                          {/* 3. Drawer Pack Unit */}
                          {comp.moduleType === 'drawer-pack' && (
                            <group position={[0, -compH / 4, d * 0.02]}>
                              <mesh>
                                <boxGeometry args={[sectionWidth * 0.92, compH * 0.75, d * 0.88]} />
                                <meshStandardMaterial color="#CBD5E1" roughness={0.4} />
                              </mesh>
                              {/* Drawer Center Handle Line */}
                              <mesh position={[0, 0, d * 0.44]}>
                                <boxGeometry args={[sectionWidth * 0.35, 0.03, 0.02]} />
                                <meshStandardMaterial color="#334155" metalness={0.8} />
                              </mesh>
                            </group>
                          )}

                          {/* 4. Locker / Safe Box */}
                          {comp.moduleType === 'locker-box' && (
                            <group position={[0, 0, d * 0.02]}>
                              <mesh>
                                <boxGeometry args={[sectionWidth * 0.88, compH * 0.7, d * 0.85]} />
                                <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.3} />
                              </mesh>
                              {/* Lock Keyhole Cylinder */}
                              <mesh position={[0, 0, d * 0.43]} rotation={[Math.PI / 2, 0, 0]}>
                                <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
                                <meshStandardMaterial color="#F59E0B" metalness={0.9} />
                              </mesh>
                            </group>
                          )}
                        </group>
                      );
                    })}
                  </group>
                );
              });
            })()}
          </group>
        )}

        {/* Shelves for Carcass */}
        {config.type !== 'wardrobe' && config.shelvesCount > 0 && (() => {
          const hasSkirting = config.carcassSubType === 'wall-cabinet' || config.carcassSubType === 'tall-unit';
          const skirtH = hasSkirting ? normalizeToFeet(config.skirtingHeight ?? (config.dimensions.unit === 'mm' ? 100 : config.dimensions.unit === 'inch' ? 4 : 0.33), config.dimensions.unit) : 0;
          const availableHeight = h - panelThick * 2;
          const defaultSpace = availableHeight / (config.shelvesCount + 1);

          return Array.from({ length: config.shelvesCount }).map((_, i) => {
            const customY = config.customShelfPositions?.[i];
            const yPos = customY !== undefined
              ? (skirtH + panelThick + customY)
              : (skirtH + panelThick + defaultSpace * (i + 1));

            const shelfPanel = config.panels.find(p => p.id === `panel-shelf-${i + 1}`) || config.panels.find(p => p.id === 'panel-shelves') || config.panels[0];
            const shelfThick = (shelfPanel.thicknessMm || config.shelfThicknessMm || 18) / 304.8;
            const shelfW = shelfPanel.widthFt !== undefined ? shelfPanel.widthFt : (w - panelThick * 2);
            const shelfD = shelfPanel.depthFt || (shelfPanel.heightFt !== d && shelfPanel.heightFt !== h ? shelfPanel.heightFt : d);

            return (
              <ProceduralTextureMesh
                key={`shelf-${i}`}
                panel={shelfPanel}
                position={[0, yPos, -d / 2 + shelfD / 2]}
                size={[shelfW, shelfThick, shelfD]}
                finishesMap={finishesMap}
                edgesMap={edgesMap}
                isSelected={selectedPanelId === shelfPanel.id}
                onSelect={onSelectPanel}
              />
            );
          });
        })()}

        {/* Shelf Vertical Partitions for Carcass */}
        {config.type !== 'wardrobe' && config.shelfPartitions && (() => {
          const hasSkirting = config.carcassSubType === 'wall-cabinet' || config.carcassSubType === 'tall-unit';
          const skirtH = hasSkirting ? normalizeToFeet(config.skirtingHeight ?? (config.dimensions.unit === 'mm' ? 100 : config.dimensions.unit === 'inch' ? 4 : 0.33), config.dimensions.unit) : 0;
          const availableHeight = h - panelThick * 2;
          const defaultSpace = availableHeight / (config.shelvesCount + 1);

          // Get Y positions of all horizontal surfaces (bottom panel, shelves, top panel)
          const shelfPositions = Array.from({ length: config.shelvesCount }).map((_, i) => {
            const customY = config.customShelfPositions?.[i];
            return customY !== undefined
              ? (skirtH + panelThick + customY)
              : (skirtH + panelThick + defaultSpace * (i + 1));
          });

          const boundaries = [skirtH + panelThick, ...shelfPositions, skirtH + h - panelThick];
          const dividerPanel = config.panels.find(p => p.category === 'divider') || config.panels[0];
          const divThick = (dividerPanel.thicknessMm || config.panelThicknessMm || 18) / 304.8;
          const innerWidth = w - panelThick * 2;

          return Object.entries(config.shelfPartitions).map(([cIdxStr, partCount]) => {
            const cIdx = parseInt(cIdxStr);
            if (partCount <= 0 || cIdx >= boundaries.length - 1) return null;

            const bottomY = boundaries[cIdx];
            const topY = boundaries[cIdx + 1];
            const compH = topY - bottomY;
            const compCenterY = bottomY + compH / 2;

            const customWidthsFt = config.customPartitionWidths?.[cIdx];
            let partitionPositions: number[] = [];

            if (customWidthsFt && customWidthsFt.length === partCount + 1) {
              let currentX = -innerWidth / 2;
              for (let i = 0; i < partCount; i++) {
                currentX += customWidthsFt[i];
                partitionPositions.push(currentX + divThick / 2);
                currentX += divThick;
              }
            } else {
              const stepX = innerWidth / (partCount + 1);
              const startX = -innerWidth / 2;
              partitionPositions = Array.from({ length: partCount }).map((_, pIdx) => startX + stepX * (pIdx + 1));
            }

            return partitionPositions.map((divX, pIdx) => {
              const partitionPanelId = `partition-${cIdx}-${pIdx}`;
              const targetPanel = config.panels.find((p) => p.id === partitionPanelId) || {
                ...dividerPanel,
                id: partitionPanelId,
                name: `Divider #${pIdx + 1}`,
              };

              return (
                <ProceduralTextureMesh
                  key={partitionPanelId}
                  panel={targetPanel}
                  position={[divX, compCenterY, 0]}
                  size={[divThick, compH, d]}
                  finishesMap={finishesMap}
                  edgesMap={edgesMap}
                  isSelected={selectedPanelId === partitionPanelId}
                  onSelect={onSelectPanel}
                />
              );
            });
          });
        })()}

        {/* Inner Vertical Sub-Dividers for Carcass Sub-Compartments */}
        {config.type !== 'wardrobe' && config.shelfSubPartitions && (() => {
          const hasSkirting = config.carcassSubType === 'wall-cabinet' || config.carcassSubType === 'tall-unit';
          const skirtH = hasSkirting ? normalizeToFeet(config.skirtingHeight ?? (config.dimensions.unit === 'mm' ? 100 : config.dimensions.unit === 'inch' ? 4 : 0.33), config.dimensions.unit) : 0;
          const availableHeight = h - panelThick * 2;
          const defaultSpace = availableHeight / (config.shelvesCount + 1);

          const shelfYPositions = Array.from({ length: config.shelvesCount }).map((_, i) => {
            const customY = config.customShelfPositions?.[i];
            return customY !== undefined
              ? (skirtH + panelThick + customY)
              : (skirtH + panelThick + defaultSpace * (i + 1));
          });

          const boundaries = [skirtH + panelThick, ...shelfYPositions, skirtH + h - panelThick];
          const dividerPanel = config.panels.find((p) => p.category === 'divider') || config.panels[0];
          const divThick = (dividerPanel.thicknessMm || config.panelThicknessMm || 18) / 304.8;
          const innerWidth = w - panelThick * 2;

          return Object.entries(config.shelfSubPartitions).map(([subKeyStr, subPartCount]) => {
            if (subPartCount <= 0) return null;
            const parts = subKeyStr.split('-');
            const compIdx = parseInt(parts[0]);
            const subIdx = parts.length > 1 ? parseInt(parts[1]) : undefined;

            if (isNaN(compIdx) || compIdx >= boundaries.length - 1 || subIdx === undefined) return null;

            const bottomY = boundaries[compIdx];
            const topY = boundaries[compIdx + 1];
            const compH = topY - bottomY;
            const compCenterY = bottomY + compH / 2;

            const partCount = config.shelfPartitions?.[compIdx] || 0;
            let subW = innerWidth;
            let subCenterX = 0;

            if (partCount > 0) {
              const customWidthsFt = config.customPartitionWidths?.[compIdx];
              if (customWidthsFt && customWidthsFt.length === partCount + 1) {
                let currentX = -innerWidth / 2;
                for (let s = 0; s < subIdx; s++) {
                  currentX += customWidthsFt[s] + divThick;
                }
                subW = customWidthsFt[subIdx] || 0.5;
                subCenterX = currentX + subW / 2;
              } else {
                const stepX = innerWidth / (partCount + 1);
                const startX = -innerWidth / 2;
                subW = (innerWidth - divThick * partCount) / (partCount + 1);
                subCenterX = startX + stepX * subIdx + stepX / 2;
              }
            }

            const stepSubX = subW / (subPartCount + 1);
            const startSubX = subCenterX - subW / 2;
            const subDivPositions = Array.from({ length: subPartCount }).map((_, pIdx) => startSubX + stepSubX * (pIdx + 1));

            return subDivPositions.map((divX, pIdx) => {
              const subPartitionPanelId = `sub-partition-${subKeyStr}-${pIdx}`;
              const targetPanel = config.panels.find((p) => p.id === subPartitionPanelId) || {
                ...dividerPanel,
                id: subPartitionPanelId,
                name: `Sub-Partition #${pIdx + 1}`,
              };

              return (
                <ProceduralTextureMesh
                  key={subPartitionPanelId}
                  panel={targetPanel}
                  position={[divX, compCenterY, 0]}
                  size={[divThick, compH, d]}
                  finishesMap={finishesMap}
                  edgesMap={edgesMap}
                  isSelected={selectedPanelId === subPartitionPanelId}
                  onSelect={onSelectPanel}
                />
              );
            });
          });
        })()}

        {/* Inner Horizontal Sub-Shelves for Carcass Sub-Compartments */}
        {config.type !== 'wardrobe' && config.shelfSubShelves && (() => {
          const hasSkirting = config.carcassSubType === 'wall-cabinet' || config.carcassSubType === 'tall-unit';
          const skirtH = hasSkirting ? normalizeToFeet(config.skirtingHeight ?? (config.dimensions.unit === 'mm' ? 100 : config.dimensions.unit === 'inch' ? 4 : 0.33), config.dimensions.unit) : 0;
          const availableHeight = h - panelThick * 2;
          const defaultSpace = availableHeight / (config.shelvesCount + 1);

          const shelfYPositions = Array.from({ length: config.shelvesCount }).map((_, i) => {
            const customY = config.customShelfPositions?.[i];
            return customY !== undefined
              ? (skirtH + panelThick + customY)
              : (skirtH + panelThick + defaultSpace * (i + 1));
          });

          const boundaries = [skirtH + panelThick, ...shelfYPositions, skirtH + h - panelThick];
          const shelfPanel = config.panels.find((p) => p.category === 'shelf') || config.panels[0];
          const shelfThick = (shelfPanel.thicknessMm || config.shelfThicknessMm || 18) / 304.8;
          const innerWidth = w - panelThick * 2;

          return Object.entries(config.shelfSubShelves).map(([keyStr, subShelvesCount]) => {
            if (subShelvesCount <= 0) return null;
            const parts = keyStr.split('-');
            const compIdx = parseInt(parts[0]);
            const subIdx = parts.length > 1 ? parseInt(parts[1]) : undefined;

            if (isNaN(compIdx) || compIdx >= boundaries.length - 1) return null;

            const bottomY = boundaries[compIdx];
            const topY = boundaries[compIdx + 1];
            const compH = topY - bottomY;

            const partCount = config.shelfPartitions?.[compIdx] || 0;
            const dividerPanel = config.panels.find((p) => p.category === 'divider') || config.panels[0];
            const divThick = (dividerPanel.thicknessMm || config.panelThicknessMm || 18) / 304.8;

            let subW = innerWidth;
            let subCenterX = 0;

            if (partCount > 0 && subIdx !== undefined) {
              const customWidthsFt = config.customPartitionWidths?.[compIdx];
              if (customWidthsFt && customWidthsFt.length === partCount + 1) {
                let currentX = -innerWidth / 2;
                for (let s = 0; s < subIdx; s++) {
                  currentX += customWidthsFt[s] + divThick;
                }
                subW = customWidthsFt[subIdx] || 0.5;
                subCenterX = currentX + subW / 2;
              } else {
                const stepX = innerWidth / (partCount + 1);
                const startX = -innerWidth / 2;
                subW = (innerWidth - divThick * partCount) / (partCount + 1);
                subCenterX = startX + stepX * subIdx + stepX / 2;
              }
            }

            const vertSpace = compH / (subShelvesCount + 1);

            return Array.from({ length: subShelvesCount }).map((_, sIdx) => {
              const subShelfY = bottomY + vertSpace * (sIdx + 1);
              const subShelfPanelId = `sub-shelf-${keyStr}-${sIdx}`;
              const targetPanel = config.panels.find((p) => p.id === subShelfPanelId) || {
                ...shelfPanel,
                id: subShelfPanelId,
                name: `Inner Sub-Shelf Board #${sIdx + 1}`,
              };

              return (
                <ProceduralTextureMesh
                  key={subShelfPanelId}
                  panel={targetPanel}
                  position={[subCenterX, subShelfY, 0]}
                  size={[subW, shelfThick, d]}
                  finishesMap={finishesMap}
                  edgesMap={edgesMap}
                  isSelected={selectedPanelId === subShelfPanelId}
                  onSelect={onSelectPanel}
                />
              );
            });
          });
        })()}

        {/* Back Panel */}
        {config.hasBackPanel && (() => {
          const backPanel = config.panels.find(p => p.id === 'panel-back') || config.panels[0];
          const backW = backPanel.widthFt || w;
          const backH = backPanel.heightFt || h;
          const backThick = (backPanel.thicknessMm || config.backPanelThicknessMm || 6) / 304.8;
          return (
            <ProceduralTextureMesh
              panel={backPanel}
              position={[0, backH / 2, -d / 2 + backThick / 2]}
              size={[backW, backH, backThick]}
              finishesMap={finishesMap}
              edgesMap={edgesMap}
              isSelected={selectedPanelId === 'panel-back'}
              onSelect={onSelectPanel}
            />
          );
        })()}

        {/* Dynamic 3D LED Lights Rendering */}
        {config.panels.map((p) => {
          if (!p.lighting || !p.lighting.enabled) return null;

          const colorMap: Record<string, string> = {
            '3000K': '#FF8C00', // Deep Warm Golden Orange Amber
            '4000K': '#FFFDF7', // Crisp Neutral Pure White
            '6000K': '#00D9FF', // Brilliant Cool Electric Ice Blue
          };
          const lightColor = colorMap[p.lighting.colorTemp || '3000K'] || '#FF8C00';

          const hasSkirting = config.carcassSubType === 'wall-cabinet' || config.carcassSubType === 'tall-unit';
          const skirtH = hasSkirting ? normalizeToFeet(config.skirtingHeight ?? (config.dimensions.unit === 'mm' ? 100 : config.dimensions.unit === 'inch' ? 4 : 0.33), config.dimensions.unit) : 0;
          const availableHeight = h - panelThick * 2;
          const defaultSpace = availableHeight / (config.shelvesCount + 1);

          const shelfYPositions = Array.from({ length: config.shelvesCount }).map((_, i) => {
            const customY = config.customShelfPositions?.[i];
            return customY !== undefined
              ? (skirtH + panelThick + customY)
              : (skirtH + panelThick + defaultSpace * (i + 1));
          });

          if (p.id === 'panel-shelves' && config.shelvesCount > 0) {
            const shelfThick = (config.shelfThicknessMm || 18) / 304.8;
            return (
              <React.Fragment key="common-shelves-lights">
                {Array.from({ length: config.shelvesCount }).map((_, i) => {
                  const yPos = (shelfYPositions[i] || (panelThick + defaultSpace * (i + 1))) - (shelfThick / 2) - 0.05;
                  return (
                    <group key={`light-common-shelf-${i}`} position={[0, yPos, 0]}>
                      <pointLight
                        color={lightColor}
                        intensity={p.lighting!.intensity * 2.8}
                        distance={Math.max(w, h, d) * 1.6}
                        decay={1.8}
                      />
                      <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[w - panelThick * 2, 0.02, 0.03]} />
                        <meshBasicMaterial color={lightColor} toneMapped={false} />
                      </mesh>
                    </group>
                  );
                })}
              </React.Fragment>
            );
          }

          const shelfThick = (config.shelfThicknessMm || 18) / 304.8;
          let lightPos: [number, number, number] = [0, h / 2, 0];
          let customLen: number | undefined = undefined;

          if (p.id.startsWith('sub-shelf-')) {
            const boundaries = [skirtH + panelThick, ...shelfYPositions, skirtH + h - panelThick];
            const innerWidth = w - panelThick * 2;
            const rest = p.id.replace('sub-shelf-', '');
            const lastDash = rest.lastIndexOf('-');

            if (lastDash !== -1) {
              const keyStr = rest.substring(0, lastDash);
              const sIdx = parseInt(rest.substring(lastDash + 1));
              const parts = keyStr.split('-');
              const compIdx = parseInt(parts[0]);
              const subIdx = parts.length > 1 ? parseInt(parts[1]) : undefined;

              if (!isNaN(compIdx) && compIdx < boundaries.length - 1) {
                const bottomY = boundaries[compIdx];
                const topY = boundaries[compIdx + 1];
                const compH = topY - bottomY;

                const subShelvesCount = config.shelfSubShelves?.[keyStr] || 1;
                const vertSpace = compH / (subShelvesCount + 1);
                const subShelfY = bottomY + vertSpace * (sIdx + 1);

                const partCount = config.shelfPartitions?.[compIdx] || 0;
                const dividerPanel = config.panels.find((panel) => panel.category === 'divider') || config.panels[0];
                const divThick = (dividerPanel.thicknessMm || config.panelThicknessMm || 18) / 304.8;

                let subW = innerWidth;
                let subCenterX = 0;

                if (partCount > 0 && subIdx !== undefined) {
                  const customWidthsFt = config.customPartitionWidths?.[compIdx];
                  if (customWidthsFt && customWidthsFt.length === partCount + 1) {
                    let currentX = -innerWidth / 2;
                    for (let s = 0; s < subIdx; s++) {
                      currentX += customWidthsFt[s] + divThick;
                    }
                    subW = customWidthsFt[subIdx] || 0.5;
                    subCenterX = currentX + subW / 2;
                  } else {
                    const stepX = innerWidth / (partCount + 1);
                    const startX = -innerWidth / 2;
                    subW = (innerWidth - divThick * partCount) / (partCount + 1);
                    subCenterX = startX + stepX * subIdx + stepX / 2;
                  }
                }

                lightPos = [subCenterX, subShelfY - (shelfThick / 2) - 0.05, 0];
                customLen = subW;
              }
            }
          } else if (p.category === 'top' || p.id === 'panel-top') {
            lightPos = [0, h - panelThick - 0.05, 0];
          } else if (p.category === 'bottom' || p.id === 'panel-bottom') {
            lightPos = [0, panelThick + 0.08, 0];
          } else if (p.category === 'side') {
            const isLeft = p.id.includes('left');
            lightPos = [isLeft ? -w / 2 + panelThick + 0.08 : w / 2 - panelThick - 0.08, h / 2, 0];
          } else if (p.category === 'shelf' || p.id.startsWith('panel-shelf-')) {
            const shelfIndex = parseInt(p.id.replace('panel-shelf-', '')) || 1;
            const yPos = (shelfYPositions[shelfIndex - 1] !== undefined
              ? shelfYPositions[shelfIndex - 1]
              : panelThick + defaultSpace * shelfIndex) - (shelfThick / 2) - 0.05;
            lightPos = [0, yPos, 0];
            customLen = w - panelThick * 2;
          }

          const isCuratedPremium = config.lightingPackage === 'curated-premium';
          const isSide = p.category === 'side';
          const isTop = p.category === 'top' || p.id === 'panel-top';
          const fixtureType = p.lighting.fixtureType || (isTop ? 'spotlight' : 'strip');

          if (fixtureType === 'strip' || (isCuratedPremium && (isSide || isTop))) {
            const numLights = 5; // Distributed emitters along channel
            const len = customLen !== undefined ? customLen : (isSide ? (h - panelThick * 2) : (w - panelThick * 2));

            return (
              <group key={`light-${p.id}`} position={lightPos}>
                {/* Continuous Glowing Diffuser Channel Mesh */}
                <mesh position={[0, 0, 0]}>
                  {isSide ? (
                    <boxGeometry args={[0.03, len, 0.04]} />
                  ) : (
                    <boxGeometry args={[len, 0.03, 0.04]} />
                  )}
                  <meshBasicMaterial color={lightColor} toneMapped={false} />
                </mesh>

                {/* Distributed Emitters Along Profile Strip */}
                {Array.from({ length: numLights }).map((_, idx) => {
                  const offset = -len / 2 + (len / (numLights - 1)) * idx;
                  const pos: [number, number, number] = isSide ? [0, offset, 0] : [offset, 0, 0];

                  return (
                    <pointLight
                      key={`strip-emitter-${p.id}-${idx}`}
                      position={pos}
                      color={lightColor}
                      intensity={(p.lighting!.intensity * 1.8) / numLights}
                      distance={Math.max(w, h, d) * 1.6}
                      decay={1.5}
                    />
                  );
                })}
              </group>
            );
          }

          // COB Spotlight rendering
          return (
            <group key={`light-${p.id}`} position={lightPos}>
              <pointLight
                color={lightColor}
                intensity={p.lighting.intensity * 2.8}
                distance={Math.max(w, h, d) * 1.8}
                decay={1.8}
              />
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.03, 16]} />
                <meshBasicMaterial color={lightColor} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Dimension Lines Overlay */}
      {showDimensions && (
        <group>
          {/* Width Dimension */}
          <Html position={[0, -0.2, d / 2 + 0.2]} center>
            <div className="bg-slate-900/90 text-white px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap shadow border border-slate-700">
              W: {config.dimensions.width} {config.dimensions.unit}
            </div>
          </Html>
          {/* Height Dimension */}
          <Html position={[w / 2 + 0.3, h / 2, 0]} center>
            <div className="bg-slate-900/90 text-white px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap shadow border border-slate-700">
              H: {config.dimensions.height} {config.dimensions.unit}
            </div>
          </Html>
          {/* Depth Dimension */}
          <Html position={[-w / 2 - 0.3, 0.2, 0]} center>
            <div className="bg-slate-900/90 text-white px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap shadow border border-slate-700">
              D: {config.dimensions.depth} {config.dimensions.unit}
            </div>
          </Html>

          {/* Individual Compartments W x H x D Dimensions Overlay for Carcass */}
          {config.type !== 'wardrobe' && (() => {
            const hasSkirting = config.carcassSubType === 'wall-cabinet' || config.carcassSubType === 'tall-unit';
            const skirtH = hasSkirting ? normalizeToFeet(config.skirtingHeight ?? (config.dimensions.unit === 'mm' ? 100 : config.dimensions.unit === 'inch' ? 4 : 0.33), config.dimensions.unit) : 0;
            const availableHeight = h - panelThick * 2;
            const defaultSpace = availableHeight / (config.shelvesCount + 1);

            const shelfYPositions = Array.from({ length: config.shelvesCount }).map((_, i) => {
              const customY = config.customShelfPositions?.[i];
              return customY !== undefined
                ? (skirtH + panelThick + customY)
                : (skirtH + panelThick + defaultSpace * (i + 1));
            });

            // Boundaries: [bottom_inner, shelf_1, shelf_2, ..., top_inner]
            const boundaries = [skirtH + panelThick, ...shelfYPositions, skirtH + h - panelThick];
            const innerWidth = w - panelThick * 2;
            const displayD = formatDimValue(d, config.dimensions.unit);

            const compOverlays = boundaries.slice(0, -1).map((bottomY, compIdx) => {
              const topY = boundaries[compIdx + 1];
              const openingH = topY - bottomY;
              const centerY = bottomY + openingH / 2;
              const displayH = formatDimValue(openingH, config.dimensions.unit);

              const partCount = config.shelfPartitions?.[compIdx] || 0;

              if (partCount <= 0) {
                // Single unpartitioned compartment compact pill badge
                const displayW = formatDimValue(innerWidth, config.dimensions.unit);
                const compName = getCompartmentLabel(compIdx, config.shelvesCount);
                const isEditing = activeEditComp?.compIdx === compIdx && activeEditComp?.subIdx === undefined;
                if (isEditing) return null;

                return (
                  <Html key={`comp-dim-${compIdx}`} position={[0, centerY, 0]} center zIndexRange={[50, 0]}>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (setActiveEditComp) setActiveEditComp(isEditing ? null : { compIdx });
                      }}
                      className={`px-2.5 py-1 rounded-full text-center shadow-md border pointer-events-auto cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 whitespace-nowrap select-none ${isEditing
                        ? 'bg-blue-950/95 border-blue-400 text-blue-200 ring-2 ring-blue-500/50 scale-105 shadow-blue-500/20'
                        : 'bg-slate-950/85 backdrop-blur-md border-slate-700/80 text-amber-300 hover:bg-slate-900 hover:border-amber-400 hover:scale-105'
                        }`}
                      title="Click to edit compartment dimensions & partitions"
                    >
                      <span className="text-[9.5px] font-extrabold uppercase tracking-wide whitespace-nowrap">
                        {compName}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-300 whitespace-nowrap">
                        • {displayW} × {displayH}
                      </span>
                      <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold opacity-80 hover:opacity-100 whitespace-nowrap">
                        ✏️
                      </span>
                    </div>
                  </Html>
                );
              }

              // Partitioned sub-compartments: center badge in each sub-partition
              const dividerPanel = config.panels.find((p) => p.category === 'divider') || config.panels[0];
              const divThick = (dividerPanel.thicknessMm || config.panelThicknessMm || 18) / 304.8;
              const customWidthsFt = config.customPartitionWidths?.[compIdx];

              if (customWidthsFt && customWidthsFt.length === partCount + 1) {
                let currentX = -innerWidth / 2;
                return customWidthsFt.map((subW, subIdx) => {
                  const subCenterX = currentX + subW / 2;
                  currentX += subW + divThick;
                  const displaySubW = formatDimValue(subW, config.dimensions.unit);
                  const subName = getCompartmentLabel(compIdx, config.shelvesCount, subIdx, partCount);
                  const isEditing = activeEditComp?.compIdx === compIdx && activeEditComp?.subIdx === subIdx;
                  if (isEditing) return null;

                  return (
                    <Html key={`comp-dim-${compIdx}-sub-${subIdx}`} position={[subCenterX, centerY, 0]} center zIndexRange={[50, 0]}>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (setActiveEditComp) setActiveEditComp(isEditing ? null : { compIdx, subIdx });
                        }}
                        className={`group px-2 py-0.5 rounded-full text-center shadow-md border pointer-events-auto cursor-pointer transition-all duration-200 flex items-center justify-center gap-1 whitespace-nowrap select-none ${isEditing
                          ? 'bg-blue-950/95 border-blue-400 text-blue-200 ring-2 ring-blue-500/50 scale-105 shadow-blue-500/20'
                          : 'bg-slate-950/85 backdrop-blur-md border-slate-700/80 text-amber-300 hover:bg-slate-900 hover:border-amber-400 hover:scale-105'
                          }`}
                        title={`${subName}: ${displaySubW} × ${displayH} ${config.dimensions.unit}`}
                      >
                        <span className="text-[9px] font-extrabold uppercase tracking-wide whitespace-nowrap">
                          {subName}
                        </span>
                        <span className="hidden group-hover:inline text-[8.5px] font-semibold text-slate-300 whitespace-nowrap transition-all duration-150">
                          • {displaySubW} × {displayH}
                        </span>
                        <span className="text-[8px] bg-amber-500/20 text-amber-300 px-0.5 py-0.2 rounded font-bold opacity-80 group-hover:opacity-100 whitespace-nowrap">
                          ✏️
                        </span>
                      </div>
                    </Html>
                  );
                });
              }

              const subCompWidth = (innerWidth - divThick * partCount) / (partCount + 1);
              const displaySubW = formatDimValue(subCompWidth, config.dimensions.unit);
              const stepX = innerWidth / (partCount + 1);
              const startX = -innerWidth / 2;

              return Array.from({ length: partCount + 1 }).map((_, subIdx) => {
                const subCenterX = startX + stepX * subIdx + stepX / 2;
                const subKey = `${compIdx}-${subIdx}`;
                const subPartCount = config.shelfSubPartitions?.[subKey] || 0;
                const isEditing = activeEditComp?.compIdx === compIdx && activeEditComp?.subIdx === subIdx;
                if (isEditing) return null;

                if (subPartCount > 0) {
                  const subSubW = (subCompWidth - divThick * subPartCount) / (subPartCount + 1);
                  const displaySubSubW = formatDimValue(subSubW, config.dimensions.unit);
                  const stepSubX = subCompWidth / (subPartCount + 1);
                  const startSubX = subCenterX - subCompWidth / 2;

                  return Array.from({ length: subPartCount + 1 }).map((_, subSubIdx) => {
                    const subSubCenterX = startSubX + stepSubX * subSubIdx + stepSubX / 2;
                    const subName = getCompartmentLabel(compIdx, config.shelvesCount, subIdx, partCount, subSubIdx);

                    return (
                      <Html key={`comp-dim-${compIdx}-sub-${subIdx}-nested-${subSubIdx}`} position={[subSubCenterX, centerY, 0]} center zIndexRange={[50, 0]}>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (setActiveEditComp) setActiveEditComp(isEditing ? null : { compIdx, subIdx });
                          }}
                          className={`group px-2 py-0.5 rounded-full text-center shadow-md border pointer-events-auto cursor-pointer transition-all duration-200 flex items-center justify-center gap-1 whitespace-nowrap select-none ${isEditing
                            ? 'bg-blue-950/95 border-blue-400 text-blue-200 ring-2 ring-blue-500/50 scale-105 shadow-blue-500/20'
                            : 'bg-slate-950/85 backdrop-blur-md border-slate-700/80 text-amber-300 hover:bg-slate-900 hover:border-amber-400 hover:scale-105'
                            }`}
                          title={`${subName}: ${displaySubSubW} × ${displayH} ${config.dimensions.unit}`}
                        >
                          <span className="text-[9px] font-extrabold uppercase tracking-wide whitespace-nowrap">
                            {subName}
                          </span>
                          <span className="hidden group-hover:inline text-[8.5px] font-semibold text-slate-300 whitespace-nowrap transition-all duration-150">
                            • {displaySubSubW} × {displayH}
                          </span>
                          <span className="text-[8px] bg-amber-500/20 text-amber-300 px-0.5 py-0.2 rounded font-bold opacity-80 group-hover:opacity-100 whitespace-nowrap">
                            ✏️
                          </span>
                        </div>
                      </Html>
                    );
                  });
                }

                const subName = getCompartmentLabel(compIdx, config.shelvesCount, subIdx, partCount);

                return (
                  <Html key={`comp-dim-${compIdx}-sub-${subIdx}`} position={[subCenterX, centerY, 0]} center zIndexRange={[50, 0]}>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (setActiveEditComp) setActiveEditComp(isEditing ? null : { compIdx, subIdx });
                      }}
                      className={`group px-2 py-0.5 rounded-full text-center shadow-md border pointer-events-auto cursor-pointer transition-all duration-200 flex items-center justify-center gap-1 whitespace-nowrap select-none ${isEditing
                        ? 'bg-blue-950/95 border-blue-400 text-blue-200 ring-2 ring-blue-500/50 scale-105 shadow-blue-500/20'
                        : 'bg-slate-950/85 backdrop-blur-md border-slate-700/80 text-amber-300 hover:bg-slate-900 hover:border-amber-400 hover:scale-105'
                        }`}
                      title={`${subName}: ${displaySubW} × ${displayH} ${config.dimensions.unit}`}
                    >
                      <span className="text-[9px] font-extrabold uppercase tracking-wide whitespace-nowrap">
                        {subName}
                      </span>
                      <span className="hidden group-hover:inline text-[8.5px] font-semibold text-slate-300 whitespace-nowrap transition-all duration-150">
                        • {displaySubW} × {displayH}
                      </span>
                      <span className="text-[8px] bg-amber-500/20 text-amber-300 px-0.5 py-0.2 rounded font-bold opacity-80 group-hover:opacity-100 whitespace-nowrap">
                        ✏️
                      </span>
                    </div>
                  </Html>
                );
              });
            });

            return compOverlays;
          })()}
        </group>
      )}
    </>
  );
}

export function FurnitureCanvas(props: FurnitureSceneProps) {
  const controlsRef = useRef<any>(null);

  // Active compartment edit popover state & draggable position state
  const [activeEditComp, setActiveEditComp] = useState<{ compIdx: number; subIdx?: number } | null>(null);
  const [compEditPos, setCompEditPos] = useState<{ x: number; y: number }>({ x: 350, y: 70 });
  const isCompDraggingRef = useRef(false);
  const compDragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 350,
    initY: 70,
  });

  const handleCompPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isCompDraggingRef.current = true;
    compDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: compEditPos.x,
      initY: compEditPos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleCompPointerMove = (e: React.PointerEvent) => {
    if (!isCompDraggingRef.current) return;
    const dx = e.clientX - compDragStartRef.current.startX;
    const dy = e.clientY - compDragStartRef.current.startY;
    setCompEditPos({
      x: Math.max(10, compDragStartRef.current.initX + dx),
      y: Math.max(10, compDragStartRef.current.initY + dy),
    });
  };

  const handleCompPointerUp = (e: React.PointerEvent) => {
    if (isCompDraggingRef.current) {
      isCompDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) { }
    }
  };

  // Dedicated Physical Board Specs popover state & draggable position
  const [panelEditPos, setPanelEditPos] = useState<{ x: number; y: number }>({ x: 360, y: 70 });
  const [panelSpecsTab, setPanelSpecsTab] = useState<'materials' | 'edges' | 'specs'>('materials');
  const isPanelDraggingRef = useRef(false);
  const panelDragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 360,
    initY: 70,
  });

  const handlePanelDragDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isPanelDraggingRef.current = true;
    panelDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: panelEditPos.x,
      initY: panelEditPos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePanelDragMove = (e: React.PointerEvent) => {
    if (!isPanelDraggingRef.current) return;
    const dx = e.clientX - panelDragStartRef.current.startX;
    const dy = e.clientY - panelDragStartRef.current.startY;
    setPanelEditPos({
      x: Math.max(10, panelDragStartRef.current.initX + dx),
      y: Math.max(10, panelDragStartRef.current.initY + dy),
    });
  };

  const handlePanelDragUp = (e: React.PointerEvent) => {
    if (isPanelDraggingRef.current) {
      isPanelDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) { }
    }
  };

  // Inspector card open/close state (open by default)
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isCarcassSubtypeOpen, setIsCarcassSubtypeOpen] = useState(false);
  const [isBackPanelMaterialOpen, setIsBackPanelMaterialOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Active Inspector Popover Tab state (Global Unit Level)
  const [popoverTab, setPopoverTab] = useState<'config' | 'lighting' | 'zones'>('config');

  useEffect(() => {
    if (props.selectedPanelId) {
      setIsInspectorOpen(true);
      if (props.selectedPanelId.startsWith('comp-')) {
        setPopoverTab('zones');
      }
    }
  }, [props.selectedPanelId]);

  // Popover drag state (offset from initial position)
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number }>({ x: 12, y: 58 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 12,
    initY: 58,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: popoverPos.x,
      initY: popoverPos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setPopoverPos({
      x: Math.max(0, dragStartRef.current.initX + dx),
      y: Math.max(0, dragStartRef.current.initY + dy),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) { }
    }
  };

  const selectedPanel = useMemo(() => {
    if (!props.selectedPanelId) return null;
    let standard = props.config.panels.find((p) => p.id === props.selectedPanelId);

    // Fallback when toggling separateShelves: if selectedPanelId is 'panel-shelves' but separateShelves is active, match 'panel-shelf-1'
    if (!standard && props.selectedPanelId === 'panel-shelves') {
      standard = props.config.panels.find((p) => p.id === 'panel-shelf-1');
    }
    // Fallback when toggling separateShelves back to common: if selectedPanelId is 'panel-shelf-X' but common mode is active, match 'panel-shelves'
    if (!standard && props.selectedPanelId.startsWith('panel-shelf-')) {
      standard = props.config.panels.find((p) => p.id === 'panel-shelves');
    }

    if (standard) return standard;

    // Fallback for dynamic sub-shelves or sub-partitions
    if (props.selectedPanelId.includes('sub-shelf')) {
      const template = props.config.panels.find((p) => p.category === 'shelf') || props.config.panels[0];
      if (template) return { ...template, id: props.selectedPanelId, name: 'Inner Sub-Shelf Board' };
    }
    if (props.selectedPanelId.includes('partition') || props.selectedPanelId.includes('divider')) {
      const template = props.config.panels.find((p) => p.category === 'divider') || props.config.panels[0];
      if (template) return { ...template, id: props.selectedPanelId, name: 'Vertical Divider Board' };
    }

    // Check if selecting a Wardrobe Compartment
    if (props.selectedPanelId.startsWith('comp-')) {
      const parts = props.selectedPanelId.split('-');
      const secIdx = parseInt(parts[1]) - 1;
      const compIdx = parseInt(parts[2]) - 1;
      const sec = props.config.wardrobeSections?.[secIdx];
      const comp = sec?.compartments?.[compIdx];

      if (comp) {
        return {
          id: props.selectedPanelId,
          name: `${sec.name} - ${comp.name}`,
          category: 'shelf' as const,
          quantity: 1,
          widthFt: sec.widthFt,
          heightFt: comp.heightFt,
          depthFt: normalizeToFeet(props.config.dimensions.depth, props.config.dimensions.unit),
          thicknessMm: props.config.shelfThicknessMm,
          materialId: props.config.defaultMaterialId,
          surfaces: [],
          edges: [],
          lighting: undefined,
          isCompartment: true,
          secIdx,
          compIdx,
          comp,
        };
      }
    }
    return null;
  }, [props.config.panels, props.config.wardrobeSections, props.selectedPanelId]);

  const updateSelectedPanelSurface = (panelId: string, surfaceType: string, enabled: boolean, finishId?: string) => {
    if (!props.onChangeConfig) return;

    const isCommonShelves = !props.config.separateShelves && (panelId === 'panel-shelves' || panelId.startsWith('panel-shelf-'));

    let panelFound = false;
    let updatedPanels = props.config.panels.map((p) => {
      const isTarget = isCommonShelves
        ? (p.category === 'shelf' && !p.id.includes('sub-shelf'))
        : p.id === panelId;

      if (!isTarget) return p;
      panelFound = true;

      const surfaces = p.surfaces.map((s) => {
        if (s.type !== surfaceType) return s;
        return {
          ...s,
          enabled,
          finishId: finishId !== undefined ? finishId : s.finishId,
        };
      });
      return { ...p, surfaces };
    });

    if (!panelFound && !isCommonShelves && selectedPanel) {
      const newPanel = {
        ...selectedPanel,
        surfaces: selectedPanel.surfaces.map((s) => {
          if (s.type !== surfaceType) return s;
          return {
            ...s,
            enabled,
            finishId: finishId !== undefined ? finishId : s.finishId,
          };
        }),
      };
      updatedPanels = [...updatedPanels, newPanel];
    }

    props.onChangeConfig({ ...props.config, panels: updatedPanels, surfacePreset: 'custom' });
  };

  const updateSelectedPanelEdge = (panelId: string, edgeType: string, enabled: boolean, finishId?: string) => {
    if (!props.onChangeConfig) return;

    const isCommonShelves = !props.config.separateShelves && (panelId === 'panel-shelves' || panelId.startsWith('panel-shelf-'));

    let panelFound = false;
    let updatedPanels = props.config.panels.map((p) => {
      const isTarget = isCommonShelves
        ? (p.category === 'shelf' && !p.id.includes('sub-shelf'))
        : p.id === panelId;

      if (!isTarget) return p;
      panelFound = true;

      const edges = p.edges.map((e) => {
        if (e.type !== edgeType) return e;
        return {
          ...e,
          enabled,
          finishId: finishId !== undefined ? finishId : e.finishId,
        };
      });
      return { ...p, edges };
    });

    if (!panelFound && !isCommonShelves && selectedPanel) {
      const newPanel = {
        ...selectedPanel,
        edges: selectedPanel.edges.map((e) => {
          if (e.type !== edgeType) return e;
          return {
            ...e,
            enabled,
            finishId: finishId !== undefined ? finishId : e.finishId,
          };
        }),
      };
      updatedPanels = [...updatedPanels, newPanel];
    }

    props.onChangeConfig({ ...props.config, panels: updatedPanels });
  };

  const updateSelectedPanelMaterial = (panelId: string, materialId: string) => {
    if (!props.onChangeConfig) return;

    let panelFound = false;
    let updatedPanels = props.config.panels.map((p) => {
      if (p.id !== panelId) return p;
      panelFound = true;
      return { ...p, materialId };
    });

    if (!panelFound && selectedPanel) {
      updatedPanels = [...updatedPanels, { ...selectedPanel, materialId }];
    }

    props.onChangeConfig({ ...props.config, panels: updatedPanels });
  };

  const updateSelectedPanelLighting = (
    panelId: string,
    enabled: boolean,
    colorTemp?: '3000K' | '4000K' | '6000K',
    fixtureType?: 'spotlight' | 'strip' | 'none'
  ) => {
    if (!props.onChangeConfig) return;

    const isCommonShelves = !props.config.separateShelves && (
      panelId === 'panel-shelves' ||
      panelId.startsWith('panel-shelf-') ||
      panelId.startsWith('sub-shelf-')
    );

    let panelFound = false;
    let updatedPanels = props.config.panels.map((p) => {
      const isTarget = isCommonShelves
        ? (p.category === 'shelf' || p.id.includes('shelf'))
        : p.id === panelId;

      if (!isTarget) return p;
      panelFound = true;
      const currentLighting = p.lighting || {
        enabled: false,
        type: p.category === 'top' ? 'top-spotlight' : 'under-shelf-strip',
        fixtureType: p.category === 'top' ? 'spotlight' : 'strip',
        colorTemp: '3000K',
        intensity: 1.2,
      };
      return {
        ...p,
        lighting: {
          ...currentLighting,
          enabled,
          fixtureType: fixtureType || currentLighting.fixtureType || (p.category === 'top' ? 'spotlight' : 'strip'),
          colorTemp: colorTemp || currentLighting.colorTemp || '3000K',
        },
      };
    });

    if (!panelFound && !isCommonShelves && selectedPanel) {
      const currentLighting = selectedPanel.lighting || {
        enabled: false,
        type: selectedPanel.category === 'top' ? 'top-spotlight' : 'under-shelf-strip',
        fixtureType: selectedPanel.category === 'top' ? 'spotlight' : 'strip',
        colorTemp: '3000K',
        intensity: 1.2,
      };
      updatedPanels = [
        ...updatedPanels,
        {
          ...selectedPanel,
          lighting: {
            ...currentLighting,
            enabled,
            fixtureType: fixtureType || currentLighting.fixtureType || (selectedPanel.category === 'top' ? 'spotlight' : 'strip'),
            colorTemp: colorTemp || currentLighting.colorTemp || '3000K',
          },
        },
      ];
    }

    props.onChangeConfig({ ...props.config, panels: updatedPanels });
  };

  const updateSelectedPanelDimension = (
    panelId: string,
    key: 'widthFt' | 'heightFt' | 'depthFt' | 'thicknessMm',
    val: number
  ) => {
    if (!props.onChangeConfig) return;
    const targetVal = Math.max(0.01, val);

    // Sync global dimensions if editing outer boundaries (side/top/bottom)
    let updatedDimensions = { ...props.config.dimensions };
    const dimUnit = props.config.dimensions.unit;

    if (panelId === 'panel-left-side' || panelId === 'panel-right-side') {
      if (key === 'heightFt') updatedDimensions.height = formatDimValue(targetVal, dimUnit);
      if (key === 'depthFt') updatedDimensions.depth = formatDimValue(targetVal, dimUnit);
    } else if (panelId === 'panel-top' || panelId === 'panel-bottom') {
      if (key === 'widthFt') updatedDimensions.width = formatDimValue(targetVal, dimUnit);
      if (key === 'depthFt') updatedDimensions.depth = formatDimValue(targetVal, dimUnit);
    }

    const isCommonShelves = !props.config.separateShelves && (panelId === 'panel-shelves' || panelId.startsWith('panel-shelf-'));

    const updatedPanels = props.config.panels.map((p) => {
      const isTarget = p.id === panelId || (isCommonShelves && (p.category === 'shelf' || p.id.startsWith('panel-shelf-') || p.id === 'panel-shelves'));
      if (!isTarget) return p;

      const isHorizontal = p.category === 'shelf' || p.category === 'top' || p.category === 'bottom';
      let extraUpdates: Partial<FurniturePanel> = {};

      if (isHorizontal) {
        if (key === 'heightFt') extraUpdates = { depthFt: targetVal };
        if (key === 'depthFt') extraUpdates = { heightFt: targetVal };
      }

      return {
        ...p,
        [key]: targetVal,
        ...extraUpdates,
        isCustomDimension: true,
      };
    });

    props.onChangeConfig({
      ...props.config,
      dimensions: updatedDimensions,
      panels: updatedPanels,
    });
  };

  const handleZoomIn = () => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = controls.object;
    const target = controls.target;
    const dir = new THREE.Vector3().subVectors(camera.position, target);
    if (dir.length() > 1.2) {
      dir.multiplyScalar(0.88); // 12% gradual step
      camera.position.copy(target).add(dir);
      controls.update();
    }
  };

  const handleZoomOut = () => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = controls.object;
    const target = controls.target;
    const dir = new THREE.Vector3().subVectors(camera.position, target);
    if (dir.length() < 35) {
      dir.multiplyScalar(1.14); // 14% gradual step
      camera.position.copy(target).add(dir);
      controls.update();
    }
  };

  const handleReset = () => {
    if (props.onResetPreset) {
      props.onResetPreset();
    }
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const w = normalizeToFeet(props.config.dimensions.width, props.config.dimensions.unit);
    const h = normalizeToFeet(props.config.dimensions.height, props.config.dimensions.unit);
    const d = normalizeToFeet(props.config.dimensions.depth, props.config.dimensions.unit);
    const targetX = -w * 0.3;
    controls.target.set(targetX, h * 0.45, 0);
    controls.object.position.set(targetX + w * 1.8, h * 1.3, d * 3.2);
    controls.update();
  };

  return (
    <div className="w-full h-full relative bg-slate-950 rounded-xl overflow-hidden select-none">
      {/* Closed Inspector Card Trigger Button */}
      {!isInspectorOpen && (
        <button
          onClick={() => setIsInspectorOpen(true)}
          className="absolute top-16 left-3 z-20 bg-slate-900/90 text-white hover:bg-slate-800 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-2 text-xs font-semibold transition-all hover:scale-105"
        >
          <Settings2 className="w-4 h-4 text-blue-400" />
          <span>Furniture Config</span>
        </button>
      )}

      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [6, 6, 12], fov: 45 }}
        onPointerMissed={() => {
          props.onSelectPanel(null);
          setPopoverTab('config');
        }}
      >

        <SceneContent
          {...props}
          activeEditComp={activeEditComp}
          setActiveEditComp={setActiveEditComp}
          onControlsReady={(c) => (controlsRef.current = c)}
        />
      </Canvas>

      {/* Active Compartment Click-to-Edit Floating 2D Draggable Outer Popover */}
      {activeEditComp && (() => {
        const compIdx = activeEditComp.compIdx;
        const subIdx = activeEditComp.subIdx;
        const totalShelves = props.config.shelvesCount;
        const isTopComp = compIdx === totalShelves;
        const partitionCount = props.config.shelfPartitions?.[compIdx] || 0;
        const hasPartition = partitionCount > 0;
        const labelName = getCompartmentLabel(compIdx, totalShelves, subIdx, partitionCount);

        const totalH = normalizeToFeet(props.config.dimensions.height, props.config.dimensions.unit);
        const pThick = (props.config.panelThicknessMm || 18) / 304.8;
        const availH = totalH - pThick * 2;
        const defaultSpace = availH / (totalShelves + 1);

        const shelfIdx = compIdx;
        const curShelfPosFt = !isTopComp
          ? (props.config.customShelfPositions?.[shelfIdx] !== undefined
            ? props.config.customShelfPositions[shelfIdx]
            : defaultSpace * (shelfIdx + 1))
          : 0;
        const displayShelfH = !isTopComp ? formatDimValue(curShelfPosFt, props.config.dimensions.unit) : '';

        const totalW = normalizeToFeet(props.config.dimensions.width, props.config.dimensions.unit);
        const dividerPanel = props.config.panels.find((p) => p.category === 'divider') || props.config.panels[0];
        const divThick = (dividerPanel.thicknessMm || props.config.panelThicknessMm || 18) / 304.8;
        const innerW = totalW - pThick * 2;
        const defaultSubW = (innerW - divThick * partitionCount) / (partitionCount + 1);
        const currentWidthsFt = props.config.customPartitionWidths?.[compIdx] || Array.from({ length: partitionCount + 1 }).map(() => defaultSubW);
        const currentSubWVal = subIdx !== undefined ? (currentWidthsFt[subIdx] !== undefined ? currentWidthsFt[subIdx] : defaultSubW) : defaultSubW;
        const displaySubW = formatDimValue(currentSubWVal, props.config.dimensions.unit);

        return (
          <div
            style={{ left: `${compEditPos.x}px`, top: `${compEditPos.y}px` }}
            className="absolute z-50 bg-slate-950/95 backdrop-blur-xl border border-amber-500/70 rounded-xl shadow-2xl p-3.5 w-72 text-slate-100 space-y-3 animate-in fade-in zoom-in-95 duration-150 select-none"
          >
            {/* Draggable Header */}
            <div
              onPointerDown={handleCompPointerDown}
              onPointerMove={handleCompPointerMove}
              onPointerUp={handleCompPointerUp}
              className="flex items-center justify-between pb-2 border-b border-slate-800 cursor-grab active:cursor-grabbing bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80"
            >
              <div className="flex items-center gap-2">
                <GripHorizontal className="w-4 h-4 text-amber-400 hover:text-amber-300" />
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-extrabold text-amber-300 truncate max-w-[170px]">
                  {labelName}
                </span>
              </div>
              <button
                onClick={() => setActiveEditComp(null)}
                className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-2.5 text-[11px]">
              {!isTopComp && props.onChangeConfig && (
                <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300">
                    Shelf #{shelfIdx + 1} Height ({props.config.dimensions.unit}):
                  </span>
                  <input
                    type="number"
                    step="1"
                    value={displayShelfH}
                    onChange={(e) => {
                      const inputVal = parseFloat(e.target.value) || 0.1;
                      const newFt = parseDimInputToFeet(inputVal, props.config.dimensions.unit);
                      const currentPositions = [...(props.config.customShelfPositions || Array.from({ length: props.config.shelvesCount }).map((_, i) => defaultSpace * (i + 1)))];
                      currentPositions[shelfIdx] = newFt;

                      props.onChangeConfig!({
                        ...props.config,
                        customShelfPositions: currentPositions,
                      });
                    }}
                    className="w-20 bg-slate-950 border border-blue-500/60 rounded px-2 py-1 text-right font-mono text-xs text-blue-400 font-bold focus:border-blue-400 focus:outline-none"
                  />
                </div>
              )}

              {hasPartition && subIdx !== undefined && props.onChangeConfig && (
                <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300">
                    Sub-Width ({props.config.dimensions.unit}):
                  </span>
                  <input
                    type="number"
                    step="1"
                    value={displaySubW}
                    onChange={(e) => {
                      const inputVal = parseFloat(e.target.value) || 0.1;
                      const newFt = parseDimInputToFeet(inputVal, props.config.dimensions.unit);
                      const newWidths = [...currentWidthsFt];
                      newWidths[subIdx] = newFt;
                      const allCustomWidths = {
                        ...(props.config.customPartitionWidths || {}),
                        [compIdx]: newWidths,
                      };
                      props.onChangeConfig!({
                        ...props.config,
                        customPartitionWidths: allCustomWidths,
                      });
                    }}
                    className="w-20 bg-slate-950 border border-amber-500/60 rounded px-2 py-1 text-right font-mono text-xs text-amber-400 font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
              )}

              {/* Parent Compartment Vertical Dividers (|) */}
              {props.onChangeConfig && (
                <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300">
                    {subIdx !== undefined ? `Parent Comp #${compIdx + 1} Dividers (|):` : 'Vertical Dividers (|):'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const currentPartitions = { ...(props.config.shelfPartitions || {}) };
                        const curCount = currentPartitions[compIdx] || 0;
                        if (curCount <= 1) {
                          delete currentPartitions[compIdx];
                        } else {
                          currentPartitions[compIdx] = curCount - 1;
                        }
                        const currentWidths = { ...(props.config.customPartitionWidths || {}) };
                        delete currentWidths[compIdx];
                        props.onChangeConfig!({
                          ...props.config,
                          shelfPartitions: currentPartitions,
                          customPartitionWidths: currentWidths,
                        });
                      }}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-amber-400 text-xs">
                      {partitionCount}
                    </span>
                    <button
                      onClick={() => {
                        const currentPartitions = { ...(props.config.shelfPartitions || {}) };
                        const curCount = currentPartitions[compIdx] || 0;
                        currentPartitions[compIdx] = Math.min(5, curCount + 1);
                        const currentWidths = { ...(props.config.customPartitionWidths || {}) };
                        delete currentWidths[compIdx];
                        props.onChangeConfig!({
                          ...props.config,
                          shelfPartitions: currentPartitions,
                          customPartitionWidths: currentWidths,
                        });
                      }}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Nested Sub-Dividers (|) for Sub-Compartments */}
              {subIdx !== undefined && props.onChangeConfig && (() => {
                const subKey = `${compIdx}-${subIdx}`;
                const subPartCount = props.config.shelfSubPartitions?.[subKey] || 0;

                return (
                  <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="font-semibold text-slate-300">
                      Sub-Dividers (|) for Comp #{compIdx + 1}#{subIdx + 1}:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const currentSubParts = { ...(props.config.shelfSubPartitions || {}) };
                          const curCount = currentSubParts[subKey] || 0;
                          if (curCount <= 1) {
                            delete currentSubParts[subKey];
                          } else {
                            currentSubParts[subKey] = curCount - 1;
                          }
                          props.onChangeConfig!({
                            ...props.config,
                            shelfSubPartitions: currentSubParts,
                          });
                        }}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-emerald-400 text-xs">
                        {subPartCount}
                      </span>
                      <button
                        onClick={() => {
                          const currentSubParts = { ...(props.config.shelfSubPartitions || {}) };
                          const curCount = currentSubParts[subKey] || 0;
                          currentSubParts[subKey] = Math.min(5, curCount + 1);
                          props.onChangeConfig!({
                            ...props.config,
                            shelfSubPartitions: currentSubParts,
                          });
                        }}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Inner Sub-Shelves (—) */}
              {props.onChangeConfig && (
                <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300">
                    Inner Sub-Shelves (—):
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const currentSubShelves = { ...(props.config.shelfSubShelves || {}) };
                        const subKey = subIdx !== undefined ? `${compIdx}-${subIdx}` : `${compIdx}`;
                        const curCount = currentSubShelves[subKey] || 0;
                        if (curCount <= 1) {
                          delete currentSubShelves[subKey];
                        } else {
                          currentSubShelves[subKey] = curCount - 1;
                        }
                        props.onChangeConfig!({
                          ...props.config,
                          shelfSubShelves: currentSubShelves,
                        });
                      }}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-blue-400 text-xs">
                      {props.config.shelfSubShelves?.[subIdx !== undefined ? `${compIdx}-${subIdx}` : `${compIdx}`] || 0}
                    </span>
                    <button
                      onClick={() => {
                        const currentSubShelves = { ...(props.config.shelfSubShelves || {}) };
                        const subKey = subIdx !== undefined ? `${compIdx}-${subIdx}` : `${compIdx}`;
                        const curCount = currentSubShelves[subKey] || 0;
                        currentSubShelves[subKey] = Math.min(5, curCount + 1);
                        props.onChangeConfig!({
                          ...props.config,
                          shelfSubShelves: currentSubShelves,
                        });
                      }}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveEditComp(null)}
              className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow flex items-center justify-center gap-1 cursor-pointer"
            >
              ✓ Done
            </button>
          </div>
        );
      })()}

      {/* Interactive 3D Unit Global Model Config Popover */}
      {isInspectorOpen && (() => {
        const isUpperPopoverOpen = activeEditComp !== null || (selectedPanel !== null && !(selectedPanel as any).isCompartment);
        return (
          <div
            style={{ left: `${popoverPos.x}px`, top: `${popoverPos.y}px` }}
            className={`absolute z-20 w-[325px] max-h-[calc(100%-70px)] flex flex-col bg-slate-900/95 text-white backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl transition-all duration-300 ${isUpperPopoverOpen ? 'opacity-25 hover:opacity-100' : 'opacity-100'
              }`}
          >
            {/* Streamlined Draggable Header */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 cursor-grab active:cursor-grabbing select-none shrink-0"
            >
              <div className="flex items-center gap-2 max-w-[230px]">
                <GripHorizontal className="w-4 h-4 text-blue-400 shrink-0 hover:text-blue-300" />
                <span className="text-xs font-extrabold text-blue-300 truncate">
                  {props.config.title || 'Furniture Unit Config'}
                </span>
              </div>
              <div className="relative group">
                <button
                  onClick={() => setIsInspectorOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close Inspector Card"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute top-full mt-2 right-0 hidden group-hover:block z-50 bg-slate-950 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-2xl whitespace-nowrap pointer-events-none border border-slate-700/80">
                  Close Panel
                </div>
              </div>
            </div>

            {/* Integrated Sleek Underline / Bottom-Border Tab Header Bar */}
            <div className="flex items-center justify-center gap-2 bg-slate-950/90 border-b border-slate-800 text-[11px] font-semibold select-none shrink-0 px-2 pt-1">
              <button
                type="button"
                onClick={() => setPopoverTab('config')}
                className={`py-2 px-3 flex items-center justify-center gap-1.5 transition-all shrink-0 border-b-2 ${popoverTab === 'config'
                  ? 'border-blue-500 text-blue-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Carcass Config</span>
              </button>

              {(() => {
                const hasActiveLed = props.config.panels.some((p) => p.lighting?.enabled);
                const isTabActive = popoverTab === 'lighting';

                return (
                  <button
                    type="button"
                    onClick={() => setPopoverTab('lighting')}
                    className={`py-2 px-3 flex items-center justify-center gap-1.5 transition-all shrink-0 border-b-2 ${isTabActive
                      ? 'border-blue-500 text-blue-400 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                  >
                    <Lightbulb className={`w-3.5 h-3.5 transition-colors ${hasActiveLed ? 'text-amber-400 fill-amber-400/30 animate-pulse' : isTabActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>LED Lights</span>
                  </button>
                );
              })()}

              {selectedPanel && (selectedPanel as any).isCompartment && (
                <button
                  type="button"
                  onClick={() => setPopoverTab('zones')}
                  className={`py-2 px-2 flex items-center justify-center gap-1.5 transition-all shrink-0 border-b-2 ${popoverTab === 'zones'
                    ? 'border-purple-500 text-purple-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>Zones</span>
                </button>
              )}
            </div>


            {/* Scrollable Tab Content Body */}
            <div className={`flex-1 p-2.5 space-y-2.5 custom-scrollbar min-h-0 overflow-y-auto`}>

              {/* TAB 0: GLOBAL FURNITURE MODEL CONFIGURATION */}
              {popoverTab === 'config' && props.onChangeConfig && (
                <div className="space-y-3 text-xs ">
                  {/* Unified Carcass Structure & Dimensions Card */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-blue-400" /> Carcass & Structure
                      </span>

                      {/* Units Switcher */}
                      <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-semibold">
                        {(['ft', 'inch', 'mm'] as const).map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() =>
                              props.onChangeConfig!({
                                ...props.config,
                                dimensions: { ...props.config.dimensions, unit: u },
                              })
                            }
                            className={`px-1.5 py-0.5 rounded transition-all ${props.config.dimensions.unit === u
                              ? 'bg-blue-600 text-white font-bold shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                              }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 1st Row: Carcass Sub Type & Skirting Height */}
                    {(() => {
                      const isSkirtingVisible = props.config.carcassSubType === 'wall-cabinet' || props.config.carcassSubType === 'tall-unit';

                      return (
                        <div className={`grid gap-2 ${isSkirtingVisible ? 'grid-cols-5' : 'grid-cols-1'}`}>
                          {/* Sub Type Dropdown (takes 3/5 width when skirting is active) */}
                          <div className={`relative ${isSkirtingVisible ? 'col-span-3' : 'col-span-1'}`}>
                            <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                              Carcass Sub Type
                            </label>
                            {(() => {
                              const options: { id: string; label: string }[] = [
                                { id: 'base-cabinet', label: 'Base Cabinet' },
                                { id: 'wall-cabinet', label: 'Wall Cabinet' },
                                { id: 'tall-unit', label: 'Tall Unit' },
                                { id: 'corner-cabinet', label: 'Corner Cabinet' },
                              ];
                              const currentVal = props.config.carcassSubType || 'base-cabinet';
                              const currentLabel = options.find((o) => o.id === currentVal)?.label || 'Base Cabinet';

                              return (
                                <PortalDropdownPicker
                                  triggerLabel={currentLabel}
                                  options={options}
                                  selectedId={currentVal}
                                  onSelect={(id) =>
                                    props.onChangeConfig!({
                                      ...props.config,
                                      carcassSubType: id as any,
                                    })
                                  }
                                />
                              );
                            })()}
                          </div>

                          {/* Skirting Height Field (takes 2/5 width next to sub type) */}
                          {isSkirtingVisible && (
                            <div className="col-span-2">
                              <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                                Skirting ({props.config.dimensions.unit})
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={props.config.skirtingHeight ?? (props.config.dimensions.unit === 'mm' ? 100 : props.config.dimensions.unit === 'inch' ? 4 : 0.33)}
                                onChange={(e) =>
                                  props.onChangeConfig!({
                                    ...props.config,
                                    skirtingHeight: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 font-mono text-xs focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Overall Dimensions Grid */}
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-400 mb-1">
                        Dimensions ({props.config.dimensions.unit})
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] text-slate-400 mb-0.5">Width</label>
                          <input
                            type="number"
                            step="0.1"
                            value={props.config.dimensions.width}
                            onChange={(e) =>
                              props.onChangeConfig!({
                                ...props.config,
                                dimensions: { ...props.config.dimensions, width: Math.max(0.1, parseFloat(e.target.value) || 0) },
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 font-mono text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] text-slate-400 mb-0.5">Height</label>
                          <input
                            type="number"
                            step="0.1"
                            value={props.config.dimensions.height}
                            onChange={(e) =>
                              props.onChangeConfig!({
                                ...props.config,
                                dimensions: { ...props.config.dimensions, height: Math.max(0.1, parseFloat(e.target.value) || 0) },
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 font-mono text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] text-slate-400 mb-0.5">Depth</label>
                          <input
                            type="number"
                            step="0.1"
                            value={props.config.dimensions.depth}
                            onChange={(e) =>
                              props.onChangeConfig!({
                                ...props.config,
                                dimensions: { ...props.config.dimensions, depth: Math.max(0.1, parseFloat(e.target.value) || 0) },
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 font-mono text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Body Thickness, Shelves Count & Shelf Config Mode */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/60">
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                          Body Thickness (mm)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={props.config.panelThicknessMm}
                          onChange={(e) =>
                            props.onChangeConfig!({
                              ...props.config,
                              panelThicknessMm: parseInt(e.target.value) || 18,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-bold text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      {props.config.type === 'wardrobe' ? (
                        <div>
                          <label className="block text-[9px] font-semibold text-blue-400 mb-0.5">
                            Bays / Sections
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={props.config.sectionsCount || 2}
                            onChange={(e) => {
                              const secCount = Math.max(1, parseInt(e.target.value) || 1);
                              const wFt = normalizeToFeet(props.config.dimensions.width, props.config.dimensions.unit);
                              const hFt = normalizeToFeet(props.config.dimensions.height, props.config.dimensions.unit);
                              props.onChangeConfig!({
                                ...props.config,
                                sectionsCount: secCount,
                                wardrobeSections: createDefaultWardrobeSections(secCount, hFt, wFt),
                              });
                            }}
                            className="w-full bg-blue-950 border border-blue-600 rounded-lg px-2.5 py-1.5 text-white font-bold text-xs focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                            Shelves Count
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={props.config.shelvesCount}
                            onChange={(e) =>
                              props.onChangeConfig!({
                                ...props.config,
                                shelvesCount: Math.max(0, parseInt(e.target.value) || 0),
                                customShelfPositions: undefined,
                                shelfPartitions: undefined,
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-bold text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Shelf Config Mode Toggle */}
                    {props.config.type !== 'wardrobe' && props.config.shelvesCount > 0 && (
                      <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                        <label className="block text-[9px] font-semibold text-slate-400">
                          Shelf Config Mode:
                        </label>
                        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                          <button
                            type="button"
                            onClick={() => {
                              props.onChangeConfig!({ ...props.config, separateShelves: false });
                              props.onSelectPanel('panel-shelves');
                            }}
                            className={`py-1 px-2 rounded-lg font-semibold transition-all ${!props.config.separateShelves
                              ? 'bg-blue-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                              }`}
                          >
                            Common (All Shelves)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              props.onChangeConfig!({ ...props.config, separateShelves: true });
                              props.onSelectPanel('panel-shelf-1');
                            }}
                            className={`py-1 px-2 rounded-lg font-semibold transition-all ${props.config.separateShelves
                              ? 'bg-blue-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                              }`}
                          >
                            Separate (Each Shelf)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Back Panel Settings */}
                  <div className="space-y-0 py-1 border-b border-t border-slate-700/60 flex justify-between items-center">
                    <div className="flex gap-1 flex-col">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                        Back Panel
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={props.config.hasBackPanel}
                          onChange={(e) => props.onChangeConfig!({ ...props.config, hasBackPanel: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-700/80 border border-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:border-blue-500 shadow-inner"></div>
                      </label>
                    </div>

                    {props.config.hasBackPanel && props.materialsMaster && (
                      <div className="pt-1 relative">
                        <label className="block text-[9px] font-semibold text-slate-400 mb-1">
                          Back Panel Material:
                        </label>
                        {(() => {
                          const activeMat = props.materialsMaster.find((m) => m.id === props.config.backPanelMaterialId) || props.materialsMaster[0];

                          return (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setIsBackPanelMaterialOpen(!isBackPanelMaterialOpen)}
                                className="w-full text-xs font-semibold bg-slate-950 hover:bg-slate-900 border border-slate-700/90 rounded-lg px-2.5 py-1.5 text-slate-200 flex items-center justify-between transition-all focus:outline-none focus:border-blue-500 shadow-sm"
                              >
                                <span className="truncate">{activeMat ? `${activeMat.name} (₹${activeMat.ratePerSqFt}/sq.ft)` : 'Select Material'}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isBackPanelMaterialOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {isBackPanelMaterialOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsBackPanelMaterialOpen(false)}
                                  />
                                  <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-slate-950 border border-slate-700/90 rounded-xl shadow-2xl py-1 backdrop-blur-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                                    {props.materialsMaster.map((m) => (
                                      <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                          props.onChangeConfig!({ ...props.config, backPanelMaterialId: m.id });
                                          setIsBackPanelMaterialOpen(false);
                                        }}
                                        className={`w-full px-3 py-1.5 text-left text-xs font-medium flex items-center justify-between transition-colors ${props.config.backPanelMaterialId === m.id
                                          ? 'bg-blue-600/20 text-blue-400 font-semibold'
                                          : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                                          }`}
                                      >
                                        <span>{m.name} (₹{m.ratePerSqFt}/sq.ft)</span>
                                        {props.config.backPanelMaterialId === m.id && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: INTEGRATED LED LIGHTING MANAGER */}
              {popoverTab === 'lighting' && props.onChangeConfig && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-blue-400" /> Integrated LED Lights
                    </span>
                    <span className="text-[10px] text-blue-300 font-semibold bg-blue-900/60 border border-blue-700/60 px-1.5 py-0.5 rounded">
                      {props.config.panels.filter((p) => p.lighting?.enabled).length} Active
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { targetId: 'panel-top', label: 'Top Panel Light', category: 'top' },
                      { targetId: 'panel-bottom', label: 'Bottom Base Light', category: 'bottom' },
                      { targetId: 'panel-left-side', label: 'Left Side Profile', category: 'side' },
                      { targetId: 'panel-right-side', label: 'Right Side Profile', category: 'side' },
                      { targetId: 'panel-shelves', label: 'Shelves Lights', category: 'shelf' },
                    ].map((loc) => {
                      const targetPanel = props.config.panels.find(
                        (p) => p.id === loc.targetId || (loc.category === 'shelf' && (p.category === 'shelf' || p.id.startsWith('panel-shelf')))
                      );
                      const isEnabled = targetPanel?.lighting?.enabled || false;
                      const fixtureType = targetPanel?.lighting?.fixtureType || (loc.category === 'top' ? 'spotlight' : 'strip');
                      const getLightingType = (cat: string): PanelLighting['type'] => (cat === 'side' ? 'side-profile' : cat === 'top' ? 'top-spotlight' : 'under-shelf-strip');

                      return (
                        <div
                          key={loc.targetId}
                          className={`p-2 rounded-lg border transition-all ${isEnabled ? 'bg-blue-900/40 border-blue-500/60' : 'bg-slate-950/60 border-slate-800'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-200">
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const updatedPanels = props.config.panels.map((p) => {
                                    const matches = p.id === loc.targetId || (loc.category === 'shelf' && p.category === 'shelf');
                                    if (!matches) return p;

                                    return {
                                      ...p,
                                      lighting: {
                                        enabled: checked,
                                        type: getLightingType(p.category),
                                        fixtureType: fixtureType,
                                        colorTemp: p.lighting?.colorTemp || '3000K',
                                        intensity: 1.2,
                                      },
                                    };
                                  });

                                  props.onChangeConfig!({ ...props.config, panels: updatedPanels });
                                }}
                                className="rounded border-blue-500 bg-slate-900 text-blue-500 focus:ring-0 cursor-pointer"
                              />
                              <span>{loc.label}</span>
                            </label>

                            {/* Color Temp & Fixture Dropdowns */}
                            <div className="flex items-center gap-1 relative">
                              {/* Color Temp Dropdown */}
                              <div className="relative">
                                {(() => {
                                  const temps: { id: '3000K' | '4000K' | '6000K'; label: string }[] = [
                                    { id: '3000K', label: '3000K Warm' },
                                    { id: '4000K', label: '4000K Day' },
                                    { id: '6000K', label: '6000K Cool' },
                                  ];
                                  const curTemp = targetPanel?.lighting?.colorTemp || '3000K';
                                  const dropdownKey = `colorTemp-${loc.targetId}`;
                                  const isOpen = activeDropdownId === dropdownKey;

                                  return (
                                    <>
                                      <button
                                        type="button"
                                        disabled={!isEnabled}
                                        onClick={() => setActiveDropdownId(isOpen ? null : dropdownKey)}
                                        className="text-[10px] font-semibold bg-slate-900 border border-blue-600/60 rounded px-1.5 py-0.5 text-blue-200 disabled:opacity-30 flex items-center gap-1 transition-all"
                                      >
                                        <span>{curTemp}</span>
                                        <ChevronDown className={`w-2.5 h-2.5 text-blue-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                      </button>

                                      {isOpen && (
                                        <>
                                          <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                                          <div className="absolute top-full mt-1 right-0 z-50 w-28 bg-slate-950 border border-blue-600/60 rounded-lg shadow-2xl py-1 backdrop-blur-xl animate-in fade-in duration-100">
                                            {temps.map((t) => (
                                              <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => {
                                                  const updatedPanels = props.config.panels.map((p) => {
                                                    const matches = p.id === loc.targetId || (loc.category === 'shelf' && p.category === 'shelf');
                                                    if (!matches) return p;
                                                    return {
                                                      ...p,
                                                      lighting: {
                                                        ...p.lighting,
                                                        enabled: true,
                                                        type: getLightingType(p.category),
                                                        fixtureType,
                                                        colorTemp: t.id,
                                                        intensity: 1.2,
                                                      },
                                                    };
                                                  });
                                                  props.onChangeConfig!({ ...props.config, panels: updatedPanels });
                                                  setActiveDropdownId(null);
                                                }}
                                                className={`w-full px-2 py-1 text-left text-[10px] font-medium flex items-center justify-between transition-colors ${curTemp === t.id ? 'bg-blue-600/20 text-blue-300 font-bold' : 'text-slate-300 hover:bg-slate-900 hover:text-white'}`}
                                              >
                                                <span>{t.label}</span>
                                              </button>
                                            ))}
                                          </div>
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>

                              {/* Fixture Type Dropdown */}
                              <div className="relative">
                                {(() => {
                                  const fixtures: { id: 'strip' | 'spotlight'; label: string }[] = [
                                    { id: 'strip', label: 'Strip' },
                                    { id: 'spotlight', label: 'Spot' },
                                  ];
                                  const dropdownKey = `fixture-${loc.targetId}`;
                                  const isOpen = activeDropdownId === dropdownKey;
                                  const curLabel = fixtureType === 'spotlight' ? 'Spot' : 'Strip';

                                  return (
                                    <>
                                      <button
                                        type="button"
                                        disabled={!isEnabled}
                                        onClick={() => setActiveDropdownId(isOpen ? null : dropdownKey)}
                                        className="text-[10px] font-semibold bg-slate-900 border border-blue-600/60 rounded px-1.5 py-0.5 text-blue-200 disabled:opacity-30 flex items-center gap-1 transition-all"
                                      >
                                        <span>{curLabel}</span>
                                        <ChevronDown className={`w-2.5 h-2.5 text-blue-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                      </button>

                                      {isOpen && (
                                        <>
                                          <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                                          <div className="absolute top-full mt-1 right-0 z-50 w-24 bg-slate-950 border border-blue-600/60 rounded-lg shadow-2xl py-1 backdrop-blur-xl animate-in fade-in duration-100">
                                            {fixtures.map((f) => (
                                              <button
                                                key={f.id}
                                                type="button"
                                                onClick={() => {
                                                  const updatedPanels = props.config.panels.map((p) => {
                                                    const matches = p.id === loc.targetId || (loc.category === 'shelf' && p.category === 'shelf');
                                                    if (!matches) return p;
                                                    return {
                                                      ...p,
                                                      lighting: {
                                                        ...p.lighting,
                                                        enabled: true,
                                                        type: getLightingType(p.category),
                                                        fixtureType: f.id,
                                                        colorTemp: p.lighting?.colorTemp || '3000K',
                                                        intensity: 1.2,
                                                      },
                                                    };
                                                  });
                                                  props.onChangeConfig!({ ...props.config, panels: updatedPanels });
                                                  setActiveDropdownId(null);
                                                }}
                                                className={`w-full px-2 py-1 text-left text-[10px] font-medium flex items-center justify-between transition-colors ${fixtureType === f.id ? 'bg-blue-600/20 text-blue-300 font-bold' : 'text-slate-300 hover:bg-slate-900 hover:text-white'}`}
                                              >
                                                <span>{f.label}</span>
                                              </button>
                                            ))}
                                          </div>
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: WARDROBE SECTION ZONES MANAGER */}
              {popoverTab === 'zones' && selectedPanel && (selectedPanel as any).isCompartment && props.onChangeConfig && (
                <div className="bg-blue-950/60 p-3 rounded-xl border border-blue-500/40 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-blue-800/80 pb-1.5">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      <Box className="w-3.5 h-3.5 text-blue-400" /> Wardrobe Section & Zones
                    </span>
                    <span className="text-[10px] bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded font-semibold">
                      Sec #{(selectedPanel as any).secIdx + 1} Zone #{(selectedPanel as any).compIdx + 1}
                    </span>
                  </div>

                  {/* Add New Section & Add Zone Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const secCount = (props.config.sectionsCount || 2) + 1;
                        const wFt = normalizeToFeet(props.config.dimensions.width, props.config.dimensions.unit);
                        const hFt = normalizeToFeet(props.config.dimensions.height, props.config.dimensions.unit);
                        props.onChangeConfig!({
                          ...props.config,
                          sectionsCount: secCount,
                          wardrobeSections: createDefaultWardrobeSections(secCount, hFt, wFt),
                        });
                      }}
                      className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-1 transition-colors text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add New Section (Bay)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const secIdx = (selectedPanel as any).secIdx;
                        const updatedSections = (props.config.wardrobeSections || []).map((sec, sIdx) => {
                          if (sIdx !== secIdx) return sec;
                          const compCount = sec.compartments.length;
                          const newComp = {
                            id: `comp-${secIdx + 1}-${compCount + 1}`,
                            name: `Compartment #${compCount + 1}`,
                            moduleType: 'shelves-grid' as const,
                            heightFt: 1.5,
                            shelvesCount: 1,
                          };
                          return { ...sec, compartments: [...sec.compartments, newComp] };
                        });
                        props.onChangeConfig!({ ...props.config, wardrobeSections: updatedSections });
                      }}
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg flex items-center justify-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Zone
                    </button>
                  </div>

                  {/* All Zones Accordion List for Active Section */}
                  <div className="space-y-1.5 pt-1">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Section #{(selectedPanel as any).secIdx + 1} Compartment Accordions
                    </span>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {(props.config.wardrobeSections?.[(selectedPanel as any).secIdx]?.compartments || []).map((comp, cIdx) => {
                        const isSelectedZone = cIdx === (selectedPanel as any).compIdx;

                        return (
                          <div
                            key={comp.id || cIdx}
                            className={`p-2 rounded-lg border transition-all ${isSelectedZone
                              ? 'bg-blue-900/80 border-blue-400 text-white shadow-xs'
                              : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                onClick={() => props.onSelectPanel(`comp-${(selectedPanel as any).secIdx + 1}-${cIdx + 1}`)}
                                className="font-bold text-[11px] cursor-pointer hover:underline flex items-center gap-1.5"
                              >
                                <span>Zone #{cIdx + 1}: {comp.name}</span>
                              </span>

                              <span className="text-[10px] font-semibold text-blue-300">
                                {comp.heightFt.toFixed(2)} ft
                              </span>
                            </div>

                            {isSelectedZone && (
                              <div className="space-y-2 pt-2 border-t border-blue-800/60 mt-1.5">
                                {/* Module Preset Selector */}
                                <div className="relative">
                                  <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                                    Module Preset
                                  </label>
                                  {(() => {
                                    const modules: { id: string; label: string }[] = [
                                      { id: 'hanging-single', label: 'Hanging Zone (Single Rod)' },
                                      { id: 'hanging-double', label: 'Double Hanging (Two Rods)' },
                                      { id: 'shelves-grid', label: 'Folded Clothes Shelves' },
                                      { id: 'drawer-pack', label: 'Internal Drawer Pack' },
                                      { id: 'locker-box', label: 'Lockable Vault / Safe Box' },
                                    ];
                                    const curModule = modules.find((m) => m.id === comp.moduleType) || modules[0];
                                    const dropdownKey = `wardrobe-module-${comp.id || cIdx}`;
                                    const isOpen = activeDropdownId === dropdownKey;

                                    return (
                                      <div className="relative">
                                        <button
                                          type="button"
                                          onClick={() => setActiveDropdownId(isOpen ? null : dropdownKey)}
                                          className="w-full text-[11px] font-semibold bg-slate-950 hover:bg-slate-900 border border-blue-700/80 rounded px-2.5 py-1 text-white flex items-center justify-between transition-all focus:outline-none focus:border-blue-400 shadow-sm"
                                        >
                                          <span className="truncate">{curModule.label}</span>
                                          <ChevronDown className={`w-3.5 h-3.5 text-blue-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isOpen && (
                                          <>
                                            <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                                            <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-slate-950 border border-blue-700/80 rounded-xl shadow-2xl py-1 backdrop-blur-xl animate-in fade-in duration-100">
                                              {modules.map((m) => (
                                                <button
                                                  key={m.id}
                                                  type="button"
                                                  onClick={() => {
                                                    const newType = m.id as any;
                                                    const defaultHeights: Record<string, number> = {
                                                      'hanging-single': 4.0,
                                                      'hanging-double': 4.5,
                                                      'shelves-grid': 1.8,
                                                      'drawer-pack': 1.6,
                                                      'locker-box': 1.2,
                                                    };
                                                    const targetH = defaultHeights[newType] || comp.heightFt;

                                                    const updatedSections = (props.config.wardrobeSections || []).map((sec, sIdx) => {
                                                      if (sIdx !== (selectedPanel as any).secIdx) return sec;
                                                      const updatedComps = sec.compartments.map((c, idx) => {
                                                        if (idx !== cIdx) return c;
                                                        return { ...c, moduleType: newType, heightFt: targetH };
                                                      });
                                                      return { ...sec, compartments: updatedComps };
                                                    });

                                                    props.onChangeConfig!({ ...props.config, wardrobeSections: updatedSections });
                                                    setActiveDropdownId(null);
                                                  }}
                                                  className={`w-full px-3 py-1.5 text-left text-[11px] font-medium flex items-center justify-between transition-colors ${comp.moduleType === m.id
                                                    ? 'bg-blue-600/20 text-blue-300 font-bold'
                                                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                                                    }`}
                                                >
                                                  <span>{m.label}</span>
                                                  {comp.moduleType === m.id && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                  )}
                                                </button>
                                              ))}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Height Customizer */}
                                <div>
                                  <div className="flex items-center justify-between mb-0.5">
                                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                                      Zone Height
                                    </label>
                                    <span className="text-[10px] font-bold text-blue-300">
                                      {comp.heightFt.toFixed(2)} ft ({(comp.heightFt * 12).toFixed(1)} in)
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="range"
                                      min="0.8"
                                      max="5.5"
                                      step="0.1"
                                      value={comp.heightFt}
                                      onChange={(e) => {
                                        const newH = parseFloat(e.target.value);
                                        const updatedSections = (props.config.wardrobeSections || []).map((sec, sIdx) => {
                                          if (sIdx !== (selectedPanel as any).secIdx) return sec;
                                          const updatedComps = sec.compartments.map((c, idx) => {
                                            if (idx !== cIdx) return c;
                                            return { ...c, heightFt: newH };
                                          });
                                          return { ...sec, compartments: updatedComps };
                                        });

                                        props.onChangeConfig!({ ...props.config, wardrobeSections: updatedSections });
                                      }}
                                      className="flex-1 accent-blue-500 cursor-pointer"
                                    />

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newH = Math.max(0.8, comp.heightFt - 0.25);
                                        const updatedSections = (props.config.wardrobeSections || []).map((sec, sIdx) => {
                                          if (sIdx !== (selectedPanel as any).secIdx) return sec;
                                          const updatedComps = sec.compartments.map((c, idx) => {
                                            if (idx !== cIdx) return c;
                                            return { ...c, heightFt: newH };
                                          });
                                          return { ...sec, compartments: updatedComps };
                                        });

                                        props.onChangeConfig!({ ...props.config, wardrobeSections: updatedSections });
                                      }}
                                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs"
                                    >
                                      -
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newH = Math.min(5.5, comp.heightFt + 0.25);
                                        const updatedSections = (props.config.wardrobeSections || []).map((sec, sIdx) => {
                                          if (sIdx !== (selectedPanel as any).secIdx) return sec;
                                          const updatedComps = sec.compartments.map((c, idx) => {
                                            if (idx !== cIdx) return c;
                                            return { ...c, heightFt: newH };
                                          });
                                          return { ...sec, compartments: updatedComps };
                                        });

                                        props.onChangeConfig!({ ...props.config, wardrobeSections: updatedSections });
                                      }}
                                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Dedicated Floating Physical Board Specs Popover Card */}
      {selectedPanel && !(selectedPanel as any).isCompartment && (
        <div
          style={{ left: `${panelEditPos.x}px`, top: `${panelEditPos.y}px` }}
          className="absolute z-50 bg-slate-950/95 backdrop-blur-xl border border-blue-500/70 rounded-xl shadow-2xl p-3.5 w-80 text-slate-100 space-y-3 animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          {/* Draggable Header */}
          <div
            onPointerDown={handlePanelDragDown}
            onPointerMove={handlePanelDragMove}
            onPointerUp={handlePanelDragUp}
            className="flex items-center justify-between pb-2 border-b border-slate-800 cursor-grab active:cursor-grabbing bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80"
          >
            <div className="flex items-center gap-2 max-w-[220px]">
              <GripHorizontal className="w-4 h-4 text-blue-400 shrink-0 hover:text-blue-300" />
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs font-extrabold text-blue-300 truncate">
                  {selectedPanel.name}
                </span>
                <span className="text-[9px] font-bold bg-blue-900/80 text-blue-200 border border-blue-700/80 px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0">
                  Board
                </span>
              </div>
            </div>
            <button
              onClick={() => props.onSelectPanel(null)}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Sub-Tab Navigation Bar */}
          <div className="flex items-center justify-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setPanelSpecsTab('materials')}
              className={`flex-1 py-1 px-1 flex items-center justify-center gap-1 rounded transition-all ${panelSpecsTab === 'materials'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Palette className="w-3 h-3" />
              <span>Surface</span>
            </button>

            <button
              type="button"
              onClick={() => setPanelSpecsTab('edges')}
              className={`flex-1 py-1 px-1 flex items-center justify-center gap-1 rounded transition-all ${panelSpecsTab === 'edges'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Scissors className="w-3 h-3" />
              <span>Edge Band</span>
            </button>

            <button
              type="button"
              onClick={() => setPanelSpecsTab('specs')}
              className={`flex-1 py-1 px-1 flex items-center justify-center gap-1 rounded transition-all ${panelSpecsTab === 'specs'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Ruler className="w-3 h-3" />
              <span>Specs</span>
            </button>
          </div>

          {/* Dedicated Tab Contents */}
          <div className="space-y-3 text-xs max-h-72 overflow-y-auto pr-0.5 custom-scrollbar">
            {/* SURFACE FINISHES & CORE MATERIAL */}
            {panelSpecsTab === 'materials' && (
              <div className="space-y-3">
                {/* Core Substrate Material */}
                {props.materialsMaster && (
                  <div className="space-y-1.5 relative">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Core Substrate Material
                    </label>
                    {(() => {
                      const materialsMaster = props.materialsMaster;
                      const curMat = materialsMaster.find((m) => m.id === selectedPanel.materialId) || materialsMaster[0];

                      return (
                        <PortalDropdownPicker
                          triggerLabel={curMat ? `${curMat.name} (₹${curMat.ratePerSqFt}/sq.ft)` : 'Select Material'}
                          options={materialsMaster.map((m) => ({ id: m.id, label: `${m.name} (₹${m.ratePerSqFt}/sq.ft)` }))}
                          selectedId={selectedPanel.materialId || ''}
                          onSelect={(id) => updateSelectedPanelMaterial(selectedPanel.id, id)}
                        />
                      );
                    })()}
                  </div>
                )}

                {/* Surface Finishes */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Surface Finishes (Laminates / Veneer)
                  </label>
                  <div className="space-y-1.5">
                    {selectedPanel.surfaces.map((surf) => {
                      const curFinish = props.finishesMaster.find((f) => f.id === (surf.finishId || 'fin-none')) || props.finishesMaster[0];

                      return (
                        <div key={surf.type} className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800 relative">
                          <input
                            type="checkbox"
                            checked={surf.enabled}
                            onChange={(e) => updateSelectedPanelSurface(selectedPanel.id, surf.type, e.target.checked)}
                            className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-0 cursor-pointer"
                          />
                          <span className="w-20 text-[11px] font-medium text-slate-300 truncate">
                            {surf.label}
                          </span>

                          <div className="relative flex-1">
                            <PortalDropdownPicker
                              triggerLabel={curFinish ? curFinish.name : 'Select Finish'}
                              disabled={!surf.enabled}
                              options={props.finishesMaster.map((f) => ({ id: f.id, label: f.name }))}
                              selectedId={surf.finishId || 'fin-none'}
                              onSelect={(id) => updateSelectedPanelSurface(selectedPanel.id, surf.type, surf.enabled, id)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* EDGE BANDING (PVC Tapes) */}
            {panelSpecsTab === 'edges' && props.edgesMaster && (
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Edge Banding (PVC / ABS Tapes)
                </label>
                <div className="space-y-1.5">
                  {(() => {
                    const edgesMaster = props.edgesMaster;
                    return selectedPanel.edges.map((edge) => {
                      const curEdge = edgesMaster.find((e) => e.id === (edge.finishId || 'edge-none')) || edgesMaster[0];

                      return (
                        <div key={edge.type} className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800 relative">
                          <input
                            type="checkbox"
                            checked={edge.enabled}
                            onChange={(e) => updateSelectedPanelEdge(selectedPanel.id, edge.type, e.target.checked)}
                            className="rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-0 cursor-pointer"
                          />
                          <span className="w-20 text-[11px] font-medium text-slate-300 truncate">
                            {edge.label}
                          </span>

                          <div className="relative flex-1">
                            <PortalDropdownPicker
                              triggerLabel={curEdge ? curEdge.name : 'Select Edge Tape'}
                              disabled={!edge.enabled}
                              options={edgesMaster.map((e) => ({ id: e.id, label: e.name }))}
                              selectedId={edge.finishId || 'edge-none'}
                              onSelect={(id) => updateSelectedPanelEdge(selectedPanel.id, edge.type, edge.enabled, id)}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* SPECS, THICKNESS & INTEGRATED LED */}
            {panelSpecsTab === 'specs' && (
              <div className="space-y-3">
                {/* Board Thickness */}
                <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300">
                    Board Thickness (mm):
                  </span>
                  <input
                    type="number"
                    step="1"
                    value={selectedPanel.thicknessMm || props.config.panelThicknessMm || 18}
                    onChange={(e) =>
                      updateSelectedPanelDimension(
                        selectedPanel.id,
                        'thicknessMm',
                        parseFloat(e.target.value) || 18
                      )
                    }
                    className="w-20 bg-slate-950 border border-blue-500/60 rounded px-2 py-1 text-right font-mono text-xs text-blue-400 font-bold focus:border-blue-400 focus:outline-none"
                  />
                </div>

                {/* Integrated LED Lighting Toggle */}
                {props.onChangeConfig && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-400" /> Integrated LED Light
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPanel.lighting?.enabled || false}
                          onChange={(e) => updateSelectedPanelLighting(selectedPanel.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-700/80 border border-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:border-amber-400 shadow-inner"></div>
                      </label>
                    </div>

                    {selectedPanel.lighting?.enabled && (
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Fixture Type Dropdown */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Fixture Type
                            </label>
                            <PortalDropdownPicker
                              triggerLabel={selectedPanel.lighting?.fixtureType === 'spotlight' ? 'Spotlight (Puck)' : 'LED Strip'}
                              options={[
                                { id: 'strip', label: 'LED Strip (Channel)' },
                                { id: 'spotlight', label: 'Spotlight (Puck)' },
                              ]}
                              selectedId={selectedPanel.lighting?.fixtureType || 'strip'}
                              onSelect={(id) => updateSelectedPanelLighting(selectedPanel.id, true, selectedPanel.lighting?.colorTemp, id as any)}
                            />
                          </div>

                          {/* Color Temperature Dropdown */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Color Temp
                            </label>
                            <PortalDropdownPicker
                              triggerLabel={
                                selectedPanel.lighting?.colorTemp === '6000K'
                                  ? '6000K Cool'
                                  : selectedPanel.lighting?.colorTemp === '4000K'
                                    ? '4000K Day'
                                    : '3000K Warm'
                              }
                              options={[
                                { id: '3000K', label: '3000K Warm' },
                                { id: '4000K', label: '4000K Day' },
                                { id: '6000K', label: '6000K Cool' },
                              ]}
                              selectedId={selectedPanel.lighting?.colorTemp || '3000K'}
                              onSelect={(id) => updateSelectedPanelLighting(selectedPanel.id, true, id as any, selectedPanel.lighting?.fixtureType)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => props.onSelectPanel(null)}
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors shadow flex items-center justify-center gap-1 cursor-pointer"
          >
            ✓ Done Editing Board
          </button>
        </div>
      )}


      {/* Horizontal Icon-Only Control Bar (+ | Goal Reset | -) */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center bg-slate-900/90 text-slate-300 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-2xl gap-1 select-none">
        <div className="relative group">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 hover:text-white hover:bg-slate-800 rounded-lg transition-all flex items-center justify-center cursor-pointer"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 bg-slate-950 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-2xl whitespace-nowrap pointer-events-none border border-slate-700/80">
            Zoom In (+)
          </div>
        </div>

        <div className="w-px h-3.5 bg-slate-800" />

        <div className="relative group">
          <button
            type="button"
            onClick={handleReset}
            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition-all flex items-center justify-center cursor-pointer"
            aria-label="Reset View"
          >
            <Target className="w-4 h-4" />
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 bg-slate-950 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-2xl whitespace-nowrap pointer-events-none border border-slate-700/80">
            Reset View (Re-center)
          </div>
        </div>

        <div className="w-px h-3.5 bg-slate-800" />

        <div className="relative group">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 hover:text-white hover:bg-slate-800 rounded-lg transition-all flex items-center justify-center cursor-pointer"
            aria-label="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 bg-slate-950 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-2xl whitespace-nowrap pointer-events-none border border-slate-700/80">
            Zoom Out (-)
          </div>
        </div>
      </div>

    </div>
  );
}







