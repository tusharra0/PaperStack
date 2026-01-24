export default function Home() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Paper trading for students
        </p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Practice investing with $100,000 in virtual cash.
        </h1>
        <p className="text-lg text-muted-foreground">
          Research stocks, place real-time simulated trades, track your
          portfolio, and climb the leaderboard without risking real money.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="/register"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Get Started
          </a>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-semibold transition hover:bg-muted"
          >
            View Dashboard
          </a>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Portfolio Value</p>
            <p className="text-3xl font-bold">$125,430.18</p>
          </div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            +5.6% today
          </span>
        </div>
        <div className="space-y-3">
          {[
            { symbol: "AAPL", shares: "50", value: "$8,925", change: "+1.9%" },
            { symbol: "MSFT", shares: "30", value: "$10,430", change: "+1.1%" },
            { symbol: "NVDA", shares: "12", value: "$6,210", change: "+2.4%" },
            { symbol: "TSLA", shares: "15", value: "$3,980", change: "-0.6%" },
          ].map((holding) => (
            <div
              key={holding.symbol}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div>
                <p className="font-semibold">{holding.symbol}</p>
                <p className="text-sm text-muted-foreground">
                  {holding.shares} shares
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{holding.value}</p>
                <p
                  className={`text-sm ${
                    holding.change.startsWith("-")
                      ? "text-red-500"
                      : "text-green-600"
                  }`}
                >
                  {holding.change}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
