'use client';

/**
 * Strategy Wizard Page
 * Multi-step wizard for creating trading strategies
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TemplateSelector, MarketSettingsForm, ReviewStep, type MarketSettings } from '@/components/strategy-wizard';
import { getTemplateList, getTemplateById, type TemplateListItem, type TemplateParameter } from '@/lib/templates';
import { autoLayout } from '@/lib/workflow/layout';

const steps = [
    { id: 1, title: 'Template' },
    { id: 2, title: 'Market' },
    { id: 3, title: 'Parameters' },
    { id: 4, title: 'Review' },
];

export default function StrategyWizardPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateListItem | null>(null);
    const [marketSettings, setMarketSettings] = useState<MarketSettings>({
        symbol: '',
        interval: '1d',
        broker: 'dhan',
    });
    const [params, setParams] = useState<Record<string, number | string>>({});
    const [isGenerating, setIsGenerating] = useState(false);

    const templates = getTemplateList();

    // Initialize params when template is selected
    function handleTemplateSelect(template: TemplateListItem) {
        setSelectedTemplate(template);
        // Set default values
        const defaults: Record<string, number | string> = {};
        for (const p of template.parameters) {
            defaults[p.key] = p.defaultValue;
        }
        setParams(defaults);
        setStep(2);
    }

    // Validate current step
    function canProceed(): boolean {
        switch (step) {
            case 1:
                return selectedTemplate !== null;
            case 2:
                if (!marketSettings.symbol || !marketSettings.interval || !marketSettings.broker) {
                    return false;
                }
                if (marketSettings.broker === 'dhan' && !marketSettings.securityId) {
                    return false;
                }
                return true;
            case 3:
                return true; // Params have defaults
            case 4:
                return true;
            default:
                return false;
        }
    }

    // Generate workflow
    async function handleGenerate() {
        if (!selectedTemplate) return;

        setIsGenerating(true);

        try {
            // Get full template with buildWorkflow
            const fullTemplate = getTemplateById(selectedTemplate.id);
            if (!fullTemplate) {
                throw new Error('Template not found');
            }

            // Build workflow - filter out undefined values
            const workflowParams: Record<string, string | number> = {
                ...params,
                symbol: marketSettings.symbol,
                interval: marketSettings.interval,
                broker: marketSettings.broker,
            };
            if (marketSettings.securityId) {
                workflowParams.securityId = marketSettings.securityId;
            }
            if (marketSettings.exchangeSegment) {
                workflowParams.exchangeSegment = marketSettings.exchangeSegment;
            }

            const workflow = fullTemplate.buildWorkflow(workflowParams);

            // Apply auto-layout
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const laidOut = autoLayout(workflow.nodes as any[], workflow.edges as any[]);

            // Store in session/local for now (would save to DB in production)
            const workflowData = {
                id: `wf_${Date.now()}`,
                name: `${selectedTemplate.name} - ${marketSettings.symbol}`,
                template: selectedTemplate.id,
                params: workflowParams,
                nodes: laidOut.nodes,
                edges: laidOut.edges,
                createdAt: new Date().toISOString(),
            };

            // Store workflow data
            sessionStorage.setItem('pendingWorkflow', JSON.stringify(workflowData));

            // Redirect to workflow editor
            router.push(`/workflows?new=${workflowData.id}`);
        } catch (error) {
            console.error('Failed to generate workflow:', error);
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Wand2 className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-bold">Strategy Wizard</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Create a trading strategy in a few simple steps
                    </p>
                </div>

                {/* Progress */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm mb-2">
                        {steps.map((s) => (
                            <span
                                key={s.id}
                                className={`${step >= s.id ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                            >
                                {s.title}
                            </span>
                        ))}
                    </div>
                    <Progress value={(step / steps.length) * 100} className="h-2" />
                </div>

                {/* Content */}
                <Card>
                    <CardContent className="p-6">
                        {step === 1 && (
                            <TemplateSelector
                                templates={templates}
                                onSelect={handleTemplateSelect}
                            />
                        )}

                        {step === 2 && (
                            <MarketSettingsForm
                                value={marketSettings}
                                onChange={setMarketSettings}
                            />
                        )}

                        {step === 3 && selectedTemplate && (
                            <div className="space-y-4">
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-semibold">Strategy Parameters</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Customize {selectedTemplate.name} settings
                                    </p>
                                </div>
                                <div className="max-w-md mx-auto space-y-4">
                                    {selectedTemplate.parameters.map((p: TemplateParameter) => (
                                        <div key={p.key} className="space-y-2">
                                            <label className="text-sm font-medium">{p.label}</label>
                                            <input
                                                type={p.type === 'number' ? 'number' : 'text'}
                                                value={params[p.key] ?? p.defaultValue}
                                                onChange={(e) =>
                                                    setParams({
                                                        ...params,
                                                        [p.key]: p.type === 'number' ? Number(e.target.value) : e.target.value,
                                                    })
                                                }
                                                min={p.min}
                                                max={p.max}
                                                className="w-full px-3 py-2 border rounded-md bg-background"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 4 && selectedTemplate && (
                            <ReviewStep
                                template={selectedTemplate}
                                marketSettings={marketSettings}
                                params={params}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={() => (step === 1 ? router.back() : setStep(step - 1))}
                        disabled={isGenerating}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {step === 1 ? 'Cancel' : 'Back'}
                    </Button>

                    {step < 4 ? (
                        <Button
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed()}
                        >
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || !canProceed()}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Generate Workflow
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
