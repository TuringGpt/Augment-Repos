import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Row, Col } from 'antd';

import { DeleteOutlined } from '@ant-design/icons';
import { useMoney } from '@/settings';
import calculate from '@/utils/calculate';

const calculateLineTotal = ({ price = 0, quantity = 0, discount = 0 }) => {
  const total = calculate.multiply(price, quantity);
  const discountAmount = calculate.multiply(total, calculate.divide(discount || 0, 100));

  return calculate.sub(total, discountAmount);
};

export default function ItemRow({ field, remove, current = null, showDiscount = false }) {
  const [totalState, setTotal] = useState(undefined);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [discount, setDiscount] = useState(0);

  const money = useMoney();
  const updateQt = (value) => {
    setQuantity(value ?? 0);
  };
  const updatePrice = (value) => {
    setPrice(value ?? 0);
  };
  const updateDiscount = (value) => {
    setDiscount(value ?? 0);
  };

  const layout = showDiscount
    ? { item: 5, description: 6, quantity: 3, price: 4, discount: 3, total: 3 }
    : { item: 5, description: 7, quantity: 3, price: 4, total: 5 };

  useEffect(() => {
    if (current) {
      // When it accesses the /payment/ endpoint,
      // it receives an invoice.item instead of just item
      // and breaks the code, but now we can check if items exists,
      // and if it doesn't we can access invoice.items.

      const { items, invoice } = current;

      if (invoice) {
        const item = invoice[field.fieldKey];

        if (item) {
          setQuantity(item.quantity);
          setPrice(item.price);
          setDiscount(item.discount ?? 0);
        }
      } else {
        const item = items[field.fieldKey];

        if (item) {
          setQuantity(item.quantity);
          setPrice(item.price);
          setDiscount(item.discount ?? 0);
        }
      }
    }
  }, [current]);

  useEffect(() => {
    const currentTotal = calculateLineTotal({ price, quantity, discount });

    setTotal(currentTotal);
  }, [price, quantity, discount]);

  return (
    <Row gutter={[12, 12]} style={{ position: 'relative' }}>
      <Col className="gutter-row" span={layout.item}>
        <Form.Item
          name={[field.name, 'itemName']}
          rules={[
            {
              required: true,
              message: 'Missing itemName name',
            },
            {
              pattern: /^(?!\s*$)[\s\S]+$/, // Regular expression to allow spaces, alphanumeric, and special characters, but not just spaces
              message: 'Item Name must contain alphanumeric or special characters',
            },
          ]}
        >
          <Input placeholder="Item Name" />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={layout.description}>
        <Form.Item name={[field.name, 'description']}>
          <Input placeholder="description Name" />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={layout.quantity}>
        <Form.Item name={[field.name, 'quantity']} rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} onChange={updateQt} />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={layout.price}>
        <Form.Item name={[field.name, 'price']} rules={[{ required: true }]}>
          <InputNumber
            style={{ width: '100%' }}
            className="moneyInput"
            onChange={updatePrice}
            min={0}
            controls={false}
            addonAfter={money.currency_position === 'after' ? money.currency_symbol : undefined}
            addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
          />
        </Form.Item>
      </Col>
      {showDiscount && (
        <Col className="gutter-row" span={layout.discount}>
          <Form.Item name={[field.name, 'discount']}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              controls={false}
              addonAfter="%"
              placeholder="0"
              onChange={updateDiscount}
            />
          </Form.Item>
        </Col>
      )}
      <Col className="gutter-row" span={layout.total}>
        <Form.Item name={[field.name, 'total']}>
          <Form.Item>
            <InputNumber
              style={{ width: '100%' }}
              readOnly
              className="moneyInput"
              value={totalState}
              min={0}
              controls={false}
              addonAfter={money.currency_position === 'after' ? money.currency_symbol : undefined}
              addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
              formatter={(value) =>
                money.amountFormatter({ amount: value, currency_code: money.currency_code })
              }
            />
          </Form.Item>
        </Form.Item>
      </Col>

      <div style={{ position: 'absolute', right: '-20px', top: ' 5px' }}>
        <DeleteOutlined onClick={() => remove(field.name)} />
      </div>
    </Row>
  );
}
