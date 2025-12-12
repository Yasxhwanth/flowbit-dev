'use client';

/**
 * ReviewStep Component
 * Step 4: Review and generate workflow
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Settings, BarChart3, Layers } from 'lucide-react';
import type { TemplateListItem } from '@/lib/templates';
import type { MarketSettings } from './MarketSettingsForm';

interface ReviewStepProps {
    template: TemplateListItem;
    marketSettings: MarketSettings;
    params: Record<string, number | string>;
}

export function ReviewStep({ template, marketSettings, params }: ReviewStepProps) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Review Your Strategy</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Confirm your settings before generating the workflow
                </p>
            </div>

            <div className="max-w-lg mx-auto space-y-4">
                {/* Template */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Layers className="h-4 w-4" />
                            Template
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="font-medium">{template.name}</span>
                            <Badge>{template.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                        </p>
                    </CardContent>
                </Card>

                {/* Market Settings */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <BarChart3 className="h-4 w-4" />
                            Market Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground">Symbol:</span>
                                <span className="ml-2 font-medium">{marketSettings.symbol}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Interval:</span>
                                <span className="ml-2 font-medium">{marketSettings.interval}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Broker:</span>
                                <span className="ml-2 font-medium capitalize">{marketSettings.broker}</span>
                            </div>
                            {marketSettings.securityId && (
                                <div>
                                    <span className="text-muted-foreground">Security ID:</span>
                                    <span className="ml-2 font-medium">{marketSettings.securityId}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Parameters */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Settings className="h-4 w-4" />
                            Strategy Parameters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(params).map(([key, value]) => {
                                const paramDef = template.parameters.find((p) => p.key === key);
                                return (
                                    <div key={key}>
                                        <span className="text-muted-foreground">{paramDef?.label || key}:</span>
                                        <span className="ml-2 font-medium">{value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Ready indicator */}
                <div className="flex items-center justify-center gap-2 p-4 bg-green-500/10 text-green-600 rounded-lg">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Ready to generate workflow</span>
                </div>
            </div>
        </div>
    );
}
