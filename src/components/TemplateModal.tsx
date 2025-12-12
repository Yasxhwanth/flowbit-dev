'use client';

/**
 * Template Selector Modal
 * Allows users to browse and load strategy templates
 */

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Loader2 } from 'lucide-react';

interface TemplateParameter {
    key: string;
    label: string;
    type: 'number' | 'string' | 'select';
    defaultValue: number | string;
    min?: number;
    max?: number;
}

interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    parameters: TemplateParameter[];
}

interface TemplateModalProps {
    onSelect: (workflow: object, templateName: string) => void;
}

export function TemplateModal({ onSelect }: TemplateModalProps) {
    const [open, setOpen] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [params, setParams] = useState<Record<string, number | string>>({});
    const [building, setBuilding] = useState(false);

    // Fetch templates on open
    useEffect(() => {
        if (open && templates.length === 0) {
            fetchTemplates();
        }
    }, [open]);

    async function fetchTemplates() {
        setLoading(true);
        try {
            const response = await fetch('/api/templates');
            const data = await response.json();
            setTemplates(data.templates || []);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleSelectTemplate(template: Template) {
        setSelectedTemplate(template);
        // Initialize params with defaults
        const defaultParams: Record<string, number | string> = {};
        for (const param of template.parameters) {
            defaultParams[param.key] = param.defaultValue;
        }
        setParams(defaultParams);
    }

    async function handleBuildWorkflow() {
        if (!selectedTemplate) return;

        setBuilding(true);
        try {
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId: selectedTemplate.id,
                    params,
                }),
            });

            const data = await response.json();
            if (data.workflow) {
                onSelect(data.workflow, data.templateName);
                setOpen(false);
                setSelectedTemplate(null);
            }
        } catch (error) {
            console.error('Failed to build workflow:', error);
        } finally {
            setBuilding(false);
        }
    }

    function getCategoryColor(category: string) {
        switch (category) {
            case 'trend':
                return 'bg-blue-500/20 text-blue-500';
            case 'momentum':
                return 'bg-purple-500/20 text-purple-500';
            case 'volatility':
                return 'bg-orange-500/20 text-orange-500';
            case 'breakout':
                return 'bg-green-500/20 text-green-500';
            default:
                return 'bg-gray-500/20 text-gray-500';
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Layers className="mr-2 h-4 w-4" />
                    Templates
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Strategy Templates</DialogTitle>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                )}

                {!loading && !selectedTemplate && (
                    <div className="grid gap-3">
                        {templates.map((template) => (
                            <Card
                                key={template.id}
                                className="cursor-pointer hover:border-primary transition-colors"
                                onClick={() => handleSelectTemplate(template)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{template.name}</CardTitle>
                                        <Badge className={getCategoryColor(template.category)}>
                                            {template.category}
                                        </Badge>
                                    </div>
                                    <CardDescription>{template.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}

                {selectedTemplate && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                                ← Back
                            </Button>
                            <h3 className="font-semibold">{selectedTemplate.name}</h3>
                        </div>

                        <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>

                        <div className="space-y-3">
                            <h4 className="font-medium">Parameters</h4>
                            {selectedTemplate.parameters.map((param) => (
                                <div key={param.key} className="grid gap-2">
                                    <Label htmlFor={param.key}>{param.label}</Label>
                                    <Input
                                        id={param.key}
                                        type={param.type === 'number' ? 'number' : 'text'}
                                        value={params[param.key] ?? param.defaultValue}
                                        min={param.min}
                                        max={param.max}
                                        onChange={(e) =>
                                            setParams({
                                                ...params,
                                                [param.key]:
                                                    param.type === 'number' ? Number(e.target.value) : e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            ))}
                        </div>

                        <Button onClick={handleBuildWorkflow} disabled={building} className="w-full">
                            {building ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Building...
                                </>
                            ) : (
                                'Create Workflow'
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
