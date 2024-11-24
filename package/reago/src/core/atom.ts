// =============================================================================
// Atom
// =============================================================================

// Core atom types

export type Atom<
  Result,
  FamilyArgs extends AtomFamilyArgs = [],
  ActionArgs extends AtomActionArgs = never
> = (
  FunctionalAtom<Result, FamilyArgs, ActionArgs> |
  (
    Result extends Promise<infer InnerResult> ? GenerativeAtom<InnerResult, FamilyArgs, ActionArgs> : never
  )
);

export type AnyAtom<
  Result = unknown,
  FamilyArgs extends AtomFamilyArgs = AtomFamilyArgs,
  ActionArgs extends AtomActionArgs = AtomActionArgs
> = (
  AnyFunctionalAtom<Result, FamilyArgs, ActionArgs> |
  (
    Result extends Promise<infer InnerResult> ? AnyGenerativeAtom<InnerResult, FamilyArgs, ActionArgs> : never
  )
);


// Atom subtypes

export type FunctionalAtom<
  ImplResult,
  FamilyArgs extends AtomFamilyArgs = [],
  ActionArgs extends AtomActionArgs = never
> = (...args: FamilyArgs) => ImplResult extends AtomGenerator<any> ? never : ImplResult;

export type GenerativeAtom<
  ImplResult,
  FamilyArgs extends AtomFamilyArgs = [],
  ActionArgs extends AtomActionArgs = never
> = (...args: FamilyArgs) => AtomGenerator<ImplResult>;

export type AnyFunctionalAtom<
  ImplResult = unknown,
  FamilyArgs extends AtomFamilyArgs = AtomFamilyArgs,
  ActionArgs extends AtomActionArgs = AtomActionArgs
> = {
  // this is not perfect - works only if Result type is inferred
  bivarianceHack(...args: FamilyArgs): ImplResult extends AtomGenerator<any> ? never : ImplResult;
}['bivarianceHack'];

export type AnyGenerativeAtom<
  ImplResult = unknown,
  FamilyArgs extends AtomFamilyArgs = AtomFamilyArgs,
  ActionArgs extends AtomActionArgs = AtomActionArgs
> = {
  bivarianceHack(...args: FamilyArgs): AtomGenerator<ImplResult>;
}['bivarianceHack'];


// Atom helper types

export type AtomFamilyArg = string | number | boolean | null | undefined;
export type AtomFamilyArgs = AtomFamilyArg[];
export type AtomActionArg = any;
export type AtomActionArgs = AtomActionArg[];

export type AtomGenerator<Result> = Generator<
  PromiseLike<unknown>, // accepted type in yield
  Result, // return type
  unknown // type of data passed back via next()
>;


// Atom type utils

export type AtomResultOf<T> = (
  T extends GenerativeAtom<infer IR, infer FA, infer AA> ? Promise<IR> :
  T extends FunctionalAtom<infer IR, infer FA, infer AA> ? IR :
  never
);

export type AtomImplResultOf<T> = (
  T extends GenerativeAtom<infer IR, infer FA, infer AA> ? IR :
  T extends FunctionalAtom<infer IR, infer FA, infer AA> ? IR :
  never
);

export type AtomFamilyArgsOf<T> = (
  T extends GenerativeAtom<infer IR, infer FA, infer AA> ? FA :
  T extends FunctionalAtom<infer IR, infer FA, infer AA> ? FA :
  never
);

export type AtomActionArgsOf<T> = (
  T extends GenerativeAtom<infer IR, infer FA, infer AA> ? AA :
  T extends FunctionalAtom<infer IR, infer FA, infer AA> ? AA :
  never
);


// Other structures

export type AtomDispatcher<T extends AnyAtom> = (...args: AtomActionArgsOf<T>) => void;
