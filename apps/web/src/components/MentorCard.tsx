import React, { useState } from 'react';
import { Star, GraduationCap, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';
import { MentorProfile } from '@vynk/types';
import { RequestMentorshipModal } from './RequestMentorshipModal';

export function MentorCard({ mentor }: { mentor: MentorProfile }) {
  const [showRequestModal, setShowRequestModal] = useState(false);

  return (
    <Card className="hover:border-indigo-500/40 transition-all flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3 flex flex-row items-start gap-3">
          <Avatar src={mentor.user.avatarUrl} fallback={mentor.user.displayName} size="lg" isOnline={true} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground truncate">{mentor.user.displayName}</h3>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{mentor.rating.toFixed(1)}</span>
              </div>
            </div>
            <p className="text-xs text-indigo-400 font-semibold truncate">{mentor.headline}</p>
            <p className="text-[11px] text-muted-foreground">{mentor.companyOrCollege} · {mentor.yearsOfExperience} yrs exp</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{mentor.about}</p>

          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Mentorship Domains:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {mentor.expertiseCategories.map((cat) => (
                <Badge key={cat} variant="secondary" className="text-[11px]">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{mentor.weeklyHoursAvailable}h/wk available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>{mentor.totalMenteesHelped} students guided</span>
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-3 border-t border-border/50">
        <Button
          size="sm"
          onClick={() => setShowRequestModal(true)}
          className="w-full text-xs shadow-sm"
        >
          <GraduationCap className="w-4 h-4" />
          <span>Request Mentorship Guidance</span>
        </Button>
      </CardFooter>

      <RequestMentorshipModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        mentor={mentor}
      />
    </Card>
  );
}
