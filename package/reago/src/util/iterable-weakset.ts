// =============================================================================
// Iterable WeakSet
// =============================================================================

import {stableWeakRef} from './stable-weakref';


export class IterableWeakSet<T extends WeakKey> {
  #set = new Set<WeakRef<T>>();

  add(value: T): this {
    this.#set.add(stableWeakRef(value));
    return this;
  }

  delete(value: T): boolean {
    return this.#set.delete(stableWeakRef(value));
  }

  some(callback: (value: T) => boolean): boolean {
    for (const ref of this.#set.values()) {
      const value = ref.deref();
      if (value) {
        if (callback(value)) {
          return true;
        }
      } else {
        this.#set.delete(ref);
      }
    }
    return false;
  }

  *[Symbol.iterator]() {
    for (const ref of this.#set.values()) {
      const value = ref.deref();
      if (value) {
        yield value;
      } else {
        this.#set.delete(ref);
      }
    }
  }
}
