import { Col, Descriptions, Divider, Row, Skeleton } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';

import useLanguage from '@/locale/useLanguage';

const StatisticSkeleton = ({ title, width }) => (
  <div>
    <div style={{ marginBottom: 8, color: 'rgba(0, 0, 0, 0.45)', fontSize: 14 }}>{title}</div>
    <Skeleton.Input active size="small" style={{ width }} />
  </div>
);

const ItemRowSkeleton = () => (
  <>
    <Row gutter={[12, 0]}>
      <Col className="gutter-row" span={11}>
        <Skeleton.Input active block style={{ width: '100%', marginBottom: 8 }} />
        <Skeleton.Input active block size="small" style={{ width: '80%' }} />
      </Col>
      <Col className="gutter-row" span={4}>
        <div style={{ textAlign: 'right' }}>
          <Skeleton.Input active size="small" style={{ width: 72 }} />
        </div>
      </Col>
      <Col className="gutter-row" span={4}>
        <div style={{ textAlign: 'right' }}>
          <Skeleton.Input active size="small" style={{ width: 40 }} />
        </div>
      </Col>
      <Col className="gutter-row" span={5}>
        <div style={{ textAlign: 'right' }}>
          <Skeleton.Input active size="small" style={{ width: 88 }} />
        </div>
      </Col>
    </Row>
    <Divider dashed style={{ marginTop: 12, marginBottom: 15 }} />
  </>
);

export default function ReadItemSkeleton({ config }) {
  const translate = useLanguage();
  const { entity } = config;
  const showQuoteAction = entity === 'quote';

  return (
    <>
      <PageHeader
        onBack={() => null}
        title={<Skeleton.Input active style={{ width: 200 }} />}
        ghost={false}
        tags={[
          <Skeleton.Button key="status" active shape="round" size="small" style={{ width: 90 }} />,
          <Skeleton.Button key="secondary-status" active shape="round" size="small" style={{ width: 110 }} />,
        ]}
        extra={[
          <Skeleton.Button key="close" active style={{ width: 92 }} />,
          <Skeleton.Button key="download" active style={{ width: 126 }} />,
          <Skeleton.Button key="mail" active style={{ width: 128 }} />,
          showQuoteAction && <Skeleton.Button key="convert" active style={{ width: 148 }} />,
          <Skeleton.Button key="edit" active style={{ width: 84 }} />,
        ].filter(Boolean)}
        style={{
          padding: '20px 0px',
        }}
      >
        <Row gutter={[32, 16]}>
          <Col>
            <StatisticSkeleton title={translate('Status')} width={90} />
          </Col>
          <Col>
            <StatisticSkeleton title={translate('SubTotal')} width={110} />
          </Col>
          <Col>
            <StatisticSkeleton title={translate('Total')} width={110} />
          </Col>
          <Col>
            <StatisticSkeleton title={translate('Paid')} width={110} />
          </Col>
        </Row>
      </PageHeader>

      <Divider dashed />

      <Descriptions title={<Skeleton.Input active style={{ width: 220 }} />}>
        <Descriptions.Item label={translate('Address')}>
          <Skeleton.Input active style={{ width: 180 }} />
        </Descriptions.Item>
        <Descriptions.Item label={translate('email')}>
          <Skeleton.Input active style={{ width: 200 }} />
        </Descriptions.Item>
        <Descriptions.Item label={translate('Phone')}>
          <Skeleton.Input active style={{ width: 120 }} />
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Row gutter={[12, 0]}>
        <Col className="gutter-row" span={11}>
          <p>
            <strong>{translate('Product')}</strong>
          </p>
        </Col>
        <Col className="gutter-row" span={4}>
          <p style={{ textAlign: 'right' }}>
            <strong>{translate('Price')}</strong>
          </p>
        </Col>
        <Col className="gutter-row" span={4}>
          <p style={{ textAlign: 'right' }}>
            <strong>{translate('Quantity')}</strong>
          </p>
        </Col>
        <Col className="gutter-row" span={5}>
          <p style={{ textAlign: 'right' }}>
            <strong>{translate('Total')}</strong>
          </p>
        </Col>
        <Divider />
      </Row>

      {[0, 1, 2].map((item) => (
        <ItemRowSkeleton key={item} />
      ))}

      <div
        style={{
          width: '300px',
          float: 'right',
          textAlign: 'right',
          fontWeight: '700',
        }}
      >
        <Row gutter={[12, 12]}>
          {[0, 1, 2].map((item) => (
            <Col className="gutter-row" span={12} key={item}>
              <Skeleton.Input active block />
            </Col>
          ))}
          {[0, 1, 2].map((item) => (
            <Col className="gutter-row" span={12} key={`value-${item}`}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Skeleton.Input active style={{ width: 96 }} />
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </>
  );
}