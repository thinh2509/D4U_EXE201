import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  ExpandOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  MailOutlined,
  ProfileOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { Alert, Button, Card, Space, Tag, Tooltip } from 'antd';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { formatDate, formatFileSize } from '../../utils/format.js';

const CHECKLIST_ITEMS = [
  'Tên trên giấy tờ khớp với hồ sơ sinh viên.',
  'Trường học thể hiện trên giấy tờ khớp với thông tin hồ sơ.',
  'Ảnh hoặc file đủ rõ để kiểm tra chi tiết cần thiết.',
  'Không phát hiện dấu hiệu bất thường hoặc che khuất thông tin quan trọng.'
];

export function maskEmail(value) {
  if (!value || !value.includes('@')) return value || 'Chưa cập nhật';
  const [localPart, domain] = value.split('@');
  if (!localPart) return value;
  const visible = localPart.slice(0, Math.min(5, localPart.length));
  const hiddenLength = Math.max(4, localPart.length - visible.length);
  return `${visible}${'*'.repeat(hiddenLength)}@${domain}`;
}

export function getVerificationFileKind(detail) {
  if (detail?.mimeType?.startsWith('image/')) {
    return { key: 'image', label: 'Hình ảnh', icon: <FileImageOutlined /> };
  }

  if (detail?.mimeType === 'application/pdf') {
    return { key: 'pdf', label: 'PDF', icon: <FilePdfOutlined /> };
  }

  return { key: 'file', label: 'Tài liệu', icon: <FileTextOutlined /> };
}

export function buildChecklistItems() {
  return CHECKLIST_ITEMS.map((label, index) => ({
    id: `review-check-${index + 1}`,
    label,
    helper: 'Đối chiếu thủ công trước khi đưa ra quyết định.'
  }));
}

function buildHeaderStats(detail) {
  const fileKind = getVerificationFileKind(detail);

  return [
    {
      key: 'document-kind',
      icon: fileKind.icon,
      label: 'Loại tài liệu',
      value: fileKind.label
    },
    {
      key: 'submitted-at',
      icon: <CalendarOutlined />,
      label: 'Ngày gửi',
      value: formatDate(detail.submittedAt)
    },
    {
      key: 'reviewed-at',
      icon: <ClockCircleOutlined />,
      label: 'Ngày xử lý',
      value: detail.reviewedAt ? formatDate(detail.reviewedAt) : 'Chưa xử lý',
      muted: !detail.reviewedAt
    },
    {
      key: 'profile-status',
      icon: <ProfileOutlined />,
      label: 'Hồ sơ sinh viên',
      value: <StatusBadge status={detail.verificationStatus} />
    }
  ];
}

function buildDocumentStripItems(detail) {
  const fileKind = getVerificationFileKind(detail);

  return [
    {
      key: 'filename',
      label: 'Tên file',
      value: detail.originalFilename,
      mono: true,
      wide: true
    },
    {
      key: 'kind',
      label: 'Loại file',
      value: fileKind.label
    },
    {
      key: 'size',
      label: 'Dung lượng',
      value: formatFileSize(detail.fileSizeBytes)
    },
    {
      key: 'submitted',
      label: 'Gửi lúc',
      value: formatDate(detail.submittedAt)
    }
  ];
}

function MetaItem({ label, value, compact = false, mono = false }) {
  return (
    <div className={`verification-meta-item ${compact ? 'is-compact' : ''}`}>
      <span>{label}</span>
      <strong className={mono ? 'is-mono' : ''}>{value || 'Chưa cập nhật'}</strong>
    </div>
  );
}

function InfoList({ items, allowCopy = false, onCopy }) {
  return (
    <dl className="verification-info-list">
      {items.map((item) => (
        <div className="verification-info-row" key={item.label}>
          <dt>{item.label}</dt>
          <dd>
            <div className="verification-info-value-wrap">
              <span className={item.truncate ? 'is-truncate' : ''}>{item.value || 'Chưa cập nhật'}</span>
              {allowCopy && item.copyValue ? (
                <Tooltip title="Sao chép giá trị đầy đủ">
                  <Button
                    aria-label={`Sao chép ${item.label.toLowerCase()}`}
                    className="verification-inline-action"
                    icon={<CopyOutlined />}
                    onClick={() => onCopy?.(item.copyValue, `Đã sao chép ${item.label.toLowerCase()}.`)}
                    size="small"
                    type="text"
                  />
                </Tooltip>
              ) : null}
            </div>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function VerificationDetailHeader({ acting, canReview, detail, onApprove, onBack, onReject }) {
  const headerStats = buildHeaderStats(detail);

  return (
    <div className="verification-header-shell">
      <div className="verification-header-main">
        <div className="verification-header-copy">
          <div className="verification-header-badges">
            <StatusBadge status={detail.status} />
            <Tag className="verification-sensitive-tag" icon={<SafetyCertificateOutlined />}>
              Dữ liệu nhạy cảm
            </Tag>
          </div>
          <h1>Chi tiết xác thực</h1>
          <p>Kiểm tra giấy tờ và đối chiếu hồ sơ trước khi đưa ra quyết định.</p>
        </div>

        <div className="verification-header-stats">
          {headerStats.map((item) => (
            <div className={`verification-header-stat ${item.muted ? 'is-muted' : ''}`} key={item.key}>
              <div className="verification-header-stat-icon" aria-hidden="true">
                {item.icon}
              </div>
              <div className="verification-header-stat-copy">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="verification-sensitive-note">
          <MailOutlined />
          <span>Email được mask mặc định để an toàn hơn khi demo và review nội bộ.</span>
        </div>
      </div>

      <div className="verification-header-rail">
        <div className="verification-header-rail-copy">
          <strong>{canReview ? 'Sẵn sàng review' : 'Đã có kết quả xử lý'}</strong>
          <span>
            {canReview
              ? 'Ưu tiên đối chiếu metadata và preview trước khi duyệt hoặc từ chối.'
              : 'Thao tác được khóa để giữ nguyên flow xác thực hiện tại.'}
          </span>
        </div>
        <Space className="verification-header-actions" direction="vertical" size={10}>
          <Button className="verification-action-button is-secondary" icon={<ArrowLeftOutlined />} onClick={onBack}>
            Quay lại
          </Button>
          <Button
            block
            className="verification-action-button is-primary"
            disabled={!canReview}
            icon={<CheckCircleOutlined />}
            loading={acting}
            onClick={onApprove}
            type="primary"
          >
            Duyệt
          </Button>
          <Button
            block
            className="verification-action-button is-danger-outline"
            danger
            disabled={!canReview}
            icon={<CloseCircleOutlined />}
            loading={acting}
            onClick={onReject}
          >
            Từ chối
          </Button>
        </Space>
      </div>
    </div>
  );
}

export function FileMetadataGrid({ detail }) {
  const fileKind = getVerificationFileKind(detail);

  return (
    <div className="verification-file-grid">
      <MetaItem label="Tên file" value={detail.originalFilename} mono />
      <MetaItem label="Loại tài liệu" value={fileKind.label} />
      <MetaItem label="Định dạng" value={detail.fileExtension?.toUpperCase()} />
      <MetaItem label="Dung lượng" value={formatFileSize(detail.fileSizeBytes)} />
      <MetaItem label="Ngày gửi" value={formatDate(detail.submittedAt)} />
      <MetaItem label="Ngày xử lý" value={formatDate(detail.reviewedAt)} />
    </div>
  );
}

export function VerificationDocumentViewer({
  detail,
  documentError,
  documentUrl,
  onDownload,
  onOpenDocument
}) {
  const fileKind = getVerificationFileKind(detail);
  const isImage = fileKind.key === 'image';
  const isPdf = fileKind.key === 'pdf';
  const hasPreview = documentUrl && (isImage || isPdf);
  const stripItems = buildDocumentStripItems(detail);

  return (
    <Card
      className="verification-review-card verification-document-card"
      title={(
        <div className="verification-card-title">
          <div>
            <strong>File xác thực</strong>
            <span>Preview giấy tờ và metadata để đối chiếu nhanh.</span>
          </div>
          <Tag className="verification-file-tag" icon={fileKind.icon}>
            {fileKind.label}
          </Tag>
        </div>
      )}
    >
      {documentError ? (
        <Alert
          className="verification-alert-inline"
          description="Kiểm tra lại kết nối hoặc mở file trực tiếp nếu tài liệu đã khả dụng."
          message={documentError}
          showIcon
          type="error"
        />
      ) : null}

      <div className="verification-document-toolbar">
        <div className="verification-document-toolbar-copy">
          <div className="verification-document-toolbar-kicker">
            <FileProtectOutlined />
            <span>Metadata tài liệu</span>
          </div>
          <div className="verification-document-strip">
            {stripItems.map((item) => (
              <div
                className={`verification-document-strip-item ${item.wide ? 'is-wide' : ''} ${item.mono ? 'is-mono' : ''}`}
                key={item.key}
              >
                <span>{item.label}</span>
                <strong title={typeof item.value === 'string' ? item.value : undefined}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <Space className="verification-document-toolbar-actions" size={8} wrap>
          <Button
            aria-label="Mở tài liệu trong tab mới"
            icon={<EyeOutlined />}
            onClick={onOpenDocument}
          >
            {isImage ? 'Mở ảnh' : 'Mở file'}
          </Button>
          <Button
            aria-label="Tải xuống tài liệu xác thực"
            icon={<DownloadOutlined />}
            onClick={onDownload}
          >
            Tải xuống
          </Button>
          {hasPreview ? (
            <Button
              aria-label="Xem tài liệu toàn màn hình"
              icon={<ExpandOutlined />}
              onClick={onOpenDocument}
            >
              Xem toàn màn hình
            </Button>
          ) : null}
        </Space>
      </div>

      <div className="verification-document-preview">
        {documentUrl && isImage ? <img alt={`Giấy tờ xác thực ${detail.originalFilename}`} src={documentUrl} /> : null}
        {documentUrl && isPdf ? <iframe src={documentUrl} title={`Xem trước ${detail.originalFilename}`} /> : null}
        {documentUrl && !isImage && !isPdf ? (
          <div className="verification-preview-empty">
            <FileTextOutlined />
            <strong>Không có preview trực tiếp cho loại file này.</strong>
            <span>Mở tài liệu trong tab mới hoặc tải xuống để kiểm tra chi tiết.</span>
            <Button icon={<EyeOutlined />} onClick={onOpenDocument} type="primary">
              Mở tài liệu
            </Button>
          </div>
        ) : null}
        {!documentUrl && !documentError ? (
          <div className="verification-preview-empty">
            <ClockCircleOutlined />
            <strong>Đang tải file xác thực...</strong>
            <span>Preview sẽ xuất hiện ngay khi tài liệu sẵn sàng.</span>
          </div>
        ) : null}
        {!documentUrl && documentError ? (
          <div className="verification-preview-empty is-error">
            <FilePdfOutlined />
            <strong>Không thể hiển thị preview tài liệu.</strong>
            <span>Admin vẫn có thể thử mở trực tiếp hoặc tải xuống khi cần đối chiếu.</span>
          </div>
        ) : null}
      </div>

      <FileMetadataGrid detail={detail} />
    </Card>
  );
}

export function VerificationAccountCard({ detail, onCopy }) {
  return (
    <Card className="verification-review-card" title="Tài khoản">
      <InfoList
        allowCopy
        items={[
          { label: 'Họ tên', value: detail.studentFullName },
          {
            label: 'Email',
            value: maskEmail(detail.studentEmail),
            copyValue: detail.studentEmail,
            truncate: true
          },
          { label: 'Username', value: detail.studentUsername, truncate: true },
          { label: 'Trạng thái tài khoản xác thực', value: <StatusBadge status={detail.status} /> }
        ]}
        onCopy={onCopy}
      />
    </Card>
  );
}

export function StudentProfileCard({ detail }) {
  return (
    <Card className="verification-review-card" title="Hồ sơ sinh viên">
      <InfoList
        items={[
          { label: 'Trường', value: detail.school },
          { label: 'Chuyên ngành', value: detail.major },
          { label: 'Năm bắt đầu', value: detail.studyStartYear ? String(detail.studyStartYear) : 'Chưa cập nhật' },
          { label: 'Bio', value: detail.bio || 'Chưa cập nhật' }
        ]}
      />
    </Card>
  );
}

export function VerificationChecklist() {
  return (
    <Card className="verification-review-card" title="Checklist kiểm tra">
      <div className="verification-checklist">
        {buildChecklistItems().map((item) => (
          <div className="verification-checklist-item" key={item.id}>
            <div className="verification-checklist-icon" aria-hidden="true">
              <CheckCircleOutlined />
            </div>
            <div>
              <strong>{item.label}</strong>
              <span>{item.helper}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function VerificationDecisionPanel({
  acting,
  canReview,
  detail,
  onApprove,
  onReject
}) {
  return (
    <Card className="verification-review-card verification-decision-card" title="Quyết định xác thực">
      <div className="verification-decision-copy">
        <strong>{canReview ? 'Sẵn sàng đưa ra quyết định' : 'Yêu cầu này đã được xử lý'}</strong>
        <span>
          {canReview
            ? 'Đối chiếu file và hồ sơ trước khi duyệt hoặc từ chối.'
            : 'Nút hành động được khóa để tránh thay đổi ngoài flow hiện tại.'}
        </span>
      </div>
      <Space className="verification-decision-actions" direction="vertical" size={10}>
        <Button
          block
          className="verification-action-button is-primary"
          disabled={!canReview}
          icon={<CheckCircleOutlined />}
          loading={acting}
          onClick={onApprove}
          type="primary"
        >
          Duyệt hồ sơ
        </Button>
        <Button
          block
          className="verification-action-button is-danger-outline"
          danger
          disabled={!canReview}
          icon={<CloseCircleOutlined />}
          loading={acting}
          onClick={onReject}
        >
          Từ chối
        </Button>
      </Space>
      {detail.rejectionReason ? (
        <Alert
          className="verification-alert-inline"
          description={detail.rejectionReason}
          message="Lý do từ chối hiện tại"
          showIcon
          type="error"
        />
      ) : null}
    </Card>
  );
}
