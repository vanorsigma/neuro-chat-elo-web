/// Class such that each enqueue operation creates a DeconflictPermit object.
/// An await call to dequeue should block until the head of the queue is the permit

export interface DeconflictPermit {
  permit_id: string;
}

export class DeconflictQueue {
  private queue: Array<DeconflictPermit>;

  constructor() {
    this.queue = [];
  }

  enqueue(): DeconflictPermit {
    const permit = { permit_id: Math.random().toString(36).substring(7) };
    this.queue.push(permit);
    return permit;
  }

  async dequeue(permit: DeconflictPermit): Promise<void> {
    while (this.queue[0] !== permit) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.queue.shift();
  }

  try_dequeue(permit: DeconflictPermit): boolean {
    if (this.queue[0] === permit) {
      this.queue.shift();
      return true;
    }
    return false;
  }
}
