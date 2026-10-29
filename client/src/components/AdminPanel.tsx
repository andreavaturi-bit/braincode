import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Download, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import type { RecalculationPlan } from "../../../server/recalculation";

export default function AdminPanel() {
  const utils = trpc.useUtils();
  const { data: allResults, isLoading } = trpc.admin.getAllResults.useQuery();
  const previewQuery = trpc.admin.recalculatePreview.useQuery(undefined, { enabled: false, retry: false });
  const [preview, setPreview] = useState<RecalculationPlan | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const results = allResults ?? [];

  const applyMutation = trpc.admin.recalculateApply.useMutation({
    onSuccess: async (data) => {
      setPreview(null);
      setConfirmOpen(false);
      await utils.admin.getAllResults.invalidate();
      toast.success(
        `Ricalcolo completato: ${data.affectedResults} risultati aggiornati` +
        (data.notificationsCreated > 0 ? ` e ${data.notificationsCreated} notifiche inviate.` : ".")
      );
    },
    onError: (error) => {
      setConfirmOpen(false);
      toast.error(error.message || "Il ricalcolo non è stato applicato.");
    },
  });

  const handlePreview = async () => {
    const result = await previewQuery.refetch();
    if (!result.data) {
      toast.error(previewQuery.error?.message || "Impossibile generare l'anteprima.");
      return;
    }

    setPreview(result.data);
    if (result.data.summary.affectedResults === 0) {
      toast.success("Nessun risultato richiede un ricalcolo.");
    } else {
      toast.success(`Anteprima pronta: ${result.data.summary.affectedResults} risultati da aggiornare.`);
    }
  };

  const getProfileBadgeColor = (profileType: string) => {
    if (profileType.includes("VERDE")) return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50";
    if (profileType.includes("ROSSO")) return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50";
    if (profileType.includes("BLU")) return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50";
    return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/50";
  };

  const exportToCSV = () => {
    const headers = ["Nome", "Email", "Data Test", "Verde", "Rosso", "Blu", "Profilo"];
    const rows = results.map(r => [
      r.userName || "N/A",
      r.userEmail || "N/A",
      new Date(r.completedAt).toLocaleDateString("it-IT"),
      r.verdeScore,
      r.rossoScore,
      r.bluScore,
      r.profileType,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `braincode_results_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pannello Amministrazione</CardTitle>
          <CardDescription>Caricamento dati...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Pannello Amministrazione</CardTitle>
            <CardDescription>
              Visualizza tutti i test completati e gestisci un eventuale ricalcolo controllato.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handlePreview}
              variant="outline"
              size="sm"
              disabled={previewQuery.isFetching || applyMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${previewQuery.isFetching ? "animate-spin" : ""}`} />
              {previewQuery.isFetching ? "Analisi in corso..." : "Anteprima ricalcolo"}
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm" disabled={results.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Esporta CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {preview && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 space-y-4">
            <div>
              <h3 className="font-semibold">Anteprima del ricalcolo</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Nessuna modifica è stata ancora salvata. Controlla le differenze prima di confermare.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div><span className="text-muted-foreground">Test analizzati</span><p className="font-bold">{preview.summary.totalResults}</p></div>
              <div><span className="text-muted-foreground">Da aggiornare</span><p className="font-bold">{preview.summary.affectedResults}</p></div>
              <div><span className="text-muted-foreground">Già corretti</span><p className="font-bold">{preview.summary.unchangedResults}</p></div>
              <div><span className="text-muted-foreground">Utenti coinvolti</span><p className="font-bold">{preview.summary.affectedUsers}</p></div>
            </div>

            {preview.changes.length > 0 ? (
              <>
                <div className="overflow-x-auto rounded-md border bg-background/50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data test</TableHead>
                        <TableHead>Prima</TableHead>
                        <TableHead>Dopo</TableHead>
                        <TableHead>Tipo di modifica</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.changes.map((change) => (
                        <TableRow key={change.testResultId}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {new Date(change.completedAt).toLocaleString("it-IT")}
                          </TableCell>
                          <TableCell className="min-w-48 text-xs">
                            <p>V {change.before.verde} · R {change.before.rosso} · B {change.before.blu}</p>
                            <p className="mt-1 text-muted-foreground">{change.before.profileType}</p>
                          </TableCell>
                          <TableCell className="min-w-48 text-xs">
                            <p>V {change.after.verde} · R {change.after.rosso} · B {change.after.blu}</p>
                            <p className="mt-1 text-muted-foreground">{change.after.profileType}</p>
                          </TableCell>
                          <TableCell className="text-xs">
                            {change.scoresChanged && <p>Punteggi aggiornati</p>}
                            {change.profileChanged && <p>Profilo aggiornato</p>}
                            {change.descriptionChanged && <p>Descrizione riallineata</p>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={() => setConfirmOpen(true)} disabled={applyMutation.isPending}>
                  Applica questo ricalcolo
                </Button>
              </>
            ) : (
              <p className="text-sm font-medium">Non c'è nulla da aggiornare.</p>
            )}
          </div>
        )}

        {results.length === 0 ? (
          <p className="rounded-md border p-4 text-sm text-muted-foreground">Nessun test completato.</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Data Test</TableHead>
                  <TableHead className="text-center">Verde</TableHead>
                  <TableHead className="text-center">Rosso</TableHead>
                  <TableHead className="text-center">Blu</TableHead>
                  <TableHead>Profilo</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.userName || "Utente Anonimo"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{result.userEmail || "N/A"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(result.completedAt).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-center font-bold text-green-600">{result.verdeScore}</TableCell>
                    <TableCell className="text-center font-bold text-red-600">{result.rossoScore}</TableCell>
                    <TableCell className="text-center font-bold text-blue-600">{result.bluScore}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getProfileBadgeColor(result.profileType)} whitespace-normal text-left leading-snug`}>
                        {result.profileType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/test-details/${result.id}`}>
                        <Button variant="ghost" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Dettagli
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confermi il ricalcolo?</AlertDialogTitle>
            <AlertDialogDescription>
              Verranno aggiornati {preview?.summary.affectedResults ?? 0} risultati in base alle tabelle di scoring già presenti. Le descrizioni verranno riallineate; le notifiche saranno inviate solo se cambiano punteggi o profilo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applyMutation.isPending}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              disabled={!preview || applyMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (preview) applyMutation.mutate({ previewHash: preview.previewHash });
              }}
            >
              {applyMutation.isPending ? "Ricalcolo in corso..." : "Conferma e applica"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
