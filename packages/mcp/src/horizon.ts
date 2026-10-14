export const HORIZON_STATUSES = ["QUEUED", "RUNNING", "SUSPENDED", "CALLBACK", "DONE", "FUSED"] as const;
export type HorizonStatus = (typeof HORIZON_STATUSES)[number];
export type HorizonKind = "ENERGY_WATCH" | "PATROL" | "CUSTOM";

export const TRACE_CHAR_LIMIT = 240;
export const MAX_INFLIGHT = 8;
export const MAX_TRACE_STEPS = 64;

export type HorizonJob = {
  jobId: string;
  name: string;
  kind: HorizonKind;
  horizonHours: number;
  status: HorizonStatus;
  callback: "LOCAL";
  mains: "deenergized";
  createdAt: number;
};

export type TraceStep = {
  atMs: number;
  note: string;
  digest: string;
};

export type HorizonFault = { ok: false; code: "QUEUE_FULL" | "JOB" | "FUSE"; upload: false; mains: "deenergized" };

export function mintJobId(name: string, nowMs: number): string {
  let hash = 0;
  const body = `${name}:${nowMs}`;
  for (const char of body) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return `H${nowMs.toString(36)}${hash.toString(36)}`;
}

export function compressTrace(note: string): { note: string; digest: string } {
  const clipped = [...note].slice(0, TRACE_CHAR_LIMIT).join("");
  let hash = 0;
  for (const char of clipped) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return { note: clipped, digest: `sum:${hash.toString(16)}` };
}

export function createHorizonQueue(options?: { now?: () => number; max?: number }) {
  const now = () => options?.now?.() ?? Date.now();
  const max = options?.max ?? MAX_INFLIGHT;
  const jobs = new Map<string, HorizonJob>();
  const traces = new Map<string, TraceStep[]>();

  function inflight(): number {
    return [...jobs.values()].filter((job) => job.status === "QUEUED" || job.status === "RUNNING" || job.status === "SUSPENDED").length;
  }

  const api = {
    jobs,
    enqueue(input: { name: string; kind?: HorizonKind; horizonHours?: number }): { ok: true; job: HorizonJob } | HorizonFault {
      if (inflight() >= max) return { ok: false, code: "QUEUE_FULL", upload: false, mains: "deenergized" };
      const createdAt = now();
      const job: HorizonJob = {
        jobId: mintJobId(input.name, createdAt),
        name: input.name.trim() || "horizon",
        kind: input.kind ?? "CUSTOM",
        horizonHours: input.horizonHours && input.horizonHours > 0 ? input.horizonHours : 1,
        status: "QUEUED",
        callback: "LOCAL",
        mains: "deenergized",
        createdAt,
      };
      jobs.set(job.jobId, job);
      traces.set(job.jobId, []);
      return { ok: true, job };
    },
    start(jobId: string) {
      const job = jobs.get(jobId);
      if (!job) return { ok: false as const, code: "JOB" as const, upload: false as const, mains: "deenergized" as const };
      job.status = "RUNNING";
      return { ok: true as const, job };
    },
    suspend(jobId: string, note: string) {
      const job = jobs.get(jobId);
      if (!job) return { ok: false as const, code: "JOB" as const, upload: false as const, mains: "deenergized" as const };
      job.status = "SUSPENDED";
      return api.trace(jobId, note);
    },
    resume(jobId: string) {
      const job = jobs.get(jobId);
      if (!job || job.status !== "SUSPENDED") return { ok: false as const, code: "JOB" as const, upload: false as const, mains: "deenergized" as const };
      job.status = "RUNNING";
      return { ok: true as const, job };
    },
    callback(jobId: string, note: string) {
      const job = jobs.get(jobId);
      if (!job) return { ok: false as const, code: "JOB" as const, upload: false as const, mains: "deenergized" as const };
      job.status = "CALLBACK";
      const traced = api.trace(jobId, note);
      if (traced.ok) job.status = "DONE";
      return traced;
    },
    trace(jobId: string, note: string) {
      const job = jobs.get(jobId);
      const steps = traces.get(jobId);
      if (!job || !steps) return { ok: false as const, code: "JOB" as const, upload: false as const, mains: "deenergized" as const };
      if (steps.length >= MAX_TRACE_STEPS) {
        job.status = "FUSED";
        return { ok: false as const, code: "FUSE" as const, upload: false as const, mains: "deenergized" as const };
      }
      const packed = compressTrace(note);
      const last = steps[steps.length - 1];
      if (last && last.digest === packed.digest) {
        return { ok: true as const, inherited: true as const, steps: steps.length, job };
      }
      steps.push({ atMs: now(), note: packed.note, digest: packed.digest });
      return { ok: true as const, inherited: false as const, steps: steps.length, job };
    },
    snapshot(jobId?: string) {
      if (!jobId) {
        return {
          ok: true as const,
          jobs: [...jobs.values()],
          callback: "LOCAL" as const,
          mains: "deenergized" as const,
          upload: false as const,
        };
      }
      const job = jobs.get(jobId);
      if (!job) return { ok: false as const, code: "JOB" as const, upload: false as const, mains: "deenergized" as const };
      return { ok: true as const, job, trace: [...(traces.get(jobId) ?? [])], mains: "deenergized" as const, upload: false as const };
    },
  };
  return api;
}

let queue: ReturnType<typeof createHorizonQueue> | null = null;

export function horizonQueue() {
  queue ??= createHorizonQueue();
  return queue;
}
