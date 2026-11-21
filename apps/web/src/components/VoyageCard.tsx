import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Github, ExternalLink, Heart, Eye, CheckCircle, Clock, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Voyage } from '@vynk/types';

export function VoyageCard({ voyage }: { voyage: Voyage }) {
  const [likesCount, setLikesCount] = useState(voyage?.likesCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (!isLiked ? prev + 1 : Math.max(0, prev - 1)));
  };

  const technologies: string[] = Array.isArray(voyage?.technologies) 
    ? voyage.technologies 
    : Array.isArray((voyage as any)?.tags) 
      ? (voyage as any).tags 
      : [];

  const milestones = Array.isArray(voyage?.milestones) ? voyage.milestones : [];
  const statusText = (voyage?.status || 'IN_PROGRESS').replace(/_/g, ' ');
  const categoryText = voyage?.category || 'Student Project';
  const creatorName = voyage?.creator?.displayName || 'VYNK Builder';
  const creatorAvatar = voyage?.creator?.avatarUrl || null;
  const projectTitle = voyage?.title || 'Untitled Voyage';
  const projectTagline = voyage?.tagline || voyage?.description || 'Collaborative student initiative on VYNK.';

  return (
    <Card className="hover:border-indigo-500/40 transition-all flex flex-col justify-between overflow-hidden group/card">
      <div>
        {voyage?.coverImageUrl && !imageError ? (
          <Link to={`/voyages/${voyage.id}`} className="block w-full h-44 overflow-hidden relative group">
            <img
              src={voyage.coverImageUrl}
              alt={projectTitle}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 right-3">
              <Badge variant="accent" className="font-bold shadow-md">
                {statusText}
              </Badge>
            </div>
          </Link>
        ) : null}

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold mb-1">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>{categoryText}</span>
            </div>
            {voyage?.id && (
              <Link
                to={`/voyages/${voyage.id}`}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-indigo-400 font-mono transition-colors"
              >
                <span>Workspace</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          {voyage?.id ? (
            <Link to={`/voyages/${voyage.id}`}>
              <h3 className="text-base font-bold text-foreground leading-tight hover:text-indigo-400 transition-colors">
                {projectTitle}
              </h3>
            </Link>
          ) : (
            <h3 className="text-base font-bold text-foreground leading-tight">
              {projectTitle}
            </h3>
          )}
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{projectTagline}</p>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Tech Stack */}
          {technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {technologies.map((tech) => (
                <span key={tech} className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-mono text-muted-foreground">
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* Milestones Preview */}
          {milestones.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/50">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Roadmap Milestones:
              </span>
              {milestones.slice(0, 2).map((m) => (
                <div key={m.id || m.title} className="flex items-center gap-2 text-xs">
                  {m.isCompleted ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={m.isCompleted ? 'line-through text-muted-foreground text-[11px]' : 'text-[11px] font-medium'}>
                    {m.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="pt-3 border-t border-border/50 justify-between">
        <div className="flex items-center gap-2">
          <Avatar src={creatorAvatar} fallback={creatorName} size="xs" />
          <span className="text-xs font-semibold">{creatorName}</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {voyage?.githubUrl && (
            <a
              href={voyage.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Github className="w-4 h-4" />
            </a>
          )}
          {voyage?.demoUrl && (
            <a
              href={voyage.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 cursor-pointer ${isLiked ? 'text-rose-500 font-bold' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likesCount}</span>
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}
