import dayjs from 'dayjs';

/**
 * Shared Ant Design column descriptors reused across Invoice and Quote tables.
 *
 * Each export is a builder function so callers control invocation time and
 * avoid stale-closure issues with translate / moneyFormatter / dateFormat.
 */

/** @param {{ translate: Function }} opts */
export const numberColumn = ({ translate }) => ({
  title: translate('Number'),
  dataIndex: 'number',
});

/** @param {{ translate: Function }} opts */
export const clientNameColumn = ({ translate }) => ({
  title: translate('Client'),
  dataIndex: ['client', 'name'],
});

/** @param {{ translate: Function, dateFormat: string }} opts */
export const dateColumn = ({ translate, dateFormat }) => ({
  title: translate('Date'),
  dataIndex: 'date',
  render: (date) => dayjs(date).format(dateFormat),
});

/** @param {{ translate: Function, dateFormat: string }} opts */
export const expiredDateColumn = ({ translate, dateFormat }) => ({
  title: translate('expired Date'),
  dataIndex: 'expiredDate',
  render: (date) => dayjs(date).format(dateFormat),
});

/**
 * Consistent RTL-safe inline style for right-aligned monetary cells.
 * Extracted once so every money column renders identically.
 */
const currencyOnCell = () => ({
  style: {
    textAlign: 'right',
    whiteSpace: 'nowrap',
    direction: 'ltr',
  },
});

/** @param {{ translate: Function, moneyFormatter: Function }} opts */
export const totalColumn = ({ translate, moneyFormatter }) => ({
  title: translate('Total'),
  dataIndex: 'total',
  onCell: currencyOnCell,
  render: (total, record) => moneyFormatter({ amount: total, currency_code: record.currency }),
});

/** @param {{ translate: Function }} opts */
export const statusColumn = ({ translate }) => ({
  title: translate('Status'),
  dataIndex: 'status',
});
