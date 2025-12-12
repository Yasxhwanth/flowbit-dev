'use client';

/**
 * ConditionRow Component
 * Single condition row with left operand, operator, right operand
 */

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ConditionRowData, Operand } from './types';
import { operatorOptions } from './operatorOptions';
import type { IndicatorOption } from './indicatorOptions';

interface ConditionRowProps {
    row: ConditionRowData;
    indicators: IndicatorOption[];
    onChange: (updated: ConditionRowData) => void;
    onDelete?: () => void;
    canDelete?: boolean;
}

export function ConditionRow({
    row,
    indicators,
    onChange,
    onDelete,
    canDelete = true,
}: ConditionRowProps) {
    function updateOperand(side: 'left' | 'right', operand: Operand) {
        onChange({ ...row, [side]: operand });
    }

    function handleOperandChange(side: 'left' | 'right', value: string) {
        // Check if it's a number
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && value.match(/^-?\d*\.?\d*$/)) {
            updateOperand(side, { type: 'number', value: numValue });
        } else {
            updateOperand(side, { type: 'indicator', value });
        }
    }

    return (
        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
            {/* Left Operand */}
            <div className="flex-1">
                <Select
                    value={String(row.left.value)}
                    onValueChange={(v) => handleOperandChange('left', v)}
                >
                    <SelectTrigger className="text-xs h-8">
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        {indicators.map((ind) => (
                            <SelectItem key={ind.value} value={ind.value}>
                                {ind.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Operator */}
            <div className="w-28">
                <Select
                    value={row.operator}
                    onValueChange={(v) => onChange({ ...row, operator: v as ConditionRowData['operator'] })}
                >
                    <SelectTrigger className="text-xs h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {operatorOptions.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                                {op.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Right Operand */}
            <div className="flex-1">
                {row.right.type === 'number' ? (
                    <Input
                        type="number"
                        value={row.right.value as number}
                        onChange={(e) => updateOperand('right', { type: 'number', value: parseFloat(e.target.value) || 0 })}
                        className="text-xs h-8"
                    />
                ) : (
                    <Select
                        value={String(row.right.value)}
                        onValueChange={(v) => handleOperandChange('right', v)}
                    >
                        <SelectTrigger className="text-xs h-8">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            {indicators.map((ind) => (
                                <SelectItem key={ind.value} value={ind.value}>
                                    {ind.label}
                                </SelectItem>
                            ))}
                            <SelectItem value="__number__">Enter number...</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Toggle number/indicator */}
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-xs"
                onClick={() => {
                    if (row.right.type === 'number') {
                        updateOperand('right', { type: 'indicator', value: '' });
                    } else {
                        updateOperand('right', { type: 'number', value: 0 });
                    }
                }}
            >
                {row.right.type === 'number' ? '#' : 'Ind'}
            </Button>

            {/* Delete */}
            {canDelete && onDelete && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={onDelete}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
