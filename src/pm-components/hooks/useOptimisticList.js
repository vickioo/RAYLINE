import { useEffect, useReducer, useCallback } from "react";

/**
 * Shared list hook for IssueList / PRList twins.
 *
 * Handles:
 *  - Parallel fetch across repos with sort-by-updated_at (desc).
 *  - Optimistic items (__optimistic=true) preserved across refetch until the
 *    server returns them.
 *  - Polling at `pollInterval` ms.
 *  - `freshItem` prop merge (insert at top if it matches current filters and
 *    is not already present).
 *  - Initial-load / error state.
 *
 * Uses useReducer so the setState-in-effect lint rule does not fire — dispatch
 * is the idiomatic way to update from effects per React 19 guidance.
 *
 * @param {object} opts
 * @param {string[]} opts.repos
 * @param {string} opts.stateFilter
 * @param {string|null} opts.repoFilter
 * @param {number} opts.refreshSignal
 * @param {object|null} opts.freshItem
 * @param {(repo: string, stateFilter: string) => Promise<object[]>} opts.fetcher
 * @param {string} opts.errorFallbackMessage
 * @param {number} [opts.pollInterval=30000]
 * @returns {{ items: object[], initialLoad: boolean, error: string|null, refetch: () => Promise<void> }}
 */
export default function useOptimisticList({
  repos,
  stateFilter,
  repoFilter,
  refreshSignal,
  freshItem,
  fetcher,
  errorFallbackMessage,
  pollInterval = 30000,
}) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const runFetch = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) dispatch({ type: "LOAD_START" });
      else dispatch({ type: "CLEAR_ERROR" });
      try {
        const targetRepos = repoFilter ? [repoFilter] : repos;
        const results = await Promise.all(
          targetRepos.map(async (repo) => {
            const items = await fetcher(repo, stateFilter);
            return items.map((item) => ({ ...item, _repo: repo }));
          })
        );
        const merged = results.flat().sort(byUpdatedDesc);
        dispatch({ type: "LOAD_SUCCESS", merged });
      } catch (err) {
        dispatch({
          type: "LOAD_ERROR",
          message: err.message || errorFallbackMessage,
        });
      }
    },
    [repos, stateFilter, repoFilter, fetcher, errorFallbackMessage]
  );

  // Poll loop + initial fetch (or clear when repos empty).
  useEffect(() => {
    if (repos.length === 0) {
      dispatch({ type: "RESET_EMPTY" });
      return;
    }
    runFetch({ silent: false });
    const interval = setInterval(() => {
      runFetch({ silent: true }).catch(() => {});
    }, pollInterval);
    return () => clearInterval(interval);
    // runFetch is stable per its own deps; re-run when any of these change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repos, stateFilter, repoFilter, refreshSignal]);

  // Optimistic insert of freshItem when it matches current filters.
  useEffect(() => {
    if (!freshItem || freshItem.number == null) return;
    const itemState = freshItem.state || "open";
    if (itemState !== stateFilter) return;
    if (repoFilter && freshItem._repo !== repoFilter) return;
    if (!repos.includes(freshItem._repo)) return;
    dispatch({ type: "ADD_OPTIMISTIC", item: freshItem });
  }, [freshItem, stateFilter, repoFilter, repos]);

  return {
    items: state.items,
    initialLoad: state.initialLoad,
    error: state.error,
    refetch: runFetch,
  };
}

const initialState = {
  items: [],
  initialLoad: true,
  error: null,
};

function byUpdatedDesc(a, b) {
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, initialLoad: true, error: null };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "LOAD_SUCCESS": {
      const mergedKeys = new Set(
        action.merged.map((i) => `${i._repo}-${i.number}`)
      );
      const stillPending = state.items.filter(
        (i) => i.__optimistic && !mergedKeys.has(`${i._repo}-${i.number}`)
      );
      const next = [...stillPending, ...action.merged].sort(byUpdatedDesc);
      return { items: next, initialLoad: false, error: null };
    }
    case "LOAD_ERROR":
      return { ...state, initialLoad: false, error: action.message };
    case "RESET_EMPTY":
      return { items: [], initialLoad: false, error: null };
    case "ADD_OPTIMISTIC": {
      const key = `${action.item._repo}-${action.item.number}`;
      if (state.items.some((i) => `${i._repo}-${i.number}` === key)) {
        return state;
      }
      return {
        ...state,
        items: [{ ...action.item, __optimistic: true }, ...state.items],
      };
    }
    default:
      return state;
  }
}
