"use client";

import { useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AIFormSection } from '@/components/ai/ai-primitives';

type StepRow = {
  id: string;
  kind: 'condition' | 'ai_decision' | 'action' | 'delay' | 'notification';
  label: string;
  config: string;
};

const MODULE_OPTIONS = ['crm', 'accounting', 'spareparts', 'real-estate', 'restaurant', 'vehicle-export', 'studio'];
const STEP_OPTIONS: StepRow['kind'][] = ['condition', 'ai_decision', 'action', 'delay', 'notification'];

export function WorkflowComposer({
  policyProfiles,
}: {
  policyProfiles: Array<{ id: string; name: string }>;
}) {
  const hasPolicies = policyProfiles.length > 0;
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [moduleScope, setModuleScope] = useState('crm');
  const [triggerEvent, setTriggerEvent] = useState('record.updated');
  const [policyProfileId, setPolicyProfileId] = useState(policyProfiles[0]?.id || '');
  const [approvalsMode, setApprovalsMode] = useState<'always' | 'policy' | 'never'>('policy');
  const [filters, setFilters] = useState('{\n  "priority": "high"\n}');
  const [steps, setSteps] = useState<StepRow[]>([
    {
      id: 'step-1',
      kind: 'notification',
      label: 'Notify operator',
      config: '{\n  "channel": "in-app"\n}',
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const buildPayload = () => {
    let parsedFilters = {};
    try {
      parsedFilters = filters.trim() ? JSON.parse(filters) : {};
    } catch {
      throw new Error('Invalid JSON in filters field');
    }
    return {
      name,
      description,
      moduleScope,
      triggerEvent,
      policyProfileId,
      approvalsMode,
      filters: parsedFilters,
      steps: steps.map((step) => {
        let parsedConfig = {};
        try {
          parsedConfig = JSON.parse(step.config || '{}');
        } catch {
          throw new Error(`Invalid JSON in config for step "${step.label}"`);
        }
        return {
          id: step.id,
          kind: step.kind,
          config: {
            label: step.label,
            ...parsedConfig,
          },
        };
      }),
    };
  };

  const updateStep = (id: string, patch: Partial<StepRow>) => {
    setSteps((current) => current.map((step) => (step.id === id ? { ...step, ...patch } : step)));
  };

  const addStep = () => {
    setSteps((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        kind: 'action',
        label: `Step ${current.length + 1}`,
        config: '{\n  "actionType": "module_action"\n}',
      },
    ]);
  };

  const removeStep = (id: string) => {
    setSteps((current) => current.filter((step) => step.id !== id));
  };

  const submitWorkflow = async (isDraft: boolean) => {
    setError(null);
    setFeedback(null);
    setSubmitting(true);

    try {
      const payload = {
        ...buildPayload(),
        isActive: !isDraft,
      };

      const response = await fetch('/api/ai/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Failed to create workflow' }));
        throw new Error(body.error || 'Failed to create workflow');
      }

      const workflow = await response.json();
      startTransition(() => {
        router.push(`/ai/workflows/${workflow.id}`);
        router.refresh();
      });
    } catch (submitError: any) {
      setError(submitError.message || 'Failed to create workflow');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitWorkflow(false);
  };

  const validateWorkflow = () => {
    try {
      const payload = buildPayload();
      if (!payload.name.trim()) {
        throw new Error('Workflow name is required.');
      }
      if (!payload.triggerEvent.trim()) {
        throw new Error('Trigger event is required.');
      }
      if (!payload.policyProfileId.trim()) {
        throw new Error('Policy profile is required.');
      }

      setError(null);
      setFeedback(`Validation passed. ${payload.steps.length} step(s) are ready to publish.`);
    } catch (validationError: any) {
      setFeedback(null);
      setError(validationError.message || 'Workflow validation failed');
    }
  };

  const simulateDraft = () => {
    try {
      const payload = buildPayload();
      const stepSummary = payload.steps
        .map((step) => `${step.id}: ${step.kind}`)
        .join(' | ');
      setError(null);
      setFeedback(
        `Local draft simulation succeeded for ${payload.steps.length} step(s). Sequence: ${stepSummary}`
      );
    } catch (simulationError: any) {
      setFeedback(null);
      setError(simulationError.message || 'Simulation failed');
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <AIFormSection
        title="Trigger"
        description="Define which module event enters the orchestration pipeline."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="workflow-name">Workflow name</Label>
            <Input id="workflow-name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Module scope</Label>
            <Select value={moduleScope} onValueChange={setModuleScope}>
              <SelectTrigger>
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                {MODULE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="trigger-event">Trigger event</Label>
            <Input
              id="trigger-event"
              value={triggerEvent}
              onChange={(event) => setTriggerEvent(event.target.value)}
              placeholder="record.updated"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Policy profile</Label>
            {hasPolicies ? (
              <Select value={policyProfileId} onValueChange={setPolicyProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select policy" />
                </SelectTrigger>
                <SelectContent>
                  {policyProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={policyProfileId}
                onChange={(event) => setPolicyProfileId(event.target.value)}
                placeholder="Enter policy profile ID"
              />
            )}
            {!hasPolicies ? (
              <p className="text-xs text-slate-500">
                No saved policy profiles were found. Enter a policy ID manually or configure policy CRUD next.
              </p>
            ) : null}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Approvals mode</Label>
            <Select value={approvalsMode} onValueChange={(value) => setApprovalsMode(value as typeof approvalsMode)}>
              <SelectTrigger>
                <SelectValue placeholder="Select approvals mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="policy">Policy-driven</SelectItem>
                <SelectItem value="always">Always require approval</SelectItem>
                <SelectItem value="never">Never require approval</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="workflow-description">Description</Label>
            <Input
              id="workflow-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What business outcome should this automate?"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="workflow-filters">Trigger filters (JSON)</Label>
          <Textarea
            id="workflow-filters"
            value={filters}
            onChange={(event) => setFilters(event.target.value)}
            className="min-h-[120px] font-mono"
          />
        </div>
      </AIFormSection>

      <AIFormSection
        title="Execution Steps"
        description="Model the action chain as discrete, auditable steps."
      >
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Step {index + 1}</p>
                  <p className="text-xs text-slate-500">{step.id}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => removeStep(step.id)}>
                  Remove
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Step type</Label>
                  <Select value={step.kind} onValueChange={(value) => updateStep(step.id, { kind: value as StepRow['kind'] })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select step type" />
                    </SelectTrigger>
                    <SelectContent>
                      {STEP_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input value={step.label} onChange={(event) => updateStep(step.id, { label: event.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Step config (JSON)</Label>
                <Textarea
                  value={step.config}
                  onChange={(event) => updateStep(step.id, { config: event.target.value })}
                  className="min-h-[110px] font-mono"
                />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addStep}>
            Add Step
          </Button>
        </div>
      </AIFormSection>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {feedback ? <p className="text-sm text-emerald-700">{feedback}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={submitting || !policyProfileId.trim()}>
          {submitting ? 'Publishing...' : 'Publish'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => submitWorkflow(true)}
          disabled={submitting || !policyProfileId.trim()}
        >
          Save Draft
        </Button>
        <Button type="button" variant="outline" onClick={validateWorkflow}>
          Validate
        </Button>
        <Button type="button" variant="outline" onClick={simulateDraft}>
          Run Simulation
        </Button>
      </div>
    </form>
  );
}
