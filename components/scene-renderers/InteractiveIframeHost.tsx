'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useWidgetIframeStore } from '@/lib/store/widget-iframe';
import {
  useInteractiveIframePool,
  type IframePoolEntry,
} from '@/lib/store/interactive-iframe-pool';
import { useSceneRuntimeErrors } from '@/lib/store/scene-runtime-errors';
import { readCapsContext, recordCapsLocalEvent } from '@/lib/curriculum/caps-storage';
import {
  GENUI_LOGICAL_HEIGHT,
  GENUI_LOGICAL_WIDTH,
  fitGenUiViewport,
} from '@/lib/interactive/logical-viewport';
import { intersectClientBoxes } from '@/lib/edit/visible-client-rect';
import { useCanvasStore } from '@/lib/store/canvas';
import { useElementRefsStore } from '@/lib/store/element-refs';
import { useI18n } from '@/lib/hooks/use-i18n';
import {
  ELEMENT_REF_SELECTOR_MAX,
  ELEMENT_SNAPSHOT_MAX,
  INTERACTIVE_OUTERHTML_MAX,
  makeInteractiveElementRef,
} from '@/lib/workbench/element-refs';

type InteractivePickerMessage = {
  __maicInteractive?: boolean;
  kind?: string;
  selector?: unknown;
  outerHTML?: unknown;
  text?: unknown;
};

/** Validate an untrusted iframe picker message and apply it to host-owned state. */
export function handleInteractivePickerMessage(
  sceneId: string,
  data: InteractivePickerMessage | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): boolean {
  if (!data || data.__maicInteractive !== true) return false;
  const target = useCanvasStore.getState().pickTarget;
  const armed = target?.purpose === 'element-ref' && target.sceneId === sceneId;
  if (data.kind === 'element-picker-disarmed') {
    if (armed) useCanvasStore.getState().setPickTarget(null);
    return armed;
  }
  if (data.kind !== 'element-picked' || !armed) return false;
  if (
    typeof data.selector !== 'string' ||
    typeof data.outerHTML !== 'string' ||
    typeof data.text !== 'string'
  ) {
    return false;
  }
  const selector = data.selector.slice(0, ELEMENT_REF_SELECTOR_MAX);
  const outerHTML = data.outerHTML.slice(0, INTERACTIVE_OUTERHTML_MAX);
  const text = data.text.slice(0, ELEMENT_SNAPSHOT_MAX);
  if (!selector.trim() || !outerHTML.trim()) return false;
  const refsStore = useElementRefsStore.getState();
  if (refsStore.ownerSessionId !== target.ownerSessionId) return false;
  refsStore.toggle(
    makeInteractiveElementRef(target.stageId, sceneId, { selector, outerHTML, text }, t),
  );
  return true;
}

/**
 * Stable host for interactive scene iframes (#619).
 *
 * Mounted once at the `Stage` root — outside the mode-swap / scene subtree that
 * unmounts and remounts — so the iframe elements it renders survive Pro mode
 * toggles, scene switches, and any PlaybackChromeRoot remount. The in-tree
 * `InteractiveRenderer` is only a placeholder that registers content and reports
 * the on-screen rect; the actual iframes live here, portaled into a stable host
 * node and positioned over each scene's rect via `position: fixed`.
 *
 * Portal target follows `document.fullscreenElement` so the iframe stays inside
 * the fullscreen subtree during presentation mode (which calls requestFullscreen
 * on the playback stage, not on body); otherwise it lives on `document.body`.
 * A low z-index keeps it under Radix dialogs (e.g. the scene-switch confirm)
 * while still covering the canvas box during interactive playback AND Pro-mode
 * editing — the editor agent fixes interactive HTML, so the teacher must see the
 * live page while editing. Visibility is driven by the placeholder's ownership
 * (gone → hidden, never unmounted), so the document is preserved for a
 * zero-reload return.
 */
export function InteractiveIframeHost() {
  const entries = useInteractiveIframePool((s) => s.entries);
  const activeSceneId = useInteractiveIframePool((s) => s.activeSceneId);
  const reset = useInteractiveIframePool((s) => s.reset);
  const setActiveScene = useWidgetIframeStore((s) => s.setActiveScene);

  const [portalTarget, setPortalTarget] = useState<Element | null>(null);
  useEffect(() => {
    const sync = () => setPortalTarget(document.fullscreenElement ?? document.body);
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  useEffect(() => {
    setActiveScene(activeSceneId);
  }, [activeSceneId, setActiveScene]);

  useEffect(() => reset, [reset]);

  if (!portalTarget) return null;

  return createPortal(
    <>
      {Object.entries(entries).map(([sceneId, entry]) => (
        <PooledIframe
          key={sceneId}
          sceneId={sceneId}
          entry={entry}
          visible={entry.owner !== null && sceneId === activeSceneId}
        />
      ))}
    </>,
    portalTarget,
  );
}

interface PooledIframeProps {
  readonly sceneId: string;
  readonly entry: IframePoolEntry;
  readonly visible: boolean;
}

/**
 * One persisted iframe. Stays mounted as long as its pool entry exists (only
 * evicted by LRU), so its document is preserved across scene/mode changes.
 * `srcDoc` / `src` come straight from the entry and only change when the
 * content changes — that is the single intended reload path.
 *
 * Security: the sandbox intentionally omits `allow-same-origin`.
 */
function PooledIframe({ sceneId, entry, visible }: PooledIframeProps) {
  const { t } = useI18n();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const completionDocumentRef = useRef<string | null>(null);
  const registerIframe = useWidgetIframeStore((s) => s.registerIframe);
  const getSendMessage = useWidgetIframeStore((s) => s.getSendMessage);
  const pickTarget = useCanvasStore.use.pickTarget();
  const refs = useElementRefsStore.use.refs();
  const armed = pickTarget?.purpose === 'element-ref' && pickTarget.sceneId === sceneId;
  const selectors = useMemo(
    () =>
      refs.flatMap((ref) =>
        ref.kind === 'interactive-element' && ref.sceneId === sceneId ? [ref.selector] : [],
      ),
    [refs, sceneId],
  );

  useEffect(() => {
    const send = (type: string, payload: Record<string, unknown>) => {
      iframeRef.current?.contentWindow?.postMessage({ type, ...payload }, '*');
    };
    registerIframe(sceneId, send);
    return () => registerIframe(sceneId, null);
  }, [sceneId, registerIframe]);

  useEffect(() => {
    const send = getSendMessage(sceneId);
    if (!send) return;
    send(armed ? 'element-picker:arm' : 'element-picker:disarm', {});
    return () => {
      if (armed) send('element-picker:disarm', {});
    };
  }, [armed, entry.srcDoc, getSendMessage, sceneId]);

  useEffect(() => {
    if (!armed) return;
    getSendMessage(sceneId)?.('element-picker:sync', { selectors });
  }, [armed, entry.srcDoc, getSendMessage, sceneId, selectors]);

  // Capture runtime errors and explicit interactive activity completion messages
  // from THIS iframe. The completion contract is intentionally opt-in: a widget
  // must post `activity-completed` after a genuine learner action. Loading,
  // mounting, visibility, or merely interacting with the iframe does not count.
  useEffect(() => {
    completionDocumentRef.current = null;
    const documentKey = entry.srcDoc ?? entry.src ?? '';

    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const d = e.data as
        | (InteractivePickerMessage & { errorKind?: string; message?: unknown })
        | undefined;
      if (!d || d.__maicInteractive !== true) return;
      if (d.kind === 'runtime-error') {
        const kind = typeof d.errorKind === 'string' ? d.errorKind : 'error';
        const msg = typeof d.message === 'string' ? d.message : String(d.message ?? '');
        useSceneRuntimeErrors.getState().addError(sceneId, `[${kind}] ${msg}`);
        return;
      }
      if (d.kind === 'activity-completed') {
        // Only the active, owned iframe can produce learner-completion credit.
        // Pooled/hidden scenes remain mounted for fast navigation but must not
        // advance CAPS progress from background script messages.
        if (!visible || entry.owner === null || sceneId !== useInteractiveIframePool.getState().activeSceneId) return;
        if (completionDocumentRef.current === documentKey) return;
        const capsContext = readCapsContext();
        if (!capsContext) return;
        completionDocumentRef.current = documentKey;
        recordCapsLocalEvent('caps_activity_completed', capsContext, Date.now());
        return;
      }
      handleInteractivePickerMessage(sceneId, d, t);
    };
    window.addEventListener('message', onMessage);
    iframeRef.current?.contentWindow?.postMessage({ __maicErrorReplayRequest: true }, '*');
    return () => window.removeEventListener('message', onMessage);
  }, [entry.owner, sceneId, entry.srcDoc, entry.src, t, visible]);

  useEffect(() => {
    useSceneRuntimeErrors.getState().clearScene(sceneId);
  }, [sceneId, entry.srcDoc]);

  const rect = entry.rect;
  const clip = entry.clip ?? rect;
  const viewport = rect ? fitGenUiViewport(rect) : null;
  const visibleViewport = viewport && clip ? intersectClientBoxes(viewport.box, clip) : null;
  const shown =
    visible &&
    rect !== null &&
    clip !== null &&
    viewport !== null &&
    visibleViewport !== null &&
    visibleViewport.width > 0 &&
    visibleViewport.height > 0 &&
    rect.width > 0 &&
    rect.height > 0;
  const wrapStyle: CSSProperties = {
    position: 'fixed',
    left: visibleViewport?.left ?? 0,
    top: visibleViewport?.top ?? 0,
    width: visibleViewport?.width ?? 0,
    height: visibleViewport?.height ?? 0,
    overflow: 'hidden',
    borderRadius: '0.5rem',
    zIndex: 1,
    visibility: shown ? 'visible' : 'hidden',
    pointerEvents: shown ? 'auto' : 'none',
  };
  const iframeStyle: CSSProperties = {
    position: 'absolute',
    left: viewport && visibleViewport ? viewport.box.left - visibleViewport.left : 0,
    top: viewport && visibleViewport ? viewport.box.top - visibleViewport.top : 0,
    width: GENUI_LOGICAL_WIDTH,
    height: GENUI_LOGICAL_HEIGHT,
    border: 0,
    transform: `scale(${viewport?.scale ?? 0})`,
    transformOrigin: 'top left',
  };

  return (
    <div style={wrapStyle}>
      <iframe
        ref={iframeRef}
        srcDoc={entry.srcDoc}
        src={entry.srcDoc ? undefined : entry.src}
        style={iframeStyle}
        title={`Interactive Scene ${sceneId}`}
        sandbox="allow-scripts allow-forms allow-popups"
      />
    </div>
  );
}
