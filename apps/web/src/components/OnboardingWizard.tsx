import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import { Sparkles, ArrowRight, ArrowLeft, Check, Shield, Rocket, User, BookOpen, Layers, Code, Globe } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user, updateUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [headline, setHeadline] = useState(user?.headline || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [college, setCollege] = useState(user?.college || 'CIT');
  const [department, setDepartment] = useState(user?.department || 'Computer Science');
  const [graduationYear, setGraduationYear] = useState(user?.graduationYear || 2026);
  const [currentlyBuilding, setCurrentlyBuilding] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [availableFor, setAvailableFor] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // Selected Skills & Interests
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['TypeScript', 'React']);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['AI Agents', 'Distributed Systems', 'Hackathons']);

  const SKILL_OPTIONS = [
    'TypeScript', 'React', 'Python', 'PyTorch', 'Rust', 'Next.js',
    'Node.js / Fastify', 'PostgreSQL', 'Tailwind CSS', 'Figma / UI Design',
    'Solidity / Web3', 'Docker / DevOps', 'Computer Vision', 'Go / Golang'
  ];

  const INTEREST_OPTIONS = [
    'AI Agents', 'Distributed Systems', 'Hackathons', 'Startups & MVPs',
    'Open Source', 'Machine Learning', 'Cybersecurity', 'Web3 & Crypto',
    'Developer Tools', 'Healthcare Tech', 'Fintech', 'Robotics'
  ];

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleNext = async () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        const updatePayload: Record<string, any> = {
          college: college.trim() || 'CIT',
          department: department.trim() || 'Computer Science',
          graduationYear: Number(graduationYear) || 2026,
          isAvailableForCrews: true,
        };

        if (headline.trim()) updatePayload.headline = headline.trim();
        if (bio.trim()) updatePayload.bio = bio.trim();
        if (currentlyBuilding.trim()) updatePayload.currentlyBuilding = currentlyBuilding.trim();
        if (lookingFor.trim()) updatePayload.lookingFor = lookingFor.trim();
        if (availableFor.trim()) updatePayload.availableFor = availableFor.trim();
        if (githubUrl.trim()) updatePayload.githubUrl = githubUrl.trim();
        if (linkedinUrl.trim()) updatePayload.linkedinUrl = linkedinUrl.trim();
        if (portfolioUrl.trim()) updatePayload.portfolioUrl = portfolioUrl.trim();

        const updated = await api.updateProfile(updatePayload);
        if (updated) {
          updateUser(updated);
        }
        api.trackEvent('onboarding_completed', { step: 5, skillsCount: selectedSkills.length });
        onComplete();
      } catch (err) {
        console.error('Onboarding update failed', err);
        onComplete();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4">
      <Card className="w-full max-w-xl border-indigo-500/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Progress Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-card to-card p-6 border-b border-border/80">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>IDENTITY CREATION • STEP {currentStep} OF 5</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono font-bold">{currentStep * 20}%</span>
          </div>
          
          <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300"
              style={{ width: `${currentStep * 20}%` }}
            />
          </div>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* Step 1: Headline & Persona */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" />
                  <span>Your Builder Headline</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Give your profile a personality. What is your technical edge?
                </p>
              </div>

              <Input
                label="Headline"
                placeholder="AI Engineer & Full-Stack Builder • Next.js & PyTorch"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Bio & What drives you</label>
                  <span className={`text-[10px] font-mono ${bio.length > 450 ? 'text-amber-400 font-bold' : 'text-muted-foreground'}`}>
                    {bio.length}/500
                  </span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 500))}
                  placeholder="Passionate about building distributed systems and agentic AI. Looking for teammates for upcoming hackathons."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 bg-[#090d16] border border-white/10 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 resize-none transition-all shadow-inner"
                />
              </div>
            </div>
          )}

          {/* Step 2: Academic Roots */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-sky-400" />
                  <span>Campus & Department</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect with peer builders and access your campus leaderboard.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="College / University"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  required
                />
                <Input
                  label="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Expected Graduation Year"
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(Number(e.target.value))}
                required
              />
            </div>
          )}

          {/* Step 3: Technical Skills */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Code className="w-5 h-5 text-indigo-400" />
                  <span>Select Your Core Weapons (Skills)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Our AI team matcher uses these to recommend squads with missing roles.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {SKILL_OPTIONS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Interests & Domains */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>Domains & Problem Spaces</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  What domains do you genuinely want to build in?
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold shadow-sm'
                          : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isSelected ? `● ${interest}` : interest}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Dynamic Signals & Links */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-emerald-400" />
                  <span>Dynamic Signals & Portfolio</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Let the ecosystem know what you are cooking right now.
                </p>
              </div>

              <Input
                label="Currently Building..."
                placeholder="Neural Speech Model in PyTorch"
                value={currentlyBuilding}
                onChange={(e) => setCurrentlyBuilding(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Looking For..."
                  placeholder="Frontend Lead / Co-founder"
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                />
                <Input
                  label="Availability"
                  placeholder="10 hrs/week • Weekends"
                  value={availableFor}
                  onChange={(e) => setAvailableFor(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="GitHub URL"
                  placeholder="https://github.com/username"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
                <Input
                  label="LinkedIn or Portfolio URL"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-6 pt-0 flex items-center justify-between border-t border-border/50 bg-card/40">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          ) : (
            <div />
          )}

          <Button
            size="sm"
            onClick={handleNext}
            isLoading={isSubmitting}
            className="shadow-lg shadow-indigo-500/20"
          >
            <span>{currentStep === 5 ? 'Launch VYNK Experience 🚀' : 'Continue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
