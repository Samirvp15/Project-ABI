"use client";

import { useSyncExternalStore } from "react";

import { getAccessToken } from "@/lib/auth";

const emptySubscribe = () => () => {};

/** Reads JWT from localStorage on the client; false during SSR/hydration. */
export function useIsAuthenticated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => !!getAccessToken(),
    () => false,
  );
}
