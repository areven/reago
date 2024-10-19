// =============================================================================
// Atom errors
// =============================================================================

export class AtomError extends Error {}

export class InternalAtomError extends AtomError {}

export class IllegalOperationAtomError extends AtomError {}

export class ComputationAbortedAtomError extends AtomError {}

export class ComputationContextRequiredAtomError extends AtomError {
  constructor() {
    super('atom: method can only be used inside an atom computation');
  }
}

export class HookMismatchAtomError extends AtomError {
  constructor() {
    super('atom: hook call does not match the hook call from older computation');
  }
}

export class HookCountMismatchAtomError extends AtomError {
  constructor() {
    super('atom: some hooks from a previous computation were omitted this time');
  }
}

export class InvalidCleanupFunctionAtomError extends AtomError {
  constructor() {
    super('atom: effect returned an invalid cleanup function');
  }
}

export class GeneratorPromiseExpectedAtomError extends AtomError {
  constructor(value: any) {
    super(
      `atom: generator yielded a value that is not a Promise\n` +
      `  value: ${value}`
    );
  }
}

export function assert(condition: unknown): asserts condition {
  /* v8 ignore next 3 */
  if (!condition) {
    throw new InternalAtomError();
  }
}
