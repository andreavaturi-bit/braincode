import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckSquare, ClipboardCopy, FolderPlus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function GroupsManagement() {
  const utils = trpc.useUtils();
  const { data: groups = [], isLoading: groupsLoading } = trpc.admin.groups.list.useQuery();
  const { data: memberships = [] } = trpc.admin.groups.memberships.useQuery();
  const { data: allResults = [], isLoading: participantsLoading } = trpc.admin.getAllResults.useQuery();
  const [newGroupName, setNewGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkGroupId, setBulkGroupId] = useState("");

  const refresh = async () => {
    await Promise.all([
      utils.admin.groups.list.invalidate(),
      utils.admin.groups.memberships.invalidate(),
      utils.admin.getAllResults.invalidate(),
    ]);
  };

  const createMutation = trpc.admin.groups.create.useMutation({
    onSuccess: async () => {
      setNewGroupName("");
      await refresh();
      toast.success("Gruppo creato.");
    },
    onError: (error) => toast.error(error.message),
  });
  const renameMutation = trpc.admin.groups.rename.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("Gruppo rinominato.");
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteMutation = trpc.admin.groups.delete.useMutation({
    onSuccess: async () => {
      setSelectedUserIds([]);
      await refresh();
      toast.success("Gruppo eliminato. Persone e risultati sono rimasti invariati.");
    },
    onError: (error) => toast.error(error.message),
  });
  const setGroupsMutation = trpc.admin.groups.setUserGroups.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message),
  });
  const addUsersMutation = trpc.admin.groups.addUsers.useMutation({
    onSuccess: async () => {
      setSelectedUserIds([]);
      setBulkGroupId("");
      await refresh();
      toast.success("Partecipanti aggiunti al gruppo.");
    },
    onError: (error) => toast.error(error.message),
  });

  const membershipsByUser = useMemo(() => {
    const value = new Map<string, typeof memberships>();
    memberships.forEach((membership) => {
      value.set(membership.userId, [...(value.get(membership.userId) ?? []), membership]);
    });
    return value;
  }, [memberships]);

  const participants = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;
    const filtered = allResults.filter((result) => {
      const completedAt = new Date(result.completedAt);
      if (from && completedAt < from) return false;
      if (to && completedAt > to) return false;
      if (!searchTerm) return true;
      return `${result.userName ?? ""} ${result.userEmail ?? ""}`.toLowerCase().includes(searchTerm);
    });
    const unique = new Map<string, (typeof allResults)[number]>();
    filtered.forEach((result) => {
      if (!unique.has(result.userId)) unique.set(result.userId, result);
    });
    return Array.from(unique.values());
  }, [allResults, fromDate, search, toDate]);

  const selectedVisibleIds = participants.map((participant) => participant.userId);
  const allVisibleSelected = selectedVisibleIds.length > 0 && selectedVisibleIds.every((id) => selectedUserIds.includes(id));

  const copyInvite = async (slug: string) => {
    const link = `${window.location.origin}/?gruppo=${slug}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link di invito copiato.");
    } catch {
      window.prompt("Copia questo link di invito:", link);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((current) => current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]);
  };

  const toggleAllVisible = () => {
    setSelectedUserIds((current) => allVisibleSelected
      ? current.filter((id) => !selectedVisibleIds.includes(id))
      : Array.from(new Set([...current, ...selectedVisibleIds])));
  };

  const addGroupToUser = (userId: string, groupId: string) => {
    const currentIds = (membershipsByUser.get(userId) ?? []).map((membership) => membership.groupId);
    if (!currentIds.includes(groupId)) {
      setGroupsMutation.mutate({ userId, groupIds: [...currentIds, groupId] });
    }
  };

  const removeGroupFromUser = (userId: string, groupId: string) => {
    const groupIds = (membershipsByUser.get(userId) ?? [])
      .map((membership) => membership.groupId)
      .filter((id) => id !== groupId);
    setGroupsMutation.mutate({ userId, groupIds });
  };

  return (
    <section className="space-y-6">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Gruppi</CardTitle>
          <CardDescription>Crea gruppi, copia i link d'invito e visualizza il BrainCode aggregato.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              createMutation.mutate({ name: newGroupName });
            }}
          >
            <input
              className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder="Nome gruppo, es. Eicon"
              maxLength={120}
            />
            <Button type="submit" disabled={!newGroupName.trim() || createMutation.isPending}>
              <FolderPlus className="mr-2 w-4 h-4" /> Crea gruppo
            </Button>
          </form>

          {groupsLoading ? (
            <p className="text-sm text-muted-foreground">Caricamento gruppi...</p>
          ) : groups.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Non hai ancora creato gruppi.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {groups.map((group) => (
                <div key={group.id} className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold break-words">{group.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{group.memberCount} persone · ?gruppo={group.slug}</p>
                    </div>
                    <Badge variant="outline">{group.memberCount}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/groups/${group.id}`}><Button size="sm">Apri gruppo</Button></Link>
                    <Button size="sm" variant="outline" onClick={() => copyInvite(group.slug)}><ClipboardCopy className="mr-1 w-3.5 h-3.5" /> Link</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const name = window.prompt("Nuovo nome del gruppo:", group.name);
                        if (name?.trim()) renameMutation.mutate({ groupId: group.id, name: name.trim() });
                      }}
                    ><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (window.confirm(`Eliminare il gruppo “${group.name}”? Le persone e i risultati non saranno eliminati.`)) {
                          deleteMutation.mutate({ groupId: group.id });
                        }
                      }}
                    ><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Partecipanti e assegnazione gruppi</CardTitle>
          <CardDescription>Filtra e seleziona più persone, poi assegnale a un gruppo in un solo passaggio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cerca nome o email" />
            <label className="text-sm text-muted-foreground">Dal<input type="date" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-foreground" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
            <label className="text-sm text-muted-foreground">Al<input type="date" className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-foreground" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
          </div>

          <div className="flex flex-col gap-2 rounded-lg bg-accent/20 p-3 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm"><strong>{selectedUserIds.length}</strong> persone selezionate</p>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={bulkGroupId} onChange={(event) => setBulkGroupId(event.target.value)}>
              <option value="">Scegli un gruppo</option>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
            <Button size="sm" disabled={!bulkGroupId || selectedUserIds.length === 0 || addUsersMutation.isPending} onClick={() => addUsersMutation.mutate({ groupId: bulkGroupId, userIds: selectedUserIds })}>
              <CheckSquare className="mr-2 w-4 h-4" /> Assegna selezionati
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="p-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Seleziona tutti i partecipanti filtrati" /></th>
                  <th className="p-3">Partecipante</th><th className="p-3">Email</th><th className="p-3">Test</th><th className="p-3">Gruppi</th><th className="p-3">Aggiungi</th>
                </tr>
              </thead>
              <tbody>
                {participantsLoading ? <tr><td className="p-4 text-muted-foreground" colSpan={6}>Caricamento partecipanti...</td></tr> : participants.length === 0 ? <tr><td className="p-4 text-muted-foreground" colSpan={6}>Nessun partecipante corrisponde ai filtri.</td></tr> : participants.map((participant) => {
                  const personGroups = membershipsByUser.get(participant.userId) ?? [];
                  return <tr key={participant.userId} className="border-t border-border align-top">
                    <td className="p-3"><input type="checkbox" checked={selectedUserIds.includes(participant.userId)} onChange={() => toggleUser(participant.userId)} aria-label={`Seleziona ${participant.userName || participant.userEmail || "partecipante"}`} /></td>
                    <td className="p-3 font-medium">{participant.userName || "Utente senza nome"}</td>
                    <td className="p-3 text-muted-foreground">{participant.userEmail || "—"}</td>
                    <td className="p-3 whitespace-nowrap">{formatDate(participant.completedAt)}</td>
                    <td className="p-3"><div className="flex max-w-xs flex-wrap gap-1">{personGroups.length ? personGroups.map((group) => <Badge key={group.groupId} variant="outline" className="gap-1 whitespace-normal">{group.groupName}<button className="ml-1 hover:text-destructive" onClick={() => removeGroupFromUser(participant.userId, group.groupId)} aria-label={`Rimuovi dal gruppo ${group.groupName}`}>×</button></Badge>) : <span className="text-muted-foreground">Nessuno</span>}</div></td>
                    <td className="p-3"><select className="h-8 min-w-36 rounded-md border border-input bg-background px-2 text-xs" value="" onChange={(event) => { if (event.target.value) addGroupToUser(participant.userId, event.target.value); }}><option value="">Aggiungi a...</option>{groups.filter((group) => !personGroups.some((membership) => membership.groupId === group.id)).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
