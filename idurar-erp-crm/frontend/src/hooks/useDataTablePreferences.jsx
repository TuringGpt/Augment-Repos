import { useEffect, useMemo, useState } from 'react';

import storePersist from '@/redux/storePersist';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const getStorageKey = (entity) => `data-table-preferences-${entity}`;

const getColumnKey = (column, index) => {
  if (column?.key) return String(column.key);
  if (Array.isArray(column?.dataIndex)) return column.dataIndex.join('.');
  if (column?.dataIndex) return String(column.dataIndex);
  if (typeof column?.title === 'string' && column.title) return column.title;

  return `column-${index}`;
};

const getColumnLabel = (column, index) => {
  if (typeof column?.title === 'string' && column.title) return column.title;
  if (Array.isArray(column?.dataIndex) && column.dataIndex.length) return column.dataIndex.join('.');
  if (column?.dataIndex) return String(column.dataIndex);

  return `Column ${index + 1}`;
};

const getStoredPreferences = (storageKey) => {
  const storedPreferences = storePersist.get(storageKey) || {};
  const pageSize = Number(storedPreferences.pageSize);

  return {
    hiddenColumnKeys: Array.isArray(storedPreferences.hiddenColumnKeys)
      ? storedPreferences.hiddenColumnKeys
      : [],
    pageSize: PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
  };
};

export default function useDataTablePreferences({ entity, columns, lockedColumnKeys = [] }) {
  const storageKey = useMemo(() => getStorageKey(entity), [entity]);

  const [preferences, setPreferences] = useState(() => getStoredPreferences(storageKey));

  useEffect(() => {
    setPreferences(getStoredPreferences(storageKey));
  }, [storageKey]);

  const persistPreferences = (nextPreferences) => {
    const safePreferences = {
      hiddenColumnKeys: Array.isArray(nextPreferences.hiddenColumnKeys)
        ? nextPreferences.hiddenColumnKeys
        : [],
      pageSize: PAGE_SIZE_OPTIONS.includes(Number(nextPreferences.pageSize))
        ? Number(nextPreferences.pageSize)
        : DEFAULT_PAGE_SIZE,
    };

    setPreferences(safePreferences);
    storePersist.set(storageKey, safePreferences);
  };

  const columnsWithPreferences = useMemo(
    () =>
      columns.map((column, index) => ({
        ...column,
        columnPreferenceKey: getColumnKey(column, index),
        columnPreferenceLabel: getColumnLabel(column, index),
      })),
    [columns]
  );

  const selectableColumns = useMemo(
    () =>
      columnsWithPreferences.filter(
        (column) => !lockedColumnKeys.includes(column.columnPreferenceKey)
      ),
    [columnsWithPreferences, lockedColumnKeys]
  );

  const selectedColumnKeys = useMemo(
    () =>
      selectableColumns
        .map((column) => column.columnPreferenceKey)
        .filter((columnKey) => !preferences.hiddenColumnKeys.includes(columnKey)),
    [selectableColumns, preferences.hiddenColumnKeys]
  );

  const visibleColumns = useMemo(
    () =>
      columnsWithPreferences.filter(
        (column) =>
          lockedColumnKeys.includes(column.columnPreferenceKey) ||
          !preferences.hiddenColumnKeys.includes(column.columnPreferenceKey)
      ),
    [columnsWithPreferences, lockedColumnKeys, preferences.hiddenColumnKeys]
  );

  const columnOptions = useMemo(
    () =>
      selectableColumns.map((column) => ({
        label: column.columnPreferenceLabel,
        value: column.columnPreferenceKey,
      })),
    [selectableColumns]
  );

  const handleVisibleColumnsChange = (nextVisibleColumnKeys = []) => {
    const nextVisibleKeysSet = new Set(nextVisibleColumnKeys.map((value) => String(value)));
    const nextHiddenColumnKeys = selectableColumns
      .map((column) => column.columnPreferenceKey)
      .filter((columnKey) => !nextVisibleKeysSet.has(columnKey));

    persistPreferences({
      ...preferences,
      hiddenColumnKeys: nextHiddenColumnKeys,
    });
  };

  const handlePageSizeChange = (nextPageSize) => {
    persistPreferences({
      ...preferences,
      pageSize: Number(nextPageSize),
    });
  };

  return {
    pageSize: preferences.pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    visibleColumns,
    columnOptions,
    selectedColumnKeys,
    handleVisibleColumnsChange,
    handlePageSizeChange,
  };
}