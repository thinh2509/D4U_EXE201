import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Select, Space } from 'antd';

export function MarketplaceToolbar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  categories = [],
  onRefresh,
  resultCount,
  placeholder = 'Tìm theo tiêu đề, brief, danh mục...'
}) {
  return (
    <Card className="marketplace-toolbar">
      <div className="toolbar-head">
        <div>
          <span className="section-kicker">Bộ lọc</span>
          <strong>Tìm dự án phù hợp</strong>
        </div>
        <span className="toolbar-count">{resultCount} kết quả</span>
      </div>

      <div className="marketplace-toolbar-inner">
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          placeholder={placeholder}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <Space wrap className="marketplace-actions">
          <Select
            size="large"
            value={category}
            onChange={onCategoryChange}
            className="category-filter"
            options={[
              { value: 'ALL', label: 'Tất cả danh mục' },
              ...categories.map((item) => ({ value: item, label: item }))
            ]}
          />
          <Button size="large" icon={<ReloadOutlined />} onClick={onRefresh}>Làm mới</Button>
        </Space>
      </div>
    </Card>
  );
}
