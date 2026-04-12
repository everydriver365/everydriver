import { useState, useEffect } from "react";
import {
  Globe,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Info,
  AlertTriangle,
  CheckCircle2,
  Server,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DNSRecord {
  id: string;
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS";
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

interface DNSManagementPanelProps {
  domainOrderId: string;
  domain: string;
  onUpdate?: () => void;
}

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"] as const;
const TTL_OPTIONS = [
  { value: 300, label: "5 minutes" },
  { value: 3600, label: "1 hour" },
  { value: 14400, label: "4 hours" },
  { value: 86400, label: "1 day" },
];

// Default DNS records for mini-website hosting
const DEFAULT_MINI_WEBSITE_RECORDS: Omit<DNSRecord, "id">[] = [
  { type: "A", name: "@", value: "185.158.133.1", ttl: 3600 },
  { type: "A", name: "www", value: "185.158.133.1", ttl: 3600 },
];

export function DNSManagementPanel({
  domainOrderId,
  domain,
  onUpdate,
}: DNSManagementPanelProps) {
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New record form
  const [newRecord, setNewRecord] = useState<Omit<DNSRecord, "id">>({
    type: "A",
    name: "@",
    value: "",
    ttl: 3600,
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [domainOrderId]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("domain_orders")
        .select("dns_records")
        .eq("id", domainOrderId)
        .single();

      if (error) throw error;

      const dnsRecords = Array.isArray(data?.dns_records) 
        ? (data.dns_records as unknown as DNSRecord[]) 
        : [];
      setRecords(dnsRecords);
    } catch (error) {
      console.error("Error fetching DNS records:", error);
      toast.error("Failed to load DNS records");
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecords = async (updatedRecords: DNSRecord[]) => {
    setIsSaving(true);
    try {
      // Convert to JSON-compatible format
      const jsonRecords = JSON.parse(JSON.stringify(updatedRecords));
      const { error } = await supabase
        .from("domain_orders")
        .update({ dns_records: jsonRecords })
        .eq("id", domainOrderId);

      if (error) throw error;

      setRecords(updatedRecords);
      toast.success("DNS records saved");
      onUpdate?.();
    } catch (error) {
      console.error("Error saving DNS records:", error);
      toast.error("Failed to save DNS records");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRecord = () => {
    if (!newRecord.value.trim()) {
      toast.error("Please enter a value for the record");
      return;
    }

    const record: DNSRecord = {
      ...newRecord,
      id: crypto.randomUUID(),
    };

    saveRecords([...records, record]);
    setNewRecord({ type: "A", name: "@", value: "", ttl: 3600 });
    setShowAddForm(false);
  };

  const handleDeleteRecord = (recordId: string) => {
    const updatedRecords = records.filter((r) => r.id !== recordId);
    saveRecords(updatedRecords);
  };

  const handleSetupMiniWebsite = () => {
    const newRecords: DNSRecord[] = DEFAULT_MINI_WEBSITE_RECORDS.map((r) => ({
      ...r,
      id: crypto.randomUUID(),
    }));

    // Check for existing A records for @ and www
    const existingRootA = records.find((r) => r.type === "A" && r.name === "@");
    const existingWwwA = records.find((r) => r.type === "A" && r.name === "www");

    if (existingRootA || existingWwwA) {
      toast.error("A records for @ or www already exist. Delete them first.");
      return;
    }

    saveRecords([...records, ...newRecords]);
    toast.success("Mini-website DNS records added");
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case "A":
        return "bg-primary/10 text-primary border-primary/20";
      case "AAAA":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "CNAME":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "MX":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "TXT":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "NS":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              DNS Management
            </CardTitle>
            <CardDescription>
              Manage DNS records for {domain}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetupMiniWebsite}
              disabled={isSaving}
            >
              <Globe className="h-4 w-4 mr-2" />
              Setup for Mini-Website
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={isSaving}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Record Form */}
        {showAddForm && (
          <div className="rounded-2xl border bg-muted/30 p-4 space-y-4">
            <p className="text-sm font-medium">Add New DNS Record</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={newRecord.type}
                  onValueChange={(v) =>
                    setNewRecord({ ...newRecord, type: v as DNSRecord["type"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECORD_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  value={newRecord.name}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, name: e.target.value })
                  }
                  placeholder="@ or subdomain"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Value</Label>
                <Input
                  value={newRecord.value}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, value: e.target.value })
                  }
                  placeholder="IP address or hostname"
                />
              </div>
              <div>
                <Label className="text-xs">TTL</Label>
                <Select
                  value={newRecord.ttl.toString()}
                  onValueChange={(v) =>
                    setNewRecord({ ...newRecord, ttl: parseInt(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TTL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddRecord} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add Record"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Records Table */}
        {records.length === 0 ? (
          <div className="text-center py-8">
            <Server className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No DNS records configured</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Setup for Mini-Website" to add default records, or add custom records.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead className="w-32">Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-24">TTL</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Badge variant="outline" className={getRecordTypeColor(record.type)}>
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {record.name === "@" ? domain : `${record.name}.${domain}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm truncate max-w-[200px]">
                          {record.value}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(record.value, record.id)}
                        >
                          {copiedId === record.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {TTL_OPTIONS.find((o) => o.value === record.ttl)?.label || `${record.ttl}s`}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRecord(record.id)}
                        disabled={isSaving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 flex gap-3">
          <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">About DNS Records</p>
            <ul className="space-y-1">
              <li><strong>A Record:</strong> Points your domain to an IP address</li>
              <li><strong>CNAME:</strong> Creates an alias to another domain</li>
              <li><strong>MX:</strong> Routes email to mail servers</li>
              <li><strong>TXT:</strong> Stores text data (often for verification)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
