import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  RotateCcw, 
  Play, 
  Pause, 
  UserPlus, 
  Check, 
  Clock, 
  MessageSquare, 
  ExternalLink, 
  Sparkles,
  GraduationCap,
  Building,
  Info
} from 'lucide-react';
import { User } from '@vynk/types';
import { VynkButton } from './VynkButton';
import { Pill } from './Pill';
import { SkillBadge } from './SkillBadge';

export type StudentUser = User & {
  skills?: Array<{ id?: string; name?: string; level?: string | number }>;
};

export interface VynkPeopleSphereProps {
  students: StudentUser[];
  onConnect?: (userId: string) => void;
  connectedUserIds?: Set<string>;
  pendingUserIds?: Set<string>;
  matchScores?: Record<string, number>;
  className?: string;
  containerSize?: number;
}

interface Position3D {
  x: number;
  y: number;
  z: number;
}

interface SphericalPosition {
  theta: number;
  phi: number;
  radius: number;
}

interface WorldPosition extends Position3D {
  scale: number;
  zIndex: number;
  isVisible: boolean;
  fadeOpacity: number;
}

const SPHERE_MATH = {
  degToRad: (deg: number) => deg * (Math.PI / 180),
  normalizeAngle: (deg: number) => {
    while (deg > 180) deg -= 360;
    while (deg < -180) deg += 360;
    return deg;
  }
};

export const VynkPeopleSphere: React.FC<VynkPeopleSphereProps> = ({
  students = [],
  onConnect,
  connectedUserIds = new Set(),
  pendingUserIds = new Set(),
  matchScores = {},
  className = '',
  containerSize: initialSize = 540,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<number>(initialSize);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [rotation, setRotation] = useState<{ x: number; y: number }>({ x: 12, y: 20 });
  const [velocity, setVelocity] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null);
  const [hoveredStudent, setHoveredStudent] = useState<StudentUser | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragDistance = useRef<number>(0);
  const animationFrame = useRef<number | null>(null);

  // Check prefers-reduced-motion with safe browser guards
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery) {
        setPrefersReducedMotion(mediaQuery.matches);
        if (mediaQuery.matches) {
          setAutoRotate(false);
        }
        const handler = (e: MediaQueryListEvent) => {
          setPrefersReducedMotion(e.matches);
          if (e.matches) setAutoRotate(false);
        };
        if (typeof mediaQuery.addEventListener === 'function') {
          mediaQuery.addEventListener('change', handler);
          return () => mediaQuery.removeEventListener('change', handler);
        } else if (typeof (mediaQuery as any).addListener === 'function') {
          (mediaQuery as any).addListener(handler);
          return () => (mediaQuery as any).removeListener(handler);
        }
      }
    } catch {
      // Gracefully ignore media query detection failures
    }
  }, []);

  // Responsive container sizing
  useEffect(() => {
    setIsMounted(true);
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.parentElement?.clientWidth || window.innerWidth;
        const target = Math.min(620, Math.max(320, width - 32));
        setContainerSize(target);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const sphereRadius = useMemo(() => containerSize * 0.42, [containerSize]);
  const baseNodeSize = useMemo(() => Math.max(38, Math.min(62, containerSize * 0.095)), [containerSize]);

  // Deterministic Fibonacci distribution for student positions
  const sphericalPositions = useMemo(() => {
    const count = students.length;
    if (count === 0) return [];

    const positions: SphericalPosition[] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = 2 * Math.PI / goldenRatio;

    for (let i = 0; i < count; i++) {
      const t = i / Math.max(1, count - 1);
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = angleIncrement * i;

      let phi = inclination * (180 / Math.PI);
      let theta = (azimuth * (180 / Math.PI)) % 360;

      // Gentle pole adjustment for pleasant visual balance
      phi = 20 + (phi / 180) * 140;

      positions.push({
        theta,
        phi,
        radius: sphereRadius,
      });
    }
    return positions;
  }, [students.length, sphereRadius]);

  // Calculate 3D to 2D projected world positions
  const worldPositions = useMemo(() => {
    const rotXRad = SPHERE_MATH.degToRad(rotation.x);
    const rotYRad = SPHERE_MATH.degToRad(rotation.y);

    return sphericalPositions.map((pos) => {
      const thetaRad = SPHERE_MATH.degToRad(pos.theta);
      const phiRad = SPHERE_MATH.degToRad(pos.phi);

      let x = pos.radius * Math.sin(phiRad) * Math.cos(thetaRad);
      let y = pos.radius * Math.cos(phiRad);
      let z = pos.radius * Math.sin(phiRad) * Math.sin(thetaRad);

      // Y-axis rotation (horizontal)
      const x1 = x * Math.cos(rotYRad) + z * Math.sin(rotYRad);
      const z1 = -x * Math.sin(rotYRad) + z * Math.cos(rotYRad);
      x = x1;
      z = z1;

      // X-axis rotation (vertical)
      const y2 = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
      const z2 = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);
      y = y2;
      z = z2;

      // Depth calculations
      const depthRatio = (z + sphereRadius) / (2 * sphereRadius); // 0 (back) to 1 (front)
      const isVisible = z > -sphereRadius * 0.85;

      // Fade opacity based on depth
      const fadeOpacity = Math.max(0.18, Math.min(1, depthRatio * 1.3));

      // Scaling: foreground larger, background smaller
      const scale = Math.max(0.48, 0.65 + depthRatio * 0.55);

      return {
        x,
        y,
        z,
        scale,
        zIndex: Math.round(1000 + z),
        isVisible,
        fadeOpacity,
      };
    });
  }, [sphericalPositions, rotation, sphereRadius]);

  // Momentum & Auto-rotation loop
  const updatePhysics = useCallback(() => {
    if (isDragging) return;

    setVelocity((prev) => {
      const decay = 0.94;
      const nx = prev.x * decay;
      const ny = prev.y * decay;
      if (!autoRotate && Math.abs(nx) < 0.01 && Math.abs(ny) < 0.01) {
        return { x: 0, y: 0 };
      }
      return { x: nx, y: ny };
    });

    setRotation((prev) => {
      let deltaY = velocity.y;
      if (autoRotate && !prefersReducedMotion) {
        deltaY += 0.22; // gentle auto-rotation speed
      }
      return {
        x: SPHERE_MATH.normalizeAngle(prev.x + velocity.x),
        y: SPHERE_MATH.normalizeAngle(prev.y + deltaY),
      };
    });
  }, [isDragging, autoRotate, prefersReducedMotion, velocity]);

  useEffect(() => {
    const loop = () => {
      updatePhysics();
      animationFrame.current = requestAnimationFrame(loop);
    };

    if (isMounted) {
      animationFrame.current = requestAnimationFrame(loop);
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isMounted, updatePhysics]);

  // Pointer & Touch Events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragDistance.current = 0;
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      dragDistance.current += Math.abs(dx) + Math.abs(dy);

      const sensitivity = 0.55;
      const rotDelta = {
        x: -dy * sensitivity,
        y: dx * sensitivity,
      };

      setRotation((prev) => ({
        x: SPHERE_MATH.normalizeAngle(prev.x + Math.max(-8, Math.min(8, rotDelta.x))),
        y: SPHERE_MATH.normalizeAngle(prev.y + Math.max(-8, Math.min(8, rotDelta.y))),
      }));

      setVelocity({
        x: Math.max(-6, Math.min(6, rotDelta.x)),
        y: Math.max(-6, Math.min(6, rotDelta.y)),
      });

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragDistance.current = 0;
      setVelocity({ x: 0, y: 0 });
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastMousePos.current.x;
      const dy = e.touches[0].clientY - lastMousePos.current.y;
      dragDistance.current += Math.abs(dx) + Math.abs(dy);

      const sensitivity = 0.55;
      const rotDelta = {
        x: -dy * sensitivity,
        y: dx * sensitivity,
      };

      setRotation((prev) => ({
        x: SPHERE_MATH.normalizeAngle(prev.x + Math.max(-8, Math.min(8, rotDelta.x))),
        y: SPHERE_MATH.normalizeAngle(prev.y + Math.max(-8, Math.min(8, rotDelta.y))),
      }));

      setVelocity({
        x: Math.max(-6, Math.min(6, rotDelta.x)),
        y: Math.max(-6, Math.min(6, rotDelta.y)),
      });

      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMounted, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Node Click: only trigger if wasn't a significant drag
  const handleNodeClick = (student: User) => {
    if (dragDistance.current < 8) {
      setSelectedStudent(student);
    }
  };

  const handleResetCamera = () => {
    setRotation({ x: 12, y: 20 });
    setVelocity({ x: 0, y: 0 });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedStudent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* ── Sphere Visual Canvas Container ── */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center overflow-visible cursor-grab active:cursor-grabbing"
        style={{
          width: containerSize,
          height: containerSize,
          perspective: '1100px',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        role="region"
        aria-label="Interactive 3D Student Connection Sphere"
      >
        {/* Subtle background ambient sphere glow */}
        <div 
          className="absolute rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-cyan-500/10 blur-3xl pointer-events-none"
          style={{
            width: sphereRadius * 1.8,
            height: sphereRadius * 1.8,
          }}
        />

        {/* Orbit Grid Wireframe Rings (Subtle decorative depth markers) */}
        <div
          className="absolute rounded-full border border-indigo-500/10 pointer-events-none"
          style={{
            width: sphereRadius * 1.9,
            height: sphereRadius * 1.9,
            transform: 'rotateX(65deg)',
          }}
        />
        <div
          className="absolute rounded-full border border-purple-500/10 pointer-events-none"
          style={{
            width: sphereRadius * 1.6,
            height: sphereRadius * 1.6,
            transform: 'rotateY(65deg)',
          }}
        />

        {/* Sphere Nodes */}
        {students.map((student, idx) => {
          const pos = worldPositions[idx];
          if (!pos || !pos.isVisible) return null;

          const size = baseNodeSize * pos.scale;
          const isConnected = connectedUserIds.has(student.id);
          const isPending = pendingUserIds.has(student.id);
          const isHovered = hoveredStudent?.id === student.id;
          const matchScore = matchScores[student.id];

          return (
            <div
              key={student.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-100 ease-out group"
              style={{
                left: `${containerSize / 2 + pos.x}px`,
                top: `${containerSize / 2 + pos.y}px`,
                zIndex: pos.zIndex + (isHovered ? 200 : 0),
                opacity: pos.fadeOpacity,
                transform: `translate(-50%, -50%) scale(${isHovered ? 1.25 : 1})`,
              }}
              onMouseEnter={() => setHoveredStudent(student)}
              onMouseLeave={() => setHoveredStudent(null)}
              onClick={() => handleNodeClick(student)}
            >
              {/* Node Avatar Container */}
              <div
                className={`relative rounded-full p-[2px] transition-all duration-300 ${
                  isConnected
                    ? 'bg-gradient-to-tr from-emerald-400 to-cyan-400 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-500/30'
                    : isPending
                    ? 'bg-gradient-to-tr from-amber-400 to-orange-400 ring-2 ring-amber-500/30'
                    : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 hover:shadow-lg hover:shadow-indigo-500/40'
                }`}
                style={{ width: `${size}px`, height: `${size}px` }}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-[#0d1117] flex items-center justify-center relative">
                  {student.avatarUrl ? (
                    <img
                      src={student.avatarUrl}
                      alt={student.displayName}
                      className="w-full h-full object-cover"
                      loading={idx < 6 ? 'eager' : 'lazy'}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span 
                      className="font-black text-white uppercase select-none tracking-tight"
                      style={{ fontSize: `${Math.max(10, size * 0.36)}px` }}
                    >
                      {student.displayName?.slice(0, 2).toUpperCase() || 'ST'}
                    </span>
                  )}

                  {/* Level / Status indicator pip */}
                  {isConnected && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#0d1117] ring-1 ring-emerald-300" />
                  )}
                  {isPending && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#0d1117] ring-1 ring-amber-300" />
                  )}
                </div>

                {/* Score Pill badge for high affinity matches */}
                {matchScore !== undefined && matchScore >= 75 && (
                  <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-indigo-600/90 border border-indigo-400/50 text-[9px] font-black font-mono text-white shadow-sm">
                    {matchScore}%
                  </div>
                )}
              </div>

              {/* Hover Label Popover */}
              <AnimatePresence>
                {isHovered && pos.z > -20 && (
                  <motion.div
                    key={`hover-${student.id || idx}`}
                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 2, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-1/2 -bottom-9 transform -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#0d1117]/95 border border-white/15 text-[11px] font-bold text-white shadow-xl pointer-events-none z-50 flex items-center gap-1.5"
                  >
                    <span>{student.displayName}</span>
                    {student.department && (
                      <span className="text-[10px] text-indigo-300 font-normal">
                        · {student.department}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── Interactive Controls Bar ── */}
      <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            autoRotate
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'text-muted-foreground hover:text-white hover:bg-white/5'
          }`}
          aria-label={autoRotate ? 'Pause sphere auto-rotation' : 'Play sphere auto-rotation'}
        >
          {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{autoRotate ? 'Auto-Rotate ON' : 'Paused'}</span>
        </button>

        <div className="h-4 w-[1px] bg-white/10" />

        <button
          onClick={handleResetCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          aria-label="Reset sphere camera angle"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset View</span>
        </button>

        <div className="hidden sm:block text-[11px] text-muted-foreground/60 pl-2">
          Drag to spin · Click profile to inspect
        </div>
      </div>

      {/* ── Selected Student Spotlight Modal Drawer ── */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            key="sphere-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={() => setSelectedStudent(null)}
          >
            <motion.div
              key={`sphere-modal-content-${selectedStudent.id}`}
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[#0d1117] border border-white/15 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Banner */}
              <div className="relative h-28 bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-cyan-900/40 border-b border-white/10 p-5 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Pill label="Constellation Profile" variant="indigo" size="xs" />
                  {matchScores[selectedStudent.id] && (
                    <Pill 
                      label={`${matchScores[selectedStudent.id]}% Match`} 
                      variant="cyan" 
                      size="xs" 
                    />
                  )}
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close profile spotlight"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Body */}
              <div className="p-6 pt-0 relative space-y-4">
                {/* Avatar with overlap onto banner */}
                <div className="flex items-end justify-between -mt-12">
                  <div className="w-20 h-20 rounded-2xl bg-[#0d1117] p-1 border-2 border-indigo-500/40 shadow-xl overflow-hidden">
                    {selectedStudent.avatarUrl ? (
                      <img
                        src={selectedStudent.avatarUrl}
                        alt={selectedStudent.displayName}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-black text-xl text-white">
                        {selectedStudent.displayName?.slice(0, 2).toUpperCase() || 'ST'}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {connectedUserIds.has(selectedStudent.id) ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        Connected
                      </span>
                    ) : pendingUserIds.has(selectedStudent.id) ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        Pending Request
                      </span>
                    ) : (
                      <VynkButton
                        size="xs"
                        variant="primary"
                        leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                        onClick={() => {
                          if (onConnect) onConnect(selectedStudent.id);
                        }}
                      >
                        Connect
                      </VynkButton>
                    )}
                  </div>
                </div>

                {/* Name, Headline, College */}
                <div>
                  <h3 className="text-lg font-black text-white">{selectedStudent.displayName}</h3>
                  <p className="text-xs text-indigo-300 font-semibold">@{selectedStudent.username}</p>
                  <p className="text-xs text-white/80 mt-1 leading-relaxed">
                    {selectedStudent.headline || 'Student builder & aspiring engineer.'}
                  </p>
                </div>

                {/* College & Department meta */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-white/5">
                  {selectedStudent.college && (
                    <div className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{selectedStudent.college}</span>
                    </div>
                  )}
                  {selectedStudent.department && (
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                      <span>{selectedStudent.department}</span>
                    </div>
                  )}
                  {selectedStudent.graduationYear && (
                    <span className="text-[11px] text-muted-foreground/60">
                      Class of {selectedStudent.graduationYear}
                    </span>
                  )}
                </div>

                {/* Bio snippet */}
                {selectedStudent.bio && (
                  <p className="text-xs text-muted-foreground leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                    {selectedStudent.bio}
                  </p>
                )}

                {/* Skills */}
                {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Skills & Technologies
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStudent.skills.slice(0, 6).map((skill: any) => (
                        <SkillBadge
                          key={skill.id || skill.name}
                          name={skill.name}
                          proficiency={skill.proficiency || (typeof skill.level === 'string' ? skill.level : undefined)}
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <Link
                    to={`/profile/${selectedStudent.username}`}
                    className="flex-1"
                  >
                    <VynkButton
                      size="sm"
                      variant="outline"
                      className="w-full"
                      rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      View Full Profile
                    </VynkButton>
                  </Link>

                  {connectedUserIds.has(selectedStudent.id) && (
                    <Link to="/messages" className="flex-1">
                      <VynkButton
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                      >
                        Open Chat
                      </VynkButton>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VynkPeopleSphere;
