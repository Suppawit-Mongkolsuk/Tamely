// ===== Members Tab =====
import { useState, useEffect } from 'react';
import {
  Search,
  MoreVertical,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { RoleBadge } from '@/components/common/RoleBadge';
import type { TeamMember } from '@/types/management-ui';
import type { WorkspaceMemberRole } from '@/types';

interface MembersTabProps {
  members: TeamMember[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onChangeRole?: (userId: string, role: WorkspaceMemberRole) => void;
  onRemoveMember?: (member: TeamMember) => void;
  canManageRoles?: boolean;
  updatingRoleUserId?: string | null;
  removingUserId?: string | null;
  onlineStatus?: Record<string, boolean>;
}

const editableRoles: WorkspaceMemberRole[] = ['ADMIN', 'MODERATOR', 'MEMBER'];

function formatLastSeen(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'เมื่อกี้';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(new Date(dateStr));
}

export function MembersTab({
  members,
  isLoading = false,
  error = null,
  onRetry,
  onChangeRole,
  onRemoveMember,
  canManageRoles = false,
  updatingRoleUserId = null,
  removingUserId = null,
  onlineStatus = {},
}: MembersTabProps) {
  const PAGE_SIZE = 10;
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredMembers = members.filter((member) => {
    if (!normalizedQuery) return true;
    return (
      member.name.toLowerCase().includes(normalizedQuery) ||
      member.role.toLowerCase().includes(normalizedQuery) ||
      member.email?.toLowerCase().includes(normalizedQuery)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const pagedMembers = filteredMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // reset to page 1 when query changes
  useEffect(() => {
    setPage(1);
  }, [query]);

  const privilegedCount = members.filter(
    (member) => member.role === 'OWNER' || member.role === 'ADMIN',
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาสมาชิก..."
            className="pl-10 bg-white"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="bg-white">
        {isLoading ? (
          <LoadingSpinner text="กำลังโหลดสมาชิก..." />
        ) : error ? (
          <div className="px-6 py-10 text-center space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                ลองใหม่
              </Button>
            )}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            {members.length === 0 ? 'ยังไม่มีสมาชิกใน workspace นี้' : 'ไม่พบสมาชิกที่ค้นหา'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-6 py-4">สมาชิก</th>
                  <th className="text-left px-6 py-4">ยศ</th>
                  <th className="text-left px-6 py-4">สถานะ</th>
                  <th className="text-left px-6 py-4">เข้าร่วมเมื่อ</th>
                  <th className="text-right px-6 py-4">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {pagedMembers.map((member) => {
                  const canEditRole =
                    canManageRoles &&
                    member.role !== 'OWNER' &&
                    !member.isCurrentUser;
                  const canRemoveMember =
                    Boolean(onRemoveMember) &&
                    member.role !== 'OWNER' &&
                    !member.isCurrentUser;

                  const isOnline = onlineStatus[member.id] ?? false;

                  return (
                    <tr
                      key={member.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <UserAvatar
                              displayName={member.name}
                              avatarUrl={member.avatarUrl}
                              size="md"
                            />
                            <span
                              className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
                                isOnline ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium">
                              {member.name}
                              {member.isCurrentUser ? ' (คุณ)' : ''}
                            </p>
                            {member.email && (
                              <p className="text-sm text-muted-foreground">
                                {member.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2.5 rounded-full shrink-0 ${
                              isOnline ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          />
                          <div className="flex flex-col">
                            <span
                              className={`text-sm ${
                                isOnline ? 'text-green-600' : 'text-muted-foreground'
                              }`}
                            >
                              {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
                            </span>
                            {!isOnline && member.lastSeenAt && (
                              <span className="text-xs text-muted-foreground/70">
                                {formatLastSeen(member.lastSeenAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {member.joinDate}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {member.role === 'OWNER' ? (
                            <Button variant="outline" className="w-32 h-9" disabled>
                              Owner
                            </Button>
                          ) : (
                            <Select
                              value={member.role}
                              onValueChange={(role) =>
                                onChangeRole?.(member.id, role as WorkspaceMemberRole)
                              }
                              disabled={!canEditRole || updatingRoleUserId === member.id}
                            >
                              <SelectTrigger className="w-32 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {editableRoles.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role === 'ADMIN'
                                      ? 'Admin'
                                      : role === 'MODERATOR'
                                        ? 'Moderator'
                                        : 'Member'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {canRemoveMember ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={removingUserId === member.id}
                                >
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => onRemoveMember?.(member)}
                                >
                                  <Trash2 className="size-4" />
                                  นำออกจาก workspace
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Button variant="ghost" size="sm" disabled>
                              <MoreVertical className="size-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>แสดง {filteredMembers.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredMembers.length)} จาก {filteredMembers.length} สมาชิก</p>
        <div className="flex items-center gap-3">
          <p>Owner/Admin: {privilegedCount} | สมาชิกอื่น: {members.length - privilegedCount}</p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
