import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Brain, Zap, Target, Users } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.25_145)] via-[oklch(0.65_0.20_25)] to-[oklch(0.65_0.25_264)] flex items-center justify-center">
              <Brain className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[oklch(0.65_0.25_145)] via-[oklch(0.65_0.20_25)] to-[oklch(0.65_0.25_264)] bg-clip-text text-transparent">
              BrainCode
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">I Miei Risultati</Button>
                </Link>
                <Link href="/test">
                  <Button>Inizia il Test</Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button>Accedi con Google</Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block">
            <div className="px-4 py-2 rounded-full bg-accent/50 border border-accent-foreground/20 text-sm font-medium mb-6">
              Test di Profilazione Psicologica
            </div>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            Decodifica il tuo{" "}
            <span className="bg-gradient-to-r from-[oklch(0.65_0.25_145)] via-[oklch(0.65_0.20_25)] to-[oklch(0.65_0.25_264)] bg-clip-text text-transparent">
              cervello
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Scopri il tuo profilo psicologico attraverso un test scientifico basato sulla teoria del cervello tripartito di Paul MacLean.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Link href="/test">
                <Button size="lg" className="text-lg px-8">
                  Inizia il Test
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="text-lg px-8">
                  Inizia Ora
                </Button>
              </a>
            )}
          </div>

          {/* Color Bar Visualization */}
          <div className="pt-8">
            <div className="h-16 rounded-lg overflow-hidden flex shadow-lg">
              <div className="flex-1 bg-[oklch(0.65_0.25_145)] flex items-center justify-center text-black font-bold">
                VERDE
              </div>
              <div className="flex-1 bg-[oklch(0.65_0.20_25)] flex items-center justify-center text-black font-bold">
                ROSSO
              </div>
              <div className="flex-1 bg-[oklch(0.65_0.25_264)] flex items-center justify-center text-black font-bold">
                BLU
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Tre componenti, un profilo unico
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">
            Le Tre Componenti del Cervello
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-[oklch(0.65_0.25_145)]/30 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-[oklch(0.65_0.25_145)]/20 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[oklch(0.65_0.25_145)]" />
                </div>
                <CardTitle className="text-[oklch(0.65_0.25_145)]">VERDE</CardTitle>
                <CardDescription>Componente Sociale</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Rappresenta l'aspetto sociale, relazionale e armonioso della personalità. 
                  Orientamento alle relazioni interpersonali e capacità di mediazione.
                </p>
              </CardContent>
            </Card>

            <Card className="border-[oklch(0.65_0.20_25)]/30 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-[oklch(0.65_0.20_25)]/20 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-[oklch(0.65_0.20_25)]" />
                </div>
                <CardTitle className="text-[oklch(0.65_0.20_25)]">ROSSO</CardTitle>
                <CardDescription>Componente Dinamica</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Rappresenta l'aspetto dinamico, impulsivo e orientato all'azione. 
                  Competitività, leadership e capacità di agire nel presente.
                </p>
              </CardContent>
            </Card>

            <Card className="border-[oklch(0.65_0.25_264)]/30 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-[oklch(0.65_0.25_264)]/20 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-[oklch(0.65_0.25_264)]" />
                </div>
                <CardTitle className="text-[oklch(0.65_0.25_264)]">BLU</CardTitle>
                <CardDescription>Componente Riflessiva</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Rappresenta l'aspetto riflessivo, sistematico e orientato alla pianificazione. 
                  Pensiero strategico e attenzione ai dettagli.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="container py-20 border-t border-border/40">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h3 className="text-3xl font-bold">Come Funziona</h3>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                1
              </div>
              <h4 className="font-semibold text-lg">Rispondi alle Domande</h4>
              <p className="text-sm text-muted-foreground">
                10 esercizi progettati per analizzare il tuo comportamento tipico in diverse situazioni.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                2
              </div>
              <h4 className="font-semibold text-lg">Calcolo Automatico</h4>
              <p className="text-sm text-muted-foreground">
                Il sistema analizza le tue risposte e calcola i punteggi per le tre componenti.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                3
              </div>
              <h4 className="font-semibold text-lg">Scopri il Tuo Profilo</h4>
              <p className="text-sm text-muted-foreground">
                Ricevi il tuo profilo psicologico con descrizione dettagliata e visualizzazione grafica.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 border-t border-border/40">
        <div className="max-w-3xl mx-auto text-center space-y-6 p-12 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 border border-accent-foreground/20">
          <h3 className="text-3xl font-bold">Pronto a Scoprire il Tuo BrainCode?</h3>
          <p className="text-lg text-muted-foreground">
            Inizia ora il test e ottieni il tuo profilo psicologico personalizzato.
          </p>
          {isAuthenticated ? (
            <Link href="/test">
              <Button size="lg" className="text-lg px-8">
                Inizia il Test
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" className="text-lg px-8">
                Accedi e Inizia
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 BrainCode. Basato sulla teoria del cervello tripartito di Paul MacLean.</p>
        </div>
      </footer>
    </div>
  );
}

