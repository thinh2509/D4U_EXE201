import { FileSearchOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Select, Table, Tag } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader.jsx";
import { DataPanel, PageShell } from "../../components/PageShell.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { ErrorState } from "../../components/StateViews.jsx";
import { adminApi } from "../../services/adminApi.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { formatDate, formatFileSize } from "../../utils/format.js";

export function VerificationListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("PENDING");
  const [query, setQuery] = useState("");
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
    return rows.filter((row) =>
      [row.studentFullName, row.studentEmail, row.school, row.major]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [query, rows]);

  const columns = [
    {
      title: "Sinh viên",
      dataIndex: "studentFullName",
      render: (value, row) => (
        <div>
          <strong>{value}</strong>
          <div className="muted-text">{row.studentEmail}</div>
        </div>
      ),
    },
    { title: "Trường", dataIndex: "school" },
    { title: "Chuyên ngành", dataIndex: "major" },
    {
      title: "Giấy tờ",
      render: (_, row) => (
        <div>
          <span>{row.originalFilename}</span>
          <div className="muted-text">
            {row.mimeType} - {formatFileSize(row.fileSizeBytes)}
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (value) => <StatusBadge status={value} />,
    },
    { title: "Ngày gửi", dataIndex: "submittedAt", render: formatDate },
    {
      title: "Hành động",
      render: (_, row) => (
        <Button
          type="primary"
          ghost
          onClick={() => navigate(`/admin/verifications/${row.id}`)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  if (error) return <ErrorState description={error} onRetry={loadRows} />;

  return (
    <PageShell size="wide">
      <PageHeader
        icon={<FileSearchOutlined />}
        title="Yêu cầu xác thực sinh viên"
        description="Duyệt hoặc từ chối các yêu cầu xác thực giấy tờ."
        extra={<Tag color="cyan">{filteredRows.length} yêu cầu</Tag>}
      />
      <DataPanel
        flush
        header={
          <>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <Select
                value={status}
                onChange={setStatus}
                className="w-full sm:w-[220px]"
                options={[
                  { value: "ALL", label: "Tất cả" },
                  { value: "PENDING", label: "Đang chờ duyệt" },
                  { value: "APPROVED", label: "Đã duyệt" },
                  { value: "REJECTED", label: "Bị từ chối" },
                ]}
              />
              <Input
                allowClear
                prefix={<SearchOutlined />}
                className="min-w-[220px] flex-1"
                placeholder="Tìm tên, email, trường..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Button onClick={loadRows}>Làm mới</Button>
          </>
        }
      >
        <div className="p-2 sm:p-3">
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filteredRows}
            scroll={{ x: 980 }}
            pagination={{ pageSize: 8 }}
            locale={{ emptyText: "Chưa có yêu cầu xác thực nào." }}
          />
        </div>
      </DataPanel>
    </PageShell>
  );
}
