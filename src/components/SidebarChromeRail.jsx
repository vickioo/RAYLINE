import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Plus, Settings } from "lucide-react";
import {
  MINI_ICON_BUTTON_HEIGHT,
  MINI_ICON_BUTTON_WIDTH,
  MINI_ICON_SIZE,
  MINI_ICON_STROKE_WIDTH,
} from "../utils/compactLayout";
import {
  SIDEBAR_CHROME_RAIL_HEIGHT,
  SIDEBAR_CHROME_RAIL_LEFT,
  SIDEBAR_CHROME_RAIL_TOP,
  SIDEBAR_CHROME_RAIL_WIDTH,
} from "../windowChrome";

function RailButton({ label, onClick, active = false, visible = true, children }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      aria-label={label}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      title={label}
      onClick={onClick}
      onMouseDownCapture={(event) => event.stopPropagation()}
      onPointerDownCapture={(event) => event.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: MINI_ICON_BUTTON_WIDTH,
        height: MINI_ICON_BUTTON_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: 7,
        background: active
          ? "var(--control-bg)"
          : hovered
            ? "var(--control-bg)"
            : "transparent",
        color: hovered || active ? "color-mix(in srgb, var(--text-primary) 89%, transparent)" : "color-mix(in srgb, var(--text-primary) 46%, transparent)",
        cursor: "pointer",
        padding: 0,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-2px)",
        transition: "background .16s ease, color .16s ease, opacity .14s ease, transform .14s ease",
        pointerEvents: visible ? "auto" : "none",
        WebkitAppRegion: "no-drag",
        userSelect: "none",
      }}
    >
      <span
        style={{
          display: "flex",
          pointerEvents: "none",
          WebkitAppRegion: "no-drag",
        }}
      >
        {children}
      </span>
    </button>
  );
}

export default function SidebarChromeRail({ sidebarOpen, settingsOpen, controlsOnHover = false, rightAligned = false, rightInset = 12, onToggleSidebar, onNew, onOpenSettings }) {
  const [railHovered, setRailHovered] = useState(false);
  const controlsVisible = !controlsOnHover || railHovered;
  const railWidth = MINI_ICON_BUTTON_WIDTH * 3;

  return (
    <div
      aria-label="Window controls"
      data-rayline-chrome-rail
      onMouseEnter={() => setRailHovered(true)}
      onMouseLeave={() => setRailHovered(false)}
      style={{
        position: "fixed",
        top: rightAligned ? 12 : SIDEBAR_CHROME_RAIL_TOP,
        left: rightAligned ? "auto" : SIDEBAR_CHROME_RAIL_LEFT,
        right: rightAligned ? rightInset : "auto",
        zIndex: 1000,
        width: rightAligned ? railWidth : SIDEBAR_CHROME_RAIL_WIDTH,
        height: SIDEBAR_CHROME_RAIL_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 0,
        pointerEvents: controlsOnHover ? "auto" : "none",
        WebkitAppRegion: "no-drag",
        userSelect: "none",
        isolation: "isolate",
      }}
      onMouseDownCapture={(event) => event.stopPropagation()}
      onPointerDownCapture={(event) => event.stopPropagation()}
    >
      <RailButton
        label={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}
        onClick={onToggleSidebar}
        visible={controlsVisible}
      >
        {sidebarOpen ? (
          <PanelLeftClose size={MINI_ICON_SIZE} strokeWidth={MINI_ICON_STROKE_WIDTH} />
        ) : (
          <PanelLeftOpen size={MINI_ICON_SIZE} strokeWidth={MINI_ICON_STROKE_WIDTH} />
        )}
      </RailButton>

      <RailButton label="New chat" onClick={onNew} visible={controlsVisible}>
        <Plus size={MINI_ICON_SIZE} strokeWidth={MINI_ICON_STROKE_WIDTH} />
      </RailButton>

      <RailButton label={settingsOpen ? "Close settings" : "Settings"} onClick={onOpenSettings} active={settingsOpen} visible={controlsVisible}>
        <Settings size={MINI_ICON_SIZE} strokeWidth={MINI_ICON_STROKE_WIDTH} />
      </RailButton>
    </div>
  );
}
