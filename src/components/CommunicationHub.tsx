import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCheck,
  Megaphone,
  MessageSquare,
  Plus,
  Search,
  Send,
  Users,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  getMessageReadStatusLabel,
  sortAnnouncementsByRecent,
  sortConversationsByRecent,
} from '../utils/communication';

interface CommunicationHubProps {
  initialSection?: 'messages' | 'announcements';
  onOpenMaterials?: (classroomId: string) => void;
}

type ThreadScope = 'all' | 'direct' | 'classroom';

function formatMessageTime(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return '';
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const CommunicationHub: React.FC<CommunicationHubProps> = ({
  initialSection = 'messages',
  onOpenMaterials,
}) => {
  const {
    user,
    workspace,
    selectedClassroomId,
    activeConversationId,
    setActiveConversationId,
    startDirectConversation,
    startClassroomConversation,
    sendMessage,
    markConversationRead,
    publishAnnouncement,
    acknowledgeAnnouncement,
  } = useWorkspace();

  const [section, setSection] = useState<'messages' | 'announcements'>(initialSection);
  const [threadScope, setThreadScope] = useState<ThreadScope>('all');
  const [threadSearch, setThreadSearch] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Composer state
  const [messageInput, setMessageInput] = useState('');
  const [attachedMaterialId, setAttachedMaterialId] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  // Start new thread controls
  const [newDirectStudentUid, setNewDirectStudentUid] = useState('');
  const [newThreadClassroomId, setNewThreadClassroomId] = useState(
    selectedClassroomId || workspace.classrooms[0]?.id || ''
  );
  const [threadActionError, setThreadActionError] = useState<string | null>(null);

  // Announcement composer (teacher)
  const [annClassroomId, setAnnClassroomId] = useState(
    selectedClassroomId || workspace.classrooms[0]?.id || ''
  );
  const [annPriority, setAnnPriority] = useState<'normal' | 'important'>('normal');
  const [annMaterialId, setAnnMaterialId] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [publishingAnn, setPublishingAnn] = useState(false);
  const [annError, setAnnError] = useState<string | null>(null);
  const [annSuccess, setAnnSuccess] = useState<string | null>(null);

  const messagesFeedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    if (selectedClassroomId) {
      setNewThreadClassroomId((prev) => prev || selectedClassroomId);
      setAnnClassroomId((prev) => prev || selectedClassroomId);
    }
  }, [selectedClassroomId]);

  const sortedConversations = useMemo(
    () => sortConversationsByRecent(workspace.conversations),
    [workspace.conversations]
  );

  const filteredConversations = useMemo(() => {
    const q = threadSearch.trim().toLowerCase();
    return sortedConversations.filter((c) => {
      if (threadScope !== 'all' && c.type !== threadScope) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.classroomName.toLowerCase().includes(q) ||
        (c.studentName && c.studentName.toLowerCase().includes(q)) ||
        c.lastMessageText.toLowerCase().includes(q)
      );
    });
  }, [sortedConversations, threadScope, threadSearch]);

  const activeConversation = useMemo(
    () =>
      sortedConversations.find((c) => c.id === activeConversationId) ??
      filteredConversations[0] ??
      sortedConversations[0] ??
      null,
    [sortedConversations, filteredConversations, activeConversationId]
  );

  const activeMessages = useMemo(
    () =>
      activeConversation
        ? workspace.messagesByConversation[activeConversation.id] ?? []
        : [],
    [activeConversation, workspace.messagesByConversation]
  );

  const threadClassroom = useMemo(
    () =>
      workspace.classrooms.find((c) => c.id === newThreadClassroomId) ??
      workspace.classrooms[0] ??
      null,
    [workspace.classrooms, newThreadClassroomId]
  );

  const activeConversationMaterials = useMemo(
    () =>
      activeConversation
        ? workspace.materials.filter((m) => m.classroomId === activeConversation.classroomId)
        : [],
    [workspace.materials, activeConversation]
  );

  const annClassroomMaterials = useMemo(
    () =>
      workspace.materials.filter(
        (m) => m.classroomId === (annClassroomId || workspace.classrooms[0]?.id)
      ),
    [workspace.materials, workspace.classrooms, annClassroomId]
  );

  const sortedAnnouncements = useMemo(
    () => sortAnnouncementsByRecent(workspace.announcements),
    [workspace.announcements]
  );

  // Sync activeConversationId when conversations arrive
  useEffect(() => {
    if (!activeConversationId && sortedConversations[0]) {
      setActiveConversationId(sortedConversations[0].id);
    }
  }, [activeConversationId, sortedConversations, setActiveConversationId]);

  // Mark active conversation read when opened or when new incoming messages arrive while viewing
  useEffect(() => {
    if (!user || !activeConversation || section !== 'messages') return;
    const hasUnreadCount = (activeConversation.unreadCounts?.[user.uid] ?? 0) > 0;
    const hasUnreadMsgs = activeMessages.some(
      (m) => m.senderUid !== user.uid && !m.readBy?.[user.uid]
    );
    if (hasUnreadCount || hasUnreadMsgs) {
      markConversationRead(activeConversation.id).catch(() => {});
    }
  }, [user, activeConversation, activeMessages, section, markConversationRead]);

  useEffect(() => {
    const el = messagesFeedRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [activeMessages.length, activeConversation?.id]);

  const handleStartDirect = async () => {
    if (!threadClassroom) return;
    setThreadActionError(null);
    try {
      const conv = await startDirectConversation(
        threadClassroom.id,
        user?.role === 'teacher' ? newDirectStudentUid : user?.uid
      );
      setActiveConversationId(conv.id);
      setMobileShowChat(true);
    } catch (err) {
      setThreadActionError(err instanceof Error ? err.message : 'Unable to start direct thread.');
    }
  };

  const handleOpenClassChannel = async () => {
    if (!threadClassroom) return;
    setThreadActionError(null);
    try {
      const conv = await startClassroomConversation(threadClassroom.id);
      setActiveConversationId(conv.id);
      setMobileShowChat(true);
    } catch (err) {
      setThreadActionError(
        err instanceof Error ? err.message : 'Unable to open classroom channel.'
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation) return;
    setMessageError(null);
    setSendingMessage(true);
    try {
      const mat = attachedMaterialId
        ? activeConversationMaterials.find((m) => m.id === attachedMaterialId)
        : undefined;
      await sendMessage(
        activeConversation.id,
        messageInput,
        mat ? { id: mat.id, title: mat.title } : undefined
      );
      setMessageInput('');
      setAttachedMaterialId('');
    } catch (err) {
      setMessageError(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnError(null);
    setAnnSuccess(null);
    setPublishingAnn(true);
    try {
      const targetClassroomId = annClassroomId || workspace.classrooms[0]?.id || '';
      const created = await publishAnnouncement({
        classroomId: targetClassroomId,
        title: annTitle,
        body: annBody,
        priority: annPriority,
        materialId: annMaterialId || undefined,
      });
      setAnnTitle('');
      setAnnBody('');
      setAnnMaterialId('');
      setAnnPriority('normal');
      setAnnSuccess(`Published announcement "${created.title}" to ${created.classroomName}.`);
    } catch (err) {
      setAnnError(err instanceof Error ? err.message : 'Unable to publish announcement.');
    } finally {
      setPublishingAnn(false);
    }
  };

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const ownBubbleBg = isTeacher
    ? 'bg-[#0F294A] text-white'
    : 'bg-[#0284C7] text-white';

  return (
    <div className="space-y-6">
      {/* Top Section Header + Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-50">
            Communication &amp; Classroom Announcements
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time direct mentoring, classroom discussions, and shared material updates synchronized via Firestore.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setSection('messages')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
              section === 'messages'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            Messages ({sortedConversations.length})
          </button>
          <button
            type="button"
            onClick={() => setSection('announcements')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
              section === 'announcements'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
            Announcements ({sortedAnnouncements.length})
          </button>
        </div>
      </div>

      {section === 'messages' ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
          {/* Left Thread Directory */}
          <aside
            aria-label="Conversation Directory"
            className={`md:col-span-5 lg:col-span-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col ${
              mobileShowChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
              {/* Quick New Conversation Bar */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="comm-classroom-select" className="sr-only">
                    Classroom for new conversation
                  </label>
                  <select
                    id="comm-classroom-select"
                    value={threadClassroom?.id ?? ''}
                    onChange={(e) => {
                      setNewThreadClassroomId(e.target.value);
                      setNewDirectStudentUid('');
                    }}
                    className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  >
                    {workspace.classrooms.length === 0 ? (
                      <option value="">No classrooms yet</option>
                    ) : (
                      workspace.classrooms.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    )}
                  </select>

                  {isTeacher ? (
                    <button
                      type="button"
                      disabled={!threadClassroom}
                      onClick={handleOpenClassChannel}
                      title="Open classroom-wide channel"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      Class Chat
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!threadClassroom}
                      onClick={handleStartDirect}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#0284C7] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Message Teacher
                    </button>
                  )}
                </div>

                {isTeacher && threadClassroom && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="comm-student-select" className="sr-only">
                      Select student for direct message
                    </label>
                    <select
                      id="comm-student-select"
                      value={newDirectStudentUid}
                      onChange={(e) => setNewDirectStudentUid(e.target.value)}
                      className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select student for 1:1 message...</option>
                      {threadClassroom.students.map((s) => (
                        <option key={s.uid} value={s.uid}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!newDirectStudentUid}
                      onClick={handleStartDirect}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#0F294A] dark:bg-[#0284C7] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-[#0369A1] cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Direct
                    </button>
                  </div>
                )}

                {threadActionError && (
                  <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                    {threadActionError}
                  </p>
                )}
              </div>

              {/* Search & Filter Tabs */}
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <label htmlFor="comm-thread-search" className="sr-only">
                  Search conversations
                </label>
                <input
                  id="comm-thread-search"
                  type="search"
                  value={threadSearch}
                  onChange={(e) => setThreadSearch(e.target.value)}
                  placeholder="Filter messages or students..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                {(['all', 'direct', 'classroom'] as ThreadScope[]).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => setThreadScope(scope)}
                    className={`rounded-md py-1 text-[11px] font-semibold capitalize cursor-pointer ${
                      threadScope === scope
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {scope === 'classroom' ? 'Classrooms' : scope}
                  </button>
                ))}
              </div>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No conversations match your filter yet. Start a direct thread or classroom channel above.
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const selected = activeConversation?.id === conv.id;
                  const unread = user ? conv.unreadCounts?.[user.uid] ?? 0 : 0;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        setMobileShowChat(true);
                      }}
                      className={`w-full p-3.5 text-left transition-colors cursor-pointer ${
                        selected
                          ? 'bg-sky-50/80 dark:bg-[#142D52]'
                          : 'hover:bg-[#F8FAFE] dark:hover:bg-[#142D52]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {conv.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {conv.classroomName}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                            {formatMessageTime(conv.lastMessageAt)}
                          </span>
                          {unread > 0 && (
                            <span className="inline-flex items-center justify-center rounded-md bg-[#0284C7] px-1.5 py-0.5 font-mono text-[10px] font-bold text-white tabular-nums">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 truncate">
                        {conv.lastMessageText}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right Live Message Stream */}
          <section
            aria-label="Active Conversation"
            className={`md:col-span-7 lg:col-span-8 flex flex-col min-h-[560px] ${
              !mobileShowChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {!activeConversation ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
                <MessageSquare className="h-8 w-8 text-slate-400" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Select a conversation to begin
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Message an individual student or open a classroom discussion channel from the left directory.
                </p>
              </div>
            ) : (
              <>
                {/* Conversation Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setMobileShowChat(false)}
                      className="md:hidden inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      Threads
                    </button>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {activeConversation.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                        {activeConversation.classroomName} ·{' '}
                        {activeConversation.type === 'classroom'
                          ? `${activeConversation.participantUids.length} participants`
                          : `Direct with ${
                              isTeacher
                                ? activeConversation.studentName ?? 'Student'
                                : activeConversation.teacherName
                            }`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Message Feed */}
                <div ref={messagesFeedRef} className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[420px]">
                  {activeMessages.length === 0 ? (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      No messages in this thread yet. Write your first message below to start the conversation.
                    </div>
                  ) : (
                    activeMessages.map((msg) => {
                      const isOwn = msg.senderUid === user?.uid;
                      const readLabel = user
                        ? getMessageReadStatusLabel(msg, activeConversation, user.uid)
                        : '';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                        >
                          <div className="mb-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {isOwn ? 'You' : msg.senderName}
                            </span>
                            <span className="capitalize">({msg.senderRole})</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                          </div>

                          <div
                            className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed space-y-2 ${
                              isOwn
                                ? ownBubbleBg
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                            {msg.materialTitle && (
                              <button
                                type="button"
                                onClick={() => onOpenMaterials?.(activeConversation.classroomId)}
                                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                                  isOwn
                                    ? 'bg-white/15 text-white hover:bg-white/25'
                                    : 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-600'
                                }`}
                              >
                                <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                <span>Material: {msg.materialTitle}</span>
                              </button>
                            )}
                          </div>

                          {isOwn && readLabel && (
                            <span className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              {readLabel === 'Sent' ? (
                                <Check className="h-3 w-3" aria-hidden="true" />
                              ) : (
                                <CheckCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                              )}
                              {readLabel}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Composer */}
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-2.5 bg-slate-50/70 dark:bg-slate-900/80"
                >
                  {activeConversationMaterials.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="chat-attach-material"
                        className="text-xs font-medium text-slate-600 dark:text-slate-400"
                      >
                        Share study material (optional):
                      </label>
                      <select
                        id="chat-attach-material"
                        value={attachedMaterialId}
                        onChange={(e) => setAttachedMaterialId(e.target.value)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100"
                      >
                        <option value="">None</option>
                        {activeConversationMaterials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {messageError && (
                    <div
                      role="alert"
                      className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs text-rose-800 dark:text-rose-200"
                    >
                      {messageError}
                    </div>
                  )}

                  <div className="flex items-end gap-2.5">
                    <label htmlFor="chat-message-input" className="sr-only">
                      Write a message
                    </label>
                    <textarea
                      id="chat-message-input"
                      rows={2}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (messageInput.trim() && !sendingMessage) {
                            handleSendMessage(e as unknown as React.FormEvent);
                          }
                        }
                      }}
                      placeholder={`Reply to ${activeConversation.title}...`}
                      className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !messageInput.trim()}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold text-white cursor-pointer disabled:opacity-50 whitespace-nowrap ${
                        isTeacher
                          ? 'bg-[#0F294A] hover:bg-[#173B69] dark:bg-[#0284C7] dark:hover:bg-[#0369A1]'
                          : 'bg-[#0284C7] hover:bg-[#0369A1]'
                      }`}
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      {sendingMessage ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      ) : (
        /* Announcements View */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {isTeacher && (
            <section className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 h-fit">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  Publish Classroom Announcement
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Broadcast important updates or study material reminders to all enrolled students.
                </p>
              </div>

              <form onSubmit={handlePublishAnnouncement} className="space-y-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="ann-classroom"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Classroom
                    </label>
                    <select
                      id="ann-classroom"
                      value={annClassroomId || workspace.classrooms[0]?.id || ''}
                      onChange={(e) => {
                        setAnnClassroomId(e.target.value);
                        setAnnMaterialId('');
                      }}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      {workspace.classrooms.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="ann-priority"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Priority
                    </label>
                    <select
                      id="ann-priority"
                      value={annPriority}
                      onChange={(e) => setAnnPriority(e.target.value as 'normal' | 'important')}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="normal">Normal Update</option>
                      <option value="important">Important Notice</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="ann-title"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Announcement Title
                  </label>
                  <input
                    id="ann-title"
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g., Unit 2 Revision Notes Posted"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ann-body"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="ann-body"
                    rows={4}
                    value={annBody}
                    onChange={(e) => setAnnBody(e.target.value)}
                    placeholder="Share instructions, quiz dates, or revision reminders..."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                {annClassroomMaterials.length > 0 && (
                  <div>
                    <label
                      htmlFor="ann-material"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Link Study Material (Optional)
                    </label>
                    <select
                      id="ann-material"
                      value={annMaterialId}
                      onChange={(e) => setAnnMaterialId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="">None</option>
                      {annClassroomMaterials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {annError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs text-rose-800 dark:text-rose-200"
                  >
                    {annError}
                  </div>
                )}
                {annSuccess && (
                  <div
                    role="status"
                    className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200"
                  >
                    {annSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={publishingAnn || workspace.classrooms.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F294A] dark:bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-[#0369A1] cursor-pointer disabled:opacity-50"
                >
                  <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
                  {publishingAnn ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </form>
            </section>
          )}

          <section
            className={`${
              isTeacher ? 'lg:col-span-7' : 'lg:col-span-12'
            } space-y-4`}
          >
            {sortedAnnouncements.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No classroom announcements published yet.
              </div>
            ) : (
              sortedAnnouncements.map((ann) => {
                const acknowledged = user ? ann.acknowledgedBy.includes(user.uid) : false;
                return (
                  <article
                    key={ann.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`font-semibold ${
                              ann.priority === 'important'
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-[#0284C7] dark:text-sky-400'
                            }`}
                          >
                            {ann.priority === 'important' ? 'Important Notice' : 'Classroom Update'}
                          </span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                            ·
                          </span>
                          <span className="text-slate-600 dark:text-slate-300 font-medium">
                            {ann.classroomName}
                          </span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                            ·
                          </span>
                          <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                            {formatMessageTime(ann.createdAt)}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                          {ann.title}
                        </h3>
                      </div>

                      {isTeacher ? (
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          Read by {ann.acknowledgedBy.length}/{ann.studentUids.length} students
                        </span>
                      ) : acknowledged ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          Read
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => acknowledgeAnnouncement(ann.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Mark as Read
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {ann.body}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>Posted by {ann.teacherName}</span>
                      {ann.materialTitle && (
                        <button
                          type="button"
                          onClick={() => onOpenMaterials?.(ann.classroomId)}
                          className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                          Study Material: {ann.materialTitle}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>
      )}
    </div>
  );
};
