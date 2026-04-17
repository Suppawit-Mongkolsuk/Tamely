import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { cn } from '@/components/ui/utils';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { apiClient } from '@/services/api';
import type { ApiSuccessResponse, WorkspaceMember, WorkspaceMemberRole } from '@/types';

/* ======================= Types ======================= */

interface MentionSuggestion {
  id: string;
  label: string; // ชื่อที่แสดง
  value: string; // ค่าที่ insert ลง text
  type: 'user' | 'role';
  avatarUrl?: string | null;
  role?: WorkspaceMemberRole;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  workspaceId: string | undefined;
  placeholder?: string;
  className?: string;
  /** true = textarea (multi-line), false = input (single-line) */
  multiline?: boolean;
  rows?: number;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  disabled?: boolean;
}

/* ======================= Role Suggestions ======================= */

const ROLE_SUGGESTIONS: MentionSuggestion[] = [
  { id: 'role-owner', label: 'Owner', value: 'Owner', type: 'role', role: 'OWNER' },
  { id: 'role-admin', label: 'Admin', value: 'Admin', type: 'role', role: 'ADMIN' },
  { id: 'role-moderator', label: 'Moderator', value: 'Moderator', type: 'role', role: 'MODERATOR' },
  { id: 'role-member', label: 'Member', value: 'Member', type: 'role', role: 'MEMBER' },
];

/* ======================= Avatar helper ======================= */

function MiniAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  return (
    <UserAvatar
      displayName={name}
      avatarUrl={avatarUrl}
      size="sm"
      className="size-7 text-[11px] shrink-0"
    />
  );
}

/* ======================= Role badge color ======================= */

function roleBadgeColor(role?: WorkspaceMemberRole) {
  switch (role) {
    case 'OWNER': return 'bg-amber-100 text-amber-700';
    case 'ADMIN': return 'bg-red-100 text-red-700';
    case 'MODERATOR': return 'bg-blue-100 text-blue-700';
    case 'MEMBER': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

/* ======================= Component ======================= */

export const MentionInput = forwardRef<
  HTMLTextAreaElement | HTMLInputElement,
  MentionInputProps
>(function MentionInput(
  {
    value,
    onChange,
    workspaceId,
    placeholder,
    className,
    multiline = false,
    rows = 5,
    onKeyDown: externalOnKeyDown,
    disabled,
  },
  _ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);

  // ── Fetch members once ──
  const loadMembers = useCallback(async () => {
    if (!workspaceId || membersLoaded) return;
    try {
      const res = await apiClient.get<ApiSuccessResponse<WorkspaceMember[]>>(
        `/workspaces/${workspaceId}/members`,
      );
      setMembers(res.data);
      setMembersLoaded(true);
    } catch (err) {
      console.warn('[MentionInput] Failed to load workspace members:', err);
    }
  }, [workspaceId, membersLoaded]);

  // Reset members cache when workspace changes
  useEffect(() => {
    setMembersLoaded(false);
    setMembers([]);
  }, [workspaceId]);

  // ── Detect @ trigger ──
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const el = e.target;
    const cursorPos = el.selectionStart ?? 0;
    const textBeforeCursor = newValue.substring(0, cursorPos);

    // หา @ ตัวสุดท้ายที่ยังไม่ปิด
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex === -1) {
      setShowDropdown(false);
      return;
    }

    // ตรวจสอบว่า @ อยู่ต้นข้อความ หรือหลัง space/newline
    const charBefore = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' ';
    if (charBefore !== ' ' && charBefore !== '\n' && atIndex !== 0) {
      setShowDropdown(false);
      return;
    }

    const query = textBeforeCursor.substring(atIndex + 1);

    // ถ้ามี space ปิดท้าย (หลังจาก @word) → ปิด dropdown
    if (/\s/.test(query) && !/^\[/.test(query)) {
      setShowDropdown(false);
      return;
    }

    // ถ้าเริ่มด้วย [ → สำหรับชื่อที่มีช่องว่าง @[Name With Space]
    // ถ้ามี ] แล้ว → ปิด dropdown
    if (query.startsWith('[') && query.includes(']')) {
      setShowDropdown(false);
      return;
    }

    const searchQuery = query.replace(/^\[/, '');
    setMentionStart(atIndex);
    setMentionQuery(searchQuery);

    // Load members ถ้ายังไม่เคย
    loadMembers();

    // Filter suggestions
    const lowerQ = searchQuery.toLowerCase();
    const userSuggestions: MentionSuggestion[] = members
      .filter((m) => m.user.Name.toLowerCase().includes(lowerQ))
      .map((m) => ({
        id: m.userId,
        label: m.user.Name,
        value: m.user.Name.includes(' ') ? `[${m.user.Name}]` : m.user.Name,
        type: 'user' as const,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
      }));

    const filteredRoles = ROLE_SUGGESTIONS.filter((r) =>
      r.label.toLowerCase().includes(lowerQ),
    );

    const combined = [...filteredRoles, ...userSuggestions];
    setSuggestions(combined);
    setActiveIndex(0);
    setShowDropdown(combined.length > 0);
  };

  // ── Insert selected mention ──
  const insertMention = useCallback(
    (suggestion: MentionSuggestion) => {
      const el = inputRef.current;
      if (!el) return;

      const before = value.substring(0, mentionStart);
      const after = value.substring(el.selectionStart ?? value.length);
      const mentionText = `@${suggestion.value} `;
      const newValue = before + mentionText + after;

      onChange(newValue);
      setShowDropdown(false);
      setMentionQuery('');

      // Focus back and set cursor position
      requestAnimationFrame(() => {
        el.focus();
        const cursorPos = before.length + mentionText.length;
        el.setSelectionRange(cursorPos, cursorPos);
      });
    },
    [value, mentionStart, onChange],
  );

  // ── Keyboard navigation ──
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (showDropdown && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(suggestions[activeIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowDropdown(false);
        return;
      }
    }

    // Forward to external onKeyDown
    externalOnKeyDown?.(e);
  };

  // ── Close on outside click ──
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  // ── Scroll active suggestion into view ──
  useEffect(() => {
    if (!showDropdown || !dropdownRef.current) return;
    const activeEl = dropdownRef.current.children[activeIndex] as HTMLElement;
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, showDropdown]);

  const sharedProps = {
    ref: inputRef as never,
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    placeholder,
    disabled,
    className: cn(
      'resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border bg-input-background px-3 py-2 text-base outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-[color,box-shadow]',
      className,
    ),
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {multiline ? (
        <textarea {...sharedProps} rows={rows} className={cn(sharedProps.className, 'min-h-16 field-sizing-content')} />
      ) : (
        <input type="text" {...sharedProps} className={cn(sharedProps.className, 'w-full bg-transparent')} />
      )}

      {/* ── Mention Dropdown ── */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 bottom-full mb-1 z-50 w-72 max-h-56 overflow-y-auto bg-white border border-border rounded-xl shadow-lg py-1"
        >
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left',
                i === activeIndex ? 'bg-primary/10' : 'hover:bg-muted/60',
              )}
              onMouseDown={(e) => {
                e.preventDefault(); // ป้องกัน blur
                insertMention(s);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {s.type === 'user' ? (
                <>
                  <MiniAvatar name={s.label} avatarUrl={s.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground truncate block">{s.label}</span>
                  </div>
                  {s.role && (
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', roleBadgeColor(s.role))}>
                      {s.role}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div className="size-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                    @
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground">@{s.label}</span>
                    <span className="text-xs text-muted-foreground ml-1.5">— ทุกคนที่มียศ {s.label}</span>
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
