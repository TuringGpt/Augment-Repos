import { useState, useEffect, useRef } from 'react';

import { request } from '@/request';
import useOnFetch from '@/hooks/useOnFetch';
import useDebounce from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';

import { Select, Empty } from 'antd';
import useLanguage from '@/locale/useLanguage';

export default function AutoCompleteAsync({
  entity,
  displayLabels,
  searchFields,
  outputValue = '_id',
  redirectLabel = 'Add New',
  withRedirect = false,
  urlToRedirect = '/',
  value, /// this is for update
  onChange, /// this is for update
}) {
  const translate = useLanguage();

  const addNewValue = { value: 'redirectURL', label: `+ ${translate(redirectLabel)}` };

  const [selectOptions, setOptions] = useState([]);
  const [currentValue, setCurrentValue] = useState(undefined);

  const isUpdating = useRef(true);
  const isSearching = useRef(false);

  const [searching, setSearching] = useState(false);

  const [valToSearch, setValToSearch] = useState('');
  const lastRequestedSearch = useRef(null);

  const navigate = useNavigate();

  const handleSelectChange = (newValue) => {
    isUpdating.current = false;
    // setCurrentValue(value[outputValue] || value); // set nested value or value
    // onChange(newValue[outputValue] || newValue);
    if (onChange) {
      if (newValue) onChange(newValue[outputValue] || newValue);
    }
    if (newValue === 'redirectURL' && withRedirect) {
      navigate(urlToRedirect);
    }
  };

  const handleOnSelect = (value) => {
    setCurrentValue(value[outputValue] || value); // set nested value or value
  };

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

      const callback = asyncSearch(options);
      onFetch(callback);
    },
    300,
    [valToSearch]
  );

  const asyncSearch = async (options) => {
    return await request.search({ entity, options });
  };

  let { onFetch, result, isSuccess, isLoading } = useOnFetch();

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
      setSearching(false);
      setOptions([]);
      setValToSearch('');
      return;
    }

    isSearching.current = true;
    setSearching(true);
    setValToSearch(trimmedSearchText);
  };

  useEffect(() => {
    if (!isLoading) {
      setSearching(false);
    }

    if (isSuccess) {
      setOptions(result || []);
    } else {
      setOptions([]);
    }
  }, [isLoading, isSuccess, result]);
  useEffect(() => {
    // this for update Form , it's for setField
    if (value && isUpdating.current) {
      setOptions([value]);
      setCurrentValue(value[outputValue] || value); // set nested value or value
      onChange(value[outputValue] || value);
      isUpdating.current = false;
    }
  }, [value]);

  return (
    <Select
      loading={isLoading}
      showSearch
      allowClear
      placeholder={translate('Search')}
      defaultActiveFirstOption={false}
      filterOption={false}
      notFoundContent={searching ? '... Searching' : <Empty />}
      value={currentValue}
      onSearch={onSearch}
      onClear={() => {
        lastRequestedSearch.current = null;
        setSearching(false);
        setOptions([]);
        setValToSearch('');
      }}
      onChange={handleSelectChange}
      style={{ minWidth: '220px' }}
      // onSelect={handleOnSelect}
    >
      {selectOptions.map((optionField) => (
        <Select.Option
          key={optionField[outputValue] || optionField}
          value={optionField[outputValue] || optionField}
        >
          {labels(optionField)}
        </Select.Option>
      ))}
      {withRedirect && <Select.Option value={addNewValue.value}>{addNewValue.label}</Select.Option>}
    </Select>
  );
}
