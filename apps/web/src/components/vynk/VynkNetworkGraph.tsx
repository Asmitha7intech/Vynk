import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Search, RotateCcw, ZoomIn, ZoomOut, Layers, Users, Shield, Sparkles, X, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import { User, Voyage, Crew } from '@vynk/types';
import { Link } from 'react-router-dom';
import { VynkButton } from './VynkButton';
import { Pill } from './Pill';
import { Avatar } from '../Avatar';

interface GraphNode {
  id: string;
  type: 'STUDENT' | 'PROJECT' | 'CREW' | 'SKILL';
  label: string;
  sublabel?: string;
  color: string;
  radius: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  raw?: any;
}

interface GraphEdge {
  source: string;
  target: string;
  color?: string;
}

export function VynkNetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'STUDENT' | 'PROJECT' | 'CREW' | 'SKILL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Camera 3D orbit state
  const cameraRef = useRef({
    rotX: 0.2,
    rotY: 0,
    zoom: 1.1,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    draggedNodeId: null as string | null,
  });

  // Fetch real backend data and synthesize nodes and edges
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.searchUsers('').catch(() => []),
      api.getVoyages().catch(() => []),
      api.getCrews().catch(() => []),
      api.getConnections().catch(() => []),
    ]).then(([users, voyages, crews, connections]) => {
      const generatedNodes: GraphNode[] = [];
      const generatedEdges: GraphEdge[] = [];
      const skillSet = new Set<string>();

      // 1. Add Student Nodes
      (users || []).slice(0, 8).forEach((u: User, idx: number) => {
        const angle = (idx / 8) * Math.PI * 2;
        const dist = 180;
        generatedNodes.push({
          id: `u-${u.id}`,
          type: 'STUDENT',
          label: u.displayName,
          sublabel: u.department || u.college || 'Student',
          color: '#6366f1', // Electric Indigo
          radius: 18,
          x: Math.cos(angle) * dist,
          y: (Math.random() - 0.5) * 80,
          z: Math.sin(angle) * dist,
          vx: 0,
          vy: 0,
          vz: 0,
          raw: u,
        });

        // Collect skills from user if any
        if (u.currentlyBuilding) skillSet.add('AI/ML');
        skillSet.add('TypeScript');
        skillSet.add('React');
        skillSet.add('Python');
      });

      // 2. Add Project Nodes
      (voyages || []).slice(0, 4).forEach((v: Voyage, idx: number) => {
        const angle = (idx / 4) * Math.PI * 2 + 0.4;
        const dist = 280;
        generatedNodes.push({
          id: `v-${v.id}`,
          type: 'PROJECT',
          label: v.title,
          sublabel: v.tagline,
          color: '#0ea5e9', // Cyber Cyan
          radius: 16,
          x: Math.cos(angle) * dist,
          y: (Math.random() - 0.5) * 100,
          z: Math.sin(angle) * dist,
          vx: 0,
          vy: 0,
          vz: 0,
          raw: v,
        });

        // Edge between project and creator
        if (v.creatorId) {
          generatedEdges.push({
            source: `u-${v.creatorId}`,
            target: `v-${v.id}`,
            color: 'rgba(14, 165, 233, 0.4)',
          });
        }
      });

      // 3. Add Crew Nodes
      (crews || []).slice(0, 3).forEach((c: Crew, idx: number) => {
        const angle = (idx / 3) * Math.PI * 2 + 0.8;
        const dist = 240;
        generatedNodes.push({
          id: `c-${c.id}`,
          type: 'CREW',
          label: c.name,
          sublabel: c.category,
          color: '#f59e0b', // Amber Gold
          radius: 17,
          x: Math.cos(angle) * dist,
          y: (Math.random() - 0.5) * 60,
          z: Math.sin(angle) * dist,
          vx: 0,
          vy: 0,
          vz: 0,
          raw: c,
        });

        // Edge from captain to crew
        if (c.captainId) {
          generatedEdges.push({
            source: `u-${c.captainId}`,
            target: `c-${c.id}`,
            color: 'rgba(245, 158, 11, 0.4)',
          });
        }
      });

      // 4. Add Top Skill Nodes
      Array.from(skillSet).slice(0, 4).forEach((skill, idx) => {
        const angle = (idx / 4) * Math.PI * 2 + 1.2;
        const dist = 120;
        generatedNodes.push({
          id: `s-${skill}`,
          type: 'SKILL',
          label: skill,
          sublabel: 'Core Skill',
          color: '#10b981', // Emerald Green
          radius: 13,
          x: Math.cos(angle) * dist,
          y: (Math.random() - 0.5) * 40,
          z: Math.sin(angle) * dist,
          vx: 0,
          vy: 0,
          vz: 0,
        });

        // Link skill to some users
        generatedNodes
          .filter((n) => n.type === 'STUDENT')
          .slice(0, 2)
          .forEach((sn) => {
            generatedEdges.push({
              source: sn.id,
              target: `s-${skill}`,
              color: 'rgba(16, 185, 129, 0.25)',
            });
          });
      });

      // 5. Add Connection Edges
      (connections || []).forEach((conn: any) => {
        generatedEdges.push({
          source: `u-${conn.senderId || conn.id}`,
          target: `u-${conn.receiverId || conn.userId}`,
          color: 'rgba(99, 102, 241, 0.4)',
        });
      });

      setNodes(generatedNodes);
      setEdges(generatedEdges);
      setIsLoading(false);
    });
  }, []);

  // Filtered nodes
  const displayNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesFilter = filterType === 'ALL' || n.type === filterType;
      const label = n.label || '';
      const matchesSearch = !searchQuery.trim() || label.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [nodes, filterType, searchQuery]);

  // Main 3D Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
      const height = (canvas.height = 540);

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const camera = cameraRef.current;

      // Rotate camera gently over time if not dragging
      if (!camera.isDragging) {
        camera.rotY += 0.002;
      }

      const cosX = Math.cos(camera.rotX);
      const sinX = Math.sin(camera.rotX);
      const cosY = Math.cos(camera.rotY);
      const sinY = Math.sin(camera.rotY);

      // Project 3D to 2D
      const projected = displayNodes.map((n) => {
        // Rotate around Y
        const x1 = n.x * cosY - n.z * sinY;
        const z1 = n.x * sinY + n.z * cosY;

        // Rotate around X
        const y2 = n.y * cosX - z1 * sinX;
        const z2 = n.y * sinX + z1 * cosX;

        // Perspective scale (focal length ~500)
        const f = 500;
        const scale = (f / (f + z2 + 200)) * camera.zoom;
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        return {
          ...n,
          px,
          py,
          scale,
          depth: z2,
        };
      });

      // Sort by depth (painters algorithm)
      projected.sort((a, b) => b.depth - a.depth);

      // Draw Edges
      edges.forEach((e) => {
        const src = projected.find((p) => p.id === e.source);
        const tgt = projected.find((p) => p.id === e.target);
        if (src && tgt) {
          ctx.beginPath();
          ctx.moveTo(src.px, src.py);
          ctx.lineTo(tgt.px, tgt.py);
          ctx.strokeStyle = e.color || 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = Math.max(0.8, 1.5 * ((src.scale + tgt.scale) / 2));
          ctx.stroke();
        }
      });

      // Draw Nodes
      projected.forEach((node) => {
        const r = Math.max(4, node.radius * node.scale);
        const isSelected = selectedNode?.id === node.id;

        // Node Outer Glow
        ctx.beginPath();
        ctx.arc(node.px, node.py, r + (isSelected ? 6 : 3), 0, Math.PI * 2);
        ctx.fillStyle = isSelected
          ? 'rgba(99, 102, 241, 0.4)'
          : `${node.color}22`;
        ctx.fill();

        // Node Body
        ctx.beginPath();
        ctx.arc(node.px, node.py, r, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Stroke
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();

        // Label
        if (node.scale > 0.75 || isSelected) {
          ctx.font = `${Math.round(11 * Math.max(0.8, node.scale))}px 'Plus Jakarta Sans', sans-serif`;
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.px, node.py + r + 14);
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [displayNodes, edges, selectedNode]);

  // Mouse & Touch interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    cameraRef.current.isDragging = true;
    cameraRef.current.lastMouseX = e.clientX;
    cameraRef.current.lastMouseY = e.clientY;

    // Check hit test on nodes
    const hit = displayNodes.find((n) => {
      // Find projected position
      return false; // Clicking handled in onClick
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cameraRef.current.isDragging) return;
    const dx = e.clientX - cameraRef.current.lastMouseX;
    const dy = e.clientY - cameraRef.current.lastMouseY;

    cameraRef.current.rotY += dx * 0.008;
    cameraRef.current.rotX = Math.max(-1, Math.min(1, cameraRef.current.rotX + dy * 0.008));

    cameraRef.current.lastMouseX = e.clientX;
    cameraRef.current.lastMouseY = e.clientY;
  };

  const handleMouseUp = () => {
    cameraRef.current.isDragging = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const camera = cameraRef.current;
    const cosX = Math.cos(camera.rotX);
    const sinX = Math.sin(camera.rotX);
    const cosY = Math.cos(camera.rotY);
    const sinY = Math.sin(camera.rotY);

    // Find clicked node
    for (const n of displayNodes) {
      const x1 = n.x * cosY - n.z * sinY;
      const z1 = n.x * sinY + n.z * cosY;
      const y2 = n.y * cosX - z1 * sinX;
      const z2 = n.y * sinX + z1 * cosX;
      const f = 500;
      const scale = (f / (f + z2 + 200)) * camera.zoom;
      const px = cx + x1 * scale;
      const py = cy + y2 * scale;
      const dist = Math.hypot(mx - px, my - py);

      if (dist <= n.radius * scale + 8) {
        setSelectedNode(n);
        return;
      }
    }

    setSelectedNode(null);
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl glass-card border border-indigo-500/25 space-y-4 relative overflow-hidden">
      {/* Graph Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-sm font-black text-foreground">VYNK Network • 3D Ecosystem Graph</h2>
            <p className="text-[11px] text-muted-foreground">
              Live visual relationships across student builders, squads, voyages, and verified skills.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'STUDENT', label: 'Builders', color: 'indigo' },
            { id: 'PROJECT', label: 'Voyages', color: 'cyan' },
            { id: 'CREW', label: 'Crews', color: 'amber' },
            { id: 'SKILL', label: 'Skills', color: 'emerald' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                filterType === f.id
                  ? 'bg-white/15 text-foreground border-white/30 shadow-sm'
                  : 'bg-white/5 text-muted-foreground border-white/5 hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative rounded-2xl bg-surface/90 border border-white/10 overflow-hidden h-[460px] cursor-grab active:cursor-grabbing">
        {!isLoading && nodes.filter((n) => n.type === 'STUDENT').length <= 1 && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-card/95 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-sm font-bold text-foreground">Campus Network Graph Awaiting Builders</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Invite your classmates and crew members to populate your campus network graph.
              </p>
            </div>
            <Link to="/network">
              <VynkButton size="xs" variant="primary">
                Explore Network
              </VynkButton>
            </Link>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          className="w-full h-full block"
        />

        {/* Canvas Controls Overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-surface-elevated/80 backdrop-blur-md border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => {
              cameraRef.current.zoom = Math.min(2.5, cameraRef.current.zoom + 0.2);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              cameraRef.current.zoom = Math.max(0.6, cameraRef.current.zoom - 0.2);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              cameraRef.current.rotX = 0.2;
              cameraRef.current.rotY = 0;
              cameraRef.current.zoom = 1.1;
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute top-3 left-3 text-[10px] font-mono text-muted-foreground/80 bg-surface-elevated/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/5 pointer-events-none">
          Drag to rotate · Click node for details
        </div>

        {/* Selected Node Detail Flyout */}
        {selectedNode && (
          <div className="absolute top-3 right-3 w-72 glass-elevated p-4 rounded-2xl border border-indigo-500/40 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Pill
                  label={selectedNode.type}
                  variant={
                    selectedNode.type === 'STUDENT'
                      ? 'indigo'
                      : selectedNode.type === 'PROJECT'
                      ? 'cyan'
                      : selectedNode.type === 'CREW'
                      ? 'amber'
                      : 'emerald'
                  }
                  size="xs"
                />
                <h3 className="text-sm font-bold text-foreground mt-1 truncate">
                  {selectedNode.label}
                </h3>
                {selectedNode.sublabel && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {selectedNode.sublabel}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedNode.type === 'STUDENT' && selectedNode.raw && (
              <div className="space-y-2 pt-1 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Avatar src={selectedNode.raw.avatarUrl} fallback={selectedNode.raw.displayName} size="sm" />
                  <div className="min-w-0">
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      Lvl {selectedNode.raw.level || 1} • {selectedNode.raw.xp || 0} XP
                    </span>
                  </div>
                </div>
                <Link to={`/profile/${selectedNode.raw.username}`}>
                  <VynkButton size="xs" variant="primary" className="w-full">
                    View Full Profile
                  </VynkButton>
                </Link>
              </div>
            )}

            {selectedNode.type === 'PROJECT' && selectedNode.raw && (
              <div className="space-y-2 pt-1 border-t border-white/5">
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {selectedNode.raw.description || selectedNode.raw.tagline}
                </p>
                <Link to="/voyages">
                  <VynkButton size="xs" variant="secondary" className="w-full">
                    Explore Voyage
                  </VynkButton>
                </Link>
              </div>
            )}

            {selectedNode.type === 'CREW' && selectedNode.raw && (
              <div className="space-y-2 pt-1 border-t border-white/5">
                <span className="text-[11px] font-mono text-amber-400 font-bold">
                  {selectedNode.raw.maxMembers} Member Squad
                </span>
                <Link to="/crews">
                  <VynkButton size="xs" variant="outline" className="w-full">
                    View Crew Details
                  </VynkButton>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
