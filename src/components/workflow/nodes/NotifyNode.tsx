'use client';

/**
 * NotifyNode - Custom node for notifications
 */

import { Bell } from 'lucide-react';
import { NodeBase } from './NodeBase';
import { getNotifyPreview } from '@/lib/workflow/node-preview';

interface NotifyNodeData {
    channel?: string;
    webhookUrl?: string;
    botToken?: string;
    email?: string;
    message?: string;
}

interface NotifyNodeProps {
    data: NotifyNodeData;
    selected?: boolean;
}

export function NotifyNode({ data, selected }: NotifyNodeProps) {
    const channel = data.channel || 'discord';

    const isConfigured =
        (channel === 'discord' && data.webhookUrl) ||
        (channel === 'telegram' && data.botToken) ||
        (channel === 'email' && data.email);

    const channelLabel = {
        discord: 'Discord',
        telegram: 'Telegram',
        email: 'Email',
    }[channel] || channel;

    const preview = getNotifyPreview(data);

    return (
        <NodeBase
            title="Notification"
            subtitle={channelLabel}
            icon={<Bell size={18} />}
            color="green"
            selected={selected}
            status={isConfigured ? 'valid' : 'warning'}
        >
            <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {preview}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
                Status: {isConfigured ? (
                    <span className="text-green-500">Configured</span>
                ) : (
                    <span className="text-orange-500">Needs setup</span>
                )}
            </div>
        </NodeBase>
    );
}
