// =============================================================================
// Atom hook
// =============================================================================

export interface AtomHook {
  (...args: any[]): any;
  onSkip?: {bivarianceHack(frame: AtomHookFrame): void}['bivarianceHack'];
}

export interface AtomHookFrame {
  readonly hook: AtomHook;
}
