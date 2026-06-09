"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Copy,
  Trash2,
  KeyRound,
  BookOpen,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/src/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import type { ApiKey, ApiKeyScope, ApiUsageLog } from "../types";
import { formatDate } from "../utils";

const SCOPES: { value: ApiKeyScope; label: string }[] = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "admin", label: "Admin" },
];

function maskToken(token: string): string {
  if (token.length <= 8) return token;
  return `${token.slice(0, 8)}${"•".repeat(8)}${token.slice(-4)}`;
}

interface Props {
  apiKeys: ApiKey[];
  usageLogs: ApiUsageLog[];
}

export function ApiSetupPanel({ apiKeys: initial, usageLogs }: Props) {
  const [keys, setKeys] = useState<ApiKey[]>(initial);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [scopes, setScopes] = useState<ApiKeyScope[]>(["read"]);
  const [error, setError] = useState("");

  function toggleScope(scope: ApiKeyScope) {
    setScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope],
    );
  }

  function openGenerate() {
    setLabel("");
    setScopes(["read"]);
    setError("");
    setOpen(true);
  }

  function handleGenerate() {
    if (!label.trim()) {
      setError("Give the key a label.");
      return;
    }
    if (scopes.length === 0) {
      setError("Select at least one scope.");
      return;
    }
    const token = `mt_live_${Math.random().toString(36).slice(2, 18)}`;
    setKeys((prev) => [
      {
        id: `key-${Date.now()}`,
        label: label.trim(),
        token,
        scopes: [...scopes],
        createdAt: new Date().toISOString(),
        revoked: false,
      },
      ...prev,
    ]);
    toast.success("API key generated.");
    setOpen(false);
  }

  function handleCopy(token: string) {
    void navigator.clipboard?.writeText(token);
    toast.success("API key copied to clipboard.");
  }

  function handleRevoke(key: ApiKey) {
    setKeys((prev) =>
      prev.map((k) => (k.id === key.id ? { ...k, revoked: true } : k)),
    );
    toast.success("API key revoked.");
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-base">API Keys</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Generate and manage keys for programmatic access.
              </CardDescription>
            </div>
            <Button size="sm" onClick={openGenerate} className="gap-1.5 shrink-0">
              <Plus className="h-3.5 w-3.5" />
              Generate Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Label</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.label}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {maskToken(key.token)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(key.createdAt)}
                    </TableCell>
                    <TableCell>
                      {key.revoked ? (
                        <Badge variant="destructive">Revoked</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                        >
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={key.revoked}
                          onClick={() => handleCopy(key.token)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {!key.revoked && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Revoke API Key
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Revoke{" "}
                                  <span className="font-semibold">
                                    {key.label}
                                  </span>
                                  ? Any integration using this key will stop
                                  working immediately.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleRevoke(key)}
                                >
                                  Revoke
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {keys.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      No API keys yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground"
              onClick={() => toast.info("API documentation opens in the developer portal.")}
            >
              <BookOpen className="h-3.5 w-3.5" />
              View API documentation
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-primary" />
            <CardTitle className="text-base">Recent API Activity</CardTitle>
          </div>
          <CardDescription>Latest requests across your keys.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {log.endpoint}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {log.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          log.status >= 400
                            ? "text-destructive font-medium"
                            : "text-emerald-600 dark:text-emerald-400 font-medium"
                        }
                      >
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>
              Name the key and choose its access scopes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Label</label>
              <Input
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Payroll Integration"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Scopes</label>
              <div className="flex gap-2">
                {SCOPES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleScope(s.value)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      scopes.includes(s.value)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-transparent text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
