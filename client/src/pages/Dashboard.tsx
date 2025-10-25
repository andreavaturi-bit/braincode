import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Plus, Calendar, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminPanel from "@/components/AdminPanel";

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: results, isLoading } = trpc.test.myResults.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: isAdmin } = trpc.admin.isAdmin.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      navigate("/");
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };

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
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden md:block">
              {user?.name || user?.email}
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              Esci
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container flex-1 py-8 md:py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">I Miei Risultati</h2>
              <p className="text-muted-foreground mt-2">
                Visualizza e gestisci tutti i tuoi test BrainCode
              </p>
            </div>
            <Link href="/test">
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Test
              </Button>
            </Link>
          </div>

          {/* Admin Panel */}
          {isAdmin && (
            <AdminPanel />
          )}

          {/* Stats Cards */}
          {results && results.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-accent/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Test Completati
                  </CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{results.length}</div>
                </CardContent>
              </Card>

              <Card className="border-accent/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ultimo Test
                  </CardTitle>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {new Date(results[0].completedAt).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Profilo Attuale
                  </CardTitle>
                  <Brain className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold line-clamp-2">
                    {results[0].profileType}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results List */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Storico Test</h3>

            {!results || results.length === 0 ? (
              <Card className="border-accent/30">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                    <Brain className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Nessun test completato</h4>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Non hai ancora completato nessun test BrainCode. Inizia ora per scoprire il tuo profilo psicologico!
                  </p>
                  <Link href="/test">
                    <Button size="lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Inizia il Primo Test
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {results.map((result) => {
                  const total = result.verdeScore + result.rossoScore + result.bluScore;
                  const verdePercent = (result.verdeScore / total) * 100;
                  const rossoPercent = (result.rossoScore / total) * 100;
                  const bluPercent = (result.bluScore / total) * 100;

                  return (
                    <Card key={result.id} className="border-accent/30 hover:border-accent/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{result.profileType}</CardTitle>
                            <CardDescription className="mt-1">
                              Completato il{" "}
                              {new Date(result.completedAt).toLocaleDateString("it-IT", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </CardDescription>
                          </div>
                          <Link href={`/results/${result.id}`}>
                            <Button variant="outline" size="sm">
                              Visualizza
                            </Button>
                          </Link>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Color Bar */}
                        <div className="h-12 rounded-lg overflow-hidden flex shadow-md">
                          <div
                            className="bg-[oklch(0.65_0.25_145)] flex items-center justify-center text-black font-medium text-sm"
                            style={{ width: `${verdePercent}%` }}
                          >
                            {verdePercent > 12 && "VERDE"}
                          </div>
                          <div
                            className="bg-[oklch(0.65_0.20_25)] flex items-center justify-center text-black font-medium text-sm"
                            style={{ width: `${rossoPercent}%` }}
                          >
                            {rossoPercent > 12 && "ROSSO"}
                          </div>
                          <div
                            className="bg-[oklch(0.65_0.25_264)] flex items-center justify-center text-black font-medium text-sm"
                            style={{ width: `${bluPercent}%` }}
                          >
                            {bluPercent > 12 && "BLU"}
                          </div>
                        </div>

                        {/* Scores */}
                        <div className="grid grid-cols-3 gap-3 text-center text-sm">
                          <div>
                            <div className="font-bold text-[oklch(0.65_0.25_145)]">{result.verdeScore}</div>
                            <div className="text-xs text-muted-foreground">VERDE ({verdePercent.toFixed(1)}%)</div>
                          </div>
                          <div>
                            <div className="font-bold text-[oklch(0.65_0.20_25)]">{result.rossoScore}</div>
                            <div className="text-xs text-muted-foreground">ROSSO ({rossoPercent.toFixed(1)}%)</div>
                          </div>
                          <div>
                            <div className="font-bold text-[oklch(0.65_0.25_264)]">{result.bluScore}</div>
                            <div className="text-xs text-muted-foreground">BLU ({bluPercent.toFixed(1)}%)</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
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

