import React, { useState, useRef, useEffect, useMemo } from 'react';
import { COIMBATORE_INSTITUTIONS, CoimbatoreInstitution } from '@vynk/types';
import { Building2, Search, Check, ChevronDown, MapPin, Sparkles, Filter } from 'lucide-react';

interface CollegeSelectProps {
  value: string;
  customValue: string;
  onChange: (collegeName: string) => void;
  onCustomChange: (customName: string) => void;
  disabled?: boolean;
}

export const OTHER_OPTION = 'Other / Not Listed';

export function CollegeSelect({
  value,
  customValue,
  onChange,
  onCustomChange,
  disabled = false,
}: CollegeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered and sorted colleges
  const filteredColleges = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return COIMBATORE_INSTITUTIONS.filter((inst) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'ENGINEERING' && inst.category !== 'Engineering & Technology') return false;
        if (selectedCategory === 'ARTS_SCIENCE' && inst.category !== 'Arts, Science & Commerce') return false;
        if (selectedCategory === 'UNIVERSITIES' && inst.category !== 'Universities & Deemed Universities') return false;
        if (selectedCategory === 'DISTRICT' && inst.areaScope !== 'Coimbatore District') return false;
      }

      // Search query filter
      if (!q) return true;
      const matchName = inst.name.toLowerCase().includes(q);
      const matchShort = inst.shortName.toLowerCase().includes(q);
      const matchLocation = inst.location.toLowerCase().includes(q);
      const matchCategory = inst.category.toLowerCase().includes(q);
      const matchCode = (inst.code || '').toLowerCase().includes(q);
      return matchName || matchShort || matchLocation || matchCategory || matchCode;
    }).sort((a, b) => {
      // Keep CIT prioritized when matching
      if (a.id === 'cbe-cit') return -1;
      if (b.id === 'cbe-cit') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, selectedCategory]);

  // Selected item label
  const selectedLabel = useMemo(() => {
    if (value === OTHER_OPTION) return OTHER_OPTION;
    const match = COIMBATORE_INSTITUTIONS.find((c) => c.name === value);
    return match ? match.name : value || 'Select College / Institution';
  }, [value]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredColleges.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredColleges.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredColleges.length) {
        selectCollege(filteredColleges[highlightedIndex].name);
      } else if (highlightedIndex === filteredColleges.length) {
        selectCollege(OTHER_OPTION);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const selectCollege = (collegeName: string) => {
    onChange(collegeName);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="text-[11px] font-semibold text-white/70 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" /> College / Institution
        </span>
        <span className="text-[10px] text-emerald-400 font-medium">Coimbatore District Directory</span>
      </label>

      {/* Main Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left flex items-center justify-between border transition-all text-xs ${
          isOpen
            ? 'bg-[#181824] border-indigo-500 ring-2 ring-indigo-500/20'
            : 'bg-[#13131c] border-white/10 hover:border-white/20'
        } ${value ? 'text-white' : 'text-white/40'}`}
      >
        <div className="flex flex-col truncate pr-2">
          <span className="truncate font-medium text-white">{selectedLabel}</span>
          {value && value !== OTHER_OPTION && (
            <span className="text-[10px] text-muted-foreground truncate">
              {COIMBATORE_INSTITUTIONS.find((c) => c.name === value)?.location || 'Coimbatore'}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-white/50 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Quick Pinned Selection for Coimbatore Institute of Technology */}
      {value !== 'Coimbatore Institute of Technology (CIT)' && (
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-white/50">Quick select:</span>
          <button
            type="button"
            onClick={() => selectCollege('Coimbatore Institute of Technology (CIT)')}
            className="text-[10px] font-medium text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/30 transition-colors flex items-center gap-1 min-h-[24px]"
          >
            <Sparkles className="w-2.5 h-2.5 text-amber-300" /> CIT Coimbatore
          </button>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#13131c] border border-white/15 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Search Input */}
          <div className="p-2.5 border-b border-white/10 bg-[#181824]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search college name, acronym (CIT, PSG, GCT), area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-400"
              />
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pt-2 no-scrollbar text-[10px]">
              {[
                { id: 'ALL', label: 'All (40+)' },
                { id: 'ENGINEERING', label: 'Engineering' },
                { id: 'ARTS_SCIENCE', label: 'Arts & Science' },
                { id: 'UNIVERSITIES', label: 'Universities' },
                { id: 'DISTRICT', label: 'District (Pollachi/Sulur)' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors min-h-[22px] ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* College Options List */}
          <div ref={listRef} className="max-h-60 overflow-y-auto divide-y divide-white/5 p-1">
            {filteredColleges.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-white/60">No matching college found in Coimbatore directory.</p>
                <button
                  type="button"
                  onClick={() => selectCollege(OTHER_OPTION)}
                  className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
                >
                  Choose "Other / Not Listed" to enter manually
                </button>
              </div>
            ) : (
              filteredColleges.map((college, idx) => {
                const isSelected = value === college.name;
                const isHighlighted = highlightedIndex === idx;

                return (
                  <button
                    key={college.id}
                    type="button"
                    onClick={() => selectCollege(college.name)}
                    className={`w-full min-h-[44px] px-3 py-2 text-left rounded-lg transition-colors flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-indigo-600/20 text-white'
                        : isHighlighted
                        ? 'bg-white/10 text-white'
                        : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium text-white truncate">{college.name}</span>
                        {college.id === 'cbe-cit' && (
                          <span className="text-[9px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-400/30">
                            CIT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/50">
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                          {college.location}
                        </span>
                        <span>•</span>
                        <span className="text-white/40">{college.category}</span>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                  </button>
                );
              })
            )}

            {/* Other / Not Listed option */}
            <button
              type="button"
              onClick={() => selectCollege(OTHER_OPTION)}
              className={`w-full min-h-[44px] px-3 py-2.5 text-left rounded-lg transition-colors flex items-center justify-between text-xs font-semibold ${
                value === OTHER_OPTION
                  ? 'bg-indigo-600/20 text-indigo-300'
                  : highlightedIndex === filteredColleges.length
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>➕ {OTHER_OPTION}</span>
                <span className="text-[10px] font-normal text-muted-foreground">(Enter custom institution)</span>
              </div>
              {value === OTHER_OPTION && <Check className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      )}

      {/* Custom College Input Field (shown when Other / Not Listed is active) */}
      {value === OTHER_OPTION && (
        <div className="space-y-1 pt-1 animate-in fade-in duration-200">
          <label className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
            Specify Your Institution Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. PSG Institute of Management / Non-Coimbatore University"
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            className="w-full min-h-[44px] bg-white/5 border border-indigo-500/40 text-white placeholder:text-white/30 text-xs px-3 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
