import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  totalValue: number;
  cashBalance: number;
  totalReturn: number;
  totalReturnPercent: number;
};

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export default function PortfolioSummary({
  totalValue,
  cashBalance,
  totalReturn,
  totalReturnPercent,
}: Props) {
  const positive = totalReturn >= 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-3xl font-bold">{formatter.format(totalValue)}</p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground">Cash Available</p>
            <p className="font-medium">{formatter.format(cashBalance)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Total Return</p>
            <p
              className={cn(
                "font-semibold",
                positive ? "text-green-600" : "text-red-600"
              )}
            >
              {formatter.format(totalReturn)}{" "}
              <span className="text-sm">
                ({totalReturnPercent.toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

