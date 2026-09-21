import { useI18n } from '../../../i18n';
import type { RefObject } from 'react';
import { useExplorerWidth } from '../hooks/useExplorerWidth';

export function ExplorerResizer({ explorer }: { explorer: RefObject<HTMLElement | null> }) {
  const { t } = useI18n();
  const resize = useExplorerWidth(explorer);
  return (
    <div
      className="explorer-resizer"
      role="separator"
      aria-label={t('Largeur de l’explorateur', 'Explorer width')}
      aria-orientation="vertical"
      aria-valuemin={160}
      aria-valuemax={Math.round(resize.state.maximum)}
      aria-valuenow={resize.state.width}
      aria-valuetext={`${resize.state.width} pixels`}
      tabIndex={resize.state.enabled ? 0 : -1}
      hidden={!resize.state.enabled}
      title={t(
        'Glissez pour redimensionner · flèches gauche/droite · Entrée ou double-clic pour réinitialiser',
        'Drag to resize · left/right arrows · Enter or double-click to reset',
      )}
      onPointerDown={resize.onPointerDown}
      onPointerMove={resize.onPointerMove}
      onPointerUp={resize.onPointerUp}
      onPointerCancel={resize.onPointerCancel}
      onLostPointerCapture={resize.onPointerUp}
      onKeyDown={resize.onKeyDown}
      onDoubleClick={resize.reset}
    />
  );
}
