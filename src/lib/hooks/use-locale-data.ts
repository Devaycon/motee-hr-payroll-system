"use client";

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { loadLocale } from "@/src/lib/stores/locale-slice";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface UseLocaleSectionResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Mocks an async fetch against the active locale bundle. Returns a fresh
 * loading state every time `country` changes so screens flash a skeleton.
 */
export function useLocaleSection<T>(
  selector: (bundle: LocaleBundle) => T,
): UseLocaleSectionResult<T> {
  const dispatch = useAppDispatch();
  const country = useAppSelector((s) => s.locale.country);
  const bundle = useAppSelector((s) => s.locale.data);
  const status = useAppSelector((s) => s.locale.status);
  const error = useAppSelector((s) => s.locale.error);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  useEffect(() => {
    if (!bundle && status === "idle") {
      dispatch(loadLocale(country));
    }
  }, [bundle, status, country, dispatch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    if (!bundle) return;
    const delay = 300 + Math.floor(Math.random() * 300);
    const timer = setTimeout(() => {
      if (cancelled) return;
      try {
        setData(selectorRef.current(bundle));
      } finally {
        setLoading(false);
      }
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [bundle, country]);

  return { data, loading, error };
}
