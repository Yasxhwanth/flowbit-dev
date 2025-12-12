'use client';

/**
 * ConditionGroup Component
 * Group of conditions with AND/OR logic
 */

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ConditionGroupData, ConditionRowData, GroupType } from './types';
import { isConditionGroup, createEmptyRow, createEmptyGroup } from './types';
import { ConditionRow } from './ConditionRow';
import type { IndicatorOption } from './indicatorOptions';

interface ConditionGroupProps {
    group: ConditionGroupData;
    indicators: IndicatorOption[];
    onChange: (updated: ConditionGroupData) => void;
    onDelete?: () => void;
    isRoot?: boolean;
}

export function ConditionGroup({
    group,
    indicators,
    onChange,
    onDelete,
    isRoot = false,
}: ConditionGroupProps) {
    function updateChild(index: number, updated: ConditionRowData | ConditionGroupData) {
        const newChildren = [...group.children];
        newChildren[index] = updated;
        onChange({ ...group, children: newChildren });
    }

    function deleteChild(index: number) {
        if (group.children.length <= 1) return;
        const newChildren = group.children.filter((_, i) => i !== index);
        onChange({ ...group, children: newChildren });
    }

    function addRow() {
        onChange({
            ...group,
            children: [...group.children, createEmptyRow()],
        });
    }

    function addGroup(type: GroupType) {
        onChange({
            ...group,
            children: [...group.children, createEmptyGroup(type)],
        });
    }

    return (
        <Card className={`p-3 ${isRoot ? '' : 'border-dashed'}`}>
            {/* Group Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Select
                        value={group.type}
                        onValueChange={(v) => onChange({ ...group, type: v as GroupType })}
                    >
                        <SelectTrigger className="w-20 h-7 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AND">AND</SelectItem>
                            <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                    </Select>
                    <Badge variant="outline" className="text-xs">
                        {group.children.length} condition{group.children.length !== 1 ? 's' : ''}
                    </Badge>
                </div>

                {!isRoot && onDelete && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={onDelete}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {/* Children */}
            <div className="space-y-2">
                {group.children.map((child, index) => (
                    <div key={child.id}>
                        {index > 0 && (
                            <div className="flex justify-center py-1">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {group.type}
                                </span>
                            </div>
                        )}

                        {isConditionGroup(child) ? (
                            <ConditionGroup
                                group={child}
                                indicators={indicators}
                                onChange={(updated) => updateChild(index, updated)}
                                onDelete={() => deleteChild(index)}
                            />
                        ) : (
                            <ConditionRow
                                row={child}
                                indicators={indicators}
                                onChange={(updated) => updateChild(index, updated)}
                                onDelete={() => deleteChild(index)}
                                canDelete={group.children.length > 1}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Add Buttons */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-dashed">
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={addRow}>
                    <Plus className="h-3 w-3 mr-1" />
                    Condition
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => addGroup('AND')}>
                    <Plus className="h-3 w-3 mr-1" />
                    AND Group
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => addGroup('OR')}>
                    <Plus className="h-3 w-3 mr-1" />
                    OR Group
                </Button>
            </div>
        </Card>
    );
}
