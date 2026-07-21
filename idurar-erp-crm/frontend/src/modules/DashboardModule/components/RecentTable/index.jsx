import { Table } from 'antd';

import { request } from '@/request';
import useFetch from '@/hooks/useFetch';

import { useDispatch } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import useLanguage from '@/locale/useLanguage';
import { useNavigate } from 'react-router-dom';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import { buildErpActionColumn, buildErpActionItems } from '@/modules/ErpPanelModule/tableColumns';

export default function RecentTable({ ...props }) {
  const translate = useLanguage();
  let { entity, dataTableColumns } = props;

  const items = buildErpActionItems({ translate, includeDelete: false });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleRead = (record) => {
    dispatch(erp.currentItem({ data: record }));
    navigate(`/${entity}/read/${record._id}`);
  };
  const handleEdit = (record) => {
    dispatch(erp.currentAction({ actionType: 'update', data: record }));
    navigate(`/${entity}/update/${record._id}`);
  };
  const handleDownload = (record) => {
    window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${record._id}.pdf`, '_blank');
  };

  const handleAction = (key, record) => {
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
      default:
        break;
    }
  };

  dataTableColumns = [
    ...dataTableColumns,
    buildErpActionColumn({ items, onAction: handleAction, fixed: false }),
  ];

  const asyncList = () => {
    return request.list({ entity });
  };
  const { result, isLoading, isSuccess } = useFetch(asyncList);
  const firstFiveItems = () => {
    if (isSuccess && result) return result.slice(0, 5);
    return [];
  };

  return (
    <Table
      columns={dataTableColumns}
      rowKey={(item) => item._id}
      dataSource={isSuccess && firstFiveItems()}
      pagination={false}
      loading={isLoading}
      scroll={{ x: true }}
    />
  );
}
