import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Download, Share2, ArrowLeft, FileText } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Results() {
  const { testResultId } = useParams<{ testResultId: string }>();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: result, isLoading } = trpc.test.getResult.useQuery(
    { testResultId: testResultId! },
    { enabled: !!testResultId && isAuthenticated }
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Calcolo del tuo profilo...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Risultato non trovato</CardTitle>
            <CardDescription>Il risultato del test richiesto non esiste o non hai i permessi per visualizzarlo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>Torna alla Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = result.verdeScore + result.rossoScore + result.bluScore;
  const verdePercent = (result.verdeScore / total) * 100;
  const rossoPercent = (result.rossoScore / total) * 100;
  const bluPercent = (result.bluScore / total) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.25_145)] via-[oklch(0.65_0.20_25)] to-[oklch(0.65_0.25_264)] flex items-center justify-center">
                <Brain className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[oklch(0.65_0.25_145)] via-[oklch(0.65_0.20_25)] to-[oklch(0.65_0.25_264)] bg-clip-text text-transparent">
                BrainCode
              </h1>
            </div>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              I Miei Risultati
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container flex-1 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Success Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-4xl font-bold">Il Tuo BrainCode</h2>
            <p className="text-xl text-muted-foreground">
              Test completato il {new Date(result.completedAt).toLocaleDateString("it-IT", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Color Bar Visualization */}
          <Card className="border-accent/30">
            <CardHeader>
              <CardTitle>La Tua Composizione Psicologica</CardTitle>
              <CardDescription>
                Distribuzione percentuale delle tre componenti del cervello
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Color Bar */}
              <div className="h-24 rounded-lg overflow-hidden flex shadow-lg">
                <div
                  className="bg-[oklch(0.65_0.25_145)] flex items-center justify-center text-black font-bold text-lg transition-all duration-500"
                  style={{ width: `${verdePercent}%` }}
                >
                  {verdePercent > 15 && "VERDE"}
                </div>
                <div
                  className="bg-[oklch(0.65_0.20_25)] flex items-center justify-center text-black font-bold text-lg transition-all duration-500"
                  style={{ width: `${rossoPercent}%` }}
                >
                  {rossoPercent > 15 && "ROSSO"}
                </div>
                <div
                  className="bg-[oklch(0.65_0.25_264)] flex items-center justify-center text-black font-bold text-lg transition-all duration-500"
                  style={{ width: `${bluPercent}%` }}
                >
                  {bluPercent > 15 && "BLU"}
                </div>
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-[oklch(0.65_0.25_145)]/10 border border-[oklch(0.65_0.25_145)]/30">
                  <div className="text-3xl font-bold text-[oklch(0.65_0.25_145)]">{result.verdeScore}</div>
                  <div className="text-sm text-muted-foreground mt-1">VERDE</div>
                  <div className="text-xs text-muted-foreground mt-1">{verdePercent.toFixed(1)}%</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-[oklch(0.65_0.20_25)]/10 border border-[oklch(0.65_0.20_25)]/30">
                  <div className="text-3xl font-bold text-[oklch(0.65_0.20_25)]">{result.rossoScore}</div>
                  <div className="text-sm text-muted-foreground mt-1">ROSSO</div>
                  <div className="text-xs text-muted-foreground mt-1">{rossoPercent.toFixed(1)}%</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-[oklch(0.65_0.25_264)]/10 border border-[oklch(0.65_0.25_264)]/30">
                  <div className="text-3xl font-bold text-[oklch(0.65_0.25_264)]">{result.bluScore}</div>
                  <div className="text-sm text-muted-foreground mt-1">BLU</div>
                  <div className="text-xs text-muted-foreground mt-1">{bluPercent.toFixed(1)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Description */}
          <Card className="border-accent/30">
            <CardHeader>
              <CardTitle className="text-2xl break-words">{result.profileType}</CardTitle>
              <CardDescription>Il tuo profilo psicologico</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">{result.profileDescription}</p>
            </CardContent>
          </Card>

          {/* Component Details */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-[oklch(0.65_0.25_145)]/30 bg-card/50">
              <CardHeader>
                <CardTitle className="text-[oklch(0.65_0.25_145)] text-lg">Componente VERDE</CardTitle>
                <CardDescription>Sociale e Relazionale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground leading-relaxed">
                  La componente VERDE rappresenta l'aspetto sociale della tua personalità. 
                  {verdePercent > 40 && " È la tua componente dominante, indicando una forte propensione alle relazioni interpersonali."}
                  {verdePercent > 25 && verdePercent <= 40 && " Ha un ruolo significativo nel tuo profilo."}
                  {verdePercent <= 25 && " Ha un ruolo secondario nel tuo profilo."}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[oklch(0.65_0.20_25)]/30 bg-card/50">
              <CardHeader>
                <CardTitle className="text-[oklch(0.65_0.20_25)] text-lg">Componente ROSSO</CardTitle>
                <CardDescription>Dinamica e Impulsiva</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground leading-relaxed">
                  La componente ROSSO rappresenta l'aspetto dinamico e orientato all'azione.
                  {rossoPercent > 40 && " È la tua componente dominante, indicando una forte propensione all'azione e alla leadership."}
                  {rossoPercent > 25 && rossoPercent <= 40 && " Ha un ruolo significativo nel tuo profilo."}
                  {rossoPercent <= 25 && " Ha un ruolo secondario nel tuo profilo."}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[oklch(0.65_0.25_264)]/30 bg-card/50">
              <CardHeader>
                <CardTitle className="text-[oklch(0.65_0.25_264)] text-lg">Componente BLU</CardTitle>
                <CardDescription>Riflessiva e Sistematica</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground leading-relaxed">
                  La componente BLU rappresenta l'aspetto riflessivo e orientato alla pianificazione.
                  {bluPercent > 40 && " È la tua componente dominante, indicando una forte propensione alla riflessione e alla pianificazione."}
                  {bluPercent > 25 && bluPercent <= 40 && " Ha un ruolo significativo nel tuo profilo."}
                  {bluPercent <= 25 && " Ha un ruolo secondario nel tuo profilo."}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
            <Link href="/test">
              <Button size="lg">
                Rifai il Test
              </Button>
            </Link>
            <Link href={`/test-details/${testResultId}`}>
              <Button size="lg" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Vedi Dettagli Risposte
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                Vedi Tutti i Risultati
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 BrainCode. Basato sulla teoria del cervello tripartito di Paul MacLean.</p>
        </div>
      </footer>
    </div>
  );
}
