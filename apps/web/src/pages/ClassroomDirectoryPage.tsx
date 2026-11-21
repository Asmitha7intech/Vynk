import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Shield,
  ArrowUpDown,
  Sparkles,
  ExternalLink,
  AlertCircle,
  GraduationCap,
  Building,
  KeyRound,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Avatar } from '../components/Avatar';
import { VynkButton } from '../components/vynk/VynkButton';

export function ClassroomDirectoryPage() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'studentId_asc'>('name_asc');

  // Claim Modal state
  const [claimingRecord, setClaimingRecord] = useState<any | null>(null);
  const [verifyStudentId, setVerifyStudentId] = useState('');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  const fetchDirectory = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.getDirectory({
        search,
        page,
        limit: 20,
        status: statusFilter,
        department: departmentFilter,
        sortBy,
      });
      if (res?.success) {
        setRecords(res.items || []);
        setMeta(res.meta || { total: 0, page: 1, limit: 20, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load classroom directory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory(1);
  }, [search, statusFilter, departmentFilter, sortBy]);

  const handleOpenClaimModal = (record: any) => {
    setClaimingRecord(record);
    setVerifyStudentId(record.studentId); // Pre-fill or let them enter
    setClaimError(null);
    setClaimSuccess(null);
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingRecord) return;
    if (!user) {
      setClaimError('Please sign in to claim your student directory profile.');
      return;
    }
    setIsSubmittingClaim(true);
    setClaimError(null);

    try {
      const res = await api.claimDirectoryRecord({
        directoryId: claimingRecord.id,
        studentId: verifyStudentId.trim(),
      });
      if (res?.success) {
        setClaimSuccess(`Successfully claimed profile for ${claimingRecord.originalDisplayName}!`);
        setTimeout(() => {
          setClaimingRecord(null);
          fetchDirectory(meta.page);
        }, 1500);
      } else {
        setClaimError(res?.message || 'Verification failed');
      }
    } catch (err: any) {
      setClaimError(err.message || 'Failed to claim record');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const claimedCount = records.filter((r) => r.isClaimed).length;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface via-surface/80 to-indigo-950/20 border border-surface-border p-6 md:p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-400">
              <Users className="w-3.5 h-3.5" />
              <span>ACADEMIC COHORT ROSTER (58 STUDENTS)</span>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Classroom Directory
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Official searchable student directory. Students can locate and claim their profile with academic verification, keeping peer networks authentic.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-background/80 border border-surface-border rounded-2xl px-4 py-2.5 text-center">
              <span className="block text-2xl font-black text-foreground">{meta.total}</span>
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Total Cohort</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2.5 text-center">
              <span className="block text-2xl font-black text-emerald-400">{claimedCount}</span>
              <span className="text-[10px] font-mono uppercase text-emerald-400">Claimed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface/50 border border-surface-border rounded-2xl p-4 backdrop-blur-md">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search classmate name or student ID (e.g. STU-2026-001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-surface-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Claim Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-background border border-surface-border text-xs rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Records</option>
            <option value="unclaimed">Unclaimed Only</option>
            <option value="claimed">Claimed Only</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-background border border-surface-border text-xs rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Departments</option>
            <option value="Computer Science & Engineering">CS & Engineering</option>
            <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
            <option value="Information Science & Engineering">Information Science</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-background border border-surface-border text-xs rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
          >
            <option value="name_asc">Name (A → Z)</option>
            <option value="name_desc">Name (Z → A)</option>
            <option value="studentId_asc">Student ID (Asc)</option>
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-surface/40 border border-surface-border animate-pulse p-5" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 bg-surface/30 rounded-3xl border border-surface-border p-8">
          <AlertCircle className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">No Directory Records Found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((student) => {
            const isUserClaimed = student.isClaimed && student.claimedUser;

            return (
              <div
                key={student.id}
                className="group relative flex flex-col justify-between rounded-2xl bg-surface/40 hover:bg-surface/70 border border-surface-border hover:border-indigo-500/30 p-5 transition-all duration-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={student.claimedUser?.avatarUrl}
                        alt={student.originalDisplayName}
                        fallback={student.originalDisplayName.slice(0, 2).toUpperCase()}
                        className="w-12 h-12 rounded-xl ring-1 ring-surface-border"
                      />
                      <div>
                        <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-indigo-400 transition-colors">
                          {student.originalDisplayName}
                        </h3>
                        <span className="font-mono text-xs text-muted-foreground">
                          {student.studentId}
                        </span>
                      </div>
                    </div>

                    {student.isClaimed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Claimed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-400">
                        <Clock className="w-3 h-3" /> Unclaimed
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-muted-foreground/70" />
                      <span className="truncate">{student.department}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/70" />
                      <span>{student.cohort || `Batch ${student.graduationYear}`}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-surface-border/60 flex items-center justify-between">
                  {student.isClaimed && student.claimedUser ? (
                    <Link
                      to={`/profile/${student.claimedUser.username}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300"
                    >
                      <span>View Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleOpenClaimModal(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Claim This Profile</span>
                    </button>
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground/60">
                    ID: {student.studentId}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => fetchDirectory(meta.page - 1)}
            disabled={meta.page <= 1}
            className="px-4 py-2 rounded-xl bg-surface border border-surface-border text-xs font-medium text-foreground disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs font-mono text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            onClick={() => fetchDirectory(meta.page + 1)}
            disabled={meta.page >= meta.totalPages}
            className="px-4 py-2 rounded-xl bg-surface border border-surface-border text-xs font-medium text-foreground disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Claim Profile Modal */}
      {claimingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-surface border border-surface-border p-6 shadow-2xl space-y-5">
            <button
              onClick={() => setClaimingRecord(null)}
              className="absolute right-5 top-5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Claim Student Profile</h3>
                <p className="text-xs text-muted-foreground">Link your registered account to the academic roster</p>
              </div>
            </div>

            <div className="bg-background/80 rounded-2xl p-4 border border-surface-border space-y-1">
              <div className="text-xs text-muted-foreground">Classmate Name:</div>
              <div className="font-bold text-base text-foreground">{claimingRecord.originalDisplayName}</div>
              <div className="text-xs font-mono text-indigo-400">{claimingRecord.department}</div>
            </div>

            {claimError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {claimError}
              </div>
            )}

            {claimSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{claimSuccess}</span>
              </div>
            )}

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-muted-foreground uppercase mb-1.5">
                  Confirm Student ID / USN:
                </label>
                <input
                  type="text"
                  value={verifyStudentId}
                  onChange={(e) => setVerifyStudentId(e.target.value)}
                  placeholder="e.g. STU-2026-013"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-surface-border text-sm text-foreground focus:outline-none focus:border-indigo-500 font-mono"
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Verify against official university registration identifier.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimingRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <VynkButton
                  type="submit"
                  disabled={isSubmittingClaim}
                  className="px-5 py-2 text-xs font-bold"
                >
                  {isSubmittingClaim ? 'Verifying...' : 'Verify & Claim Profile'}
                </VynkButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default ClassroomDirectoryPage;
