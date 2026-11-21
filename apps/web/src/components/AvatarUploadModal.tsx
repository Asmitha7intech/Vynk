import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Trash2, Camera, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';
import { VynkButton } from './vynk/VynkButton';
import { Avatar } from './Avatar';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  displayName: string;
  onAvatarUpdated: (newUrl: string | null) => void;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function AvatarUploadModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  displayName,
  onAvatarUpdated,
}: AvatarUploadModalProps) {
  const { updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Clean up object URL on unmount or file reset
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage('Invalid file format. Please choose a JPEG, PNG, WebP, or GIF image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limit is 5MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  const handleCancelPreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveAvatar = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const res = await api.uploadAvatar(selectedFile);
      if (res?.avatarUrl) {
        onAvatarUpdated(res.avatarUrl);
        updateUser({ avatarUrl: res.avatarUrl });
        setSuccessMessage('Profile photo updated successfully!');
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload profile photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await api.deleteAvatar();
      onAvatarUpdated(null);
      updateUser({ avatarUrl: null });
      setSuccessMessage('Profile photo removed.');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove profile photo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeDisplayUrl = previewUrl || currentAvatarUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-modal-title"
    >
      <div className="w-full max-w-md rounded-3xl glass-card border border-white/10 p-6 space-y-6 shadow-2xl relative bg-[#0B0F19]/95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 id="avatar-modal-title" className="text-base font-bold text-white">
                Profile Photo
              </h2>
              <p className="text-[11px] text-white/50">Preview and update your campus identity photo</p>
            </div>
          </div>
          <button
            onClick={() => {
              handleCancelPreview();
              onClose();
            }}
            disabled={isUploading || isDeleting}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close photo modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Photo Display and Preview Section */}
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-indigo-500/40 shadow-xl relative bg-card flex items-center justify-center">
              {activeDisplayUrl ? (
                <img
                  src={activeDisplayUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Avatar src={null} fallback={displayName} size="lg" className="w-full h-full text-4xl" />
              )}
            </div>

            {selectedFile && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-md whitespace-nowrap">
                New Preview
              </span>
            )}
          </div>

          {selectedFile ? (
            <div className="text-center space-y-0.5">
              <p className="text-xs font-semibold text-white truncate max-w-xs">{selectedFile.name}</p>
              <p className="text-[11px] text-white/50">{(selectedFile.size / 1024).toFixed(0)} KB ready to save</p>
            </div>
          ) : (
            <p className="text-xs text-white/50 text-center max-w-xs">
              Supports JPEG, PNG, WebP or GIF up to 5MB. Photo is stored persistently in the database.
            </p>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
          id="avatar-file-input"
        />

        {/* Action Controls */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          {selectedFile ? (
            <div className="flex items-center justify-between gap-3">
              <VynkButton
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelPreview}
                disabled={isUploading}
                className="flex-1"
              >
                Cancel Preview
              </VynkButton>
              <VynkButton
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveAvatar}
                isLoading={isUploading}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                className="flex-1"
              >
                Confirm & Save
              </VynkButton>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <VynkButton
                type="button"
                variant="primary"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="w-4 h-4" />}
                className="w-full"
              >
                Select Image from Device
              </VynkButton>

              {currentAvatarUrl && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={isDeleting}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-500/20 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Remove Current Photo</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
