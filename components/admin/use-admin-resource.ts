'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/toast';
import type { ContentMap, ContentName } from '@/lib/validators';
import { adminFetch } from './admin-client';
import { useDirtyGuard } from './dirty-guard';

interface LoadResponse {
  data: unknown;
  sha: string | null;
  updatedAt: string | null;
  warning?: string;
}

interface Conflict {
  data: unknown;
  sha: string | null;
}

/**
 * Loads one content document for editing and keeps a local draft.
 * - `draft` is what the form edits; `dirty` compares it with the last saved copy.
 * - `save()` PUTs the draft with the last known sha; field errors from the server come back in `errors` (dotted paths).
 * - On a conflict (changed elsewhere) `conflict` is set; `reloadLatest()` adopts the newer version.
 */
export function useAdminResource<K extends ContentName>(name: K) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saved, setSaved] = useState<ContentMap[K] | null>(null);
  const [draft, setDraft] = useState<ContentMap[K] | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [warning, setWarning] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState<Conflict | null>(null);

  const apply = useCallback((r: LoadResponse) => {
    setSaved(r.data as ContentMap[K]);
    setDraft(structuredClone(r.data) as ContentMap[K]);
    setSha(r.sha);
    setUpdatedAt(r.updatedAt);
    setWarning(r.warning ?? '');
    setErrors({});
    setConflict(null);
  }, []);

  const onLoaded = useCallback(
    (res: Awaited<ReturnType<typeof adminFetch<LoadResponse>>>) => {
      if (res.ok) {
        apply(res.data as LoadResponse);
        setLoadError('');
      } else {
        setLoadError(res.data.message || 'Could not load this page.');
      }
      setLoading(false);
    },
    [apply],
  );

  useEffect(() => {
    let cancelled = false;
    adminFetch<LoadResponse>(`/api/admin/content/${name}`).then((res) => {
      if (!cancelled) onLoaded(res);
    });
    return () => {
      cancelled = true;
    };
  }, [name, onLoaded]);

  const reload = useCallback(() => {
    setLoading(true);
    adminFetch<LoadResponse>(`/api/admin/content/${name}`).then(onLoaded);
  }, [name, onLoaded]);

  const dirty = useMemo(
    () => draft !== null && JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved],
  );
  useDirtyGuard(dirty);

  const save = useCallback(
    async (override?: ContentMap[K]): Promise<boolean> => {
      const payload = override ?? draft;
      if (!payload) return false;
      setSaving(true);
      setErrors({});
      const res = await adminFetch<{
        sha: string;
        updatedAt: string;
        data: unknown;
        current?: Conflict;
      }>(`/api/admin/content/${name}`, {
        method: 'PUT',
        body: { data: payload, sha },
      });
      setSaving(false);
      if (res.ok) {
        const d = res.data as { sha: string; updatedAt: string; data: unknown };
        setSaved(d.data as ContentMap[K]);
        setDraft(structuredClone(d.data) as ContentMap[K]);
        setSha(d.sha);
        setUpdatedAt(d.updatedAt);
        setWarning('');
        toast.success('Saved. The website will update within a few seconds.');
        return true;
      }
      if (res.status === 422 && res.data.errors) {
        setErrors(res.data.errors);
        toast.error('Please fix the highlighted fields.');
      } else if (res.status === 409 && res.data.conflict) {
        setConflict((res.data as { current?: Conflict }).current ?? { data: null, sha: null });
      } else {
        toast.error(res.data.message || 'Could not save. Please try again.');
      }
      return false;
    },
    [draft, name, sha, toast],
  );

  /** After a conflict: keep my draft but base the next save on the newer version (so it overwrites on purpose). */
  const keepEditing = useCallback(() => {
    if (conflict) setSha(conflict.sha);
    setConflict(null);
  }, [conflict]);

  const discard = useCallback(() => {
    setDraft(saved ? (structuredClone(saved) as ContentMap[K]) : null);
    setErrors({});
  }, [saved]);

  /** Adopt the newer version found on GitHub after a conflict (drops the local draft). */
  const reloadLatest = useCallback(() => {
    if (conflict?.data) apply({ data: conflict.data, sha: conflict.sha, updatedAt: null });
    else reload();
  }, [conflict, apply, reload]);

  /** Error message for a dotted field path (e.g. "hero.title"). */
  const errorFor = useCallback((path: string) => errors[path], [errors]);

  return {
    loading,
    loadError,
    draft,
    setDraft,
    saved,
    sha,
    updatedAt,
    warning,
    saving,
    errors,
    errorFor,
    dirty,
    save,
    discard,
    reload,
    conflict,
    reloadLatest,
    keepEditing,
    setErrors,
  };
}
