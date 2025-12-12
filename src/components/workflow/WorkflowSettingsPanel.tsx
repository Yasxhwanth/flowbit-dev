'use client';

/**
 * WorkflowSettingsPanel
 * Sidebar panel for editing workflow-level settings
 */

import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/trpc/client';

interface WorkflowSettingsPanelProps {
    open: boolean;
    workflow: {
        id: string;
        name: string;
        description?: string | null;
        enabled?: boolean;
        defaultBroker?: string | null;
        defaultSymbol?: string | null;
        defaultInterval?: string | null;
        cron?: string | null;
        tags?: string[] | null;
    };
    onClose: () => void;
    onSave: () => void;
}

const CRON_PRESETS = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every 5 minutes', value: '*/5 * * * *' },
    { label: 'Every 15 minutes', value: '*/15 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Market open (9:15 AM, Mon-Fri)', value: '15 9 * * 1-5' },
    { label: 'Market close (3:30 PM, Mon-Fri)', value: '30 15 * * 1-5' },
];

export function WorkflowSettingsPanel({
    open,
    workflow,
    onClose,
    onSave,
}: WorkflowSettingsPanelProps) {
    const utils = trpc.useUtils();
    const updateSettings = trpc.workflows.updateSettings.useMutation({
        onSuccess: () => {
            toast.success('Settings saved', {
                description: 'Workflow settings updated successfully',
            });
            utils.workflows.getOne.invalidate({ id: workflow.id });
            onSave();
            onClose();
        },
        onError: (error) => {
            console.error('Save failed:', error);
            toast.error('Error', {
                description: 'Failed to save settings',
            });
        }
    });

    const [formData, setFormData] = useState({
        name: workflow.name,
        description: workflow.description || '',
        enabled: workflow.enabled ?? true,
        defaultBroker: workflow.defaultBroker || '',
        defaultSymbol: workflow.defaultSymbol || '',
        defaultInterval: workflow.defaultInterval || '',
        cron: workflow.cron || '',
        tags: workflow.tags?.join(', ') || '',
    });

    async function handleSave() {
        if (!formData.name.trim()) {
            toast.error('Validation Error', {
                description: 'Workflow name is required',
            });
            return;
        }

        updateSettings.mutate({
            id: workflow.id,
            name: formData.name,
            description: formData.description,
            enabled: formData.enabled,
            defaultBroker: formData.defaultBroker || undefined,
            defaultSymbol: formData.defaultSymbol || undefined,
            defaultInterval: formData.defaultInterval || undefined,
            cron: formData.cron || undefined,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        });
    }

    const isSaving = updateSettings.isPending;

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="overflow-y-auto w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Workflow Settings</SheetTitle>
                    <SheetDescription>
                        Configure workflow-level settings and defaults
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Workflow Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            disabled={isSaving}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            disabled={isSaving}
                            rows={3}
                        />
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                            id="tags"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="e.g. production, strategy, btc (comma separated)"
                            disabled={isSaving}
                        />
                        <p className="text-xs text-muted-foreground">Separate tags with commas</p>
                    </div>

                    {/* Enabled */}
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                        <div>
                            <Label htmlFor="enabled" className="text-base">Enabled</Label>
                            <p className="text-sm text-muted-foreground">
                                {formData.enabled
                                    ? 'Workflow will run on schedule'
                                    : 'Workflow paused (won\'t run automatically)'}
                            </p>
                        </div>
                        <Switch
                            id="enabled"
                            checked={formData.enabled}
                            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                            disabled={isSaving}
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-medium text-muted-foreground">Defaults</h3>

                        {/* Default Broker */}
                        <div className="space-y-2">
                            <Label htmlFor="broker">Default Broker</Label>
                            <Select
                                value={formData.defaultBroker}
                                onValueChange={(value) => setFormData({ ...formData, defaultBroker: value })}
                                disabled={isSaving}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select broker" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dhan">Dhan</SelectItem>
                                    <SelectItem value="fyers">Fyers</SelectItem>
                                    <SelectItem value="angel">Angel One</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Default Symbol */}
                        <div className="space-y-2">
                            <Label htmlFor="symbol">Default Symbol</Label>
                            <Input
                                id="symbol"
                                value={formData.defaultSymbol}
                                onChange={(e) => setFormData({ ...formData, defaultSymbol: e.target.value })}
                                placeholder="e.g., RELIANCE, NIFTY"
                                disabled={isSaving}
                            />
                        </div>

                        {/* Default Interval */}
                        <div className="space-y-2">
                            <Label htmlFor="interval">Default Interval</Label>
                            <Select
                                value={formData.defaultInterval}
                                onValueChange={(value) => setFormData({ ...formData, defaultInterval: value })}
                                disabled={isSaving}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select interval" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1m">1 Minute</SelectItem>
                                    <SelectItem value="5m">5 Minutes</SelectItem>
                                    <SelectItem value="15m">15 Minutes</SelectItem>
                                    <SelectItem value="30m">30 Minutes</SelectItem>
                                    <SelectItem value="1h">1 Hour</SelectItem>
                                    <SelectItem value="1d">1 Day</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Cron Schedule */}
                    <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="cron">Cron Schedule</Label>
                        <Input
                            id="cron"
                            value={formData.cron}
                            onChange={(e) => setFormData({ ...formData, cron: e.target.value })}
                            placeholder="* * * * *"
                            disabled={isSaving}
                            className="font-mono"
                        />
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>Presets:</p>
                            <div className="flex flex-wrap gap-1">
                                {CRON_PRESETS.map((preset) => (
                                    <Button
                                        key={preset.value}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFormData({ ...formData, cron: preset.value })}
                                        disabled={isSaving}
                                        className="text-xs h-7"
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 sticky bottom-0 bg-background pb-4 border-t mt-auto">
                        <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Settings
                        </Button>
                        <Button variant="outline" onClick={onClose} disabled={isSaving}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
