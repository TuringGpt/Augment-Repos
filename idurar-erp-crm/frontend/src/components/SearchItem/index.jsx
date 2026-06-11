import { useState, useEffect, useRef } from 'react';

import useDebounce from '@/hooks/useDebounce';

import { Select, Empty } from 'antd';

import { SearchOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { crud } from '@/redux/crud/actions';

import { useCrudContext } from '@/context/crud';
import { selectSearchedItems } from '@/redux/crud/selectors';

export default function SearchItem({ config }) {
  let { entity, searchConfig } = config;

  const { displayLabels, searchFields, outputValue = '_id' } = searchConfig;

  const dispatch = useDispatch();
  const { crudContextAction } = useCrudContext();
  const { panel, collapsedBox, readBox } = crudContextAction;
  const { result, isLoading, isSuccess } = useSelector(selectSearchedItems);

  const [selectOptions, setOptions] = useState([]);
  const [currentValue, setCurrentValue] = useState(undefined);

  const isSearching = useRef(false);

  const [searching, setSearching] = useState(false);

  const [valToSearch, setValToSearch] = useState('');
  const lastRequestedSearch = useRef(null);

  const [, cancel] = useDebounce(
    () => {
      const trimmedSearchValue = valToSearch.trim();

      if (!trimmedSearchValue) {
        lastRequestedSearch.current = null;
        setSearching(false);
        setOptions([]);
        return;
      }

      if (trimmedSearchValue === lastRequestedSearch.current) {
        setSearching(false);
        return;
      }

      lastRequestedSearch.current = trimmedSearchValue;

      const options = {
        q: trimmedSearchValue,
        fields: searchFields,
      };

      dispatch(crud.search({ entity, options }));
    },
    300,
    [valToSearch]
  );

  const labels = (optionField) => {
    return displayLabels.map((x) => optionField[x]).join(' ');
  };

  useEffect(() => {
    return () => {
      cancel();
    };
  }, []);

  const onSearch = (searchText) => {
    const trimmedSearchText = searchText.trim();

    if (!trimmedSearchText) {
      lastRequestedSearch.current = null;
      isSearching.current = false;
      setSearching(false);
      setOptions([]);
      setCurrentValue(undefined);
      setValToSearch('');
      return;
    }

    isSearching.current = true;
    setSearching(true);
    setOptions([]);
    setCurrentValue(undefined);
    setValToSearch(trimmedSearchText);
  };

  const onSelect = (data) => {
    const currentItem = result.find((item) => {
      return item[outputValue] === data;
    });

    dispatch(crud.currentItem({ data: currentItem }));

    panel.open();
    collapsedBox.open();
    readBox.open();

    lastRequestedSearch.current = null;
    isSearching.current = false;
    setSearching(false);
    setOptions([]);
    setCurrentValue(undefined);
    setValToSearch('');
  };
  useEffect(() => {
    if (isSearching.current) {
      setSearching(false);

      if (isSuccess) {
        setOptions(result || []);
      } else {
        setCurrentValue(undefined);
        setOptions([]);
      }
    }
  }, [isSuccess, result]);

  return (
    <Select
      loading={isLoading}
      showSearch
      allowClear
      placeholder={<SearchOutlined style={{ float: 'right', padding: '8px 0' }} />}
      defaultActiveFirstOption={false}
      filterOption={false}
      notFoundContent={searching ? '... Searching' : <Empty />}
      value={currentValue}
      onSearch={onSearch}
      style={{ width: '100%' }}
      onSelect={onSelect}
    >
      {selectOptions.map((optionField) => (
        <Select.Option key={optionField[outputValue]} value={optionField[outputValue]}>
          {labels(optionField)}
        </Select.Option>
      ))}
    </Select>
  );
}
