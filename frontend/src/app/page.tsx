export default function Home() {
  const features = [
    {
      title: "$100K virtual bankroll",
      description: "Start with house money and experiment without risking real cash.",
    },
    {
      title: "Real market prices",
      description: "Trade against live quotes and see how your strategies perform.",
    },
    {
      title: "Track everything",
      description: "Holdings, history, and performance snapshots auto-updated for you.",
    },
    {
      title: "Compete & climb",
      description: "Challenge friends and chase medals on the global leaderboard.",
    },
  ];

  const steps = [
    "Create your free account",
    "Search any stock and place paper trades",
    "Watch your portfolio change in real time",
    "Take the top spot on the leaderboard",
  ];

  return (
    <div className="space-y-16">
      <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-12 text-white shadow-xl">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Paper trading, gamified</p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Learn to trade with zero risk and beat the market with friends.
            </h1>
            <p className="text-lg text-slate-200">
              PaperStack gives you $100,000 in virtual cash, live prices, and a daily-updated leaderboard so you can
              practice, compete, and build confidence before touching real money.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/register"
                className="rounded-lg bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:translate-y-[-1px] hover:bg-emerald-300"
              >
                Get Started Free
              </a>
              <a
                href="/dashboard"
                className="rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View Dashboard
              </a>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-300">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-100">Live prices</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Leaderboard medals</span>
            </div>
          </div>
          <div className="relative hidden overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl lg:block">
            <div className="mb-4 flex items-center justify-between text-sm text-slate-200">
              <span>Sample Portfolio</span>
              <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-100">+5.6% today</span>
            </div>
            <div className="space-y-3 text-sm">
              {["AAPL", "MSFT", "NVDA", "TSLA", "GOOGL"].map((sym, idx) => (
                <div key={sym} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                  <div>
                    <p className="font-semibold text-white">{sym}</p>
                    <p className="text-xs text-slate-300">{[50, 30, 12, 15, 18][idx]} shares</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">${[8925, 10430, 6210, 3980, 7150][idx].toLocaleString()}</p>
                    <p className={`text-xs ${idx % 2 === 0 ? "text-emerald-300" : "text-red-300"}`}>
                      {idx % 2 === 0 ? "+" : "-"}
                      {(1.1 + idx * 0.3).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Why PaperStack</p>
          <h2 className="text-3xl font-bold">Designed for learning & competition</h2>
          <p className="text-muted-foreground">Everything you need to practice trading safely and stay motivated.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-1">
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-6 rounded-3xl border bg-muted/40 p-8">
        <h2 className="text-2xl font-bold">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-2">
          {steps.map((step, idx) => (
            <li key={step} className="flex gap-3 rounded-2xl bg-background p-4 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {idx + 1}
              </span>
              <div>
                <p className="font-semibold">{step}</p>
                <p className="text-sm text-muted-foreground">
                  {idx === 1
                    ? "Search any symbol, get live quotes, and place simulated orders."
                    : idx === 2
                    ? "Track performance with charts, snapshots, and live price updates."
                    : idx === 3
                    ? "Refresh the leaderboard every few minutes and brag about your rank."
                    : "Sign up in seconds—no credit card required."}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl rounded-3xl border bg-primary px-8 py-10 text-primary-foreground shadow-lg">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em]">Ready to play?</p>
            <h3 className="text-3xl font-bold">Get your $100K virtual account today.</h3>
            <p className="text-sm text-primary-foreground/80">Join traders learning together—risk free.</p>
          </div>
          <div className="flex gap-3">
            <a
              href="/register"
              className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-primary shadow hover:bg-slate-100"
            >
              Create Account
            </a>
            <a
              href="/leaderboard"
              className="rounded-lg border border-white px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-white/10"
            >
              View Leaderboard
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

