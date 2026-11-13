import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  CheckCheck,
  ClipboardCheck,
  Megaphone,
  Menu,
  MessageSquare,
  Moon,
  RefreshCw,
  Search,
  Sun,
  UserCheck,
  X,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  computeUnreadNotificationsCount,
  searchWorkspaceEntities,
} from '../utils/communication';
import type { AppNotification, NotificationType, WorkspaceSearchResult } from '../types/learnsense';

interface TopNavBarProps {
  title: string;
  subtitle?: React.ReactNode;
  mobileMenuOpen: boolean;
  onOpenMobileMenu: () => void;
  onNavigate: (params: {
    tab: string;
    classroomId?: string;
    targetId?: string;
    kind?: WorkspaceSearchResult['kind'] | NotificationType;
  }) => void;
  onOpenSettings: () => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant: 'teacher' | 'student' | 'admin';
  };
}

function getNotificationCategoryLabel(type: NotificationType): string {
  switch (type) {
    case 'teacher_message':
      return 'Teacher Message';
    case 'student_message':
      return 'Student Message';
    case 'announcement':
      return 'Announcement';
    case 'material_published':
      return 'Study Material';
    case 'assessment_published':
      return 'New Test';
    case 'assessment_deadline':
      return 'Deadline';
    case 'assessment_result':
      return 'Test Result';
  }
}

function getSearchKindLabel(kind: WorkspaceSearchResult['kind']): string {
  switch (kind) {
    case 'classroom':
      return 'Classroom';
    case 'student':
      return 'Student';
    case 'material':
      return 'Material';
    case 'assessment':
      return 'Assessment';
    case 'announcement':
      return 'Announcement';
    case 'conversation':
      return 'Message';
  }
}

function formatShortTimestamp(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return '';
  const date = new Date(ms);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  title,
  subtitle,
  mobileMenuOpen,
  onOpenMobileMenu,
  onNavigate,
  onOpenSettings,
  primaryAction,
}) => {
  const {
    user,
    theme,
    toggleTheme,
    dataLoading,
    refreshWorkspace,
    workspace,
    allNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    setActiveConversationId,
  } = useWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(
    () => computeUnreadNotificationsCount(allNotifications),
    [allNotifications]
  );

  const searchResults = useMemo(
    () =>
      searchWorkspaceEntities({
        queryText: searchQuery,
        user,
        classrooms: workspace.classrooms,
        materials: workspace.materials,
        assessments: workspace.assessments,
        announcements: workspace.announcements,
        conversations: workspace.conversations,
      }),
    [
      searchQuery,
      user,
      workspace.classrooms,
      workspace.materials,
      workspace.assessments,
      workspace.announcements,
      workspace.conversations,
    ]
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setSearchOpen(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectSearchResult = (item: WorkspaceSearchResult) => {
    if (item.kind === 'conversation') {
      setActiveConversationId(item.targetId);
    }
    onNavigate({
      tab: item.targetTab,
      classroomId: item.classroomId,
      targetId: item.targetId,
      kind: item.kind,
    });
    setSearchQuery('');
    setSearchOpen(false);
  };

  const handleSelectNotification = async (notif: AppNotification) => {
    if (!notif.read) {
      await markNotificationRead(notif.id);
    }
    if (notif.type === 'teacher_message' || notif.type === 'student_message') {
      setActiveConversationId(notif.targetId);
    }
    onNavigate({
      tab: notif.targetTab,
      classroomId: notif.classroomId,
      targetId: notif.targetId,
      kind: notif.type,
    });
    setNotifOpen(false);
  };

  const userInitials = useMemo(() => {
    const parts = (user?.name || 'LS').trim().split(/\s+/);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || 'LS';
  }, [user?.name]);

  const accentButtonClass =
    primaryAction?.variant === 'student'
      ? 'bg-[#0284C7] hover:bg-[#0369A1] dark:bg-sky-600 dark:hover:bg-sky-500'
      : 'bg-[#0F294A] hover:bg-[#173B69] dark:bg-sky-600 dark:hover:bg-sky-500';

  return (
    <header className="sticky top-0 z-30 border-b border-[#DCE5F2] dark:border-[#1D3557] bg-white/95 dark:bg-[#0B1F3A]/95 backdrop-blur-sm px-4 sm:px-6 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mobile Drawer Trigger + Active Classroom Context */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={onOpenMobileMenu}
            className="lg:hidden rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="min-w-0">
            <h1 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-50 truncate">
              {title}
            </h1>
            {subtitle && (
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Right: Global Search + Controls + Notifications + Theme + Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Workspace Search */}
          <div ref={searchContainerRef} className="relative hidden md:block w-64 lg:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
            <label htmlFor="global-workspace-search" className="sr-only">
              Search classrooms, students, materials, tests, and messages
            </label>
            <input
              id="global-workspace-search"
              type="search"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search classes, notes, tests..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />

            {searchOpen && searchQuery.trim().length > 0 && (
              <div
                role="listbox"
                aria-label="Search results"
                className="absolute right-0 mt-2 w-88 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden z-40"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Workspace Matches</span>
                  <span className="font-mono tabular-nums">{searchResults.length}</span>
                </div>
                {searchResults.length === 0 ? (
                  <p className="px-3.5 py-4 text-xs text-slate-500 dark:text-slate-400">
                    No matching classrooms, materials, tests, or threads found.
                  </p>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSearchResult(item)}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] font-medium text-[#0284C7] dark:text-sky-400">
                          {getSearchKindLabel(item.kind)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notification Centre Popover */}
          <div ref={notifContainerRef} className="relative">
            <button
              type="button"
              aria-label={`Notifications (${unreadCount} unread)`}
              aria-expanded={notifOpen}
              onClick={() => setNotifOpen((prev) => !prev)}
              className="relative inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  data-testid="unread-notifications-badge"
                  className="ml-1.5 font-mono text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums"
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <section
                aria-label="Notification Centre"
                className="absolute right-0 mt-2 w-88 sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-40"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Notifications
                    </h2>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {unreadCount} unread
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsRead()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Mark all read
                    </button>
                  )}
                </div>

                {allNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    No notifications yet. Real messages, announcements, test deadlines, and evaluation updates appear here automatically.
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {allNotifications.slice(0, 20).map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3.5 transition-colors ${
                          notif.read
                            ? 'bg-white dark:bg-[#0F1E36]'
                            : 'bg-sky-50/70 dark:bg-[#142D52]/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectNotification(notif)}
                            className="flex-1 text-left cursor-pointer min-w-0 space-y-1"
                          >
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0284C7] dark:text-sky-400">
                              {notif.type === 'announcement' ? (
                                <Megaphone className="h-3 w-3 shrink-0" aria-hidden="true" />
                              ) : notif.type === 'material_published' ? (
                                <BookOpen className="h-3 w-3 shrink-0" aria-hidden="true" />
                              ) : notif.type === 'assessment_result' ||
                                notif.type === 'assessment_published' ||
                                notif.type === 'assessment_deadline' ? (
                                <ClipboardCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
                              ) : (
                                <MessageSquare className="h-3 w-3 shrink-0" aria-hidden="true" />
                              )}
                              <span>{getNotificationCategoryLabel(notif.type)}</span>
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                                ·
                              </span>
                              <span className="font-normal text-slate-500 dark:text-slate-400 tabular-nums">
                                {formatShortTimestamp(notif.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {notif.title}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                              {notif.body}
                            </p>
                          </button>

                          {!notif.read && (
                            <button
                              type="button"
                              onClick={() => markNotificationRead(notif.id)}
                              className="shrink-0 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                            >
                              Read
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {/* Refresh Sync */}
          <button
            type="button"
            onClick={() => refreshWorkspace()}
            disabled={dataLoading}
            aria-label="Refresh workspace sync"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${dataLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span className="hidden lg:inline">{dataLoading ? 'Syncing...' : 'Refresh'}</span>
          </button>

          {/* Profile Shortcut */}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open profile and account settings"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#0F294A] dark:bg-[#0284C7] text-[11px] font-bold text-white">
              {userInitials}
            </span>
            <span className="hidden xl:inline max-w-[110px] truncate">{user?.name}</span>
            <UserCheck className="hidden xl:inline h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          </button>

          {/* Primary Portal Action */}
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className={`hidden sm:inline-flex rounded-lg px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer ${accentButtonClass}`}
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Input Row */}
      <div className="mt-2.5 md:hidden relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <label htmlFor="mobile-workspace-search" className="sr-only">
          Search workspace
        </label>
        <input
          id="mobile-workspace-search"
          type="search"
          value={searchQuery}
          onFocus={() => setSearchOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchOpen(true);
          }}
          placeholder="Search classrooms, notes, tests..."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
        />
        {searchOpen && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-40 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {searchResults.length === 0 ? (
              <p className="p-3 text-xs text-slate-500 dark:text-slate-400">No matches found.</p>
            ) : (
              searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {item.subtitle}
                  </p>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </header>
  );
};
