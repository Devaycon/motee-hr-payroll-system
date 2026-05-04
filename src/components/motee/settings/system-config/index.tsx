"use client";

import { useState } from "react";
import {
  Settings,
  Shield,
  UserPlus,
  Mail,
  AlertTriangle,
  Database,
  Save,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Separator } from "@/src/components/ui/separator";
import { Switch } from "@/src/components/ui/switch";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { DEMO_PLATFORM_CONFIG, PlatformConfig } from "@/src/data/motee-demo";

type TabId =
  | "general"
  | "security"
  | "registration"
  | "email"
  | "sms"
  | "maintenance";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Settings className="w-4 h-4" /> },
  {
    id: "security",
    label: "Security & Session",
    icon: <Shield className="w-4 h-4" />,
  },
  {
    id: "registration",
    label: "Registration & Login",
    icon: <UserPlus className="w-4 h-4" />,
  },
  { id: "email", label: "Email & SMS", icon: <Mail className="w-4 h-4" /> },
  {
    id: "maintenance",
    label: "Maintenance",
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  { id: "sms", label: "Storage", icon: <Database className="w-4 h-4" /> },
];

const CURRENCIES = ["NGN", "USD", "GBP", "EUR", "GHS", "KES", "ZAR"];
const TIMEZONES = [
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Accra",
  "Europe/London",
  "America/New_York",
  "Asia/Dubai",
];
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "yo", label: "Yoruba" },
  { value: "ha", label: "Hausa" },
];

function SaveRow({ onSave }: { onSave: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <Button
        size="sm"
        className="gap-2 bg-[#ff8b2d] hover:bg-[#e67820] text-white"
        onClick={onSave}
      >
        <Save className="w-4 h-4" /> Save Changes
      </Button>
    </div>
  );
}

function SavedBanner() {
  return (
    <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded-lg">
      <CheckCircle className="w-4 h-4" /> Settings saved successfully.
    </div>
  );
}

export function SystemConfigPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [cfg, setCfg] = useState<PlatformConfig>(DEMO_PLATFORM_CONFIG);
  const [savedTab, setSavedTab] = useState<TabId | null>(null);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [pendingMaintenance, setPendingMaintenance] = useState(false);

  function save(tab: TabId) {
    setSavedTab(tab);
    setTimeout(() => setSavedTab(null), 3000);
  }

  function setGeneral<K extends keyof PlatformConfig["general"]>(
    key: K,
    val: PlatformConfig["general"][K],
  ) {
    setCfg((p) => ({ ...p, general: { ...p.general, [key]: val } }));
  }
  function setPassword<K extends keyof PlatformConfig["passwordPolicy"]>(
    key: K,
    val: PlatformConfig["passwordPolicy"][K],
  ) {
    setCfg((p) => ({
      ...p,
      passwordPolicy: { ...p.passwordPolicy, [key]: val },
    }));
  }
  function setSession<K extends keyof PlatformConfig["session"]>(
    key: K,
    val: PlatformConfig["session"][K],
  ) {
    setCfg((p) => ({ ...p, session: { ...p.session, [key]: val } }));
  }
  function setReg<K extends keyof PlatformConfig["registration"]>(
    key: K,
    val: PlatformConfig["registration"][K],
  ) {
    setCfg((p) => ({ ...p, registration: { ...p.registration, [key]: val } }));
  }
  function setLogin<K extends keyof PlatformConfig["login"]>(
    key: K,
    val: PlatformConfig["login"][K],
  ) {
    setCfg((p) => ({ ...p, login: { ...p.login, [key]: val } }));
  }
  function setEmail<K extends keyof PlatformConfig["email"]>(
    key: K,
    val: PlatformConfig["email"][K],
  ) {
    setCfg((p) => ({ ...p, email: { ...p.email, [key]: val } }));
  }
  function setSms<K extends keyof PlatformConfig["sms"]>(
    key: K,
    val: PlatformConfig["sms"][K],
  ) {
    setCfg((p) => ({ ...p, sms: { ...p.sms, [key]: val } }));
  }
  function setStorage<K extends keyof PlatformConfig["storage"]>(
    key: K,
    val: PlatformConfig["storage"][K],
  ) {
    setCfg((p) => ({ ...p, storage: { ...p.storage, [key]: val } }));
  }
  function setMaintenance<K extends keyof PlatformConfig["maintenance"]>(
    key: K,
    val: PlatformConfig["maintenance"][K],
  ) {
    setCfg((p) => ({ ...p, maintenance: { ...p.maintenance, [key]: val } }));
  }

  function requestMaintenanceToggle(val: boolean) {
    if (val) {
      setPendingMaintenance(true);
      setShowMaintenanceDialog(true);
    } else {
      setMaintenance("enabled", false);
    }
  }

  function confirmMaintenance() {
    setMaintenance("enabled", pendingMaintenance);
    setShowMaintenanceDialog(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage platform-wide system configuration.
        </p>
      </div>

      <div className="flex gap-1 flex-wrap border-b border-border pb-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === t.id
                ? "bg-background border border-b-background border-border text-[#ff8b2d] -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === "general" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">General Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {savedTab === "general" && <SavedBanner />}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Platform Name</Label>
                  <Input
                    value={cfg.general.platformName}
                    onChange={(e) => setGeneral("platformName", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Support Email</Label>
                  <Input
                    type="email"
                    value={cfg.general.supportEmail}
                    onChange={(e) => setGeneral("supportEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Support Phone</Label>
                  <Input
                    value={cfg.general.supportPhone}
                    onChange={(e) => setGeneral("supportPhone", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Default Currency</Label>
                  <Select
                    value={cfg.general.defaultCurrency}
                    onValueChange={(v) => setGeneral("defaultCurrency", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Default Timezone</Label>
                  <Select
                    value={cfg.general.defaultTimezone}
                    onValueChange={(v) => setGeneral("defaultTimezone", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Default Language</Label>
                  <Select
                    value={cfg.general.defaultLanguage}
                    onValueChange={(v) => setGeneral("defaultLanguage", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Max File Upload Size (MB)</Label>
                  <Input
                    type="number"
                    value={cfg.general.maxFileSizeMB}
                    onChange={(e) =>
                      setGeneral("maxFileSizeMB", Number(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Allowed File Types</Label>
                  <Input
                    value={cfg.general.allowedFileTypes}
                    onChange={(e) =>
                      setGeneral("allowedFileTypes", e.target.value)
                    }
                  />
                </div>
              </div>
              <SaveRow onSave={() => save("general")} />
            </CardContent>
          </Card>
        )}

        {activeTab === "security" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Password Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {savedTab === "security" && <SavedBanner />}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Minimum Password Length</Label>
                    <Input
                      type="number"
                      value={cfg.passwordPolicy.minLength}
                      onChange={(e) =>
                        setPassword("minLength", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max Password Age (days)</Label>
                    <Input
                      type="number"
                      value={cfg.passwordPolicy.maxPasswordAgeDays}
                      onChange={(e) =>
                        setPassword(
                          "maxPasswordAgeDays",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prevent Password Reuse (last N)</Label>
                    <Input
                      type="number"
                      value={cfg.passwordPolicy.preventReuseCount}
                      onChange={(e) =>
                        setPassword("preventReuseCount", Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  {(
                    [
                      ["requireUppercase", "Require Uppercase Letter"],
                      ["requireNumbers", "Require Numbers"],
                      ["requireSymbols", "Require Special Characters"],
                    ] as [keyof PlatformConfig["passwordPolicy"], string][]
                  ).map(([key, label]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <Label className="font-normal">{label}</Label>
                      <Switch
                        checked={cfg.passwordPolicy[key] as boolean}
                        onCheckedChange={(v) => setPassword(key, v)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Session Timeout (minutes)</Label>
                    <Input
                      type="number"
                      value={cfg.session.timeoutMinutes}
                      onChange={(e) =>
                        setSession("timeoutMinutes", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max Concurrent Sessions</Label>
                    <Input
                      type="number"
                      value={cfg.session.maxConcurrentSessions}
                      onChange={(e) =>
                        setSession(
                          "maxConcurrentSessions",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Remember Me Duration (days)</Label>
                    <Input
                      type="number"
                      value={cfg.session.rememberMeDays}
                      onChange={(e) =>
                        setSession("rememberMeDays", Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <SaveRow onSave={() => save("security")} />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "registration" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registration & Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {savedTab === "registration" && <SavedBanner />}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Registration Options
                </p>
                {(
                  [
                    [
                      "allowSelfRegistration",
                      "Allow Self-Registration",
                      "Tenants can sign up without an invite.",
                    ],
                    [
                      "requireEmailDomainVerification",
                      "Require Email Domain Verification",
                      "New tenants must verify their company domain before activating.",
                    ],
                    [
                      "publicPricingPageEnabled",
                      "Public Pricing Page",
                      "Show pricing plans on the public marketing site.",
                    ],
                  ] as [keyof PlatformConfig["registration"], string, string][]
                ).map(([key, label, desc]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={cfg.registration[key] as boolean}
                      onCheckedChange={(v) => setReg(key, v)}
                    />
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Social Login Providers
                </p>
                {(
                  [
                    [
                      "googleEnabled",
                      "Google",
                      "Sign in with Google OAuth 2.0",
                    ],
                    [
                      "microsoftEnabled",
                      "Microsoft",
                      "Sign in with Microsoft Azure AD",
                    ],
                    [
                      "linkedInEnabled",
                      "LinkedIn",
                      "Sign in with LinkedIn OAuth",
                    ],
                    [
                      "magicLinkEnabled",
                      "Magic Link",
                      "Passwordless login via email link",
                    ],
                  ] as [keyof PlatformConfig["login"], string, string][]
                ).map(([key, label, desc]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={cfg.login[key] as boolean}
                      onCheckedChange={(v) => setLogin(key, v)}
                    />
                  </div>
                ))}
              </div>
              <SaveRow onSave={() => save("registration")} />
            </CardContent>
          </Card>
        )}

        {activeTab === "email" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Delivery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {savedTab === "email" && <SavedBanner />}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Email Provider</Label>
                    <Select
                      value={cfg.email.provider}
                      onValueChange={(v) =>
                        setEmail(
                          "provider",
                          v as PlatformConfig["email"]["provider"],
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="ses">AWS SES</SelectItem>
                        <SelectItem value="smtp">SMTP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sender Name</Label>
                    <Input
                      value={cfg.email.senderName}
                      onChange={(e) => setEmail("senderName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sender Domain</Label>
                    <Input
                      value={cfg.email.senderDomain}
                      onChange={(e) => setEmail("senderDomain", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Reply-To Address</Label>
                    <Input
                      type="email"
                      value={cfg.email.replyTo}
                      onChange={(e) => setEmail("replyTo", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Bounce Handling</p>
                    <p className="text-xs text-muted-foreground">
                      Automatically handle hard bounces and unsubscribes.
                    </p>
                  </div>
                  <Switch
                    checked={cfg.email.bounceHandlingEnabled}
                    onCheckedChange={(v) =>
                      setEmail("bounceHandlingEnabled", v)
                    }
                  />
                </div>
                <SaveRow onSave={() => save("email")} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">SMS Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>SMS Provider</Label>
                    <Select
                      value={cfg.sms.provider}
                      onValueChange={(v) =>
                        setSms(
                          "provider",
                          v as PlatformConfig["sms"]["provider"],
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="sns">AWS SNS</SelectItem>
                        <SelectItem value="termii">Termii</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sender ID</Label>
                    <Input
                      value={cfg.sms.senderId}
                      onChange={(e) => setSms("senderId", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">SMS Enabled</p>
                    <p className="text-xs text-muted-foreground">
                      Enable SMS delivery for OTPs and notifications.
                    </p>
                  </div>
                  <Switch
                    checked={cfg.sms.enabled}
                    onCheckedChange={(v) => setSms("enabled", v)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "sms" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Storage Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {savedTab === "sms" && <SavedBanner />}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Storage Provider</Label>
                  <Select
                    value={cfg.storage.provider}
                    onValueChange={(v) =>
                      setStorage(
                        "provider",
                        v as PlatformConfig["storage"]["provider"],
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s3">AWS S3</SelectItem>
                      <SelectItem value="azure">Azure Blob</SelectItem>
                      <SelectItem value="local">Local Disk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Bucket / Container Name</Label>
                  <Input
                    value={cfg.storage.bucketName}
                    onChange={(e) => setStorage("bucketName", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Region</Label>
                  <Input
                    value={cfg.storage.region}
                    onChange={(e) => setStorage("region", e.target.value)}
                  />
                </div>
              </div>
              <SaveRow onSave={() => save("sms")} />
            </CardContent>
          </Card>
        )}

        {activeTab === "maintenance" && (
          <div className="space-y-4">
            {cfg.maintenance.enabled && (
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                    Maintenance Mode is Active
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                    All tenants are currently seeing the maintenance page.
                    Disable to restore access.
                  </p>
                </div>
              </div>
            )}
            <Card
              className={
                cfg.maintenance.enabled
                  ? "border-red-300 dark:border-red-700"
                  : ""
              }
            >
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Maintenance Mode
                  <Switch
                    checked={cfg.maintenance.enabled}
                    onCheckedChange={requestMaintenanceToggle}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {savedTab === "maintenance" && <SavedBanner />}
                <div className="space-y-1.5">
                  <Label>Maintenance Message</Label>
                  <Textarea
                    rows={4}
                    value={cfg.maintenance.message}
                    onChange={(e) => setMaintenance("message", e.target.value)}
                    placeholder="Message shown to tenants during maintenance..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Estimated Downtime</Label>
                  <Input
                    value={cfg.maintenance.estimatedDowntime}
                    onChange={(e) =>
                      setMaintenance("estimatedDowntime", e.target.value)
                    }
                    placeholder="e.g. 2 hours"
                  />
                </div>
                <SaveRow onSave={() => save("maintenance")} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog
        open={showMaintenanceDialog}
        onOpenChange={setShowMaintenanceDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Enable Maintenance Mode?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Enabling maintenance mode will make the platform inaccessible to{" "}
            <strong>all tenants</strong> until it is turned off. Ongoing
            sessions will be terminated. Are you sure you want to continue?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMaintenanceDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmMaintenance}
            >
              Yes, Enable Maintenance Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
