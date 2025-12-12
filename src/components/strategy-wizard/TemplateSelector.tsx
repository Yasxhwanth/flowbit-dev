'use client';

/**
 * TemplateSelector Component
 * Step 1: Choose a strategy template
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, BarChart3, Zap } from 'lucide-react';
import type { TemplateListItem } from '@/lib/templates';

interface TemplateSelectorProps {
    templates: TemplateListItem[];
    onSelect: (template: TemplateListItem) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
    trend: <TrendingUp className="h-5 w-5" />,
    momentum: <Activity className="h-5 w-5" />,
    volatility: <BarChart3 className="h-5 w-5" />,
    breakout: <Zap className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
    trend: 'bg-blue-500/20 text-blue-500',
    momentum: 'bg-purple-500/20 text-purple-500',
    volatility: 'bg-orange-500/20 text-orange-500',
    breakout: 'bg-green-500/20 text-green-500',
};

export function TemplateSelector({ templates, onSelect }: TemplateSelectorProps) {
    return (
        <div className="space-y-4">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Choose a Strategy Template</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Select a pre-built strategy to customize
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                    <Card
                        key={template.id}
                        className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                        onClick={() => onSelect(template)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${categoryColors[template.category] || 'bg-muted'}`}>
                                        {categoryIcons[template.category] || <BarChart3 className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{template.name}</CardTitle>
                                        <Badge variant="outline" className="text-xs mt-1">
                                            {template.category}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-sm">
                                {template.description}
                            </CardDescription>
                            <div className="mt-3 flex flex-wrap gap-1">
                                {template.parameters.slice(0, 3).map((p) => (
                                    <Badge key={p.key} variant="secondary" className="text-xs">
                                        {p.label}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
