import React from 'react';
import { Shield, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VynkButton } from '../components/vynk/VynkButton';

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Legal Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-mono font-bold uppercase tracking-wider block">
            REQUIRES LEGAL REVIEW · DRAFT CAMPUS TERMS OF SERVICE
          </span>
          <p className="text-amber-200/90 leading-relaxed">
            This document is a technical and functional operational draft for the VYNK campus collaboration platform. It must undergo formal institutional legal review before commercial or university-wide deployment. Complies with the Digital Personal Data Protection Act, 2023 (DPDP Act, India).
          </p>
        </div>
      </div>

      <div className="p-8 sm:p-10 rounded-3xl glass-card space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold">
            <Shield className="w-4 h-4" />
            <span>CAMPUS GOVERNANCE & CODE OF CONDUCT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">Terms of Service</h1>
          <p className="text-xs text-muted-foreground">Last updated: November 2026</p>
        </div>

        <div className="space-y-6 text-xs text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or creating an account on VYNK, you agree to comply with and be bound by these Terms of Service. If you are using VYNK on behalf of a college student organization, hackathon crew, or technical guild, you represent that you have the authority to bind that entity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">2. Student Eligibility & Authentication</h2>
            <p>
              VYNK is designed exclusively for college and university students, faculty, and academic mentors. Users must be at least 16 years of age. You agree to provide accurate, current, and complete academic institution details during registration and keep your profile updated.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">3. Student Code of Conduct & Academic Integrity</h2>
            <p>
              VYNK is a collaborative space for authentic student projects, voyages, and hackathons. Users agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Harass, threaten, or impersonate other students, faculty, or institutional representatives.</li>
              <li>Post plagiarized code or proprietary intellectual property without attribution.</li>
              <li>Upload malicious scripts, spam, or unlawful material.</li>
              <li>Attempt unauthorized administrative access or circumvent security controls.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">4. Intellectual Property & Voyage Ownership</h2>
            <p>
              Students retain 100% intellectual property ownership of their projects, code repositories, designs, and voyages showcased on VYNK. By publishing on VYNK, you grant the platform a non-exclusive license to display your project portfolio within the campus network.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">5. Termination & Account Cancellation</h2>
            <p>
              VYNK reserves the right to suspend or terminate accounts that violate campus safety, code of conduct, or security integrity rules. Users may request full account deletion and data export at any time.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-border flex items-center justify-between">
          <Link to="/">
            <VynkButton size="sm" variant="outline" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Home
            </VynkButton>
          </Link>
          <Link to="/privacy">
            <VynkButton size="sm" variant="primary">
              View Privacy Policy
            </VynkButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
