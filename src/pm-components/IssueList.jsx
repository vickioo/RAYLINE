import React, { useState, useMemo, useEffect } from "react";
import { Circle, CheckCircle2, Copy, Check, GitPullRequest } from "lucide-react";
import { applyPaneInteractionStyle, getPaneInteractionStyle } from "../utils/paneSurface";
import HoverIconButton from "../components/HoverIconButton";
import { createTranslator } from "../i18n";
import useOptimisticList from "./hooks/useOptimisticList";

function timeAgo(dateStr, t) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t("pm.timeMinutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("pm.timeHoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 30) return t("pm.timeDaysAgo", { count: days });
  const months = Math.floor(days / 30);
  return t("pm.timeMonthsAgo", { count: months });
}

export default function IssueList({ repos, stateFilter, repoFilter, onSelectItem, refreshSignal, freshItem, locale }) {
  const t = useMemo(() => createTranslator(locale), [locale]);
  const [copiedId, setCopiedId] = useState(null);
  const [linkedPRs, setLinkedPRs] = useState({});

  const { items: issues, initialLoad, error, refetch } = useOptimisticList({
    repos,
    stateFilter,
    repoFilter,
    refreshSignal,
    freshItem,
    fetcher: (repo, state) => window.ghApi.listIssues(repo, state),
    errorFallbackMessage: t("pm.failedToLoadIssues"),
  });

  useEffect(() => {
    if (issues.length === 0) return;
    let cancelled = false;
    async function fetchLinkedPRs() {
      const results = await Promise.allSettled(
        issues.map(async (item) => {
          const key = `${item._repo}/${item.number}`;
          const prs = await window.ghApi.getLinkedPRs(item._repo, item.number);
          return { key, prs };
        })
      );
      if (cancelled) return;
      const map = {};
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.prs.length > 0) {
          map[r.value.key] = r.value.prs;
        }
      }
      setLinkedPRs(map);
    }
    fetchLinkedPRs();
    return () => { cancelled = true; };
  }, [issues]);

  if (initialLoad && issues.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 40, color: "rgba(255,255,255,0.4)", fontFamily: "system-ui", fontSize: 13 }}>
        {t("pm.loadingIssues")}
      </div>
    );
  }

  if (error && issues.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 40, gap: 12 }}>
        <span style={{ color: "rgba(255,100,100,0.7)", fontFamily: "system-ui", fontSize: 13 }}>{error}</span>
        <button
          onClick={() => refetch()}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(255,255,255,0.5)", padding: "6px 16px", cursor: "pointer", fontFamily: "system-ui", fontSize: 12 }}
        >
          {t("pm.retry")}
        </button>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 40, color: "rgba(255,255,255,0.3)", fontFamily: "system-ui", fontSize: 13 }}>
        {t("pm.noIssuesFound")}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {issues.map((item) => {
        const isOpen = item.state === "open";
        const repoShort = item._repo.split("/").pop();
        return (
          <div
            key={`${item._repo}-${item.number}`}
            onClick={() => onSelectItem({ repo: item._repo, number: item.number, type: "issue" })}
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "10px 16px",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
              transition: "background .15s, box-shadow .15s, backdrop-filter .15s",
              ...getPaneInteractionStyle("idle"),
            }}
            onMouseEnter={(e) => { applyPaneInteractionStyle(e.currentTarget, "hover"); const b = e.currentTarget.querySelector(".copy-btn"); if (b) b.style.opacity = "1"; }}
            onMouseLeave={(e) => { applyPaneInteractionStyle(e.currentTarget, "idle"); const b = e.currentTarget.querySelector(".copy-btn"); if (b) b.style.opacity = "0"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isOpen ? (
                <Circle size={12} color="rgba(63,185,80,0.7)" />
              ) : (
                <CheckCircle2 size={12} color="rgba(130,80,223,0.7)" />
              )}
              <span style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                #{item.number}
              </span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontFamily: "system-ui", fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.title}
              </span>
              <HoverIconButton
                className="copy-btn"
                tooltip={copiedId === `${item._repo}-${item.number}` ? t("pm.copied") : t("pm.copyIssueSummary")}
                onClick={(e) => {
                  e.stopPropagation();
                  const url = `https://github.com/${item._repo}/issues/${item.number}`;
                  navigator.clipboard.writeText(`#${item.number} ${item.title} ${url}`);
                  const id = `${item._repo}-${item.number}`;
                  setCopiedId(id);
                  setTimeout(() => setCopiedId((v) => v === id ? null : v), 1500);
                }}
                baseColor={copiedId === `${item._repo}-${item.number}` ? "rgba(120,230,150,0.8)" : "rgba(255,255,255,0.35)"}
                hoverColor={copiedId === `${item._repo}-${item.number}` ? "rgba(150,245,170,1)" : "rgba(255,255,255,0.9)"}
                style={{ opacity: copiedId === `${item._repo}-${item.number}` ? 1 : 0 }}
              >
                {copiedId === `${item._repo}-${item.number}` ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={1.5} />}
              </HoverIconButton>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <span style={{ width: 25, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.35)" }} title={linkedPRs[`${item._repo}/${item.number}`] ? t(linkedPRs[`${item._repo}/${item.number}`].length > 1 ? "pm.linkedPrsTooltip" : "pm.linkedPrTooltip", { count: linkedPRs[`${item._repo}/${item.number}`].length }) : undefined}>
                  {linkedPRs[`${item._repo}/${item.number}`] && (
                    <GitPullRequest size={12} strokeWidth={1.5} />
                  )}
                </span>
                <span style={{ color: "rgba(255,255,255,0.25)", fontFamily: "system-ui", fontSize: 11 }}>
                  {repoShort}
                </span>
              </div>
            </div>
            <div style={{ marginLeft: 26, color: "rgba(255,255,255,0.3)", fontFamily: "system-ui", fontSize: 12, marginTop: 2 }}>
              {t("pm.byUpdated", { user: item.user?.login || t("pm.unknownUser"), time: timeAgo(item.updated_at, t) })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
