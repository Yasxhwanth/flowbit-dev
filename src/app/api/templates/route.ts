/**
 * Templates API Route
 * GET: List all templates
 * POST: Build workflow from template
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTemplateList, getTemplateById } from '@/lib/templates';

export async function GET() {
    try {
        const templates = getTemplateList();
        return NextResponse.json({ templates });
    } catch (error) {
        console.error('[Templates] List error:', error);
        return NextResponse.json({ error: 'Failed to list templates' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { templateId, params } = body;

        if (!templateId) {
            return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
        }

        const template = getTemplateById(templateId);
        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        // Merge default params with provided params
        const defaultParams: Record<string, number | string> = {};
        for (const param of template.parameters) {
            defaultParams[param.key] = param.defaultValue;
        }
        const mergedParams = { ...defaultParams, ...params };

        // Build workflow
        const workflow = template.buildWorkflow(mergedParams);

        return NextResponse.json({
            workflow,
            templateId: template.id,
            templateName: template.name,
        });
    } catch (error) {
        console.error('[Templates] Build error:', error);
        const message = error instanceof Error ? error.message : 'Failed to build workflow';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
