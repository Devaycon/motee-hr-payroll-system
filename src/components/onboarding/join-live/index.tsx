"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CircleCheck, FileUp, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import ThemeToggle from "@/src/components/themes/theme-toggle";
import { landingPathForSession } from "@/src/lib/auth/session";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { getApiErrorMessage } from "@/src/lib/utils";
import { formatDateTime } from "@/src/lib/utils/format-date";
import {
  acceptInviteSchema,
  joinDeclarationSchema,
  joinGuarantorsSchema,
  joinP45Schema,
  type AcceptInviteFormType,
} from "@/src/lib/validations/join";
import { setCredentials } from "@/src/store/reducers/authSlice";
import { useUploadFileMutation } from "@/src/store/services/files";
import {
  useAcceptInvitationMutation,
  useAcceptJoinConsentMutation,
  useAttachJoinDocumentMutation,
  useDeclareJoinPackMutation,
  useGetInvitationQuery,
  useGetJoinPackQuery,
  useGetJoinRequirementsQuery,
  useRemoveJoinDocumentMutation,
  useSaveJoinDraftMutation,
  useSaveJoinGuarantorsMutation,
  useSaveJoinStarterTaxMutation,
  useUploadJoinPhotoMutation,
} from "@/src/store/services/join";
import type {
  GuarantorRequest,
  JoinerDocumentKind,
  JoinerPackDto,
  JoinerPackRequirementsDto,
  StarterTaxSource,
  StudentLoanPlan,
} from "@/src/types/join";

function Section({
  title,
  done,
  children,
}: {
  title: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {done && (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
            >
              <CircleCheck className="h-3 w-3" />
              Done
            </Badge>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

/** Creates the joiner's account: the invitation becomes a signed-in session. */
function AccountSection({ token }: { token: string }) {
  const dispatch = useAppDispatch();
  const [acceptInvitation] = useAcceptInvitationMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormType>({
    resolver: zodResolver(acceptInviteSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const onSubmit = async (values: AcceptInviteFormType) => {
    try {
      const session = (
        await acceptInvitation({
          token,
          body: {
            password: values.password,
            phone: values.phone || null,
            dateOfBirth: values.dateOfBirth || null,
            address: values.address || null,
            emergencyContactName: values.emergencyContactName || null,
            emergencyContactPhone: values.emergencyContactPhone || null,
          },
        }).unwrap()
      ).data;
      dispatch(
        setCredentials({
          token: session.accessToken,
          refresh_token: session.refreshToken ?? undefined,
          expires_at: session.expiresAt,
          user_id: session.userId,
          tenant_id: session.tenantId,
          onboarding_completed: session.onboardingCompleted,
        }),
      );
      toast.success("Your account is ready.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not create your account."));
    }
  };

  const field = (
    name: keyof AcceptInviteFormType,
    label: string,
    type = "text",
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name} className="text-xs">
        {label}
      </Label>
      <Input id={name} type={type} className="h-9 text-sm" {...register(name)} />
      {errors[name] && (
        <span className="text-xs text-destructive">{errors[name]?.message}</span>
      )}
    </div>
  );

  return (
    <Section title="Create your account">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field("password", "Password", "password")}
          {field("confirmPassword", "Confirm password", "password")}
          {field("phone", "Phone (optional)", "tel")}
          {field("dateOfBirth", "Date of birth (optional)", "date")}
          <div className="sm:col-span-2">
            {field("address", "Home address (optional)")}
          </div>
          {field("emergencyContactName", "Emergency contact (optional)")}
          {field("emergencyContactPhone", "Their phone (optional)", "tel")}
        </div>
        <Button type="submit" className="w-fit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create account"}
        </Button>
      </form>
    </Section>
  );
}

function ConsentSection({ token, pack }: { token: string; pack: JoinerPackDto }) {
  const [acceptConsent, { isLoading }] = useAcceptJoinConsentMutation();
  const consent = pack.privacyConsent;

  async function handleAccept() {
    try {
      await acceptConsent(token).unwrap();
      toast.success("Privacy notice accepted");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not record your consent."));
    }
  }

  return (
    <Section title="Privacy notice" done={Boolean(consent)}>
      {consent ? (
        <p className="text-sm text-muted-foreground">
          Accepted version {consent.noticeVersion} on{" "}
          {formatDateTime(consent.acceptedAt)}.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Your employer collects the details on this page to set you up as an
            employee. Accept the privacy notice to continue.
          </p>
          <Button className="w-fit gap-1.5" disabled={isLoading} onClick={handleAccept}>
            <ShieldCheck className="h-4 w-4" />
            I accept the privacy notice
          </Button>
        </>
      )}
    </Section>
  );
}

function PhotoSection({ token }: { token: string }) {
  const [uploadPhoto, { isLoading }] = useUploadJoinPhotoMutation();
  const [uploaded, setUploaded] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      await uploadPhoto({ token, file }).unwrap();
      setUploaded(true);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not upload the photo."));
    }
  }

  return (
    <Section title="Profile photo" done={uploaded}>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        variant="outline"
        className="w-fit gap-1.5"
        disabled={isLoading}
        onClick={() => input.current?.click()}
      >
        <FileUp className="h-4 w-4" />
        {isLoading ? "Uploading…" : uploaded ? "Replace photo" : "Upload photo"}
      </Button>
    </Section>
  );
}

function DocumentsSection({
  token,
  pack,
  requirements,
  signedIn,
}: {
  token: string;
  pack: JoinerPackDto;
  requirements: JoinerPackRequirementsDto;
  signedIn: boolean;
}) {
  const [uploadFile] = useUploadFileMutation();
  const [attachDocument] = useAttachJoinDocumentMutation();
  const [removeDocument] = useRemoveJoinDocumentMutation();
  const [busyKind, setBusyKind] = useState<JoinerDocumentKind | null>(null);

  async function handleFile(kind: JoinerDocumentKind, file: File | undefined) {
    if (!file) return;
    setBusyKind(kind);
    try {
      // The file is stored first, then linked to this slot of the pack.
      const stored = (
        await uploadFile({ file, purpose: "employeeDocument" }).unwrap()
      ).data;
      await attachDocument({
        token,
        kind,
        body: { fileId: stored.id },
      }).unwrap();
      toast.success(`${file.name} uploaded`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not upload the document."));
    } finally {
      setBusyKind(null);
    }
  }

  async function handleRemove(kind: JoinerDocumentKind) {
    try {
      await removeDocument({ token, kind }).unwrap();
      toast.success("Document removed");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the document."));
    }
  }

  const required = requirements.documents.filter((d) => d.required);
  const done = required.every((spec) =>
    pack.documents.some((d) => d.kind === spec.kind),
  );

  return (
    <Section title="Documents" done={done}>
      {!signedIn && (
        <p className="text-xs text-muted-foreground">
          Create your account above before uploading documents.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {requirements.documents.map((spec) => {
          const uploaded = pack.documents.find((d) => d.kind === spec.kind);
          return (
            <li
              key={spec.kind}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
            >
              <div className="flex min-w-0 flex-col">
                <span className="text-sm text-foreground">
                  {spec.label}
                  {spec.required && <span className="text-destructive"> *</span>}
                </span>
                <span className="text-xs text-muted-foreground">
                  {uploaded ? uploaded.fileName : spec.hint}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <label>
                  <input
                    type="file"
                    className="hidden"
                    disabled={!signedIn || busyKind === spec.kind}
                    onChange={(e) => handleFile(spec.kind, e.target.files?.[0])}
                  />
                  <span
                    className={
                      "inline-flex h-8 cursor-pointer items-center rounded-md border border-border px-3 text-xs " +
                      (!signedIn ? "pointer-events-none opacity-50" : "")
                    }
                  >
                    {busyKind === spec.kind
                      ? "Uploading…"
                      : uploaded
                        ? "Replace"
                        : "Upload"}
                  </span>
                </label>
                {uploaded && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    aria-label={`Remove ${spec.label}`}
                    onClick={() => handleRemove(spec.kind)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function GuarantorsSection({
  token,
  pack,
  count,
}: {
  token: string;
  pack: JoinerPackDto;
  count: number;
}) {
  const [saveGuarantors, { isLoading }] = useSaveJoinGuarantorsMutation();
  const [rows, setRows] = useState<GuarantorRequest[]>(() =>
    Array.from({ length: count }, (_, i) => {
      const saved = pack.guarantors.find((g) => g.position === i + 1);
      return {
        position: i + 1,
        name: saved?.name ?? "",
        relationship: saved?.relationship ?? "",
        occupation: saved?.occupation ?? "",
        address: saved?.address ?? "",
        phone: saved?.phone ?? "",
      };
    }),
  );
  const setRow = (index: number, patch: Partial<GuarantorRequest>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  async function handleSave() {
    const parsed = joinGuarantorsSchema.safeParse({ guarantors: rows });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      await saveGuarantors({ token, body: parsed.data }).unwrap();
      toast.success("Guarantors saved");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save your guarantors."));
    }
  }

  return (
    <Section title="Guarantors" done={pack.guarantors.length >= count}>
      {rows.map((row, index) => (
        <div key={row.position} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <span className="text-xs font-medium text-foreground sm:col-span-2">
            Guarantor {row.position}
          </span>
          {(
            [
              ["name", "Full name"],
              ["relationship", "Relationship"],
              ["occupation", "Occupation"],
              ["phone", "Phone"],
            ] as const
          ).map(([key, label]) => (
            <Input
              key={key}
              value={row[key] ?? ""}
              onChange={(e) => setRow(index, { [key]: e.target.value })}
              placeholder={label}
              className="h-9 text-sm"
            />
          ))}
          <Input
            value={row.address ?? ""}
            onChange={(e) => setRow(index, { address: e.target.value })}
            placeholder="Address"
            className="h-9 text-sm sm:col-span-2"
          />
        </div>
      ))}
      <Button className="w-fit" disabled={isLoading} onClick={handleSave}>
        Save guarantors
      </Button>
    </Section>
  );
}

function StarterTaxSection({ token, pack }: { token: string; pack: JoinerPackDto }) {
  const [saveStarterTax, { isLoading }] = useSaveJoinStarterTaxMutation();
  const saved = pack.starterTax;
  const [source, setSource] = useState<StarterTaxSource>(saved?.source ?? "none");
  const [leavingDate, setLeavingDate] = useState(saved?.p45?.leavingDate ?? "");
  const [taxCode, setTaxCode] = useState(saved?.p45?.taxCodeAtLeaving ?? "");
  const [pay, setPay] = useState(String(saved?.p45?.totalPayToDate ?? ""));
  const [tax, setTax] = useState(String(saved?.p45?.totalTaxToDate ?? ""));
  const statement = saved?.starterChecklist?.employeeStatement;
  const [hasAnotherJob, setHasAnotherJob] = useState(statement?.hasAnotherJob ?? false);
  const [receivesPension, setReceivesPension] = useState(
    statement?.receivesPension ?? false,
  );
  const [recentPayments, setRecentPayments] = useState(
    statement?.recentPaymentsSince6April ?? false,
  );
  const [loanPlan, setLoanPlan] = useState<StudentLoanPlan | "none">(
    saved?.starterChecklist?.studentLoan.plan ?? "none",
  );

  async function handleSave() {
    let p45;
    if (source === "p45") {
      const parsed = joinP45Schema.safeParse({
        leavingDate,
        taxCodeAtLeaving: taxCode,
        totalPayToDate: pay ? Number(pay) : undefined,
        totalTaxToDate: tax ? Number(tax) : undefined,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
      p45 = parsed.data;
    }
    try {
      await saveStarterTax({
        token,
        body: {
          source,
          p45,
          employeeStatement:
            source === "starterChecklist"
              ? {
                  hasAnotherJob,
                  receivesPension,
                  recentPaymentsSince6April: recentPayments,
                }
              : undefined,
          studentLoan:
            source === "starterChecklist"
              ? {
                  hasPlan: loanPlan !== "none",
                  plan: loanPlan === "none" ? undefined : loanPlan,
                }
              : undefined,
        },
      }).unwrap();
      toast.success("Tax details saved");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save your tax details."));
    }
  }

  const tick = (
    label: string,
    checked: boolean,
    onChange: (value: boolean) => void,
  ) => (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      {label}
    </label>
  );

  return (
    <Section title="Starter tax details" done={Boolean(saved && saved.source !== "none")}>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">What can you give us?</Label>
        <Select value={source} onValueChange={(v) => setSource(v as StarterTaxSource)}>
          <SelectTrigger className="h-9 w-64 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p45">A P45 from my last job</SelectItem>
            <SelectItem value="starterChecklist">A starter checklist</SelectItem>
            <SelectItem value="none">Neither yet</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {source === "p45" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Leaving date</Label>
            <Input
              type="date"
              value={leavingDate}
              onChange={(e) => setLeavingDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Tax code at leaving</Label>
            <Input
              value={taxCode}
              onChange={(e) => setTaxCode(e.target.value)}
              placeholder="e.g. 1257L"
              className="h-9 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Total pay to date</Label>
            <Input
              type="number"
              value={pay}
              onChange={(e) => setPay(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Total tax to date</Label>
            <Input
              type="number"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>
      )}

      {source === "starterChecklist" && (
        <div className="flex flex-col gap-2">
          {tick("I have another job", hasAnotherJob, setHasAnotherJob)}
          {tick("I receive a pension", receivesPension, setReceivesPension)}
          {tick(
            "I have had taxable payments since 6 April",
            recentPayments,
            setRecentPayments,
          )}
          <div className="flex flex-col gap-1.5 pt-1">
            <Label className="text-xs">Student loan</Label>
            <Select
              value={loanPlan}
              onValueChange={(v) => setLoanPlan(v as StudentLoanPlan | "none")}
            >
              <SelectTrigger className="h-9 w-48 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No student loan</SelectItem>
                <SelectItem value="plan1">Plan 1</SelectItem>
                <SelectItem value="plan2">Plan 2</SelectItem>
                <SelectItem value="plan4">Plan 4</SelectItem>
                <SelectItem value="plan5">Plan 5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {saved?.derived && (
        <p className="text-xs text-muted-foreground">
          Tax code worked out for you: {saved.derived.taxCode}
        </p>
      )}

      <Button className="w-fit" disabled={isLoading} onClick={handleSave}>
        Save tax details
      </Button>
    </Section>
  );
}

function DeclarationSection({
  token,
  pack,
  onFinished,
}: {
  token: string;
  pack: JoinerPackDto;
  onFinished: () => void;
}) {
  const [declare, { isLoading }] = useDeclareJoinPackMutation();
  const [saveDraft, { isLoading: saving }] = useSaveJoinDraftMutation();
  const [signedName, setSignedName] = useState("");

  async function handleDeclare() {
    const parsed = joinDeclarationSchema.safeParse({ signedName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      await declare({ token, body: parsed.data }).unwrap();
      toast.success("Submitted. Thank you!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not submit your details."));
    }
  }

  /** Lets the joiner leave and come back to the same link later. */
  async function handleSaveDraft() {
    try {
      await saveDraft({
        token,
        body: { draftJson: JSON.stringify({ signedName }), step: null },
      }).unwrap();
      toast.success("Progress saved. You can return to this link later.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save your progress."));
    }
  }

  if (pack.declaration) {
    return (
      <Section title="Declaration" done>
        <p className="text-sm text-muted-foreground">
          Signed by {pack.declaration.signedName} on{" "}
          {formatDateTime(pack.declaration.signedAt)}.
        </p>
        <Button className="w-fit" onClick={onFinished}>
          Go to my account
        </Button>
      </Section>
    );
  }

  return (
    <Section title="Declaration">
      {pack.outstanding.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          Still needed: {pack.outstanding.join(", ")}
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        I confirm the details I have given are true and complete.
      </p>
      <Input
        value={signedName}
        onChange={(e) => setSignedName(e.target.value)}
        placeholder="Type your full name to sign"
        className="h-9 max-w-sm text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <Button disabled={isLoading} onClick={handleDeclare}>
          Submit my details
        </Button>
        <Button variant="outline" disabled={saving} onClick={handleSaveDraft}>
          Save and finish later
        </Button>
      </div>
    </Section>
  );
}

/** The page a new joiner lands on from their invitation link. */
export function LiveJoinPage({ token }: { token: string }) {
  const router = useRouter();
  const session = useAppSelector((s) => s.session);
  const signedIn = session.is_loggedIn;
  const { data: invite, isLoading } = useGetInvitationQuery(token);
  const preview = invite?.data;
  const valid = preview?.outcome === "valid" || signedIn;
  const collectsPack = preview?.purpose !== "credentials";
  const { data: requirementsRes } = useGetJoinRequirementsQuery(token, {
    skip: !valid || !collectsPack,
  });
  const { data: packRes } = useGetJoinPackQuery(token, {
    skip: !valid || !collectsPack,
  });
  const requirements = requirementsRes?.data;
  const pack = packRes?.data;

  const goToAccount = () => router.push(landingPathForSession(session));

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="text-sm font-semibold text-foreground">
          {preview?.companyName ?? "Motee"}
        </span>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-8">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : !preview || (!valid && preview.outcome !== "valid") ? (
          <Card>
            <CardContent className="flex flex-col gap-2 p-6">
              <h1 className="text-xl font-semibold text-foreground">
                This link can&apos;t be used
              </h1>
              <p className="text-sm text-muted-foreground">
                {preview?.outcome === "expired"
                  ? "The invitation has expired. Ask your HR contact to send a new one."
                  : preview?.outcome === "consumed"
                    ? "This invitation has already been used. Sign in instead."
                    : preview?.outcome === "revoked"
                      ? "This invitation was withdrawn. Contact your HR team."
                      : "We could not find this invitation."}
              </p>
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => router.push("/auth/login")}
              >
                Go to sign in
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome{preview.firstName ? `, ${preview.firstName}` : ""}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {[preview.jobTitle, preview.department, preview.companyName]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            {!signedIn && <AccountSection token={token} />}

            {!collectsPack && signedIn && (
              <Section title="You're all set" done>
                <Button className="w-fit" onClick={goToAccount}>
                  Go to my account
                </Button>
              </Section>
            )}

            {collectsPack && pack && requirements && (
              <>
                <ConsentSection token={token} pack={pack} />
                <PhotoSection token={token} />
                {requirements.documents.length > 0 && (
                  <DocumentsSection
                    token={token}
                    pack={pack}
                    requirements={requirements}
                    signedIn={signedIn}
                  />
                )}
                {requirements.guarantorsRequired > 0 && (
                  <GuarantorsSection
                    key={pack.guarantors.length}
                    token={token}
                    pack={pack}
                    count={requirements.guarantorsRequired}
                  />
                )}
                {requirements.collectsStarterTax && (
                  <StarterTaxSection token={token} pack={pack} />
                )}
                <DeclarationSection
                  token={token}
                  pack={pack}
                  onFinished={goToAccount}
                />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
