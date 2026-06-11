import useLanguage from '@/locale/useLanguage';
import { useMoney, useDate } from '@/settings';
import QuoteDataTableModule from '@/modules/QuoteModule/QuoteDataTableModule';
import {
  numberColumn,
  clientNameColumn,
  dateColumn,
  expiredDateColumn,
  totalColumn,
  statusColumn,
} from '@/modules/shared/columns/invoiceQuoteColumns';

export default function Quote() {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const entity = 'quote';
  const { moneyFormatter } = useMoney();

  const searchConfig = {
    entity: 'client',
    displayLabels: ['name'],
    searchFields: 'name',
  };
  const deleteModalLabels = ['number', 'client.name'];

  const columnParams = { translate, moneyFormatter, dateFormat };
  const dataTableColumns = [
    numberColumn(columnParams),
    clientNameColumn(columnParams),
    dateColumn(columnParams),
    expiredDateColumn(columnParams),
    totalColumn(columnParams),
    statusColumn(columnParams),
  ];

  const Labels = {
    PANEL_TITLE: translate('quote'),
    DATATABLE_TITLE: translate('quote_list'),
    ADD_NEW_ENTITY: translate('add_new_quote'),
    ENTITY_NAME: translate('quote'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  const config = {
    ...configPage,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
  };

  return <QuoteDataTableModule config={config} />;
}
