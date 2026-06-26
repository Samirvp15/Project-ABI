"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** True on the client after hydration; false during SSR/hydration. */
export function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
