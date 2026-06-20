import { SettingOutlined } from '@ant-design/icons';
import { Button, Checkbox, Divider, Popover, Select } from 'antd';

import useLanguage from '@/locale/useLanguage';

export default function TablePreferences({
  columnOptions = [],
  selectedColumnKeys = [],
  pageSize,
  pageSizeOptions = [],
  onColumnsChange,
  onPageSizeChange,
}) {
  const translate = useLanguage();
  const hasColumnOptions = columnOptions.length > 0;

  const content = (
    <div style={{ minWidth: '240px' }}>
      {hasColumnOptions && (
        <>
          <div style={{ fontWeight: 600, marginBottom: '10px' }}>{translate('Visible columns')}</div>
          <Checkbox.Group
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            value={selectedColumnKeys}
            onChange={onColumnsChange}
          >
            {columnOptions.map((option) => (
              <Checkbox key={option.value} value={option.value}>
                {option.label}
              </Checkbox>
            ))}
          </Checkbox.Group>

          <Divider style={{ margin: '14px 0' }} />
        </>
      )}

      <div style={{ fontWeight: 600, marginBottom: '10px' }}>{translate('Rows per page')}</div>
      <Select
        style={{ width: '100%' }}
        value={pageSize}
        options={pageSizeOptions.map((option) => ({ value: option, label: option }))}
        onChange={onPageSizeChange}
      />
    </div>
  );

  return (
    <Popover content={content} trigger={['click']} placement="bottomRight">
      <Button icon={<SettingOutlined />}>{translate('Table settings')}</Button>
    </Popover>
  );
}