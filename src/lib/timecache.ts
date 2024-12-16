export class TimeCache<K, V> {
  private cache: Map<K, V> = new Map();
  private timestamps: Map<K, number> = new Map();
  private maxElements: number;
  private maxAge: number;

  constructor(maxElements: number, maxAge: number) {
    this.maxElements = maxElements;
    this.maxAge = maxAge;
  }

  public get(key: K): V | undefined {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    } else {
      return undefined;
    }
  }

  public set(key: K, value: V): void {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
    this.cleanup();
  }

  private cleanup(): void {
    if (this.cache.size > this.maxElements) {
      const keys = Array.from(this.timestamps.keys());
      const sortedKeys = keys.sort((a, b) => this.timestamps.get(a)! - this.timestamps.get(b)!);
      const toDelete = sortedKeys.slice(0, this.cache.size - this.maxElements);
      for (const key of toDelete) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }

    const now = Date.now();
    for (const [key, timestamp] of this.timestamps) {
      if (now - timestamp > this.maxAge) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }
  }
}
