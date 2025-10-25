import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";
import { Link } from "wouter";

export default function AdminPanel() {
  const { data: allResults, isLoading } = trpc.admin.getAllResults.useQuery();

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

  if (!allResults || allResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pannello Amministrazione</CardTitle>
          <CardDescription>Nessun test completato</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getProfileBadgeColor = (profileType: string) => {
    if (profileType.includes("VERDE")) return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50";
    if (profileType.includes("ROSSO")) return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50";
    if (profileType.includes("BLU")) return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50";
    return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/50";
  };

  const exportToCSV = () => {
    const headers = ["Nome", "Email", "Data Test", "Verde", "Rosso", "Blu", "Dominante"];
    const rows = allResults.map(r => [
      r.userName || "N/A",
      r.userEmail || "N/A",
      new Date(r.completedAt).toLocaleDateString('it-IT'),
      r.verdeScore,
      r.rossoScore,
      r.bluScore,
      r.profileType
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `braincode_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pannello Amministrazione</CardTitle>
            <CardDescription>
              Visualizza tutti i test completati dagli utenti
            </CardDescription>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Esporta CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Data Test</TableHead>
                <TableHead className="text-center">Verde</TableHead>
                <TableHead className="text-center">Rosso</TableHead>
                <TableHead className="text-center">Blu</TableHead>
                <TableHead>Dominante</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">
                    {result.userName || "Utente Anonimo"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {result.userEmail || "N/A"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(result.completedAt).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className="text-center font-bold text-green-600">
                    {result.verdeScore}
                  </TableCell>
                  <TableCell className="text-center font-bold text-red-600">
                    {result.rossoScore}
                  </TableCell>
                  <TableCell className="text-center font-bold text-blue-600">
                    {result.bluScore}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getProfileBadgeColor(result.profileType)}>
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
      </CardContent>
    </Card>
  );
}

