import { Skeleton, Row, Col, Divider } from 'antd';

const itemCols = [11, 4, 4, 5];

export default function ReadItemSkeleton() {
  return (
    <>
      {/* PageHeader skeleton – matches title, action buttons, and statistics row */}
      <div style={{ padding: '20px 0px' }}>
        {/* Back button + title + action buttons */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Skeleton.Button active size="small" style={{ width: 32, marginRight: 8 }} />
            <Skeleton.Input active style={{ width: 240 }} />
          </Col>
          <Col>
            <Row gutter={8}>
              {[120, 140, 140, 120, 80].map((w, i) => (
                <Col key={i}>
                  <Skeleton.Button active style={{ width: w }} />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>

        {/* Statistics row – Status, SubTotal, Total, Paid */}
        <Row gutter={32}>
          {[80, 110, 110, 80].map((w, i) => (
            <Col key={i}>
              <Skeleton.Input
                active
                size="small"
                style={{ width: 60, display: 'block', marginBottom: 4 }}
              />
              <Skeleton.Input active style={{ width: w }} />
            </Col>
          ))}
        </Row>
      </div>

      <Divider dashed />

      {/* Client description skeleton */}
      <Skeleton
        active
        title={{ width: 200 }}
        paragraph={{ rows: 2, width: ['60%', '50%'] }}
      />

      <Divider />

      {/* Items table header skeleton */}
      <Row gutter={[12, 0]} style={{ marginBottom: 12 }}>
        {itemCols.map((span, i) => (
          <Col key={i} span={span}>
            <Skeleton.Input active size="small" block />
          </Col>
        ))}
      </Row>
      <Divider style={{ marginTop: 0, marginBottom: 15 }} />

      {/* Three placeholder item rows */}
      {[1, 2, 3].map((row) => (
        <div key={row}>
          <Row gutter={[12, 0]} style={{ marginBottom: 4 }}>
            {itemCols.map((span, i) => (
              <Col key={i} span={span}>
                <Skeleton.Input active size="small" block />
              </Col>
            ))}
          </Row>
          <Divider dashed style={{ marginTop: 0, marginBottom: 15 }} />
        </div>
      ))}

      {/* Totals section skeleton (bottom-right) */}
      <div style={{ width: 300, float: 'right', marginTop: 8 }}>
        {[1, 2, 3].map((i) => (
          <Row key={i} gutter={[12, 0]} style={{ marginBottom: 8 }}>
            <Col span={12}>
              <Skeleton.Input active size="small" block />
            </Col>
            <Col span={12}>
              <Skeleton.Input active size="small" block />
            </Col>
          </Row>
        ))}
      </div>
    </>
  );
}
