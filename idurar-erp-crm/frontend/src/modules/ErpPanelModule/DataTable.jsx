import { useEffect } from 'react';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  RedoOutlined,
  PlusOutlined,
  EllipsisOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { Dropdown, Table, Button } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import TablePreferences from '@/components/DataTable/TablePreferences';
import { useSelector, useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import useDataTablePreferences from '@/hooks/useDataTablePreferences';
import { erp } from '@/redux/erp/actions';
import { selectListItems } from '@/redux/erp/selectors';
import { useErpContext } from '@/context/erp';
import { useNavigate } from 'react-router-dom';

import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';

function AddNewItem({ config }) {
  const navigate = useNavigate();
  const { ADD_NEW_ENTITY, entity } = config;

  const handleClick = () => {
    navigate(`/${entity.toLowerCase()}/create`);
  };

  return (
    <Button onClick={handleClick} type="primary" icon={<PlusOutlined />}>
      {ADD_NEW_ENTITY}
    </Button>
  );
}

export default function DataTable({ config, extra = [] }) {
  const translate = useLanguage();
  let { entity, dataTableColumns, disableAdd = false, searchConfig } = config;

  const { DATATABLE_TITLE } = config;

  const { result: listResult, isLoading: listIsLoading } = useSelector(selectListItems);

  const { pagination, items: dataSource } = listResult;

  const { erpContextAction } = useErpContext();
  const { modal } = erpContextAction;

  const items = [
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
    {
      type: 'divider',
    },

    {
      label: translate('Delete'),
      key: 'delete',
      icon: <DeleteOutlined />,
    },
  ];

  const navigate = useNavigate();

  const handleRead = (record) => {
    dispatch(erp.currentItem({ data: record }));
    navigate(`/${entity}/read/${record._id}`);
  };
  const handleEdit = (record) => {
    const data = { ...record };
    dispatch(erp.currentAction({ actionType: 'update', data }));
    navigate(`/${entity}/update/${record._id}`);
  };
  const handleDownload = (record) => {
    window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${record._id}.pdf`, '_blank');
  };

  const handleDelete = (record) => {
    dispatch(erp.currentAction({ actionType: 'delete', data: record }));
    modal.open();
  };

  const handleRecordPayment = (record) => {
    dispatch(erp.currentItem({ data: record }));
    navigate(`/invoice/pay/${record._id}`);
  };

  const actionColumn = {
    title: '',
    key: 'action',
    fixed: 'right',
    render: (_, record) => (
      <Dropdown
        menu={{
          items,
          onClick: ({ key }) => {
            switch (key) {
              case 'read':
                handleRead(record);
                break;
              case 'edit':
                handleEdit(record);
                break;
              case 'download':
                handleDownload(record);
                break;
              case 'delete':
                handleDelete(record);
                break;
              case 'recordPayment':
                handleRecordPayment(record);
                break;
              default:
                break;
            }
            // else if (key === '2')handleCloseTask
          },
        }}
        trigger={['click']}
      >
        <EllipsisOutlined
          style={{ cursor: 'pointer', fontSize: '24px' }}
          onClick={(e) => e.preventDefault()}
        />
      </Dropdown>
    ),
  };

  const {
    visibleColumns,
    columnOptions,
    selectedColumnKeys,
    pageSize,
    pageSizeOptions,
    handleVisibleColumnsChange,
    handlePageSizeChange,
  } = useDataTablePreferences({
    entity,
    columns: [...dataTableColumns, actionColumn],
    lockedColumnKeys: ['action'],
  });

  const dispatch = useDispatch();

  const handelDataTableLoad = (pagination = {}) => {
    const nextPageSize = Number(pagination.pageSize) || pageSize;

    if (nextPageSize !== pageSize) {
      handlePageSizeChange(nextPageSize);
    }

    const options = { page: pagination.current || 1, items: nextPageSize };
    dispatch(erp.list({ entity, options }));
  };

  const handleTablePageSizeChange = (nextPageSize) => {
    const size = Number(nextPageSize) || pageSize;
    handlePageSizeChange(size);
    dispatch(erp.list({ entity, options: { page: 1, items: size } }));
  };

  const dispatcher = () => {
    dispatch(erp.list({ entity, options: { page: 1, items: pageSize } }));
  };

  useEffect(() => {
    const controller = new AbortController();
    dispatcher();
    return () => {
      controller.abort();
    };
  }, []);

  const filterTable = (value) => {
    const options = { page: 1, items: pageSize, equal: value, filter: searchConfig?.entity };
    dispatch(erp.list({ entity, options }));
  };

  return (
    <>
      <PageHeader
        title={DATATABLE_TITLE}
        ghost={true}
        onBack={() => window.history.back()}
        backIcon={<ArrowLeftOutlined />}
        extra={[
          <AutoCompleteAsync
            key="search-auto-complete"
            entity={searchConfig?.entity}
            displayLabels={['name']}
            searchFields={'name'}
            onChange={filterTable}
            // redirectLabel={'Add New Client'}
            // withRedirect
            // urlToRedirect={'/customer'}
          />,
          <TablePreferences
            key="table-preferences"
            columnOptions={columnOptions}
            selectedColumnKeys={selectedColumnKeys}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onColumnsChange={handleVisibleColumnsChange}
            onPageSizeChange={handleTablePageSizeChange}
          />,
          <Button onClick={handelDataTableLoad} key="refresh-button" icon={<RedoOutlined />}>
            {translate('Refresh')}
          </Button>,

          !disableAdd && <AddNewItem config={config} key="add-new-item" />,
        ]}
        style={{
          padding: '20px 0px',
        }}
      ></PageHeader>

      <Table
        columns={visibleColumns}
        rowKey={(item) => item._id}
        dataSource={dataSource}
        pagination={{ ...pagination, pageSize }}
        loading={listIsLoading}
        onChange={handelDataTableLoad}
        scroll={{ x: true }}
      />
    </>
  );
}
