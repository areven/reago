// =============================================================================
// Atom
// =============================================================================

// Core atom types

export type Atom<
  Result,
  FamilyArgs extends AtomFamilyArgs = [],
  ActionArgs extends AtomActionArgs = []
> = (
  FunctionalAtom<Result, FamilyArgs, ActionArgs> |
  GenerativeAtom<Result, FamilyArgs, ActionArgs>
);

export type AnyAtom<
  Result = unknown,
  FamilyArgs extends AtomFamilyArgs = AtomFamilyArgs,
  ActionArgs extends AtomActionArgs = AtomActionArgs
> = (
  AnyFunctionalAtom<Result, FamilyArgs, ActionArgs> |
  AnyGenerativeAtom<Result, FamilyArgs, ActionArgs>
);


// Atom subtypes

export type FunctionalAtom<
  Result,
  FamilyArgs extends AtomFamilyArgs = [],
  ActionArgs extends AtomActionArgs = []
> = (...args: FamilyArgs) => Result extends AtomGenerator<any> ? never : Result;

export type GenerativeAtom<
  Result,
  FamilyArgs extends AtomFamilyArgs = [],
  ActionArgs extends AtomActionArgs = []
> = (...args: FamilyArgs) => AtomGenerator<Result>;

export type AnyFunctionalAtom<
  Result = unknown,
  FamilyArgs extends AtomFamilyArgs = AtomFamilyArgs,
  ActionArgs extends AtomActionArgs = AtomActionArgs
> = {
  // this is not perfect - works only if Result type is inferred
  bivarianceHack(...args: FamilyArgs): Result extends AtomGenerator<any> ? never : Result;
}['bivarianceHack'];

export type AnyGenerativeAtom<
  Result = unknown,
  FamilyArgs extends AtomFamilyArgs = AtomFamilyArgs,
  ActionArgs extends AtomActionArgs = AtomActionArgs
> = {
  bivarianceHack(...args: FamilyArgs): AtomGenerator<Result>;
}['bivarianceHack'];


// Atom helper types

export type AtomFamilyArg = string | number | boolean | null | undefined;
export type AtomFamilyArgs = AtomFamilyArg[];
export type AtomActionArg = any;
export type AtomActionArgs = AtomActionArg[];

export type AtomGenerator<Result> = Generator<
  Promise<unknown>, // accepted type in yield
  Result, // return type
  unknown // type of data passed back via next()
>;


// Atom type utils

export type AtomResultOf<T> = (
  T extends Atom<
    infer Result,
    infer FamilyArgs extends AtomFamilyArgs,
    infer ActionArgs extends AtomActionArgs
  > ? Result : never
);

export type AtomFamilyArgsOf<T> = (
  T extends Atom<
    infer Result,
    infer FamilyArgs extends AtomFamilyArgs,
    infer ActionArgs extends AtomActionArgs
  > ? FamilyArgs : never
);

export type AtomActionArgsOf<T> = (
  T extends Atom<
    infer Result,
    infer FamilyArgs extends AtomFamilyArgs,
    infer ActionArgs extends AtomActionArgs
  > ? ActionArgs : never
);


// Other structures

export type AtomDispatcher<T extends AnyAtom> = (...args: AtomActionArgsOf<T>) => void;

export type AtomWatcher<T extends AnyAtom = AnyAtom> = {
  readonly listener: AtomListener<T>,
  readonly clear: () => void,
  [Symbol.dispose]: () => void
};

export type AtomListener<T extends AnyAtom = AnyAtom> = () => any;
