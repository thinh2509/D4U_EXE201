import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Select } from 'antd';
import { DataPanel } from './PageShell.jsx';

export function MarketplaceToolbar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  categories = [],
  onRefresh,
  resultCount,
  placeholder = 'TÃ¬m theo tiÃªu Ä‘á», brief, danh má»¥c...'
}) {
  return (
    <DataPanel
      className="overflow-visible"
      headerClassName="items-start"
      header={(
        <>
          <div className="grid gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-d4u-text-3">Bá»™ lá»c</span>
            <strong className="text-base font-semibold leading-tight text-d4u-text-1">TÃ¬m dá»± Ã¡n phÃ¹ há»£p</strong>
          </div>
          <span className="inline-flex min-h-[32px] items-center rounded-full bg-d4u-soft px-3 text-xs font-bold text-d4u-teal-deep">
            {resultCount} káº¿t quáº£
          </span>
        </>
      )}
      contentClassName="grid gap-3 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto]"
    >
      <Input
        allowClear
        size="large"
        prefix={<SearchOutlined className="text-d4u-text-3" />}
        placeholder={placeholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <Select
          size="large"
          value={category}
          onChange={onCategoryChange}
          className="w-full sm:w-[240px]"
          options={[
            { value: 'ALL', label: 'Táº¥t cáº£ danh má»¥c' },
            ...categories.map((item) => ({ value: item, label: item }))
          ]}
        />
        <Button size="large" icon={<ReloadOutlined />} onClick={onRefresh}>
          LÃ m má»›i
        </Button>
      </div>
    </DataPanel>
  );
}
