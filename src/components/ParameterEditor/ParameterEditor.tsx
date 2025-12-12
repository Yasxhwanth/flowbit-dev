'use client';

/**
 * Parameter Editor Component
 * Allows editing strategy template parameters with proper UI controls
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings, RotateCcw } from 'lucide-react';

interface ParameterSchema {
    key: string;
    label: string;
    type: 'number' | 'string' | 'boolean' | 'select';
    defaultValue: number | string | boolean;
    min?: number;
    max?: number;
    options?: Array<{ value: string | number; label: string }>;
    description?: string;
}

interface ParameterEditorProps {
    templateName?: string;
    parameters: ParameterSchema[];
    values: Record<string, number | string | boolean>;
    onChange: (updatedValues: Record<string, number | string | boolean>) => void;
    onReset?: () => void;
}

export function ParameterEditor({
    templateName,
    parameters,
    values,
    onChange,
    onReset,
}: ParameterEditorProps) {
    const [localValues, setLocalValues] = useState(values);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Sync with external values
    useEffect(() => {
        setLocalValues(values);
    }, [values]);

    function validateValue(param: ParameterSchema, value: number | string | boolean): string | null {
        if (param.type === 'number') {
            const numValue = typeof value === 'number' ? value : Number(value);
            if (isNaN(numValue)) return 'Must be a number';
            if (param.min !== undefined && numValue < param.min) {
                return `Minimum is ${param.min}`;
            }
            if (param.max !== undefined && numValue > param.max) {
                return `Maximum is ${param.max}`;
            }
        }
        return null;
    }

    function handleChange(key: string, value: number | string | boolean, param: ParameterSchema) {
        const error = validateValue(param, value);

        setErrors((prev) => ({
            ...prev,
            [key]: error || '',
        }));

        const newValues = { ...localValues, [key]: value };
        setLocalValues(newValues);

        // Only propagate if no error
        if (!error) {
            onChange(newValues);
        }
    }

    function handleReset() {
        const defaultValues: Record<string, number | string | boolean> = {};
        for (const param of parameters) {
            defaultValues[param.key] = param.defaultValue;
        }
        setLocalValues(defaultValues);
        setErrors({});
        onChange(defaultValues);
        onReset?.();
    }

    function renderInput(param: ParameterSchema) {
        const value = localValues[param.key] ?? param.defaultValue;
        const error = errors[param.key];

        switch (param.type) {
            case 'number':
                return (
                    <div className="space-y-1">
                        <Input
                            id={param.key}
                            type="number"
                            value={value as number}
                            min={param.min}
                            max={param.max}
                            onChange={(e) => handleChange(param.key, Number(e.target.value), param)}
                            className={error ? 'border-red-500' : ''}
                        />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                        {param.min !== undefined && param.max !== undefined && !error && (
                            <p className="text-xs text-muted-foreground">
                                Range: {param.min} - {param.max}
                            </p>
                        )}
                    </div>
                );

            case 'boolean':
                return (
                    <Switch
                        id={param.key}
                        checked={value as boolean}
                        onCheckedChange={(checked) => handleChange(param.key, checked, param)}
                    />
                );

            case 'select':
                return (
                    <Select
                        value={String(value)}
                        onValueChange={(v) => handleChange(param.key, v, param)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {param.options?.map((option) => (
                                <SelectItem key={String(option.value)} value={String(option.value)}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'string':
            default:
                return (
                    <Input
                        id={param.key}
                        type="text"
                        value={value as string}
                        onChange={(e) => handleChange(param.key, e.target.value, param)}
                    />
                );
        }
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Settings className="h-4 w-4" />
                        {templateName ? `${templateName} Parameters` : 'Parameters'}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {parameters.map((param) => (
                    <div key={param.key} className="grid gap-2">
                        <Label htmlFor={param.key} className="text-sm font-medium">
                            {param.label}
                        </Label>
                        {param.description && (
                            <p className="text-xs text-muted-foreground -mt-1">{param.description}</p>
                        )}
                        {renderInput(param)}
                    </div>
                ))}

                {parameters.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No parameters available
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
