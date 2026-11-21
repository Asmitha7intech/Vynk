import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, UserPlus, ExternalLink, Check, Sparkles, MessageSquare, RotateCcw, Compass, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User } from '@vynk/types';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface SphericalPosition {
  theta: number;  // Azimuth angle in degrees
  phi: number;    // Polar angle in degrees
  radius: number; // Distance from center
}

export interface WorldPosition extends Position3D {
  scale: number;
  zIndex: number;
  isVisible: boolean;
  fadeOpacity: number;
  originalIndex: number;
}

export interface SphereStudentItem {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  headline?: string | null;
  college?: string | null;
  department?: string | null;
  skills?: string[];
  xp?: number;
  level?: number;
  streakDays?: number;
  isConnected?: boolean;
  isPending?: boolean;
  matchScore?: number;
  matchReason?: string | null;
  raw?: User;
}

export interface SphereImageGridProps {
  students?: SphereStudentItem[];
  containerSize?: number;
  sphereRadius?: number;
  dragSensitivity?: number;
  momentumDecay?: number;
  maxRotationSpeed?: number;
  baseImageScale?: number;
  hoverScale?: number;
  perspective?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
  onConnect?: (studentId: string) => Promise<void> | void;
  onSelectStudent?: (student: SphereStudentItem) => void;
  onSwitchToGrid?: () => void;
}

interface RotationState {
  x: number;
  y: number;
  z: number;
}

interface VelocityState {
  x: number;
  y: number;
}

interface MousePosition {
  x: number;
  y: number;
}

// ==========================================
// 3D SPHERE MATH & DETERMINISTIC POSITIONING
// ==========================================

const SPHERE_MATH = {
  degreesToRadians: (degrees: number): number => degrees * (Math.PI / 180),
  radiansToDegrees: (radians: number): number => radians * (180 / Math.PI),

  sphericalToCartesian: (radius: number, theta: number, phi: number): Position3D => ({
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  }),

  normalizeAngle: (angle: number): number => {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  },

  // Deterministic hash to give each student a stable pseudo-random offset
  hashId: (id: string): number => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) / 2147483647;
  },
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export const SphereImageGrid: React.FC<SphereImageGridProps> = ({
  students = [],
  containerSize: initialContainerSize,
  sphereRadius: initialSphereRadius,
  dragSensitivity = 0.65,
  momentumDecay = 0.94,
  maxRotationSpeed = 4,
  baseImageScale = 0.16,
  hoverScale = 1.25,
  perspective = 1000,
  autoRotate = true,
  autoRotateSpeed = 0.25,
  className = '',
  onConnect,
  onSelectStudent,
  onSwitchToGrid,
}) => {
  const navigate = useNavigate();

  // Responsive container sizing
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<number>(initialContainerSize || 540);

  useEffect(() => {
    if (initialContainerSize) {
      setContainerSize(initialContainerSize);
      return;
    }

    const updateSize = () => {
      if (wrapperRef.current) {
        const availableWidth = wrapperRef.current.clientWidth;
        // Clamp between 320px and 620px
        const optimalSize = Math.max(320, Math.min(620, availableWidth));
        setContainerSize(optimalSize);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [initialContainerSize]);

  const actualSphereRadius = initialSphereRadius || containerSize * 0.42;
  const baseImageSize = containerSize * baseImageScale;

  // ==========================================
  // STATE & REFS
  // ==========================================

  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [rotation, setRotation] = useState<RotationState>({ x: 12, y: 20, z: 0 });
  const [velocity, setVelocity] = useState<VelocityState>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragDistance, setDragDistance] = useState<number>(0);
  const [selectedStudent, setSelectedStudent] = useState<SphereStudentItem | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef<MousePosition>({ x: 0, y: 0 });
  const dragStartPos = useRef<MousePosition>({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);

  // Check reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // ==========================================
  // STABLE FIBONACCI POSITIONING (DERIVED FROM STUDENT ID)
  // ==========================================

  const spherePositions = useMemo((): SphericalPosition[] => {
    const count = students.length;
    if (count === 0) return [];

    const positions: SphericalPosition[] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = 2 * Math.PI / goldenRatio;

    for (let i = 0; i < count; i++) {
      const student = students[i];
      const t = count === 1 ? 0.5 : i / count;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * i;

      let phi = inclination * (180 / Math.PI);
      let theta = (azimuth * (180 / Math.PI)) % 360;

      // Pole moderation: prevent extreme compression at poles
      const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 25;
      if (phi < 90) {
        phi = Math.max(12, phi - poleBonus);
      } else {
        phi = Math.min(168, phi + poleBonus);
      }
      phi = 15 + (phi / 180) * 150;

      // Stable deterministic jitter from user ID to break rigid grid lines
      const hash = student ? SPHERE_MATH.hashId(student.id || student.username || `${i}`) : 0.5;
      const stableThetaOffset = (hash - 0.5) * 15;
      const stablePhiOffset = (hash - 0.5) * 8;

      theta = (theta + stableThetaOffset) % 360;
      phi = Math.max(8, Math.min(172, phi + stablePhiOffset));

      positions.push({
        theta,
        phi,
        radius: actualSphereRadius,
      });
    }

    return positions;
  }, [students, actualSphereRadius]);

  // ==========================================
  // 3D WORLD PROJECTION WITH Z-INDEX DEPTH
  // ==========================================

  const worldPositions = useMemo((): WorldPosition[] => {
    if (!spherePositions.length) return [];

    const positions = spherePositions.map((pos, index) => {
      const thetaRad = SPHERE_MATH.degreesToRadians(pos.theta);
      const phiRad = SPHERE_MATH.degreesToRadians(pos.phi);
      const rotXRad = SPHERE_MATH.degreesToRadians(rotation.x);
      const rotYRad = SPHERE_MATH.degreesToRadians(rotation.y);

      // Initial point on sphere
      let x = pos.radius * Math.sin(phiRad) * Math.cos(thetaRad);
      let y = pos.radius * Math.cos(phiRad);
      let z = pos.radius * Math.sin(phiRad) * Math.sin(thetaRad);

      // Y-axis rotation (horizontal orbital)
      const x1 = x * Math.cos(rotYRad) + z * Math.sin(rotYRad);
      const z1 = -x * Math.sin(rotYRad) + z * Math.cos(rotYRad);
      x = x1;
      z = z1;

      // X-axis rotation (vertical tilt)
      const y2 = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
      const z2 = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);
      y = y2;
      z = z2;

      const worldPos: Position3D = { x, y, z };

      // Fade zone: nodes that rotate behind the sphere smoothly fade
      const fadeZoneStart = -actualSphereRadius * 0.15;
      const fadeZoneEnd = -actualSphereRadius * 0.75;
      const isVisible = worldPos.z > fadeZoneEnd;

      let fadeOpacity = 1;
      if (worldPos.z <= fadeZoneStart) {
        fadeOpacity = Math.max(0.15, (worldPos.z - fadeZoneEnd) / (fadeZoneStart - fadeZoneEnd));
      }

      // Distance from center scale
      const distanceFromCenter = Math.sqrt(worldPos.x * worldPos.x + worldPos.y * worldPos.y);
      const maxDistance = actualSphereRadius;
      const distanceRatio = Math.min(distanceFromCenter / maxDistance, 1);
      const centerScale = Math.max(0.45, 1 - distanceRatio * 0.45);

      // Depth perspective scale
      const depthScale = (worldPos.z + actualSphereRadius) / (2 * actualSphereRadius);
      const scale = centerScale * Math.max(0.55, 0.75 + depthScale * 0.45);

      return {
        ...worldPos,
        scale,
        zIndex: Math.round(1000 + worldPos.z),
        isVisible,
        fadeOpacity,
        originalIndex: index,
      };
    });

    // Collision cushion
    const adjustedPositions = [...positions];
    for (let i = 0; i < adjustedPositions.length; i++) {
      const pos = adjustedPositions[i];
      if (!pos.isVisible) continue;

      let adjustedScale = pos.scale;
      const imageSize = baseImageSize * adjustedScale;

      for (let j = 0; j < adjustedPositions.length; j++) {
        if (i === j) continue;
        const other = adjustedPositions[j];
        if (!other.isVisible) continue;

        const otherSize = baseImageSize * other.scale;
        const dx = pos.x - other.x;
        const dy = pos.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (imageSize + otherSize) / 2 + 18;

        if (distance < minDistance && distance > 0) {
          const overlap = minDistance - distance;
          const reductionFactor = Math.max(0.5, 1 - (overlap / minDistance) * 0.45);
          adjustedScale = Math.min(adjustedScale, adjustedScale * reductionFactor);
        }
      }

      adjustedPositions[i] = {
        ...pos,
        scale: Math.max(0.35, adjustedScale),
      };
    }

    return adjustedPositions;
  }, [spherePositions, rotation, actualSphereRadius, baseImageSize]);

  // ==========================================
  // PHYSICS & MOMENTUM
  // ==========================================

  const clampRotationSpeed = useCallback((speed: number): number => {
    return Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, speed));
  }, [maxRotationSpeed]);

  const updateMomentum = useCallback(() => {
    if (isDragging || isPaused) return;

    setVelocity((prev) => {
      const newVelocity = {
        x: prev.x * momentumDecay,
        y: prev.y * momentumDecay,
      };

      if (!autoRotate && Math.abs(newVelocity.x) < 0.005 && Math.abs(newVelocity.y) < 0.005) {
        return { x: 0, y: 0 };
      }
      return newVelocity;
    });

    setRotation((prev) => {
      let newY = prev.y;

      if (autoRotate && !prefersReducedMotion) {
        newY += autoRotateSpeed;
      }

      newY += clampRotationSpeed(velocity.y);

      return {
        x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(velocity.x)),
        y: SPHERE_MATH.normalizeAngle(newY),
        z: prev.z,
      };
    });
  }, [isDragging, isPaused, momentumDecay, autoRotate, autoRotateSpeed, clampRotationSpeed, velocity, prefersReducedMotion]);

  // ==========================================
  // EVENT HANDLERS (DRAG & TOUCH GESTURES)
  // ==========================================

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag with left mouse button
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragDistance(0);
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    const totalDist = Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y);
    setDragDistance(totalDist);

    const rotationDelta = {
      x: -deltaY * dragSensitivity,
      y: deltaX * dragSensitivity,
    };

    setRotation((prev) => ({
      x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(rotationDelta.x)),
      y: SPHERE_MATH.normalizeAngle(prev.y + clampRotationSpeed(rotationDelta.y)),
      z: prev.z,
    }));

    setVelocity({
      x: clampRotationSpeed(rotationDelta.x),
      y: clampRotationSpeed(rotationDelta.y),
    });

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, dragSensitivity, clampRotationSpeed]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    setIsDragging(true);
    setDragDistance(0);
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: touch.clientX, y: touch.clientY };
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - lastMousePos.current.x;
    const deltaY = touch.clientY - lastMousePos.current.y;
    const totalDist = Math.hypot(touch.clientX - dragStartPos.current.x, touch.clientY - dragStartPos.current.y);
    setDragDistance(totalDist);

    const rotationDelta = {
      x: -deltaY * dragSensitivity,
      y: deltaX * dragSensitivity,
    };

    setRotation((prev) => ({
      x: SPHERE_MATH.normalizeAngle(prev.x + clampRotationSpeed(rotationDelta.x)),
      y: SPHERE_MATH.normalizeAngle(prev.y + clampRotationSpeed(rotationDelta.y)),
      z: prev.z,
    }));

    setVelocity({
      x: clampRotationSpeed(rotationDelta.x),
      y: clampRotationSpeed(rotationDelta.y),
    });

    lastMousePos.current = { x: touch.clientX, y: touch.clientY };
  }, [isDragging, dragSensitivity, clampRotationSpeed]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const STEP = 8;
    if (e.key === 'ArrowLeft') {
      setRotation((prev) => ({ ...prev, y: SPHERE_MATH.normalizeAngle(prev.y - STEP) }));
    } else if (e.key === 'ArrowRight') {
      setRotation((prev) => ({ ...prev, y: SPHERE_MATH.normalizeAngle(prev.y + STEP) }));
    } else if (e.key === 'ArrowUp') {
      setRotation((prev) => ({ ...prev, x: SPHERE_MATH.normalizeAngle(prev.x - STEP) }));
    } else if (e.key === 'ArrowDown') {
      setRotation((prev) => ({ ...prev, x: SPHERE_MATH.normalizeAngle(prev.x + STEP) }));
    } else if (e.key === 'Escape') {
      setSelectedStudent(null);
    }
  }, []);

  // Connection handler
  const handleConnectAction = async (student: SphereStudentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectedIds.has(student.id) || student.isConnected || student.isPending) return;

    setConnectingId(student.id);
    try {
      if (onConnect) {
        await onConnect(student.id);
      }
      setConnectedIds((prev) => new Set([...prev, student.id]));
    } finally {
      setConnectingId(null);
    }
  };

  // Node Click: Only trigger selection if user didn't drag (> 6px movement)
  const handleNodeClick = (student: SphereStudentItem) => {
    if (dragDistance > 6) {
      return; // It was a drag gesture, ignore click
    }
    setSelectedStudent(student);
    if (onSelectStudent) {
      onSelectStudent(student);
    }
  };

  // ==========================================
  // LIFECYCLE & CLEANUP
  // ==========================================

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const animate = () => {
      updateMomentum();
      animationFrame.current = requestAnimationFrame(animate);
    };

    if (isMounted) {
      animationFrame.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isMounted, updateMomentum]);

  useEffect(() => {
    if (!isMounted) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMounted, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Pause animation when tab is inactive to preserve GPU/battery
  useEffect(() => {
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // ==========================================
  // RENDER STUDENT NODE
  // ==========================================

  const renderStudentNode = (student: SphereStudentItem, index: number) => {
    const position = worldPositions[index];
    if (!position || !position.isVisible) return null;

    const nodeSize = baseImageSize * position.scale;
    const isHovered = hoveredIndex === index;
    const isSelected = selectedStudent?.id === student.id;
    const isConnected = connectedIds.has(student.id) || student.isConnected;
    const finalScale = isHovered ? Math.min(1.3, hoverScale / position.scale) : 1;

    // Get initials
    const initials = student.displayName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'V';

    return (
      <div
        key={student.id}
        className="absolute cursor-pointer select-none transition-transform duration-150 ease-out group"
        style={{
          width: `${nodeSize}px`,
          height: `${nodeSize}px`,
          left: `${containerSize / 2 + position.x}px`,
          top: `${containerSize / 2 + position.y}px`,
          opacity: position.fadeOpacity,
          transform: `translate(-50%, -50%) scale(${finalScale})`,
          zIndex: isHovered || isSelected ? 3000 : position.zIndex,
        }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={() => handleNodeClick(student)}
        role="button"
        tabIndex={0}
        aria-label={`View profile of ${student.displayName}`}
      >
        {/* Glow halo for prominent foreground nodes */}
        {position.scale > 0.8 && (
          <div
            className="absolute -inset-1.5 rounded-full blur-md -z-10 transition-opacity"
            style={{
              background: isSelected
                ? 'radial-gradient(circle, rgba(99, 102, 241, 0.6) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%)',
              opacity: isHovered ? 0.9 : 0.5,
            }}
          />
        )}

        {/* Node Avatar Container */}
        <div
          className={`relative w-full h-full rounded-full overflow-hidden transition-all duration-200 border-2 ${
            isSelected
              ? 'border-indigo-400 ring-4 ring-indigo-500/40 shadow-xl shadow-indigo-500/50'
              : isHovered
              ? 'border-indigo-300 ring-2 ring-indigo-400/30 shadow-lg'
              : position.scale > 0.85
              ? 'border-white/40 shadow-md'
              : 'border-white/20'
          }`}
        >
          {student.avatarUrl ? (
            <img
              src={student.avatarUrl}
              alt={student.displayName}
              className="w-full h-full object-cover"
              draggable={false}
              loading="lazy"
              onError={(e) => {
                // If avatar URL 404s, replace with gradient fallback
                (e.target as HTMLElement).style.display = 'none';
                const parent = (e.target as HTMLElement).parentElement;
                if (parent) {
                  parent.classList.add('bg-gradient-to-br', 'from-indigo-600', 'to-purple-700');
                  parent.innerHTML = `<span class="flex items-center justify-center w-full h-full text-white font-bold text-xs font-mono">${initials}</span>`;
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex items-center justify-center text-white font-black font-mono text-[11px] select-none">
              {initials}
            </div>
          )}

          {/* Connected badge */}
          {isConnected && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border border-surface ring-1 ring-emerald-400" />
          )}
        </div>

        {/* Floating Mini Name Tooltip on Foreground / Hover */}
        {(isHovered || (position.scale > 0.92 && !selectedStudent)) && (
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2.5 py-1 rounded-xl glass-elevated border border-white/10 shadow-xl whitespace-nowrap pointer-events-none transition-all z-50 text-center"
            style={{
              opacity: isHovered ? 1 : 0.85,
            }}
          >
            <p className="text-[11px] font-bold text-foreground truncate max-w-[140px]">
              {student.displayName}
            </p>
            {student.department && (
              <p className="text-[9px] text-muted-foreground truncate max-w-[130px]">
                {student.department}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // QUICK PREVIEW DETAIL MODAL
  // ==========================================

  const renderStudentModal = () => {
    if (!selectedStudent) return null;

    const isConnected = connectedIds.has(selectedStudent.id) || selectedStudent.isConnected;
    const isPending = selectedStudent.isPending;
    const isConnecting = connectingId === selectedStudent.id;

    const initials = selectedStudent.displayName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'V';

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
        onClick={() => setSelectedStudent(null)}
      >
        <div
          className="relative max-w-sm w-full glass-elevated border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ambient Card Glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={() => setSelectedStudent(null)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header & Avatar */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-lg shrink-0 bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center">
              {selectedStudent.avatarUrl ? (
                <img
                  src={selectedStudent.avatarUrl}
                  alt={selectedStudent.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-black text-xl font-mono">{initials}</span>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="text-base font-black text-foreground truncate">
                {selectedStudent.displayName}
              </h3>
              <p className="text-xs text-indigo-400 font-semibold truncate">
                @{selectedStudent.username}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {selectedStudent.department || selectedStudent.college || 'Campus Builder'}
              </p>
            </div>
          </div>

          {/* Headline / Bio */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-foreground/90 leading-relaxed">
            {selectedStudent.headline || 'Student engineer building high-impact technology & collaborative projects.'}
          </div>

          {/* Match Reason Banner if available */}
          {selectedStudent.matchReason && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/15 border border-indigo-500/25 text-[11px] text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
              <span className="truncate">{selectedStudent.matchReason}</span>
            </div>
          )}

          {/* Skills Badges */}
          {selectedStudent.skills && selectedStudent.skills.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Core Stack
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedStudent.skills.slice(0, 5).map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-center">
            <div className="p-2 rounded-xl bg-white/5">
              <span className="block text-[10px] text-muted-foreground uppercase font-bold">XP</span>
              <span className="text-xs font-mono font-black text-foreground">{selectedStudent.xp ?? 0}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5">
              <span className="block text-[10px] text-muted-foreground uppercase font-bold">Level</span>
              <span className="text-xs font-mono font-black text-indigo-400">Lvl {selectedStudent.level ?? 1}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5">
              <span className="block text-[10px] text-muted-foreground uppercase font-bold">Streak</span>
              <span className="text-xs font-mono font-black text-amber-400">{selectedStudent.streakDays ?? 1}d</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => navigate(`/profile/${selectedStudent.username}`)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-foreground text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
            >
              <span>View Profile</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {isConnected ? (
              <button
                onClick={() => navigate('/messages')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
            ) : isPending ? (
              <button
                disabled
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 text-muted-foreground text-xs font-bold border border-white/5 cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <span>Request Sent</span>
              </button>
            ) : (
              <button
                onClick={(e) => handleConnectAction(selectedStudent, e)}
                disabled={isConnecting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                {isConnecting ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                <span>Connect</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // EMPTY STATE
  // ==========================================

  if (!students.length) {
    return (
      <div
        ref={wrapperRef}
        className={`w-full flex flex-col items-center justify-center p-8 rounded-3xl glass-card border border-white/10 text-center space-y-3 ${className}`}
        style={{ minHeight: '380px' }}
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-foreground">No Student Profiles Available</h3>
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
          The 3D student sphere displays real campus builders. Check back soon or switch to the list view to discover incoming students.
        </p>
        {onSwitchToGrid && (
          <button
            onClick={onSwitchToGrid}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            Switch to Grid View
          </button>
        )}
      </div>
    );
  }

  // ==========================================
  // MAIN 3D SPHERE RENDER
  // ==========================================

  return (
    <div ref={wrapperRef} className={`relative flex flex-col items-center w-full select-none ${className}`}>
      {/* 3D Sphere Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative cursor-grab active:cursor-grabbing focus:outline-none flex items-center justify-center"
        style={{
          width: `${containerSize}px`,
          height: `${containerSize}px`,
          perspective: `${perspective}px`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="3D Interactive Student Constellation Sphere. Drag to rotate or use arrow keys."
      >
        {/* Subtle Ambient Cosmic Sphere Glow */}
        <div
          className="absolute rounded-full pointer-events-none transition-all duration-700 -z-10"
          style={{
            width: `${actualSphereRadius * 1.85}px`,
            height: `${actualSphereRadius * 1.85}px`,
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(14, 165, 233, 0.03) 50%, transparent 75%)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        />

        {/* Orbit Grid Wireframe Ring for spatial depth */}
        <div
          className="absolute rounded-full pointer-events-none -z-10 opacity-30"
          style={{
            width: `${actualSphereRadius * 2}px`,
            height: `${actualSphereRadius * 2}px`,
            border: '1px dashed rgba(99, 102, 241, 0.15)',
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          }}
        />

        {/* Nodes Layer */}
        <div className="relative w-full h-full" style={{ zIndex: 10 }}>
          {students.map((student, index) => renderStudentNode(student, index))}
        </div>

        {/* Floating Controls Overlay (Bottom Center) */}
        <div className="absolute bottom-3 flex items-center gap-2 bg-surface/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-2xl shadow-xl z-40">
          <button
            onClick={() => {
              setRotation({ x: 12, y: 20, z: 0 });
              setVelocity({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
            title="Reset Sphere Rotation"
            aria-label="Reset Sphere Rotation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-mono text-muted-foreground">
            {students.length} Builders in Orbit
          </span>

          {onSwitchToGrid && (
            <button
              onClick={onSwitchToGrid}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-foreground text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Compass className="w-3 h-3 text-indigo-400" />
              <span>Grid</span>
            </button>
          )}
        </div>

        {/* Accessibility Screen Reader Hint */}
        <span className="sr-only">
          3D Interactive People Sphere containing {students.length} student builders. Drag with mouse or swipe with touch to orbit. Click any profile to view details.
        </span>
      </div>

      {/* Selected Student Modal Flyout */}
      {renderStudentModal()}
    </div>
  );
};

export default SphereImageGrid;
