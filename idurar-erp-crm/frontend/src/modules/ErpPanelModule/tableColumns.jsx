import dayjs from 'dayjs';
import { Dropdown } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  EyeOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';

const rightAlignedCell = () => ({
  style: {
    textAlign: 'right',
    whiteSpace: 'nowrap',
    direction: 'ltr',
  },
});

const formatDate = (date, dateFormat) => dayjs(date).format(dateFormat);

const moneyColumn = ({ title, dataIndex, moneyFormatter }) => ({
  title,
  dataIndex,
  onCell: rightAlignedCell,
  render: (amount, record) => moneyFormatter({ amount, currency_code: record.currency }),
});

export const buildDocumentSummaryColumns = ({ translate, moneyFormatter }) => [
  {
    title: translate('number'),
    dataIndex: 'number',
  },
  {
    title: translate('Client'),
    dataIndex: ['client', 'name'],
  },
  moneyColumn({
    title: translate('Total'),
    dataIndex: 'total',
    moneyFormatter,
  }),
  {
    title: translate('Status'),
    dataIndex: 'status',
  },
];

export const buildInvoiceTableColumns = ({ translate, moneyFormatter, dateFormat }) => [
  {
    title: translate('Number'),
    dataIndex: 'number',
  },
  {
    title: translate('Client'),
    dataIndex: ['client', 'name'],
  },
  {
    title: translate('Date'),
    dataIndex: 'date',
    render: (date) => formatDate(date, dateFormat),
  },
  {
    title: translate('expired Date'),
    dataIndex: 'expiredDate',
    render: (date) => formatDate(date, dateFormat),
  },
  moneyColumn({
    title: translate('Total'),
    dataIndex: 'total',
    moneyFormatter,
  }),
  moneyColumn({
    title: translate('paid'),
    dataIndex: 'credit',
    moneyFormatter,
  }),
  {
    title: translate('Status'),
    dataIndex: 'status',
  },
  {
    title: translate('Payment'),
    dataIndex: 'paymentStatus',
  },
];

export const buildQuoteTableColumns = ({ translate, moneyFormatter, dateFormat }) => [
  {
    title: translate('Number'),
    dataIndex: 'number',
  },
  {
    title: translate('Client'),
    dataIndex: ['client', 'name'],
  },
  {
    title: translate('Date'),
    dataIndex: 'date',
    render: (date) => formatDate(date, dateFormat),
  },
  {
    title: translate('expired Date'),
    dataIndex: 'expiredDate',
    render: (date) => formatDate(date, dateFormat),
  },
  moneyColumn({
    title: translate('Total'),
    dataIndex: 'total',
    moneyFormatter,
  }),
  {
    title: translate('Status'),
    dataIndex: 'status',
  },
];

export const buildErpActionItems = ({ translate, extra = [], includeDelete = true }) => [
  {
    label: translate('Show'),
    key: 'read',
    icon: <EyeOutlined />,
  },
  {
    label: translate('Edit'),
    key: 'edit',
    icon: <EditOutlined />,
  },
  {
    label: translate('Download'),
    key: 'download',
    icon: <FilePdfOutlined />,
  },
  ...extra,
  ...(includeDelete
    ? [
        {
          type: 'divider',
        },
        {
          label: translate('Delete'),
          key: 'delete',
          icon: <DeleteOutlined />,
        },
      ]
    : []),
];

export const buildErpActionColumn = ({ items, onAction, fixed = 'right' }) => ({
  title: '',
  key: 'action',
  ...(fixed ? { fixed } : {}),
  render: (_, record) => (
    <Dropdown
      menu={{
        items,
        onClick: ({ key }) => onAction(key, record),
      }}
      trigger={['click']}
    >
      <EllipsisOutlined
        style={{ cursor: 'pointer', fontSize: '24px' }}
        onClick={(e) => e.preventDefault()}
      />
    </Dropdown>
  ),
});