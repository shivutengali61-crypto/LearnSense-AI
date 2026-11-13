import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { LanguageCode } from '../types/learnsense';

interface AccountSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ open, onClose }) => {
  const { user, isDemoMode, updateCurrentProfile, theme, toggleTheme } = useWorkspace();

  const [name, setName] = useState(user?.name ?? '');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(
    user?.preferredLanguage ?? 'en'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }

    setSaving(true);
    try {
      await updateCurrentProfile({
        name: name.trim(),
        preferredLanguage,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update account settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F3A]/60 dark:bg-black/75 backdrop-blur-[2px] p-4"
    >
      <div className="ls-modal-enter w-full max-w-md rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#DCE5F2] dark:border-[#1D3557] pb-3">
          <div>
            <h2 id="account-settings-title" className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
              Account Preferences
            </h2>
            <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">{user.email}</p>
          </div>
          <button
            type="button"
            aria-label="Close account settings"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#475D7C] dark:text-[#9EB3D1] hover:bg-[#EAF1FB] dark:hover:bg-[#142D52] hover:text-[#0B1F3A] dark:hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="acct-name" className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
              Full Name
            </label>
            <input
              id="acct-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="acct-lang" className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
              Preferred Explanation Language
            </label>
            <select
              id="acct-lang"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)}
              className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
            >
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ (Kannada + English)</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/70 p-3">
            <div>
              <span className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200">Appearance Theme</span>
              <span className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                Currently {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 hover:bg-[#EAF1FB] dark:hover:bg-[#142D52] cursor-pointer"
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>

          <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/70 p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#0B1F3A] dark:text-slate-200">Portal Role</span>
              <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-[#0B1F3A] dark:text-slate-100">
                <Lock className="h-3 w-3 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
                {user.role === 'admin' ? 'Administrator' : user.role === 'teacher' ? 'Teacher' : 'Student'}
              </span>
            </div>
            <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
              {isDemoMode
                ? 'Demo Preview Mode: use the sidebar Switch Portal buttons to preview Student, Teacher, or Administrator.'
                : 'Role locked by Firestore account permissions and cannot be modified client-side.'}
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[#DCE5F2] dark:border-[#1D3557] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] px-3.5 py-2 text-xs font-semibold text-[#0B1F3A] dark:text-slate-300 hover:bg-[#EAF1FB] dark:hover:bg-[#142D52] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#0F294A] dark:bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-[#0369A1] cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
