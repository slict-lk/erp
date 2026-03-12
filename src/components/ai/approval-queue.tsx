"use client";

import { useEffect, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AIEmptyState, AIStatusBadge } from '@/components/ai/ai-primitives';
import { useToast } from '@/components/ui/use-toast';
import type { ApprovalItem } from '@/lib/ai/control-plane-types';

export function ApprovalQueue({ approvals }: { approvals: ApprovalItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const validIds = new Set(approvals.map((approval) => approval.id));
    setSelectedIds((current) => current.filter((id) => validIds.has(id)));
  }, [approvals]);

  const act = async (approvalId: string, decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'ESCALATED') => {
    setWorkingId(approvalId);

    try {
      const response = await fetch(`/api/ai/inbox/${approvalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note }),
      });

      if (!response.ok) {
        throw new Error('Failed to update approval');
      }

      setSelectedIds((current) => current.filter((id) => id !== approvalId));
      startTransition(() => {
        router.refresh();
      });
      toast({ title: `Approval ${decision.toLowerCase()}` });
    } catch (error: any) {
      toast({
        title: 'Approval failed',
        description: error.message || 'Failed to update approval',
        variant: 'destructive',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const allSelected = approvals.length > 0 && selectedIds.length === approvals.length;

  const toggleSelected = (approvalId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, approvalId])] : current.filter((id) => id !== approvalId)
    );
  };

  const bulkApprove = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    setWorkingId('bulk');

    try {
      const results = await Promise.allSettled(
        selectedIds.map((approvalId) =>
          fetch(`/api/ai/inbox/${approvalId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decision: 'APPROVED', note }),
          }).then((response) => {
            if (!response.ok) throw new Error(`Failed to approve ${approvalId}`);
            return approvalId;
          })
        )
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      setSelectedIds([]);
      startTransition(() => {
        router.refresh();
      });
      toast({
        title: 'Bulk approve completed',
        description: failed > 0
          ? `${succeeded} approved, ${failed} failed.`
          : `${succeeded} approval item(s) processed.`,
        variant: failed > 0 ? 'destructive' : undefined,
      });
    } catch (error: any) {
      toast({
        title: 'Bulk approve failed',
        description: error.message || 'Failed to bulk approve items',
        variant: 'destructive',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const formatSla = (dueAt: string) => {
    const dueMs = new Date(dueAt).getTime();
    if (isNaN(dueMs)) return 'Unknown';
    const deltaMs = dueMs - Date.now();
    const totalMinutes = Math.round(Math.abs(deltaMs) / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const text = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    return deltaMs >= 0 ? `${text} left` : `Overdue by ${text}`;
  };

  return (
    <div className="space-y-4">
      {approvals.length === 0 ? (
        <AIEmptyState
          title="No approvals pending"
          description="Approval-gated actions will appear here when policy checks enqueue them."
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional approval note or escalation reason"
        />
        <Button
          type="button"
          variant="outline"
          onClick={bulkApprove}
          disabled={selectedIds.length === 0 || workingId === 'bulk'}
        >
          {workingId === 'bulk' ? 'Approving...' : `Bulk Approve (${selectedIds.length})`}
        </Button>
      </div>
      {approvals.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) =>
                    setSelectedIds(checked ? approvals.map((approval) => approval.id) : [])
                  }
                />
              </TableHead>
              <TableHead>Request</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvals.map((approval) => (
              <TableRow key={approval.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(approval.id)}
                    onCheckedChange={(checked) => toggleSelected(approval.id, checked === true)}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">{approval.title}</p>
                    <p className="text-sm text-slate-600">{approval.summary}</p>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{approval.module}</TableCell>
                <TableCell>{approval.riskScore}</TableCell>
                <TableCell>{approval.assignedRole || approval.assignedToUserId || 'Unassigned'}</TableCell>
                <TableCell>
                  <AIStatusBadge status={approval.status} />
                </TableCell>
                <TableCell>{new Date(approval.dueAt).toLocaleString()}</TableCell>
                <TableCell className={new Date(approval.dueAt).getTime() < Date.now() ? 'text-red-600' : 'text-slate-700'}>
                  {formatSla(approval.dueAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button size="sm" onClick={() => act(approval.id, 'APPROVED')} disabled={workingId === approval.id || workingId === 'bulk'}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => act(approval.id, 'REJECTED')} disabled={workingId === approval.id || workingId === 'bulk'}>
                      Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => act(approval.id, 'CHANGES_REQUESTED')} disabled={workingId === approval.id || workingId === 'bulk'}>
                      Request Changes
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => act(approval.id, 'ESCALATED')} disabled={workingId === approval.id || workingId === 'bulk'}>
                      Escalate
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  );
}
