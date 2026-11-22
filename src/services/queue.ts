type Task<T> = () => Promise<T>;

let tail: Promise<unknown> = Promise.resolve();

export interface QueueOptions<T> {
  onError?: (error: unknown) => T | Promise<T>;
}

/** Serializes tab-touching workflows within one service-worker lifetime. */
export function enqueue<T>(task: Task<T>, options: QueueOptions<T> = {}): Promise<T> {
  const run = tail.then(task, task);
  tail = run.catch(() => undefined);
  if (!options.onError) return run;
  return run.catch(async (error: unknown) => options.onError?.(error) as T);
}
