import { FileSearchOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Select, Table, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader.jsx';
import { DataPanel, PageShell } from '../../components/PageShell.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ErrorState } from '../../components/StateViews.jsx';
import { adminApi } from '../../services/adminApi.js';
import { getApiErrorMessage } from '../../utils/apiError.js';
import { formatDate, formatFileSize } from '../../utils/format.js';

export function VerificationListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('PENDING');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await adminApi.listStudentVerifications(status));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, [status]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) => [row.studentFullName, row.studentEmail, row.school, row.major]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalized)));
  }, [query, rows]);

  const columns = [
    {
      title: 'Sinh viÃªn',
      dataIndex: 'studentFullName',
      render: (value, row) => (
        <div>
          <strong>{value}</strong>
          <div className="muted-text">{row.studentEmail}</div>
        </div>
      )
    },
    { title: 'TrÆ°á»ng', dataIndex: 'school' },
    { title: 'ChuyÃªn ngÃ nh', dataIndex: 'major' },
    {
      title: 'Giáº¥y tá»',
      render: (_, row) => (
        <div>
          <span>{row.originalFilename}</span>
          <div className="muted-text">{row.mimeType} - {formatFileSize(row.fileSizeBytes)}</div>
        </div>
      )
    },
    { title: 'Tráº¡ng thÃ¡i', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
    { title: 'NgÃ y gá»­i', dataIndex: 'submittedAt', render: formatDate },
    {
      title: 'HÃ nh Ä‘á»™ng',
      render: (_, row) => <Button type="primary" ghost onClick={() => navigate(`/admin/verifications/${row.id}`)}>Xem chi tiáº¿t</Button>
    }
  ];

  if (error) return <ErrorState description={error} onRetry={loadRows} />;

  return (
    <PageShell size="wide">
      <PageHeader
        icon={<FileSearchOutlined />}
        title="YÃªu cáº§u xÃ¡c thá»±c sinh viÃªn"
        description="Duyá»‡t hoáº·c tá»« chá»‘i cÃ¡c yÃªu cáº§u xÃ¡c thá»±c giáº¥y tá»."
        extra={<Tag color="cyan">{filteredRows.length} yÃªu cáº§u</Tag>}
      />
      <DataPanel
        flush
        header={(
          <>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <Select
                value={status}
                onChange={setStatus}
                className="w-full sm:w-[220px]"
                options={[
                  { value: 'ALL', label: 'Táº¥t cáº£' },
                  { value: 'PENDING', label: 'Äang chá» duyá»‡t' },
                  { value: 'APPROVED', label: 'ÄÃ£ duyá»‡t' },
                  { value: 'REJECTED', label: 'Bá»‹ tá»« chá»‘i' }
                ]}
              />
              <Input
                allowClear
                prefix={<SearchOutlined />}
                className="min-w-[220px] flex-1"
                placeholder="TÃ¬m tÃªn, email, trÆ°á»ng..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Button onClick={loadRows}>LÃ m má»›i</Button>
          </>
        )}
      >
        <div className="p-2 sm:p-3">
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filteredRows}
            scroll={{ x: 980 }}
            pagination={{ pageSize: 8 }}
            locale={{ emptyText: 'ChÆ°a cÃ³ yÃªu cáº§u xÃ¡c thá»±c nÃ o.' }}
          />
        </div>
      </DataPanel>
    </PageShell>
  );
}
