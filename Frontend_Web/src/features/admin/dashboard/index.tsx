import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Ban,
  Bot,
  History,
  Loader2,
  LogOut,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Unlock,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { adminService } from '@/services';
import { cn, formatDate } from '@/lib/utils';
import type {
  AdminUser,
  AdminWorkspaceAuditLog,
  AdminWorkspaceSummary,
} from '@/types';

const ITEMS_PER_PAGE = 5;

type TimeRange = '7d' | '30d' | 'all';
type StatusFilter = 'all' | 'active' | 'blocked';
type SortOption =
  | 'updated-desc'
  | 'name-asc'
  | 'name-desc'
  | 'ai-desc'
  | 'tokens-desc'
  | 'members-desc'
  | 'last-ai-desc';

const formatDateTime = (value?: string | null) => {
  if (!value) return 'ยังไม่เคยใช้งาน';
  return new Date(value).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getUsageRangeLabel = (range: TimeRange) => {
  if (range === '7d') return '7 วันล่าสุด';
  if (range === '30d') return '30 วันล่าสุด';
  return 'ทั้งหมด';
};

const getAuditActionLabel = (action: AdminWorkspaceAuditLog['action']) => {
  if (action === 'BLOCK') return 'Block';
  if (action === 'UNBLOCK') return 'Unblock';
  return 'Delete';
};

const getSortedWorkspaces = (workspaces: AdminWorkspaceSummary[], sortBy: SortOption) => {
  const list = [...workspaces];

  switch (sortBy) {
    case 'name-asc':
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return list.sort((a, b) => b.name.localeCompare(a.name));
    case 'ai-desc':
      return list.sort((a, b) => b.aiQueryCount - a.aiQueryCount);
    case 'tokens-desc':
      return list.sort((a, b) => b.tokensUsed - a.tokensUsed);
    case 'members-desc':
      return list.sort((a, b) => b.memberCount - a.memberCount);
    case 'last-ai-desc':
      return list.sort((a, b) => {
        const aValue = a.lastAiUsedAt ? new Date(a.lastAiUsedAt).getTime() : 0;
        const bValue = b.lastAiUsedAt ? new Date(b.lastAiUsedAt).getTime() : 0;
        return bValue - aValue;
      });
    case 'updated-desc':
    default:
      return list.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }
};

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [workspaces, setWorkspaces] = useState<AdminWorkspaceSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminWorkspaceAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated-desc');
  const [dialogWorkspace, setDialogWorkspace] = useState<AdminWorkspaceSummary | null>(null);
  const [deleteWorkspace, setDeleteWorkspace] = useState<AdminWorkspaceSummary | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [deleteWorkspaceName, setDeleteWorkspaceName] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const loadDashboard = useCallback(async (range: TimeRange) => {
    setIsLoading(true);
    try {
      const [adminProfile, dashboard] = await Promise.all([
        adminService.getMe(),
        adminService.getDashboard(range),
      ]);

      setAdmin(adminProfile);
      setWorkspaces(dashboard.workspaces);
      setAuditLogs(dashboard.auditLogs);
    } catch {
      navigate('/login', { replace: true });
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard(timeRange);
  }, [loadDashboard, timeRange]);

  const filteredWorkspaces = useMemo(() => {
    const searched = deferredSearch
      ? workspaces.filter((workspace) => {
          const haystack = [
            workspace.name,
            workspace.description ?? '',
            workspace.owner.Name,
            workspace.owner.email,
            workspace.blockedReason ?? '',
          ].join(' ').toLowerCase();

          return haystack.includes(deferredSearch);
        })
      : workspaces;

    const filteredByStatus = searched.filter((workspace) => {
      if (statusFilter === 'active') return workspace.isActive;
      if (statusFilter === 'blocked') return !workspace.isActive;
      return true;
    });

    return getSortedWorkspaces(filteredByStatus, sortBy);
  }, [deferredSearch, sortBy, statusFilter, workspaces]);

  const totalPages = Math.max(1, Math.ceil(filteredWorkspaces.length / ITEMS_PER_PAGE));

  const paginatedWorkspaces = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWorkspaces.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredWorkspaces]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, sortBy, statusFilter, timeRange]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const summary = useMemo(() => {
    return workspaces.reduce(
      (acc, workspace) => {
        acc.total += 1;
        acc.active += workspace.isActive ? 1 : 0;
        acc.blocked += workspace.isActive ? 0 : 1;
        acc.aiQueries += workspace.aiQueryCount;
        acc.tokens += workspace.tokensUsed;
        return acc;
      },
      { total: 0, active: 0, blocked: 0, aiQueries: 0, tokens: 0 },
    );
  }, [workspaces]);

  const handleLogout = async () => {
    await adminService.logout();
    navigate('/login', { replace: true });
  };

  const openStatusDialog = (workspace: AdminWorkspaceSummary) => {
    setDialogWorkspace(workspace);
    setBlockReason(workspace.isActive ? '' : workspace.blockedReason ?? '');
  };

  const openDeleteDialog = (workspace: AdminWorkspaceSummary) => {
    setDeleteWorkspace(workspace);
    setDeleteWorkspaceName('');
    setDeletePassword('');
    setDeleteReason('');
  };

  const handleConfirmStatusChange = async () => {
    if (!dialogWorkspace) return;

    const nextStatus = !dialogWorkspace.isActive;
    const normalizedReason = blockReason.trim();

    if (!nextStatus && !normalizedReason) {
      toast.error('กรุณากรอกเหตุผลในการ block workspace');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.updateWorkspaceStatus(
        dialogWorkspace.id,
        nextStatus,
        nextStatus ? undefined : normalizedReason,
      );

      toast.success(
        nextStatus
          ? `ปลด block "${dialogWorkspace.name}" แล้ว`
          : `block "${dialogWorkspace.name}" แล้ว`,
      );

      setDialogWorkspace(null);
      setBlockReason('');
      await loadDashboard(timeRange);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'อัปเดตสถานะ workspace ไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteWorkspace = async () => {
    if (!deleteWorkspace) return;

    if (deleteWorkspaceName.trim() !== deleteWorkspace.name) {
      toast.error('ชื่อ workspace ที่ยืนยันไม่ตรงกัน');
      return;
    }

    if (!deletePassword.trim()) {
      toast.error('กรุณากรอกรหัสผ่านแอดมิน');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.deleteWorkspace(deleteWorkspace.id, {
        workspaceName: deleteWorkspaceName.trim(),
        password: deletePassword,
        reason: deleteReason.trim() || undefined,
      });

      toast.success(`ลบ "${deleteWorkspace.name}" สำเร็จ`);
      setDeleteWorkspace(null);
      setDeleteWorkspaceName('');
      setDeletePassword('');
      setDeleteReason('');
      await loadDashboard(timeRange);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ลบ workspace ไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#081320]">
        <Loader2 className="size-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#0b1f35_0%,#123b5f_32%,#1c6070_58%,#d9edf4_100%)] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8rem] top-20 size-80 rounded-full bg-[#7ecff0]/12 blur-3xl" />
          <div className="absolute right-[-5rem] top-12 size-72 rounded-full bg-[#8dd3c7]/10 blur-3xl" />
          <div className="absolute bottom-24 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-white/18 blur-3xl" />
        </div>

        <div className="relative">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur">
                  <Shield className="size-4 text-[#8dd3c7]" />
                  Admin session: {admin?.username}
                </div>
                <h1 className="max-w-3xl text-3xl font-semibold sm:text-4xl">
                  ภาพรวม workspace ทั้งระบบและการใช้งาน AI
                </h1>
                <p className="mt-3 max-w-2xl text-white/70">
                  จัดการสถานะ workspace, ตรวจสอบเหตุผลการ block และดูประวัติการเปลี่ยนแปลงจากศูนย์กลางเดียว
                </p>
              </div>

              <Button
                className="bg-[#d84d57] text-white hover:bg-[#c13f49]"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                ออกจากระบบ
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-white/10 bg-white/8 text-white shadow-none backdrop-blur">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/65">Workspace ทั้งหมด</CardDescription>
                  <CardTitle className="flex items-center gap-3 text-3xl">
                    <Users className="size-6 text-[#8dd3c7]" />
                    {summary.total}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-white/10 bg-white/8 text-white shadow-none backdrop-blur">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/65">Workspace ที่เปิดใช้งาน</CardDescription>
                  <CardTitle className="flex items-center gap-3 text-3xl">
                    <Activity className="size-6 text-[#7ecff0]" />
                    {summary.active}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-white/10 bg-white/8 text-white shadow-none backdrop-blur">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/65">
                    AI Queries รวม ({getUsageRangeLabel(timeRange)})
                  </CardDescription>
                  <CardTitle className="flex items-center gap-3 text-3xl">
                    <Bot className="size-6 text-[#ffd480]" />
                    {summary.aiQueries.toLocaleString('th-TH')}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-white/10 bg-white/8 text-white shadow-none backdrop-blur">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/65">
                    Tokens รวม ({getUsageRangeLabel(timeRange)})
                  </CardDescription>
                  <CardTitle className="flex items-center gap-3 text-3xl">
                    <Sparkles className="size-6 text-[#f8a9b1]" />
                    {summary.tokens.toLocaleString('th-TH')}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="border-white/45 bg-white/96 shadow-2xl shadow-[#0a2137]/12 backdrop-blur">
            <CardHeader className="gap-4">
              <div>
                <CardTitle className="text-slate-900">Workspace Dashboard</CardTitle>
                <CardDescription>
                  แสดง owner, จำนวนสมาชิก, usage ของ AI, สถานะการใช้งาน, เหตุผล block, การลบ และประวัติล่าสุด
                </CardDescription>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,0.8fr))]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="ค้นหาชื่อ workspace, owner, email"
                    className="pl-9"
                  />
                </div>

                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="active">เฉพาะ Active</SelectItem>
                    <SelectItem value="blocked">เฉพาะ Blocked</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger>
                    <SelectValue placeholder="เรียงลำดับ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated-desc">อัปเดตล่าสุด</SelectItem>
                    <SelectItem value="name-asc">ชื่อ A-Z</SelectItem>
                    <SelectItem value="name-desc">ชื่อ Z-A</SelectItem>
                    <SelectItem value="ai-desc">AI Queries มากสุด</SelectItem>
                    <SelectItem value="tokens-desc">Tokens มากสุด</SelectItem>
                    <SelectItem value="members-desc">สมาชิกมากสุด</SelectItem>
                    <SelectItem value="last-ai-desc">ใช้ AI ล่าสุด</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                  <SelectTrigger>
                    <SelectValue placeholder="ช่วงเวลา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 วันล่าสุด</SelectItem>
                    <SelectItem value="30d">30 วันล่าสุด</SelectItem>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {filteredWorkspaces.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center text-slate-500">
                  ไม่พบ workspace ที่ตรงกับเงื่อนไขที่เลือก
                </div>
              ) : (
                paginatedWorkspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className={cn(
                      'rounded-2xl border p-5 transition',
                      workspace.isActive
                        ? 'border-slate-200 bg-slate-50/80'
                        : 'border-rose-200 bg-rose-50/70',
                    )}
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold text-slate-900">{workspace.name}</h3>
                          <Badge
                            variant={workspace.isActive ? 'secondary' : 'destructive'}
                            className={workspace.isActive ? 'bg-emerald-100 text-emerald-700' : ''}
                          >
                            {workspace.isActive ? 'Active' : 'Blocked'}
                          </Badge>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {workspace.description?.trim() || 'ไม่มีคำอธิบาย'}
                        </p>

                        {!workspace.isActive && workspace.blockedReason ? (
                          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            <p className="font-medium">เหตุผลที่ block</p>
                            <p className="mt-1">{workspace.blockedReason}</p>
                            <p className="mt-1 text-xs text-rose-600">
                              โดย {workspace.blockedByAdminUsername ?? 'admin'} เมื่อ {formatDateTime(workspace.blockedAt)}
                            </p>
                          </div>
                        ) : null}

                        <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <p className="text-slate-400">Owner</p>
                            <p className="font-medium text-slate-900">{workspace.owner.Name}</p>
                            <p>{workspace.owner.email}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">
                              การใช้งาน AI ({getUsageRangeLabel(timeRange)})
                            </p>
                            <p className="font-medium text-slate-900">
                              {workspace.aiQueryCount.toLocaleString('th-TH')} queries
                            </p>
                            <p>{workspace.tokensUsed.toLocaleString('th-TH')} tokens</p>
                          </div>
                          <div>
                            <p className="text-slate-400">โครงสร้าง workspace</p>
                            <p className="font-medium text-slate-900">
                              {workspace.memberCount.toLocaleString('th-TH')} members
                            </p>
                            <p>{workspace.roomCount.toLocaleString('th-TH')} rooms</p>
                          </div>
                          <div>
                            <p className="text-slate-400">ใช้งาน AI ล่าสุด</p>
                            <p className="font-medium text-slate-900">
                              {formatDateTime(workspace.lastAiUsedAt)}
                            </p>
                            <p>สร้างเมื่อ {formatDate(workspace.createdAt)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-3 lg:w-52">
                        <Button
                          variant={workspace.isActive ? 'destructive' : 'secondary'}
                          className={workspace.isActive ? '' : 'bg-emerald-600 text-white hover:bg-emerald-700'}
                          onClick={() => openStatusDialog(workspace)}
                        >
                          {workspace.isActive ? <Ban className="size-4" /> : <Unlock className="size-4" />}
                          {workspace.isActive ? 'Block Workspace' : 'Unblock Workspace'}
                        </Button>
                        <Button
                          variant="outline"
                          className="border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => openDeleteDialog(workspace)}
                        >
                          <Trash2 className="size-4" />
                          Delete Workspace
                        </Button>
                        <div className="rounded-xl bg-white/80 px-3 py-2 text-xs leading-5 text-slate-500">
                          Workspace ID: <span className="font-mono text-[11px] text-slate-700">{workspace.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {filteredWorkspaces.length > 0 ? (
                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredWorkspaces.length)} จาก {filteredWorkspaces.length} workspace
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    >
                      ก่อนหน้า
                    </Button>
                    <span className="min-w-24 text-center text-slate-600">
                      หน้า {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    >
                      ถัดไป
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="mt-6 border-white/45 bg-white/96 shadow-2xl shadow-[#0a2137]/12 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <History className="size-5 text-slate-600" />
                Audit Log
              </CardTitle>
              <CardDescription>
                ประวัติการ block, unblock และลบ workspace ล่าสุด 20 รายการ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-slate-500">
                  ยังไม่มีประวัติการจัดการ workspace
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4 md:flex-row md:items-start md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{log.workspaceNameSnapshot}</p>
                        <Badge
                          variant={log.action === 'BLOCK' || log.action === 'DELETE' ? 'destructive' : 'secondary'}
                          className={log.action === 'UNBLOCK' ? 'bg-emerald-100 text-emerald-700' : ''}
                        >
                          {getAuditActionLabel(log.action)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        โดย <span className="font-medium">{log.adminUsername}</span> เมื่อ {formatDateTime(log.createdAt)}
                      </p>
                      <p className="text-sm text-slate-500">
                        สถานะ: {log.previousIsActive ? 'Active' : 'Blocked'} {'>'}{' '}
                        {log.action === 'DELETE' ? 'Deleted' : log.nextIsActive ? 'Active' : 'Blocked'}
                      </p>
                    </div>

                    <div className="max-w-xl rounded-xl bg-white px-4 py-3 text-sm text-slate-600">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Reason</p>
                      <p className="mt-1">{log.reason?.trim() || '-'}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(dialogWorkspace)}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            setDialogWorkspace(null);
            setBlockReason('');
          }
        }}
        title={
          dialogWorkspace?.isActive
            ? `ยืนยันการ block ${dialogWorkspace?.name ?? ''}`
            : `ยืนยันการ unblock ${dialogWorkspace?.name ?? ''}`
        }
        description={
          dialogWorkspace?.isActive
            ? 'Workspace นี้จะไม่สามารถใช้งานต่อได้จนกว่าจะถูกปลด block'
            : 'Workspace นี้จะกลับมาใช้งานได้ตามปกติ'
        }
        warningMessage={
          dialogWorkspace?.isActive
            ? 'การ block จะตัดการเข้าถึง workflow หลักของ workspace นี้ทันที'
            : 'ตรวจสอบให้แน่ใจก่อนว่าพร้อมเปิดใช้งาน workspace นี้อีกครั้ง'
        }
        warningNote={
          dialogWorkspace?.isActive
            ? 'กรุณาระบุเหตุผลให้ชัดเจนเพื่อเก็บเป็น audit log'
            : 'การปลด block จะถูกบันทึกลง audit log เช่นกัน'
        }
        confirmLabel={dialogWorkspace?.isActive ? 'ยืนยัน Block' : 'ยืนยัน Unblock'}
        cancelLabel="ยกเลิก"
        confirmVariant={dialogWorkspace?.isActive ? 'destructive' : 'primary'}
        onConfirm={handleConfirmStatusChange}
        loading={isSubmitting}
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">{dialogWorkspace?.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              Workspace ID: <span className="font-mono">{dialogWorkspace?.id}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="block-reason">
              เหตุผล {dialogWorkspace?.isActive ? '(จำเป็นต้องกรอก)' : '(ไม่บังคับ)'}
            </Label>
            <Textarea
              id="block-reason"
              value={blockReason}
              onChange={(event) => setBlockReason(event.target.value)}
              placeholder="ระบุเหตุผล เช่น spam, ผิดกฎการใช้งาน, ระงับชั่วคราว"
              rows={4}
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleteWorkspace)}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            setDeleteWorkspace(null);
            setDeleteWorkspaceName('');
            setDeletePassword('');
            setDeleteReason('');
          }
        }}
        title={`ยืนยันการลบ ${deleteWorkspace?.name ?? ''}`}
        description="การลบ workspace เป็นการกระทำถาวรและไม่สามารถย้อนกลับได้"
        warningMessage="ข้อมูลที่ผูกกับ workspace นี้จะถูกลบออกจากระบบทั้งหมดทันที"
        warningNote="รวมถึงห้อง, โพสต์, งาน, AI logs และข้อมูลที่ cascade ตาม workspace นี้"
        confirmLabel="ยืนยัน Delete"
        cancelLabel="ยกเลิก"
        confirmVariant="destructive"
        onConfirm={handleConfirmDeleteWorkspace}
        disabled={
          !deleteWorkspace ||
          deleteWorkspaceName.trim() !== deleteWorkspace.name ||
          !deletePassword.trim()
        }
        loading={isSubmitting}
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">{deleteWorkspace?.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              Workspace ID: <span className="font-mono">{deleteWorkspace?.id}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-workspace-name">
              พิมพ์ชื่อ workspace เพื่อยืนยัน
            </Label>
            <Input
              id="delete-workspace-name"
              value={deleteWorkspaceName}
              onChange={(event) => setDeleteWorkspaceName(event.target.value)}
              placeholder={deleteWorkspace?.name ?? 'ชื่อ workspace'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-password">รหัสผ่านแอดมิน</Label>
            <Input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              placeholder="กรอกรหัสผ่านเพื่อยืนยันอีกครั้ง"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-reason">เหตุผลในการลบ (ไม่บังคับ)</Label>
            <Textarea
              id="delete-reason"
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder="ระบุเหตุผล เช่น test workspace, spam, cleanup"
              rows={3}
            />
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}
