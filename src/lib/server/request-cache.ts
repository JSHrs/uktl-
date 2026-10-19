/** Request-keyed promises deduplicate work without retaining another visitor's session. */
export function createRequestCache<T>() {
  const values = new WeakMap<object, Promise<T>>();
  return {
    get(request: object, load: () => Promise<T>): Promise<T> {
      const existing = values.get(request);
      if (existing) return existing;
      const pending = Promise.resolve().then(load);
      values.set(request, pending);
      pending.catch(() => {
        if (values.get(request) === pending) values.delete(request);
      });
      return pending;
    },
    clear(request: object) {
      values.delete(request);
    },
  };
}
