import { useCallback, useState } from 'react';

import storePersist from '@/redux/storePersist';

export const DEFAULT_PAGE_SIZE = 10;

const STORAGE_PREFIX = 'table_settings_';

// Build a stable identifier for a column so it can be referenced in storage.
export const getColumnKey = (column) => {
  if (column.key !== undefined && column.key !== null) return String(column.key);
  if (Array.isArray(column.dataIndex)) return column.dataIndex.join('.');
  if (column.dataIndex !== undefined && column.dataIndex !== null) return String(column.dataIndex);
  return '';
};

export default function useTableSettings(entity) {
  const storageKey = `${STORAGE_PREFIX}${entity}`;

  const [settings, setSettings] = useState(() => {
    const saved = storePersist.get(storageKey) || {};
    return {
      hiddenColumns: Array.isArray(saved.hiddenColumns) ? saved.hiddenColumns : [],
      pageSize: saved.pageSize || DEFAULT_PAGE_SIZE,
    };
  });

  const persist = useCallback(
    (next) => {
      storePersist.set(storageKey, next);
      return next;
    },
    [storageKey]
  );

  const setColumnVisible = useCallback(
    (columnKey, visible) => {
      setSettings((prev) => {
        const hiddenColumns = visible
          ? prev.hiddenColumns.filter((key) => key !== columnKey)
          : prev.hiddenColumns.includes(columnKey)
            ? prev.hiddenColumns
            : [...prev.hiddenColumns, columnKey];
        return persist({ ...prev, hiddenColumns });
      });
    },
    [persist]
  );

  const setPageSize = useCallback(
    (pageSize) => {
      setSettings((prev) => persist({ ...prev, pageSize }));
    },
    [persist]
  );

  return {
    hiddenColumns: settings.hiddenColumns,
    pageSize: settings.pageSize,
    setColumnVisible,
    setPageSize,
  };
}
