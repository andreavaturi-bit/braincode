import { useMemo } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Download, Maximize2, Minimize2, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = {
  verde: "bg-[oklch(0.65_0.25_145)]",
  rosso: "bg-[oklch(0.65_0.20_25)]",
  blu: "bg-[oklch(0.65_0.25_264)]",
} as const;

type Scores = { verde: number; rosso: number; blu: number };

function BrainBar({ scores, compact = false }: { scores: Scores; compact?: boolean }) {
  const total = scores.verde + scores.rosso + scores.blu || 36;
  const values = [
    { label: "VERDE", score: scores.verde, className: COLORS.verde },
    { label: "ROSSO", score: scores.rosso, className: COLORS.rosso },
    { label: "BLU", score: scores.blu, className: COLORS.blu },
  ];
  return <div className={`${compact ? "h-7 text-[10px]" : "h-16 text-sm"} flex overflow-hidden rounded-lg shadow-md`}>
    {values.map((value) => <div key={value.label} className={`${value.className} flex items-center justify-center font-bold text-black`} style={{ width: `${(value.score / total) * 100}%` }}>
      {value.score / total > (compact ? 0.16 : 0.12) ? `${value.label}${compact ? "" : ` ${value.score}`}` : ""}
    </div>)}
  </div>;
}

function escapeCsv(value: unknown) {
  const raw = String(value ?? "");
  const safe = /^[=+\-@]/.test(raw.trim()) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function scoreFor(member: { result: { verdeScore: number; rossoScore: number; bluScore: number } | null }, color: "verde" | "rosso" | "blu") {
  if (!member.result) return -1;
  return color === "verde" ? member.result.verdeScore : color === "rosso" ? member.result.rossoScore : member.result.bluScore;
}

export default function GroupDetails() {
  const { groupId } = useParams<{ groupId: string }>();
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const projection = new URLSearchParams(location.split("?")[1] ?? "").get("proiezione") === "1";
  const sort = new URLSearchParams(location.split("?")[1] ?? "").get("ordina") ?? "recenti";
  const { data: isAdmin, isLoading: isCheckingAdmin } = trpc.admin.isAdmin.useQuery(undefined, { enabled: isAuthenticated });
  const detailQuery = trpc.admin.groups.detail.useQuery(
    { groupId: groupId! },
    { enabled: Boolean(groupId && isAdmin && !projection) }
  );
  const summaryQuery = trpc.admin.groups.summary.useQuery(
    { groupId: groupId! },
    { enabled: Boolean(groupId && isAdmin && projection) }
  );
  const data = projection ? summaryQuery.data : detailQuery.data;
  const isLoading = projection ? summaryQuery.isLoading : detailQuery.isLoading;
  const error = projection ? summaryQuery.error : detailQuery.error;

  const members = useMemo(() => {
    if (!detailQuery.data) return [];
    const sorted = [...detailQuery.data.members];
    if (sort === "verde" || sort === "rosso" || sort === "blu") {
      sorted.sort((a, b) => scoreFor(b, sort) - scoreFor(a, sort));
    } else {
      sorted.sort((a, b) => new Date(b.result?.completedAt ?? 0).getTime() - new Date(a.result?.completedAt ?? 0).getTime());
    }
    return sorted;
  }, [detailQuery.data, sort]);

  const exportCsv = () => {
    if (!detailQuery.data) return;
    const headers = ["Nome", "Email", "Completato il", "Verde", "Rosso", "Blu", "Profilo"];
    const rows = members.map((member) => [
      member.userName || "",
      member.userEmail || "",
      member.result ? new Date(member.result.completedAt).toLocaleString("it-IT") : "",
      member.result?.verdeScore ?? "",
      member.result?.rossoScore ?? "",
      member.result?.bluScore ?? "",
      member.result?.profileType ?? "Non completato",
    ]);
    const content = `\ufeff${[headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n")}`;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `braincode-gruppo-${detailQuery.data.group.slug}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV del gruppo scaricato.");
  };

  if (!isAuthenticated || (!isCheckingAdmin && !isAdmin)) {
    return <main className="min-h-screen bg-background p-6 text-center"><Card className="mx-auto mt-20 max-w-md"><CardHeader><CardTitle>Accesso riservato</CardTitle><CardDescription>Questa pagina è disponibile solo agli amministratori.</CardDescription></CardHeader><CardContent><Link href="/"><Button>Torna alla home</Button></Link></CardContent></Card></main>;
  }
  if (isLoading || isCheckingAdmin) return <main className="min-h-screen bg-background p-6 text-center text-muted-foreground">Caricamento gruppo...</main>;
  if (!data) return <main className="min-h-screen bg-background p-6 text-center"><Card className="mx-auto mt-20 max-w-md"><CardHeader><CardTitle>Gruppo non trovato</CardTitle><CardDescription>{error?.message || "Il gruppo richiesto non esiste più."}</CardDescription></CardHeader><CardContent><Link href="/dashboard"><Button>Torna all'amministrazione</Button></Link></CardContent></Card></main>;

  const { group, overview } = data;
  const basePath = `/admin/groups/${group.id}`;
  const distributionColor = (key: string) => key === "verde" ? COLORS.verde : key === "rosso" ? COLORS.rosso : key === "blu" ? COLORS.blu : key === "doppia" ? "bg-violet-500" : "bg-slate-500";

  if (projection) {
    return <main className="min-h-screen bg-[#08090d] px-6 py-10 text-white md:px-14"><div className="mx-auto max-w-6xl space-y-12"><div className="flex items-center justify-between border-b border-white/15 pb-6"><div><p className="text-sm uppercase tracking-[0.3em] text-white/50">BrainCode di gruppo</p><h1 className="mt-2 text-4xl font-bold md:text-6xl">{group.name}</h1></div><Link href={basePath}><Button variant="outline" className="border-white/25 text-white hover:bg-white/10"><Minimize2 className="mr-2 h-4 w-4" /> Esci dalla proiezione</Button></Link></div><section className="grid gap-6 md:grid-cols-2"><div className="rounded-2xl bg-white/5 p-8"><p className="text-lg text-white/65">Persone con test completato</p><p className="mt-3 text-7xl font-bold">{overview.completedCount}</p><p className="mt-2 text-white/50">su {overview.memberCount} membri del gruppo</p></div><div className="rounded-2xl bg-white/5 p-8"><p className="text-lg text-white/65">BrainCode medio</p><div className="mt-7"><BrainBar scores={overview.average} /></div></div></section><section className="rounded-2xl bg-white/5 p-8"><h2 className="text-2xl font-bold">Distribuzione dei profili</h2><div className="mt-8 grid gap-5 md:grid-cols-2">{overview.distribution.map((item) => <div key={item.key}><div className="mb-2 flex justify-between text-lg"><span>{item.label}</span><strong>{item.count} · {item.percent.toFixed(0)}%</strong></div><div className="h-4 overflow-hidden rounded-full bg-white/10"><div className={`${distributionColor(item.key)} h-full rounded-full`} style={{ width: `${item.percent}%` }} /></div></div>)}</div></section></div></main>;
  }

  return <main className="min-h-screen bg-background"><header className="sticky top-0 z-30 border-b border-border/40 bg-background/90 backdrop-blur"><div className="container flex h-16 items-center justify-between"><Link href="/dashboard"><Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Amministrazione</Button></Link><div className="flex gap-2"><Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" /> CSV</Button><Link href={`${basePath}?proiezione=1`}><Button><Maximize2 className="mr-2 h-4 w-4" /> Modalità proiezione</Button></Link></div></div></header><div className="container py-8 md:py-12"><div className="mx-auto max-w-6xl space-y-8"><section><p className="text-sm font-semibold uppercase tracking-wider text-primary">Gruppo</p><h1 className="mt-2 text-4xl font-bold">{group.name}</h1><p className="mt-2 text-muted-foreground">{overview.memberCount} membri · {overview.completedCount} test completati</p></section><div className="grid gap-6 md:grid-cols-2"><Card><CardHeader><CardTitle>BrainCode medio</CardTitle><CardDescription>I valori sono arrotondati e mantengono sempre la somma 36.</CardDescription></CardHeader><CardContent className="space-y-4"><BrainBar scores={overview.average} /><div className="grid grid-cols-3 text-center text-sm"><div><strong className="text-lg text-[oklch(0.65_0.25_145)]">{overview.average.verde}</strong><p className="text-muted-foreground">VERDE</p></div><div><strong className="text-lg text-[oklch(0.65_0.20_25)]">{overview.average.rosso}</strong><p className="text-muted-foreground">ROSSO</p></div><div><strong className="text-lg text-[oklch(0.65_0.25_264)]">{overview.average.blu}</strong><p className="text-muted-foreground">BLU</p></div></div></CardContent></Card><Card><CardHeader><CardTitle>Distribuzione dei profili</CardTitle><CardDescription>Percentuali calcolate sui test completati.</CardDescription></CardHeader><CardContent className="space-y-4">{overview.distribution.map((item) => <div key={item.key}><div className="mb-1 flex justify-between text-sm"><span>{item.label}</span><span className="font-semibold">{item.count} · {item.percent.toFixed(1)}%</span></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className={`${distributionColor(item.key)} h-full rounded-full`} style={{ width: `${item.percent}%` }} /></div></div>)}</CardContent></Card></div><Card><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Membri</CardTitle><CardDescription>Ogni persona compare con il suo test più recente nel gruppo.</CardDescription></div><label className="text-sm text-muted-foreground">Ordina per <select className="ml-2 h-9 rounded-md border border-input bg-background px-2 text-foreground" value={sort} onChange={(event) => { const params = new URLSearchParams(); if (event.target.value !== "recenti") params.set("ordina", event.target.value); navigate(`${basePath}${params.toString() ? `?${params}` : ""}`); }}><option value="recenti">test più recente</option><option value="verde">VERDE</option><option value="rosso">ROSSO</option><option value="blu">BLU</option></select></label></div></CardHeader><CardContent><div className="space-y-3">{members.map((member) => <div key={member.userId} className="rounded-lg border border-border p-4"><div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{member.userName || "Utente senza nome"}</p><p className="text-sm text-muted-foreground">{member.userEmail || "Nessuna email"}</p></div>{member.result ? <p className="text-sm text-muted-foreground">{member.result.profileType}</p> : <p className="text-sm text-muted-foreground">Test non completato</p>}</div>{member.result ? <BrainBar compact scores={{ verde: member.result.verdeScore, rosso: member.result.rossoScore, blu: member.result.bluScore }} /> : null}</div>)}</div></CardContent></Card></div></div></main>;
}
