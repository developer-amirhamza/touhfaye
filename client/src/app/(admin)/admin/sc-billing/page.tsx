"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaChevronDown,
  FaChevronUp,
  FaCopy,
  FaDownload,
  FaTimes,
  FaSync,
} from "react-icons/fa";
import Axios from "@/utils/Axios";
import { SummeryApi } from "@/app/common/SummeryApi";
import AxiosToastError from "@/utils/AxiosToastError";
import { RootState } from "@/redux/store";

/* ------------------------------------------------------------------ *
 * SC Billing Tracker (admin-only)
 * Support-coordination time log, budget pacing and claim export.
 * ------------------------------------------------------------------ */

const ACTIVITIES = [
  "Phone call",
  "Home visit",
  "Meeting",
  "Email",
  "Report writing",
  "Provider liaison",
  "Case note",
  "Plan review",
  "Other",
];

const NEW_PLAN_COLORS = ["#7c3aed", "#0891b2", "#c2410c", "#4d7c0f", "#be185d"];
const PLAN_COLORS = ["#e2663b", "#2f6feb", "#1f9d55", ...NEW_PLAN_COLORS];

/* ---------------------------- types ------------------------------- */

interface PlanDraft {
  participant: string;
  ndis: string;
  coordinator: string;
  rate: number;
  travelRate: number;
  itemCode: string;
  travelItemCode: string;
  budget: number;
  start: string; // "YYYY-MM-DD"
  end: string; // "YYYY-MM-DD"
  reportLeadDays: number;
  color: string;
}

interface ScPlanItem extends PlanDraft {
  id: string;
}

type EntryType = "support" | "travel";

interface EntryPayload {
  id: string | null;
  planId: string;
  date: string; // "YYYY-MM-DD"
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  hours: number;
  type: EntryType;
  activity: string;
  note: string;
  coordinator: string;
}

interface ScEntryItem extends Omit<EntryPayload, "id"> {
  id: string;
}

interface PlanStats {
  entries: ScEntryItem[];
  supportHours: number;
  travelHours: number;
  supportValue: number;
  travelValue: number;
  billed: number;
  left: number;
  hoursLeft: number;
  billedPct: number;
  expectedPct: number;
  supportPct: number;
  travelPct: number;
  daysLeft: number;
  ended: boolean;
  notStarted: boolean;
  perWeek: number | null;
  perMonth: number | null;
  reportDue: string;
  reportInDays: number;
  status: string;
  tone: "ok" | "warn" | "bad" | "info";
}

type StatsMap = Record<string, PlanStats>;
type Notify = (msg: string, kind?: "success" | "error") => void;

/* ---------------------------- helpers ----------------------------- */

const DAY = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parseDate = (s?: string | null) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const shortDate = (s: string) => {
  const d = parseDate(s);
  return d ? `${MONTHS[d.getMonth()]} ${d.getDate()}` : "";
};
const monthLabel = (s: string) => {
  const d = parseDate(s);
  return d ? `${MONTHS[d.getMonth()]} ${d.getFullYear()}` : "";
};
const monthSort = (s: string) => s.slice(0, 7);

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const money0 = (n: number) => (n < 0 ? "-" : "") + "$" + Math.round(Math.abs(n)).toLocaleString("en-AU");
const money2 = (n: number) =>
  (n < 0 ? "-" : "") +
  "$" +
  Math.abs(round2(n)).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hrs = (n: number, dp = 2) => `${n.toFixed(dp)} h`;

/** Minutes between two HH:MM strings, rounded to the nearest 6 minutes (0.1 h). */
const hoursFromTimes = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return Math.round(mins / 6) / 10;
};

const lineValue = (entry: ScEntryItem, plan: ScPlanItem) =>
  round2(entry.hours * (entry.type === "travel" ? plan.travelRate : plan.rate));

/* ------------------------ API <-> UI mapping ----------------------- *
 * The backend stores plan/entry dates as plain "YYYY-MM-DD" strings and
 * uses its own field names (startDate/endDate/ndisNumber/startTime/
 * endTime). Everything below this boundary keeps the tracker's own
 * shorter field names (start/end/ndis) so the calculation and rendering
 * code reads exactly like the original tool.
 * ------------------------------------------------------------------- */

const fromApiPlan = (p: any): ScPlanItem => ({
  id: p.id,
  participant: p.participant,
  ndis: p.ndisNumber || "",
  coordinator: p.coordinator || "",
  rate: p.rate,
  travelRate: p.travelRate,
  itemCode: p.itemCode,
  travelItemCode: p.travelItemCode || "",
  budget: p.budget,
  start: p.startDate,
  end: p.endDate,
  reportLeadDays: p.reportLeadDays,
  color: p.color,
});

const toApiPlan = (p: PlanDraft) => ({
  participant: p.participant,
  ndisNumber: p.ndis || null,
  coordinator: p.coordinator,
  rate: p.rate,
  travelRate: p.travelRate,
  itemCode: p.itemCode,
  travelItemCode: p.travelItemCode || null,
  budget: p.budget,
  startDate: p.start,
  endDate: p.end,
  reportLeadDays: p.reportLeadDays,
  color: p.color,
});

const fromApiEntry = (e: any): ScEntryItem => ({
  id: e.id,
  planId: e.planId,
  date: e.date,
  start: e.startTime,
  end: e.endTime,
  hours: e.hours,
  type: e.type === "travel" ? "travel" : "support",
  activity: e.activity,
  note: e.note || "",
  coordinator: e.coordinator,
});

const toApiEntry = (e: EntryPayload) => ({
  planId: e.planId,
  date: e.date,
  startTime: e.start,
  endTime: e.end,
  hours: e.hours,
  type: e.type,
  activity: e.activity,
  note: e.note || null,
  coordinator: e.coordinator,
});

/* ------------------------- shared UI bits ------------------------- */

const CARD = "rounded-lg border border-slate-200 bg-white";
const LABEL = "text-xs font-medium uppercase tracking-wide text-slate-400";
const INPUT =
  "w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

function Badge({ tone = "ok", children }: { tone?: PlanStats["tone"]; children: React.ReactNode }) {
  const tones: Record<PlanStats["tone"], string> = {
    ok: "border-slate-200 text-slate-600",
    warn: "border-amber-300 bg-amber-50 text-amber-700",
    bad: "border-red-300 bg-red-50 text-red-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-slate-900">{value}</div>
      {sub ? <div className="text-xs tabular-nums text-slate-400">{sub}</div> : null}
    </div>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap overflow-hidden rounded-md border border-slate-300">
      {options.map((o, i) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-sm ${i > 0 ? "border-l border-slate-300" : ""} ${
            value === o.value ? "bg-blue-600 font-medium text-white" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="inline-block h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: color }} aria-hidden="true" />;
}

/** Budget bar: blue = support billed, grey = travel, dark notch = where today should sit. */
function BudgetBar({ supportPct, travelPct, expectedPct }: { supportPct: number; travelPct: number; expectedPct: number }) {
  const s = Math.max(0, Math.min(100, supportPct));
  const t = Math.max(0, Math.min(100 - s, travelPct));
  const e = Math.max(0, Math.min(99.6, expectedPct));
  return (
    <div className="relative py-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
        <div className="flex h-full">
          <div className="h-full bg-blue-600" style={{ width: `${s}%` }} />
          <div className="h-full bg-slate-300" style={{ width: `${t}%` }} />
        </div>
      </div>
      <div className="absolute top-0 h-4 w-0.5 rounded-full bg-slate-800" style={{ left: `${e}%` }} title="Where billing should sit today" />
    </div>
  );
}

/* --------------------------- calculations ------------------------- */

function planStats(plan: ScPlanItem, entries: ScEntryItem[], today: Date): PlanStats {
  const mine = entries.filter((e) => e.planId === plan.id);
  let supportHours = 0;
  let travelHours = 0;
  let supportValue = 0;
  let travelValue = 0;
  for (const e of mine) {
    const v = lineValue(e, plan);
    if (e.type === "travel") {
      travelHours += e.hours;
      travelValue += v;
    } else {
      supportHours += e.hours;
      supportValue += v;
    }
  }
  const billed = round2(supportValue + travelValue);
  const left = round2(plan.budget - billed);
  const hoursLeft = plan.rate > 0 ? left / plan.rate : 0;

  const start = parseDate(plan.start) as Date;
  const end = parseDate(plan.end) as Date;
  const totalDays = Math.max(1, daysBetween(start, end));
  const daysLeft = daysBetween(today, end);
  const ended = daysLeft < 0;
  const notStarted = daysBetween(today, start) > 0;

  const elapsed = Math.max(0, Math.min(totalDays, daysBetween(start, today)));
  const expectedPct = (elapsed / totalDays) * 100;
  const billedPct = plan.budget > 0 ? (billed / plan.budget) * 100 : 0;

  const perWeek = ended || daysLeft <= 0 ? null : hoursLeft / (daysLeft / 7);
  const perMonth = ended || daysLeft <= 0 ? null : hoursLeft / (daysLeft / 30.44);

  const reportDue = addDays(end, -(plan.reportLeadDays || 42));
  const reportInDays = daysBetween(today, reportDue);

  let status = "On track";
  let tone: PlanStats["tone"] = "ok";
  if (ended) {
    if (left > 1) {
      status = "Plan ended, unspent";
      tone = "bad";
    } else {
      status = "Plan ended";
      tone = "ok";
    }
  } else if (notStarted) {
    status = "Not started";
    tone = "info";
  } else if (billedPct - expectedPct < -10) {
    status = "Behind pace";
    tone = "warn";
  } else if (billedPct - expectedPct > 10) {
    status = "Ahead of pace";
    tone = "warn";
  }

  return {
    entries: mine,
    supportHours,
    travelHours,
    supportValue: round2(supportValue),
    travelValue: round2(travelValue),
    billed,
    left,
    hoursLeft,
    billedPct,
    expectedPct,
    supportPct: plan.budget > 0 ? (supportValue / plan.budget) * 100 : 0,
    travelPct: plan.budget > 0 ? (travelValue / plan.budget) * 100 : 0,
    daysLeft,
    ended,
    notStarted,
    perWeek,
    perMonth,
    reportDue: toKey(reportDue),
    reportInDays,
    status,
    tone,
  };
}

/* ============================== app ============================== */

export default function AdminScBillingPage() {
  const [tab, setTab] = useState("dashboard");
  const [plans, setPlans] = useState<ScPlanItem[]>([]);
  const [entries, setEntries] = useState<ScEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { user } = useSelector((state: RootState) => state.userSlice);
  const me = (user as any)?.name || user?.email || "Admin";

  const today = useMemo(() => startOfDay(new Date()), []);

  const notify: Notify = useCallback((msg, kind = "success") => {
    if (kind === "error") toast.error(msg);
    else toast.success(msg);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [plansRes, entriesRes] = await Promise.all([
        Axios({ ...SummeryApi.getScPlans }),
        Axios({ ...SummeryApi.getScEntries }),
      ]);
      if (plansRes.data?.success) setPlans((plansRes.data.data || []).map(fromApiPlan));
      if (entriesRes.data?.success) setEntries((entriesRes.data.data || []).map(fromApiEntry));
    } catch (err) {
      AxiosToastError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const planById = useMemo(() => {
    const m: Record<string, ScPlanItem> = {};
    for (const p of plans) m[p.id] = p;
    return m;
  }, [plans]);

  const stats = useMemo(() => {
    const m: StatsMap = {};
    for (const p of plans) m[p.id] = planStats(p, entries, today);
    return m;
  }, [plans, entries, today]);

  const saveEntry = useCallback(async (payload: EntryPayload): Promise<boolean> => {
    try {
      if (payload.id) {
        const res = await Axios({ ...SummeryApi.updateScEntry, data: { id: payload.id, ...toApiEntry(payload) } });
        if (res.data?.success) {
          const updated = fromApiEntry(res.data.data);
          setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
          return true;
        }
        toast.error(res.data?.message || "Couldn't update this entry");
        return false;
      }
      const res = await Axios({ ...SummeryApi.createScEntry, data: toApiEntry(payload) });
      if (res.data?.success) {
        const created = fromApiEntry(res.data.data);
        setEntries((prev) => [...prev, created]);
        return true;
      }
      toast.error(res.data?.message || "Couldn't log this entry");
      return false;
    } catch (err) {
      AxiosToastError(err);
      return false;
    }
  }, []);

  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        const res = await Axios({ ...SummeryApi.deleteScEntry, data: { id } });
        if (res.data?.success) {
          setEntries((prev) => prev.filter((e) => e.id !== id));
          if (editingId === id) setEditingId(null);
          notify("Entry deleted");
        }
      } catch (err) {
        AxiosToastError(err);
      }
    },
    [editingId, notify]
  );

  const startEdit = useCallback((id: string) => {
    setEditingId(id);
    setTab("log");
  }, []);

  const createPlan = useCallback(async (draft: PlanDraft): Promise<ScPlanItem | null> => {
    try {
      const res = await Axios({ ...SummeryApi.createScPlan, data: toApiPlan(draft) });
      if (res.data?.success) {
        const created = fromApiPlan(res.data.data);
        setPlans((prev) => [...prev, created]);
        return created;
      }
      toast.error(res.data?.message || "Couldn't add this plan");
      return null;
    } catch (err) {
      AxiosToastError(err);
      return null;
    }
  }, []);

  const updatePlan = useCallback(async (id: string, draft: PlanDraft): Promise<boolean> => {
    try {
      const res = await Axios({ ...SummeryApi.updateScPlan, data: { id, ...toApiPlan(draft) } });
      if (res.data?.success) {
        const updated = fromApiPlan(res.data.data);
        setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
        return true;
      }
      toast.error(res.data?.message || "Couldn't update this plan");
      return false;
    } catch (err) {
      AxiosToastError(err);
      return false;
    }
  }, []);

  const deletePlan = useCallback(async (plan: ScPlanItem): Promise<boolean> => {
    try {
      const res = await Axios({ ...SummeryApi.deleteScPlan, data: { id: plan.id } });
      if (res.data?.success) {
        setPlans((prev) => prev.filter((p) => p.id !== plan.id));
        return true;
      }
      toast.error(res.data?.message || "Couldn't remove this plan");
      return false;
    } catch (err) {
      AxiosToastError(err);
      return false;
    }
  }, []);

  const TABS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "log", label: "Log time" },
    { id: "hours", label: "Hours" },
    { id: "claim", label: "Claim" },
    { id: "plans", label: "Plans" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 pb-16 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">SC Billing Tracker</h1>
            <p className="mt-1 text-sm text-slate-500">Support coordination time log, budget pacing and claim export.</p>
          </div>
          <button
            onClick={fetchAll}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <FaSync size={12} /> Refresh
          </button>
        </div>

        {/* tabs */}
        <div className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 border-b-2 px-3 py-2 text-sm ${
                tab === t.id ? "border-slate-900 font-semibold text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {tab === "dashboard" && (
            <Dashboard plans={plans} stats={stats} onEdit={startEdit} onDelete={deleteEntry} onGoLog={() => setTab("log")} />
          )}
          {tab === "log" && (
            <LogTime
              plans={plans}
              entries={entries}
              planById={planById}
              me={me}
              editingId={editingId}
              onCancelEdit={() => setEditingId(null)}
              onSaveEntry={saveEntry}
              onDeleteEntry={deleteEntry}
              onEdit={setEditingId}
              notify={notify}
            />
          )}
          {tab === "hours" && <Hours entries={entries} planById={planById} today={today} />}
          {tab === "claim" && <Claim plans={plans} entries={entries} planById={planById} today={today} notify={notify} />}
          {tab === "plans" && (
            <Plans
              plans={plans}
              stats={stats}
              entries={entries}
              notify={notify}
              onCreatePlan={createPlan}
              onUpdatePlan={updatePlan}
              onDeletePlan={deletePlan}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ dashboard =========================== */

function Dashboard({
  plans,
  stats,
  onEdit,
  onDelete,
  onGoLog,
}: {
  plans: ScPlanItem[];
  stats: StatsMap;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onGoLog: () => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const alerts: { rank: number; glyph: string; text: string }[] = [];
  for (const p of plans) {
    const s = stats[p.id];
    if (s.ended && s.left > 1) {
      alerts.push({ rank: 0, glyph: "!", text: `${p.participant} — plan ended with ${money0(s.left)} unclaimed` });
      continue;
    }
    if (!s.ended && s.reportInDays >= 0 && s.reportInDays <= 30) {
      alerts.push({ rank: 1, glyph: "▲", text: `${p.participant} — report due in ${s.reportInDays} days` });
    }
    if (!s.ended && s.reportInDays < 0) {
      alerts.push({ rank: 0, glyph: "!", text: `${p.participant} — report was due ${shortDate(s.reportDue)}` });
    }
    if (!s.ended && s.daysLeft <= 60) {
      alerts.push({ rank: 2, glyph: "•", text: `${p.participant} — plan ends in ${s.daysLeft} days` });
    }
    if (!s.ended && s.status === "Behind pace") {
      alerts.push({ rank: 2, glyph: "•", text: `${p.participant} — billing ${Math.round(s.expectedPct - s.billedPct)}% behind pace` });
    }
  }
  alerts.sort((a, b) => a.rank - b.rank);

  const active = plans.filter((p) => !stats[p.id].ended);
  const totalLeft = active.reduce((a, p) => a + Math.max(0, stats[p.id].left), 0);
  const totalHours = active.reduce((a, p) => a + Math.max(0, stats[p.id].hoursLeft), 0);
  const attention = plans.filter((p) => stats[p.id].tone !== "ok").length;

  const stripe: Record<number, string> = { 0: "border-l-red-500", 1: "border-l-orange-400", 2: "border-l-amber-300" };
  const glyphColor: Record<number, string> = { 0: "text-red-600", 1: "text-orange-500", 2: "text-amber-500" };

  const ordered = plans.slice().sort((a, b) => {
    const sa = stats[a.id];
    const sb = stats[b.id];
    if (sa.ended !== sb.ended) return sa.ended ? 1 : -1;
    return sa.daysLeft - sb.daysLeft;
  });

  return (
    <div className="space-y-4">
      {alerts.length > 0 ? (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-start gap-2 rounded-md border border-l-4 border-slate-200 bg-white px-3 py-2.5 text-sm ${stripe[a.rank]}`}>
              <span className={`font-bold ${glyphColor[a.rank]}`}>{a.glyph}</span>
              <span className="text-slate-800">{a.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${CARD} px-3 py-2.5 text-sm text-slate-500`}>Nothing needs attention today.</div>
      )}

      <div className="pt-2">
        <div className="text-sm text-slate-500">
          Left to bill across {active.length} active plan{active.length === 1 ? "" : "s"}
        </div>
        <div className="text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">{money0(totalLeft)}</div>
        <div className="mt-1 text-sm text-slate-500">
          {hrs(totalHours)} of support coordination
          {attention > 0 ? ` · ${attention} plan${attention === 1 ? "" : "s"} need attention` : ""}
        </div>
      </div>

      {plans.length === 0 ? (
        <div className={`${CARD} px-3 py-6 text-center text-sm text-slate-500`}>
          No plans yet.{" "}
          <button onClick={onGoLog} className="font-medium text-blue-700 hover:underline">
            Add one in the Plans tab
          </button>{" "}
          to start tracking.
        </div>
      ) : null}

      {ordered.map((p) => {
        const s = stats[p.id];
        const isOpen = !!open[p.id];
        return (
          <div key={p.id} className={`${CARD} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-bold">{p.participant}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <Dot color={p.color} />
                  <span>{p.coordinator}</span>
                  <span>· {money2(p.rate)}/h</span>
                  {s.travelHours > 0 || p.travelRate ? <span>· travel {money2(p.travelRate)}/h</span> : null}
                </div>
              </div>
              <Badge tone={s.tone}>
                {s.tone === "ok" ? "✓" : s.tone === "bad" ? "!" : "▲"} {s.status}
              </Badge>
            </div>

            <div className="mt-3">
              <BudgetBar supportPct={s.supportPct} travelPct={s.travelPct} expectedPct={s.expectedPct} />
              <div className="mt-1 flex items-baseline justify-between gap-3 text-xs text-slate-500">
                <span className="tabular-nums">
                  {money0(s.billed)} of {money0(p.budget)} billed
                  {s.travelHours > 0 ? ` · ${hrs(s.travelHours)} travel` : ""}
                </span>
                <span className="tabular-nums">{Math.round(s.billedPct)}%</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Left to bill" value={money0(s.left)} sub={hrs(Math.max(0, s.hoursLeft))} />
              <Stat
                label="Per week"
                value={s.perWeek === null ? "—" : hrs(s.perWeek, 1)}
                sub={s.ended ? "plan ended" : `${s.daysLeft} days left`}
              />
              <Stat label="Per month" value={s.perMonth === null ? "—" : hrs(s.perMonth, 1)} sub={`${p.start} → ${p.end}`} />
            </div>

            <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Report due {shortDate(s.reportDue)} ({p.reportLeadDays} days before plan end) ·{" "}
              {s.reportInDays < 0 ? `${Math.abs(s.reportInDays)} days overdue` : `in ${s.reportInDays} days`}
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <button
                onClick={() => setOpen((o) => ({ ...o, [p.id]: !isOpen }))}
                className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
              >
                {isOpen ? "Hide detail" : "Show detail"}
                {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </button>
              <span className="text-slate-400">
                · {s.entries.length} {s.entries.length === 1 ? "entry" : "entries"}
              </span>
            </div>

            {isOpen ? <PlanDetail plan={p} stats={s} onEdit={onEdit} onDelete={onDelete} onGoLog={onGoLog} /> : null}
          </div>
        );
      })}

      <p className="pt-2 text-sm leading-relaxed text-slate-400">
        The dark notch on each bar marks where billing should sit today, given the plan dates. Grey on the bar is travel.
      </p>
    </div>
  );
}

function PlanDetail({
  plan,
  stats,
  onEdit,
  onDelete,
  onGoLog,
}: {
  plan: ScPlanItem;
  stats: PlanStats;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onGoLog: () => void;
}) {
  const s = stats;
  if (s.entries.length === 0) {
    return (
      <div className="mt-4 rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
        No time logged against this plan yet.{" "}
        <button onClick={onGoLog} className="font-medium text-blue-700 hover:underline">
          Log the first entry
        </button>
        .
      </div>
    );
  }

  const byCoord: Record<string, { support: number; travel: number; value: number }> = {};
  const byMonth: Record<string, { hours: number; value: number; sort: string }> = {};
  for (const e of s.entries) {
    const c = (byCoord[e.coordinator] ||= { support: 0, travel: 0, value: 0 });
    if (e.type === "travel") c.travel += e.hours;
    else c.support += e.hours;
    c.value += lineValue(e, plan);

    const key = monthLabel(e.date);
    const m = (byMonth[key] ||= { hours: 0, value: 0, sort: monthSort(e.date) });
    m.hours += e.hours;
    m.value += lineValue(e, plan);
  }

  const sorted = s.entries.slice().sort((a, b) => (a.date === b.date ? (a.start < b.start ? 1 : -1) : a.date < b.date ? 1 : -1));

  return (
    <div className="mt-4 space-y-5">
      <section>
        <div className={LABEL}>By coordinator</div>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-1.5 text-left font-medium">Coordinator</th>
                <th className="py-1.5 text-right font-medium">Support</th>
                <th className="py-1.5 text-right font-medium">Travel</th>
                <th className="py-1.5 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(byCoord).map(([name, v]) => (
                <tr key={name}>
                  <td className="py-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Dot color={plan.color} />
                      {name}
                    </span>
                  </td>
                  <td className="py-2 text-right tabular-nums">{v.support.toFixed(2)}</td>
                  <td className="py-2 text-right tabular-nums">{v.travel.toFixed(2)}</td>
                  <td className="py-2 text-right tabular-nums">{money2(v.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className={LABEL}>By month</div>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-1.5 text-left font-medium">Month</th>
                <th className="py-1.5 text-right font-medium">Hours</th>
                <th className="py-1.5 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(byMonth)
                .sort((a, b) => (a[1].sort < b[1].sort ? -1 : 1))
                .map(([label, v]) => (
                  <tr key={label}>
                    <td className="py-2">{label}</td>
                    <td className="py-2 text-right tabular-nums">{hrs(v.hours)}</td>
                    <td className="py-2 text-right tabular-nums">{money2(v.value)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className={LABEL}>Entries</div>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-1.5 pr-3 text-left font-medium">Date</th>
                <th className="py-1.5 pr-3 text-left font-medium">Time</th>
                <th className="py-1.5 pr-3 text-right font-medium">Hours</th>
                <th className="py-1.5 pr-3 text-right font-medium">Value</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((e) => (
                <tr key={e.id} className="align-top">
                  <td className="py-2 pr-3">
                    <div className="whitespace-nowrap">{shortDate(e.date)}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <Dot color={plan.color} />
                      {e.coordinator}
                      {e.type === "travel" ? (
                        <span className="rounded border border-slate-300 px-1 text-xs uppercase tracking-wide text-slate-500">Travel</span>
                      ) : null}
                    </div>
                    {e.type !== "travel" ? (
                      <div className="mt-0.5 text-xs text-slate-400">
                        {e.activity}
                        {e.note ? ` · ${e.note}` : ""}
                      </div>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap py-2 pr-3 tabular-nums text-slate-600">
                    {e.start}–{e.end}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{e.hours.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{money2(lineValue(e, plan))}</td>
                  <td className="py-2">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(e.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        <FaEdit size={11} /> Edit
                      </button>
                      <button
                        onClick={() => onDelete(e.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        <FaTrash size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ============================= log time =========================== */

interface LogDraft {
  id: string | null;
  planId: string;
  date: string;
  start: string;
  end: string;
  activity: string;
  note: string;
  coordinator: string;
  isTravel?: boolean;
  withTravel: boolean;
  travelStart: string;
  travelEnd: string;
}

const blankDraft = (plans: ScPlanItem[], me: string): LogDraft => ({
  id: null,
  planId: plans[0] ? plans[0].id : "",
  date: toKey(new Date()),
  start: "09:00",
  end: "10:00",
  activity: "Phone call",
  note: "",
  coordinator: me,
  withTravel: false,
  travelStart: "10:00",
  travelEnd: "10:30",
});

function LogTime({
  plans,
  entries,
  planById,
  me,
  editingId,
  onCancelEdit,
  onSaveEntry,
  onDeleteEntry,
  onEdit,
  notify,
}: {
  plans: ScPlanItem[];
  entries: ScEntryItem[];
  planById: Record<string, ScPlanItem>;
  me: string;
  editingId: string | null;
  onCancelEdit: () => void;
  onSaveEntry: (entry: EntryPayload) => Promise<boolean>;
  onDeleteEntry: (id: string) => void;
  onEdit: (id: string) => void;
  notify: Notify;
}) {
  const [draft, setDraft] = useState<LogDraft>(() => blankDraft(plans, me));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    const e = entries.find((x) => x.id === editingId);
    if (!e) return;
    setDraft({
      id: e.id,
      planId: e.planId,
      date: e.date,
      start: e.start,
      end: e.end,
      activity: e.type === "travel" ? "Other" : e.activity,
      note: e.note || "",
      coordinator: e.coordinator,
      isTravel: e.type === "travel",
      withTravel: false,
      travelStart: e.end,
      travelEnd: e.end,
    });
    setError("");
  }, [editingId, entries]);

  const set = (k: "planId" | "date" | "start" | "end" | "coordinator" | "note", v: string) =>
    setDraft((d) => ({ ...d, [k]: v }));
  const plan = planById[draft.planId];
  const hours = hoursFromTimes(draft.start, draft.end);
  const travelHours = draft.withTravel ? hoursFromTimes(draft.travelStart, draft.travelEnd) : 0;
  const isTravelEntry = !!draft.isTravel;

  const value = plan ? round2(hours * (isTravelEntry ? plan.travelRate : plan.rate)) : 0;
  const travelValue = plan ? round2(travelHours * plan.travelRate) : 0;

  const outsidePlan =
    plan && draft.date && (draft.date < plan.start || draft.date > plan.end)
      ? `That date sits outside ${plan.participant}'s plan (${plan.start} → ${plan.end}).`
      : "";

  const submit = async () => {
    if (!plan) return setError("Pick a participant first.");
    if (hours <= 0) return setError("End time needs to be after the start time.");
    setError("");
    setSaving(true);

    const base: EntryPayload = {
      id: draft.id,
      planId: draft.planId,
      date: draft.date,
      start: draft.start,
      end: draft.end,
      hours,
      type: isTravelEntry ? "travel" : "support",
      activity: isTravelEntry ? "Travel" : draft.activity,
      note: draft.note.trim(),
      coordinator: draft.coordinator.trim() || me,
    };
    const ok = await onSaveEntry(base);
    if (!ok) {
      setSaving(false);
      return;
    }

    if (draft.withTravel && travelHours > 0) {
      await onSaveEntry({
        id: null,
        planId: draft.planId,
        date: draft.date,
        start: draft.travelStart,
        end: draft.travelEnd,
        hours: travelHours,
        type: "travel",
        activity: "Travel",
        note: "",
        coordinator: draft.coordinator.trim() || me,
      });
    }

    notify(draft.id ? "Entry updated" : draft.withTravel ? "Entry and travel leg logged" : "Entry logged");
    const wasEditing = !!draft.id;
    const fresh = blankDraft(plans, me);
    setDraft({ ...fresh, planId: draft.planId, date: draft.date, coordinator: draft.coordinator });
    setSaving(false);
    if (wasEditing) onCancelEdit();
  };

  const cancel = () => {
    onCancelEdit();
    setDraft(blankDraft(plans, me));
    setError("");
  };

  const recent = entries
    .slice()
    .sort((a, b) => (a.date === b.date ? (a.start < b.start ? 1 : -1) : a.date < b.date ? 1 : -1))
    .slice(0, 8);

  if (plans.length === 0) {
    return <div className={`${CARD} p-6 text-sm text-slate-600`}>Add a plan first — every entry is billed against a participant's plan and rate.</div>;
  }

  return (
    <div className="space-y-4">
      <div className={`${CARD} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{draft.id ? "Edit entry" : "Log an entry"}</h2>
          {draft.id ? (
            <button onClick={cancel} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
              <FaTimes size={12} /> Cancel
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Participant">
            <select className={INPUT} value={draft.planId} onChange={(ev) => set("planId", ev.target.value)}>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.participant} · {p.ndis}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className={INPUT} value={draft.date} onChange={(ev) => set("date", ev.target.value)} />
          </Field>
          <Field label="Start">
            <input type="time" className={INPUT} value={draft.start} onChange={(ev) => set("start", ev.target.value)} />
          </Field>
          <Field label="End" hint="Rounded to the nearest 6 minutes.">
            <input type="time" className={INPUT} value={draft.end} onChange={(ev) => set("end", ev.target.value)} />
          </Field>
          <Field label="Activity">
            <select
              className={INPUT}
              value={isTravelEntry ? "Travel" : draft.activity}
              onChange={(ev) => {
                if (ev.target.value === "Travel") {
                  setDraft((d) => ({ ...d, isTravel: true, activity: "Travel", withTravel: false }));
                } else {
                  setDraft((d) => ({ ...d, isTravel: false, activity: ev.target.value }));
                }
              }}
            >
              {ACTIVITIES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
              <option value="Travel">Travel (billed at the travel rate)</option>
            </select>
          </Field>
          <Field label="Logged by">
            <input className={INPUT} value={draft.coordinator} onChange={(ev) => set("coordinator", ev.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Note">
              <input
                className={INPUT}
                placeholder="What happened, in a few words"
                value={draft.note}
                onChange={(ev) => set("note", ev.target.value)}
              />
            </Field>
          </div>
        </div>

        {!isTravelEntry ? (
          <div className="mt-3 rounded-md bg-slate-50 p-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={draft.withTravel}
                onChange={(ev) =>
                  setDraft((d) => ({
                    ...d,
                    withTravel: ev.target.checked,
                    travelStart: d.end,
                    travelEnd: d.end,
                  }))
                }
              />
              Add a travel leg on the same visit
            </label>
            {draft.withTravel ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Travel start">
                  <input
                    type="time"
                    className={INPUT}
                    value={draft.travelStart}
                    onChange={(ev) => setDraft((d) => ({ ...d, travelStart: ev.target.value }))}
                  />
                </Field>
                <Field label="Travel end">
                  <input
                    type="time"
                    className={INPUT}
                    value={draft.travelEnd}
                    onChange={(ev) => setDraft((d) => ({ ...d, travelEnd: ev.target.value }))}
                  />
                </Field>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <div className="text-xs text-slate-500">This entry</div>
            <div className="text-lg font-semibold tabular-nums">
              {hrs(hours)} · {money2(value)}
              {travelHours > 0 ? (
                <span className="text-slate-400"> + {hrs(travelHours)} travel · {money2(travelValue)}</span>
              ) : null}
            </div>
          </div>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <FaPlus size={12} /> {saving ? "Saving..." : draft.id ? "Update entry" : "Log entry"}
          </button>
        </div>

        {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
        {outsidePlan ? <div className="mt-3 text-sm text-amber-700">{outsidePlan}</div> : null}
      </div>

      <div className={`${CARD} p-4`}>
        <h2 className="text-base font-semibold">Recent entries</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nothing logged yet. Your first entry will show up here.</p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100">
            {recent.map((e) => {
              const p = planById[e.planId];
              return (
                <div key={e.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                      {p ? <Dot color={p.color} /> : null}
                      <span className="font-medium">{p ? p.participant : "Unknown plan"}</span>
                      <span className="text-slate-400">
                        {shortDate(e.date)} · {e.start}–{e.end}
                      </span>
                      {e.type === "travel" ? (
                        <span className="rounded border border-slate-300 px-1 text-xs uppercase tracking-wide text-slate-500">Travel</span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-500">
                      {e.activity}
                      {e.note ? ` · ${e.note}` : ""} · {e.coordinator}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right text-sm tabular-nums">
                      <div className="font-medium">{e.hours.toFixed(2)} h</div>
                      <div className="text-xs text-slate-400">{p ? money2(lineValue(e, p)) : "—"}</div>
                    </div>
                    <button onClick={() => onEdit(e.id)} className="rounded-md border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-50" aria-label="Edit entry">
                      <FaEdit size={12} />
                    </button>
                    <button
                      onClick={() => onDeleteEntry(e.id)}
                      className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                      aria-label="Delete entry"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== hours ============================= */

function rangeFor(period: string, today: Date): [Date, Date] {
  const y = today.getFullYear();
  const m = today.getMonth();
  if (period === "month") return [new Date(y, m, 1), new Date(y, m + 1, 0)];
  if (period === "last") return [new Date(y, m - 1, 1), new Date(y, m, 0)];
  if (period === "14") return [addDays(today, -13), today];
  if (period === "90") return [addDays(today, -89), today];
  return [new Date(1970, 0, 1), new Date(2999, 11, 31)];
}

function useFiltered(entries: ScEntryItem[], period: string, today: Date) {
  return useMemo(() => {
    const [from, to] = rangeFor(period, today);
    const f = toKey(from);
    const t = toKey(to);
    return { list: entries.filter((e) => e.date >= f && e.date <= t), from, to };
  }, [entries, period, today]);
}

function Hours({ entries, planById, today }: { entries: ScEntryItem[]; planById: Record<string, ScPlanItem>; today: Date }) {
  const [period, setPeriod] = useState("month");
  const { list, from, to } = useFiltered(entries, period, today);

  const totals = useMemo(() => {
    let support = 0;
    let travel = 0;
    let value = 0;
    const byParticipant: Record<string, { name: string; color: string; hours: number; value: number }> = {};
    const byMonth: Record<string, { sort: string; support: number; travel: number; value: number }> = {};
    const byCoord: Record<string, { hours: number; value: number }> = {};
    const byActivity: Record<string, { hours: number; value: number }> = {};

    for (const e of list) {
      const p = planById[e.planId];
      if (!p) continue;
      const v = lineValue(e, p);
      value += v;
      if (e.type === "travel") travel += e.hours;
      else support += e.hours;

      const bp = (byParticipant[p.id] ||= { name: p.participant, color: p.color, hours: 0, value: 0 });
      bp.hours += e.hours;
      bp.value += v;

      const mk = monthLabel(e.date);
      const bm = (byMonth[mk] ||= { sort: monthSort(e.date), support: 0, travel: 0, value: 0 });
      if (e.type === "travel") bm.travel += e.hours;
      else bm.support += e.hours;
      bm.value += v;

      const bc = (byCoord[e.coordinator] ||= { hours: 0, value: 0 });
      bc.hours += e.hours;
      bc.value += v;

      const ba = (byActivity[e.activity] ||= { hours: 0, value: 0 });
      ba.hours += e.hours;
      ba.value += v;
    }
    return { support, travel, value: round2(value), byParticipant, byMonth, byCoord, byActivity };
  }, [list, planById]);

  const parts = Object.values(totals.byParticipant).sort((a, b) => b.hours - a.hours);
  const maxHours = parts.length ? Math.max(...parts.map((p) => p.hours)) : 1;

  return (
    <div className="space-y-5">
      <Chips
        value={period}
        onChange={setPeriod}
        options={[
          { value: "month", label: "This month" },
          { value: "last", label: "Last month" },
          { value: "90", label: "Last 90 days" },
          { value: "all", label: "All time" },
        ]}
      />

      <div>
        <div className="text-sm text-slate-500">
          {period === "all" ? "All logged time" : `${toKey(from)} → ${toKey(to)}`} · {list.length} {list.length === 1 ? "entry" : "entries"}
        </div>
        <div className="text-4xl font-bold tabular-nums tracking-tight">{(totals.support + totals.travel).toFixed(2)} h</div>
        <div className="mt-1 text-sm text-slate-500 tabular-nums">
          {hrs(totals.support)} support · {hrs(totals.travel)} travel · {money2(totals.value)} billable
        </div>
      </div>

      {list.length === 0 ? (
        <div className={`${CARD} px-3 py-4 text-sm text-slate-500`}>No time logged in this period. Try a wider range.</div>
      ) : (
        <>
          <div className={`${CARD} p-4`}>
            <div className={LABEL}>By participant</div>
            <div className="mt-3 space-y-3">
              {parts.map((p) => (
                <div key={p.name}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Dot color={p.color} />
                      {p.name}
                    </span>
                    <span className="tabular-nums text-slate-500">
                      {hrs(p.hours)} · {money2(p.value)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${(p.hours / maxHours) * 100}%`, backgroundColor: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${CARD} p-4`}>
            <div className={LABEL}>By month</div>
            <div className="mt-1 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-1.5 text-left font-medium">Month</th>
                    <th className="py-1.5 text-right font-medium">Support</th>
                    <th className="py-1.5 text-right font-medium">Travel</th>
                    <th className="py-1.5 text-right font-medium">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(totals.byMonth)
                    .sort((a, b) => (a[1].sort < b[1].sort ? -1 : 1))
                    .map(([label, v]) => (
                      <tr key={label}>
                        <td className="py-2">{label}</td>
                        <td className="py-2 text-right tabular-nums">{v.support.toFixed(2)}</td>
                        <td className="py-2 text-right tabular-nums">{v.travel.toFixed(2)}</td>
                        <td className="py-2 text-right tabular-nums">{money2(v.value)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={`${CARD} p-4`}>
              <div className={LABEL}>By coordinator</div>
              <table className="mt-1 w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(totals.byCoord)
                    .sort((a, b) => b[1].hours - a[1].hours)
                    .map(([name, v]) => (
                      <tr key={name}>
                        <td className="py-2">{name}</td>
                        <td className="py-2 text-right tabular-nums">{hrs(v.hours)}</td>
                        <td className="py-2 text-right tabular-nums text-slate-500">{money2(v.value)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className={`${CARD} p-4`}>
              <div className={LABEL}>By activity</div>
              <table className="mt-1 w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(totals.byActivity)
                    .sort((a, b) => b[1].hours - a[1].hours)
                    .map(([name, v]) => (
                      <tr key={name}>
                        <td className="py-2">{name}</td>
                        <td className="py-2 text-right tabular-nums">{hrs(v.hours)}</td>
                        <td className="py-2 text-right tabular-nums text-slate-500">{money2(v.value)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================== claim ============================= */

interface ClaimRow {
  id: string;
  participant: string;
  ndis: string;
  date: string;
  item: string;
  type: string;
  desc: string;
  hours: number;
  rate: number;
  total: number;
}

function Claim({
  plans,
  entries,
  planById,
  today,
  notify,
}: {
  plans: ScPlanItem[];
  entries: ScEntryItem[];
  planById: Record<string, ScPlanItem>;
  today: Date;
  notify: Notify;
}) {
  const [period, setPeriod] = useState("month");
  const [who, setWho] = useState("all");
  const { list, from, to } = useFiltered(entries, period, today);

  const rows: ClaimRow[] = useMemo(() => {
    return list
      .filter((e) => (who === "all" ? true : e.planId === who))
      .map((e): ClaimRow | null => {
        const p = planById[e.planId];
        if (!p) return null;
        return {
          id: e.id,
          participant: p.participant,
          ndis: p.ndis,
          date: e.date,
          item: e.type === "travel" ? p.travelItemCode : p.itemCode,
          type: e.type === "travel" ? "Travel" : "Support",
          desc: e.type === "travel" ? "" : `${e.activity}${e.note ? ` · ${e.note}` : ""}`,
          hours: e.hours,
          rate: e.type === "travel" ? p.travelRate : p.rate,
          total: lineValue(e, p),
        };
      })
      .filter((r): r is ClaimRow => r !== null)
      .sort((a, b) => (a.participant === b.participant ? (a.date < b.date ? -1 : 1) : a.participant < b.participant ? -1 : 1));
  }, [list, who, planById]);

  const totalHours = rows.reduce((a, r) => a + r.hours, 0);
  const totalValue = round2(rows.reduce((a, r) => a + r.total, 0));

  const periodLabel = period === "all" ? "All time" : period === "14" ? "Last 14 days" : `${MONTHS[from.getMonth()]} ${from.getFullYear()}`;

  const fileFrom = rows.length ? rows.reduce((a, r) => (r.date < a ? r.date : a), rows[0].date) : toKey(from);
  const fileTo = rows.length ? rows.reduce((a, r) => (r.date > a ? r.date : a), rows[0].date) : toKey(to);
  const filename = `sc-claim-${period === "all" ? fileFrom : toKey(from)}-to-${period === "all" ? fileTo : toKey(to)}.csv`;

  const csv = useMemo(() => {
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Participant", "NDIS number", "Date", "Support item", "Type", "Description", "Hours", "Rate", "Total"];
    const body = rows.map((r) =>
      [r.participant, r.ndis, r.date, r.item, r.type, r.desc, r.hours.toFixed(2), r.rate.toFixed(2), r.total.toFixed(2)].map(esc).join(",")
    );
    return [header.join(","), ...body].join("\n");
  }, [rows]);

  const copyCsv = async () => {
    try {
      await navigator.clipboard.writeText(csv);
      notify("CSV copied to the clipboard");
    } catch {
      notify("Couldn't reach the clipboard — try downloading instead", "error");
    }
  };

  const downloadCsv = () => {
    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify(`Downloaded ${filename}`);
    } catch {
      notify("Download failed — copy the CSV instead", "error");
    }
  };

  return (
    <div className="space-y-4">
      <Chips
        value={period}
        onChange={setPeriod}
        options={[
          { value: "month", label: "This month" },
          { value: "last", label: "Last month" },
          { value: "14", label: "Last 14 days" },
          { value: "all", label: "All time" },
        ]}
      />

      <Field label="Participant">
        <select className={INPUT} value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="all">All participants</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.participant}
            </option>
          ))}
        </select>
      </Field>

      <div>
        <div className="text-sm text-slate-500">
          {periodLabel} · {rows.length} {rows.length === 1 ? "line" : "lines"}
        </div>
        <div className="text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">{money0(totalValue)}</div>
        <div className="mt-1 text-sm text-slate-500 tabular-nums">{hrs(totalHours)} billable</div>
      </div>

      <div className={`${CARD} p-4`}>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No claimable lines in this period. Widen the range or log some time first.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-3 text-left font-medium">Participant</th>
                  <th className="py-2 pr-3 text-left font-medium">Date</th>
                  <th className="py-2 pr-3 text-left font-medium">Item</th>
                  <th className="py-2 pr-3 text-left font-medium">Type</th>
                  <th className="py-2 pr-3 text-right font-medium">Hours</th>
                  <th className="py-2 pr-3 text-right font-medium">Rate</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="py-2.5 pr-3">
                      <div className="whitespace-nowrap font-medium">{r.participant}</div>
                      <div className="text-xs tabular-nums text-slate-400">{r.ndis}</div>
                    </td>
                    <td className="whitespace-nowrap py-2.5 pr-3">{shortDate(r.date)}</td>
                    <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-slate-600">{r.item}</td>
                    <td className="py-2.5 pr-3">
                      <div>{r.type}</div>
                      {r.desc ? <div className="text-xs text-slate-400">{r.desc}</div> : null}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{r.hours.toFixed(2)}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{money2(r.rate)}</td>
                    <td className="py-2.5 text-right tabular-nums">{money2(r.total)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200 font-semibold">
                  <td className="py-2.5 pr-3" colSpan={4}>
                    Total
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{totalHours.toFixed(2)}</td>
                  <td className="py-2.5 pr-3" />
                  <td className="py-2.5 text-right tabular-nums">{money2(totalValue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={downloadCsv}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
        >
          <FaDownload size={12} /> Download CSV
        </button>
        <button
          onClick={copyCsv}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
        >
          <FaCopy size={12} /> Copy CSV
        </button>
      </div>

      <p className="text-sm leading-relaxed text-slate-400">
        Saves as <span className="font-medium text-slate-500">{filename}</span> — one row per logged entry, with travel on its own line at the
        travel rate. Check it against the price guide before you claim; the rates here are whatever is set on each plan.
      </p>
    </div>
  );
}

/* ============================== plans ============================= */

const blankPlanDraft = (): PlanDraft => ({
  participant: "",
  ndis: "",
  coordinator: "",
  rate: 100.14,
  travelRate: 50.07,
  itemCode: "07_001_0106_8_3",
  travelItemCode: "07_099_0106_8_3",
  budget: 0,
  start: toKey(new Date()),
  end: toKey(addDays(new Date(), 365)),
  reportLeadDays: 42,
  color: NEW_PLAN_COLORS[0],
});

function PlanForm({
  draft,
  set,
  num,
  onSave,
  onCancel,
  saving,
  title,
}: {
  draft: PlanDraft;
  set: (k: keyof PlanDraft, v: string | number) => void;
  num: (v: string) => number;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  title: string | null;
}) {
  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      {title ? <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Participant name">
          <input className={INPUT} value={draft.participant} onChange={(e) => set("participant", e.target.value)} />
        </Field>
        <Field label="NDIS number">
          <input className={INPUT} value={draft.ndis} onChange={(e) => set("ndis", e.target.value)} />
        </Field>
        <Field label="Lead coordinator">
          <input className={INPUT} value={draft.coordinator} onChange={(e) => set("coordinator", e.target.value)} />
        </Field>
        <Field label="Plan budget (support coordination)">
          <input type="number" step="1" className={INPUT} value={draft.budget} onChange={(e) => set("budget", num(e.target.value))} />
        </Field>
        <Field label="Support rate per hour">
          <input type="number" step="0.01" className={INPUT} value={draft.rate} onChange={(e) => set("rate", num(e.target.value))} />
        </Field>
        <Field label="Travel rate per hour">
          <input type="number" step="0.01" className={INPUT} value={draft.travelRate} onChange={(e) => set("travelRate", num(e.target.value))} />
        </Field>
        <Field label="Plan starts">
          <input type="date" className={INPUT} value={draft.start} onChange={(e) => set("start", e.target.value)} />
        </Field>
        <Field label="Plan ends">
          <input type="date" className={INPUT} value={draft.end} onChange={(e) => set("end", e.target.value)} />
        </Field>
        <Field label="Support item">
          <input className={INPUT} value={draft.itemCode} onChange={(e) => set("itemCode", e.target.value)} />
        </Field>
        <Field label="Travel item">
          <input className={INPUT} value={draft.travelItemCode} onChange={(e) => set("travelItemCode", e.target.value)} />
        </Field>
        <Field label="Report lead time" hint="Days before the plan ends that the report is due.">
          <input type="number" step="1" className={INPUT} value={draft.reportLeadDays} onChange={(e) => set("reportLeadDays", num(e.target.value))} />
        </Field>
        <Field label="Colour">
          <div className="flex flex-wrap gap-2 pt-1">
            {PLAN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("color", c)}
                className={`h-6 w-6 rounded ${draft.color === c ? "ring-2 ring-slate-900 ring-offset-1" : ""}`}
                style={{ backgroundColor: c }}
                aria-label={`Use ${c}`}
              />
            ))}
          </div>
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save plan"}
        </button>
      </div>
    </div>
  );
}

function Plans({
  plans,
  stats,
  entries,
  notify,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
}: {
  plans: ScPlanItem[];
  stats: StatsMap;
  entries: ScEntryItem[];
  notify: Notify;
  onCreatePlan: (draft: PlanDraft) => Promise<ScPlanItem | null>;
  onUpdatePlan: (id: string, draft: PlanDraft) => Promise<boolean>;
  onDeletePlan: (plan: ScPlanItem) => Promise<boolean>;
}) {
  const [openId, setOpenId] = useState<string | null>(null); // an existing plan's id, or "new"
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const startCreate = () => {
    setDraft(blankPlanDraft());
    setOpenId("new");
  };
  const startEdit = (p: ScPlanItem) => {
    setDraft({
      participant: p.participant,
      ndis: p.ndis,
      coordinator: p.coordinator,
      rate: p.rate,
      travelRate: p.travelRate,
      itemCode: p.itemCode,
      travelItemCode: p.travelItemCode,
      budget: p.budget,
      start: p.start,
      end: p.end,
      reportLeadDays: p.reportLeadDays,
      color: p.color,
    });
    setOpenId(p.id);
  };
  const cancel = () => {
    setOpenId(null);
    setDraft(null);
  };

  const set = (k: keyof PlanDraft, v: string | number) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const num = (v: string) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.participant.trim()) {
      notify("Give this plan a participant name", "error");
      return;
    }
    setSaving(true);
    if (openId === "new") {
      const created = await onCreatePlan(draft);
      if (created) {
        notify("Plan added");
        cancel();
      }
    } else if (openId) {
      const ok = await onUpdatePlan(openId, draft);
      if (ok) {
        notify("Plan updated");
        cancel();
      }
    }
    setSaving(false);
  };

  const remove = async (p: ScPlanItem) => {
    const n = entries.filter((e) => e.planId === p.id).length;
    if (n > 0) {
      notify(`Delete the ${n} logged ${n === 1 ? "entry" : "entries"} first`, "error");
      return;
    }
    if (!window.confirm(`Remove ${p.participant}'s plan?`)) return;
    const ok = await onDeletePlan(p);
    if (ok) notify("Plan removed");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Rates, budgets and dates live here. Everything on the other tabs is calculated from them.</p>
        <button
          onClick={startCreate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <FaPlus size={12} /> Add plan
        </button>
      </div>

      {openId === "new" && draft ? (
        <div className={`${CARD} p-4`}>
          <PlanForm draft={draft} set={set} num={num} onSave={save} onCancel={cancel} saving={saving} title="New plan" />
        </div>
      ) : null}

      {plans.map((p) => {
        const s = stats[p.id];
        const isOpen = openId === p.id;
        return (
          <div key={p.id} className={`${CARD} p-4`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-base font-bold">
                  <Dot color={p.color} />
                  {p.participant}
                </div>
                <div className="mt-0.5 text-xs tabular-nums text-slate-500">
                  {p.ndis || "no NDIS number"} · {p.start} → {p.end} · {money0(p.budget)} budget
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums">{money0(s ? s.left : p.budget)} left</div>
                <div className="text-xs text-slate-400">report {s ? shortDate(s.reportDue) : "—"}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-sm">
              <button onClick={() => (isOpen ? cancel() : startEdit(p))} className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline">
                {isOpen ? "Done editing" : "Edit plan"}
                {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </button>
              <button onClick={() => remove(p)} className="inline-flex items-center gap-1 text-slate-400 hover:text-red-600">
                <FaTrash size={11} /> Remove
              </button>
            </div>

            {isOpen && draft ? <PlanForm draft={draft} set={set} num={num} onSave={save} onCancel={cancel} saving={saving} title={null} /> : null}
          </div>
        );
      })}

      {plans.length === 0 ? <div className={`${CARD} px-3 py-6 text-center text-sm text-slate-500`}>No plans yet. Add one to start tracking.</div> : null}
    </div>
  );
}
