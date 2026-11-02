import type { FullEvent } from "@/content/schema";

const loaded = new Map<string, Promise<FullEvent>>();

/** An event's long text, sources and picture credit, fetched the first time its page is opened. */
export function loadEvent(id: string) {
  let job = loaded.get(id);
  if (!job) {
    job = fetch(`/data/event/${id}.json`).then((r) => (r.ok ? (r.json() as Promise<FullEvent>) : Promise.reject(new Error(id))));
    job.catch(() => loaded.delete(id));
    loaded.set(id, job);
  }
  return job;
}
