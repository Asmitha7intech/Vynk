import React from 'react';
import { Shield, AlertTriangle, ArrowLeft, Lock, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VynkButton } from '../components/vynk/VynkButton';

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Legal Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-mono font-bold uppercase tracking-wider block">
            REQUIRES LEGAL REVIEW · DIGITAL PERSONAL DATA PROTECTION ACT (DPDP ACT 2023) NOTICE
          </span>
          <p className="text-amber-200/90 leading-relaxed">
            This Privacy Policy describes data governance under the Digital Personal Data Protection Act, 2023 (DPDP Act, India). It must undergo formal institutional legal counsel review before commercial rollout.
          </p>
        </div>
      </div>

      <div className="p-8 sm:p-10 rounded-3xl glass-card space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
            <Lock className="w-4 h-4" />
            <span>CAMPUS DATA GOVERNANCE & PRIVACY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Effective Date: November 2026</p>
        </div>

        <div className="space-y-6 text-xs text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">1. Data Fiduciary & Student Rights</h2>
            <p>
              Under the Digital Personal Data Protection Act, 2023, VYNK acts as the Data Fiduciary for student personal data processed on the platform. As a Data Principal, you possess the right to access your personal data, rectify inaccuracies, withdraw consent, and request erasure of your profile.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">2. Information We Collect</h2>
            <p>
              We collect information strictly necessary to provide student networking and collaboration services:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Registration Data:</strong> Name, university email address, college, department, and graduation year.</li>
              <li><strong>Portfolio Data:</strong> Technical skills, interests, project links (GitHub/live URLs), and voyage milestones.</li>
              <li><strong>Interaction Telemetry:</strong> Connection requests, messaging (end-to-end access controlled), and quest completions.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">3. How Your Data Is Protected</h2>
            <p>
              All passwords are encrypted using state-of-the-art Argon2id hashing. Session tokens are rotated on each refresh with cryptographic family tracking to detect reuse. Uploaded assets are strictly validated for MIME type, dimensions, and magic byte signatures before storage in isolated, private object buckets.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">4. No Sale of Student Data</h2>
            <p>
              VYNK never sells, rents, or monetizes student personal data to third-party ad networks or data brokers. Analytics events collected are anonymized and processed solely for platform security, infrastructure telemetry, and skill matching.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">5. Data Erasure & Right to be Forgotten</h2>
            <p>
              Students may delete their account or export all stored personal data at any time via Profile Settings. Upon account deletion, all personal data, sessions, and private messages are permanently purged from active PostgreSQL databases within 30 days.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-border flex items-center justify-between">
          <Link to="/">
            <VynkButton size="sm" variant="outline" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Home
            </VynkButton>
          </Link>
          <Link to="/terms">
            <VynkButton size="sm" variant="primary">
              View Terms of Service
            </VynkButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
