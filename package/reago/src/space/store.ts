// =============================================================================
// Atom store
// =============================================================================

import {
  AnyAtom, AnyFunctionalAtom, AnyGenerativeAtom, AtomDispatcher, AtomFamilyArgsOf,
  AtomListener, AtomResultOf, AtomWatcher
} from '~/atom';
import {AtomSupervisor} from './supervisor';


export class AtomStore {
  readonly #supervisor: AtomSupervisor;

  constructor(supervisor: AtomSupervisor) {
    this.#supervisor = supervisor;
  }

  read<T extends AnyGenerativeAtom>(atom: T, ...args: AtomFamilyArgsOf<T>): Promise<AtomResultOf<T>>;
  read<T extends AnyFunctionalAtom>(atom: T, ...args: AtomFamilyArgsOf<T>): AtomResultOf<T>;
  read<T extends AnyAtom>(
    atom: T,
    ...args: AtomFamilyArgsOf<T>
  ): AtomResultOf<T> | Promise<AtomResultOf<T>> {
    const instance = this.#supervisor.getInstance(atom, ...args);
    return this.#supervisor.readInstance(instance);
  }

  watch<T extends AnyAtom>(
    atom: T,
    ...args: [...AtomFamilyArgsOf<T>, AtomListener<T>]
  ): AtomWatcher<T> {
    const instance = this.#supervisor.getInstance(
      atom,
      ...args.slice(0, -1) as AtomFamilyArgsOf<T>
    );
    return this.#supervisor.watchInstance(instance, args[args.length - 1] as AtomListener<T>);
  }

  dispatch<T extends AnyAtom>(
    atom: T,
    ...args: AtomFamilyArgsOf<T>
  ): AtomDispatcher<T> {
    return (...actionArgs) => {
      const instance = this.#supervisor.getInstance(atom, ...args);
      this.#supervisor.dispatchInstance(instance, ...actionArgs);
      this.#supervisor.flush();
    };
  }

  invalidate<T extends AnyAtom>(atom: T, ...args: AtomFamilyArgsOf<T>): void {
    const instance = this.#supervisor.getInstance(atom, ...args);
    this.#supervisor.invalidateInstance(instance);
    this.#supervisor.flush();
  }
}
