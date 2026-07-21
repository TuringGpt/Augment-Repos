import { useCallback, useEffect } from 'react';

import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  RedoOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { Dropdown, Table, Button, Input } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';

import { useSelector, useDispatch } from 'react-redux';
import { crud } from '@/redux/crud/actions';
import { selectListItems } from '@/redux/crud/selectors';
import useLanguage from '@/locale/useLanguage';
import { dataForTable } from '@/utils/dataStructure';
import { useMoney, useDate } from '@/settings';
import useDataTablePreferences from '@/hooks/useDataTablePreferences';

import { generate as uniqueId } from 'shortid';

import { useCrudContext } from '@/context/crud';
import TablePreferences from './TablePreferences';

function AddNewItem({ config }) {
  const { crudContextAction } = useCrudContext();
  const { collapsedBox, panel } = crudContextAction;
  const { ADD_NEW_ENTITY } = config;

  const handelClick = () => {
    panel.open();
    collapsedBox.close();
  };

  return (
    <Button onClick={handelClick} type="primary">
      {ADD_NEW_ENTITY}
    </Button>
  );
}
export default function DataTable({ config, extra = [] }) {
  let { entity, dataTableColumns, DATATABLE_TITLE, fields, searchConfig } = config;
  const { crudContextAction } = useCrudContext();
  const { panel, collapsedBox, modal, readBox, editBox, advancedBox } = crudContextAction;
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const { dateFormat } = useDate();

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

  const handleRead = (record) => {
    dispatch(crud.currentItem({ data: record }));
    panel.open();
    collapsedBox.open();
    readBox.open();
  };
  function handleEdit(record) {
    dispatch(crud.currentItem({ data: record }));
    dispatch(crud.currentAction({ actionType: 'update', data: record }));
    editBox.open();
    panel.open();
    collapsedBox.open();
  }
  function handleDelete(record) {
    dispatch(crud.currentAction({ actionType: 'delete', data: record }));
    modal.open();
  }

  function handleUpdatePassword(record) {
    dispatch(crud.currentItem({ data: record }));
    dispatch(crud.currentAction({ actionType: 'update', data: record }));
    advancedBox.open();
    panel.open();
    collapsedBox.open();
  }

  let dispatchColumns = [];
  if (fields) {
    dispatchColumns = [...dataForTable({ fields, translate, moneyFormatter, dateFormat })];
  } else {
    dispatchColumns = [...dataTableColumns];
  }

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

              case 'delete':
                handleDelete(record);
                break;
              case 'updatePassword':
                handleUpdatePassword(record);
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
    columns: [...dispatchColumns, actionColumn],
    lockedColumnKeys: ['action'],
  });

  const { result: listResult, isLoading: listIsLoading } = useSelector(selectListItems);

  const { pagination, items: dataSource } = listResult;

  const dispatch = useDispatch();

  const handelDataTableLoad = useCallback((pagination = {}) => {
    const nextPageSize = Number(pagination.pageSize) || pageSize;

    if (nextPageSize !== pageSize) {
      handlePageSizeChange(nextPageSize);
    }

    const options = { page: pagination.current || 1, items: nextPageSize };
    dispatch(crud.list({ entity, options }));
  }, [dispatch, entity, pageSize, handlePageSizeChange]);

  const handleTablePageSizeChange = (nextPageSize) => {
    const size = Number(nextPageSize) || pageSize;
    handlePageSizeChange(size);
    dispatch(crud.list({ entity, options: { page: 1, items: size } }));
  };

  const filterTable = (e) => {
    const value = e.target.value;
    const options = { page: 1, items: pageSize, q: value, fields: searchConfig?.searchFields || '' };
    dispatch(crud.list({ entity, options }));
  };

  const dispatcher = () => {
    dispatch(crud.list({ entity, options: { page: 1, items: pageSize } }));
  };

  useEffect(() => {
    const controller = new AbortController();
    dispatcher();
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <>
      <PageHeader
        onBack={() => window.history.back()}
        backIcon={<ArrowLeftOutlined />}
        title={DATATABLE_TITLE}
        ghost={false}
        extra={[
          <Input
            key={`searchFilterDataTable}`}
            onChange={filterTable}
            placeholder={translate('search')}
            allowClear
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
          <Button onClick={handelDataTableLoad} key={`${uniqueId()}`} icon={<RedoOutlined />}>
            {translate('Refresh')}
          </Button>,

          <AddNewItem key={`${uniqueId()}`} config={config} />,
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
