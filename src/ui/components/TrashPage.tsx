import { RotateCcw, Trash2 } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { deleteForever, emptyTrash, getTrash, type TrashGroup, undo } from '../../core/db/repo';
import { formatDate, stackTitle, tabCount } from '../format';
import { t } from '../i18n';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { Button, ConfirmDialog, IconButton } from './controls';

export function TrashPage(): ReactNode {
  const [groups, setGroups] = useState<TrashGroup[]>([]);
  const rev = useLibrary((state) => state.rev);
  const retention = useSettings((state) => state.settings?.trashRetentionDays ?? 30);
  const [busy, setBusy] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reload after every ChangeSet
  useEffect(() => {
    void getTrash().then(setGroups);
  }, [rev]);

  const run = async (action: () => Promise<unknown>): Promise<void> => {
    setBusy(true);
    try {
      await action();
      await useLibrary.getState().reload();
      setGroups(await getTrash());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t('trash')}</h1>
          <p className="muted">
            {retention === 0
              ? t('trashRetentionNever')
              : t('trashRetentionBody', { days: retention })}
          </p>
        </div>
        {groups.length > 0 ? (
          <Button variant="danger" disabled={busy} onClick={() => setConfirmEmpty(true)}>
            <Trash2 size={15} /> {t('emptyTrash')}
          </Button>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <h2>{t('trashEmpty')}</h2>
          <p>{t('trashEmptyBody', { days: retention || '∞' })}</p>
        </div>
      ) : (
        <ul className="trash-list">
          {groups.map((group) => {
            const title = group.stacks[0] ? stackTitle(group.stacks[0]) : t('savedTabs');
            return (
              <li key={group.opId} className="trash-group">
                <div className="trash-info">
                  <strong>{title}</strong>
                  <span className="meta">
                    {tabCount(group.tabs.length)} · {formatDate(group.at)}
                  </span>
                  <ul className="trash-tabs">
                    {group.tabs.slice(0, 5).map((tab) => (
                      <li key={tab.id} title={tab.url}>
                        {tab.title || tab.url}
                      </li>
                    ))}
                    {group.tabs.length > 5 ? (
                      <li className="muted">+{group.tabs.length - 5} more</li>
                    ) : null}
                  </ul>
                </div>
                <div className="trash-actions">
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void run(() => undo(group.opId))}
                  >
                    <RotateCcw size={14} /> {t('restore')}
                  </Button>
                  <IconButton
                    label={t('deleteForever')}
                    disabled={busy}
                    onClick={() => void run(() => deleteForever(group))}
                  >
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog
        open={confirmEmpty}
        title={t('emptyTrash')}
        body={t('emptyTrashConfirm')}
        confirmLabel={t('emptyTrash')}
        danger
        onConfirm={() => void run(() => emptyTrash())}
        onClose={() => setConfirmEmpty(false)}
      />
    </div>
  );
}
