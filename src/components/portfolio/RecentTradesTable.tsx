import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Trade {
    workflowId: string;
    workflowName: string;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    pnl?: number;
    timestamp: string | Date;
}

interface RecentTradesTableProps {
    trades: Trade[];
}

export function RecentTradesTable({ trades }: RecentTradesTableProps) {
    if (trades.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Trades</CardTitle>
                </CardHeader>
                <CardContent className="h-32 flex items-center justify-center text-muted-foreground">
                    No recent trades found
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Strategy</TableHead>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Side</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">PNL</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {trades.map((trade, i) => (
                            <TableRow key={i}>
                                <TableCell className="text-muted-foreground">
                                    {format(new Date(trade.timestamp), "MMM d, HH:mm")}
                                </TableCell>
                                <TableCell className="font-medium">{trade.workflowName}</TableCell>
                                <TableCell>{trade.symbol}</TableCell>
                                <TableCell>
                                    <Badge variant={trade.side === "BUY" ? "default" : "destructive"}>
                                        {trade.side}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{trade.price.toFixed(2)}</TableCell>
                                <TableCell className="text-right">{trade.quantity}</TableCell>
                                <TableCell className={`text-right font-medium ${(trade.pnl || 0) >= 0 ? "text-green-500" : "text-red-500"
                                    }`}>
                                    {trade.pnl ? trade.pnl.toFixed(2) : "-"}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
