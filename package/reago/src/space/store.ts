// =============================================================================
// Space store
// =============================================================================

import {Supervisor} from './supervisor';
import type {AnyAtom, AtomDispatcher, AtomFamilyArgsOf, AtomResultOf} from '~/core/atom';
import type {AtomListener, AtomWatcher} from '~/core/atom-watcher';


export class Store {
  readonly #supervisor: Supervisor;

  constructor(supervisor: Supervisor) {
    this.#supervisor = supervisor;
    this.read = this.read.bind(this);
    this.watch = this.watch.bind(this);
    this.dispatch = this.dispatch.bind(this);
    this.invalidate = this.invalidate.bind(this);
  }

  read<T extends AnyAtom>(
    atom: T,
    ...args: AtomFamilyArgsOf<T>
  ): AtomResultOf<T> {
    const instance = this.#supervisor.getOrCreateInstance(atom, ...args);
    return this.#supervisor.readInstance(instance);
  }

  watch<T extends AnyAtom>(
    atom: T,
    ...args: [...AtomFamilyArgsOf<T>, AtomListener<T>]
  ): AtomWatcher<T> {
    const instance = this.#supervisor.getOrCreateInstance(
      atom,
      ...args.slice(0, -1) as AtomFamilyArgsOf<T>
    );
    const watcher = this.#supervisor.watchInstance(instance, args[args.length - 1] as AtomListener<T>);
    this.#supervisor.flush();
    return watcher;
  }

  dispatch<T extends AnyAtom>(
    atom: T,
    ...args: AtomFamilyArgsOf<T>
  ): AtomDispatcher<T> {
    return (...actionArgs) => {
      const instance = this.#supervisor.getOrCreateInstance(atom, ...args);
      this.#supervisor.dispatchInstance(instance, ...actionArgs);
      this.#supervisor.flush();
    };
  }

  invalidate<T extends AnyAtom>(atom: T, ...args: AtomFamilyArgsOf<T>): void {
    const instance = this.#supervisor.getInstance(atom, ...args);
    if (instance) {
      this.#supervisor.invalidateInstance(instance);
      this.#supervisor.flush();
    }
  }
}
