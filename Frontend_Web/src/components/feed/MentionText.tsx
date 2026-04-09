import { cn } from '@/components/ui/utils';

/**
 * Render text ที่มี @mention ให้ highlight เป็นสี
 *
 * รองรับ:
 *   @[Name With Spaces]  → แสดงเป็น "@Name With Spaces" (highlighted)
 *   @SingleWord          → แสดงเป็น "@SingleWord" (highlighted)
 *
 * ยศ (Owner/Admin/Moderator/Member) จะแสดงเป็นสีต่างจาก user
 */

const ROLE_NAMES = new Set(['owner', 'admin', 'moderator', 'member']);

function isRoleMention(name: string) {
  return ROLE_NAMES.has(name.toLowerCase());
}

interface MentionTextProps {
  text: string;
  className?: string;
}

export function MentionText({ text, className }: MentionTextProps) {
  // Regex: @[Name With Spaces] หรือ @SingleWord
  const mentionRegex = /@\[([^\]]+)\]|@(\w+)/g;

  const parts: (string | { mention: string; isRole: boolean })[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(text)) !== null) {
    // เพิ่มส่วนที่อยู่ก่อน mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const name = match[1] ?? match[2]; // match[1] = bracket, match[2] = word
    parts.push({ mention: name, isRole: isRoleMention(name) });

    lastIndex = match.index + match[0].length;
  }

  // เพิ่มส่วนที่เหลือหลัง mention สุดท้าย
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // ถ้าไม่มี mention เลย → render text ปกติ
  if (parts.length === 1 && typeof parts[0] === 'string') {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (typeof part === 'string') {
          return <span key={i}>{part}</span>;
        }

        return (
          <span
            key={i}
            className={cn(
              'font-semibold rounded px-0.5',
              part.isRole
                ? 'text-blue-600 bg-blue-50'
                : 'text-primary bg-primary/10',
            )}
          >
            @{part.mention}
          </span>
        );
      })}
    </span>
  );
}
