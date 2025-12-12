"use client";

import { trpc } from "@/trpc/client";
import { PortfolioStats } from "@/components/portfolio/PortfolioStats";
import { BrokerDistributionChart } from "@/components/portfolio/BrokerDistributionChart";
import { PortfolioEquityCurve } from "@/components/portfolio/PortfolioEquityCurve";
import { RecentTradesTable } from "@/components/portfolio/RecentTradesTable";
import { Loader2 } from "lucide-react";

export default function PortfolioPage() {
    const { data, isLoading, error } = trpc.portfolio.getSummary.useQuery();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center text-destructive">
                Error loading portfolio data: {error.message}
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Portfolio Summary</h1>
            </div>

            <PortfolioStats stats={data.stats} />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <BrokerDistributionChart distribution={data.brokerDistribution} />
                <PortfolioEquityCurve workflows={data.workflows} />
            </div>

            <RecentTradesTable trades={data.recentTrades} />
        </div>
    );
}
