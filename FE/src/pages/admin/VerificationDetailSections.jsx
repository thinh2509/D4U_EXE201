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
import { Alert, Button, Card, Tag, Tooltip } from 'antd';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { formatDate, formatFileSize } from '../../utils/format.js';

const CHECKLIST_ITEMS = [
  'Tên trên giấy tờ khớp với hồ sơ sinh viên.',
  'Trường học thể hiện trên giấy tờ khớp với thông tin hồ sơ.',
  'Ảnh hoặc file đủ rõ để kiểm tra chi tiết cần thiết.',
  'Không phát hiện dấu hiệu bất thường hoặc che khuất thông tin quan trọng.'
];

function surfaceCardClassName(extra = '') {
  return `overflow-hidden rounded-[20px] border border-d4u-border/80 bg-white shadow-sm ${extra}`.trim();
}

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

function buildMetadataItems(detail) {
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
      key: 'document-kind',
      label: 'Loại tài liệu',
      value: fileKind.label
    },
    {
      key: 'extension',
      label: 'Định dạng',
      value: detail.fileExtension?.toUpperCase()
    },
    {
      key: 'size',
      label: 'Dung lượng',
      value: formatFileSize(detail.fileSizeBytes)
    },
    {
      key: 'submitted-at',
      label: 'Ngày gửi',
      value: formatDate(detail.submittedAt)
    },
    {
      key: 'reviewed-at',
      label: 'Ngày xử lý',
      value: detail.reviewedAt ? formatDate(detail.reviewedAt) : 'Chưa xử lý',
      muted: !detail.reviewedAt
    }
  ];
}

function MetaItem({ label, value, mono = false, muted = false, wide = false }) {
  return (
    <div
      className={[
        'min-w-0 rounded-[18px] border border-d4u-border/80 bg-d4u-soft/60 px-4 py-3.5',
        wide ? 'sm:col-span-2' : ''
      ].join(' ').trim()}
    >
      <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-d4u-text-2">
        {label}
      </span>
      <strong
        className={[
          'mt-2 block min-w-0 break-words text-sm leading-5 text-d4u-text-1',
          mono ? 'font-mono text-[13px]' : '',
          muted ? 'text-d4u-text-2' : ''
        ].join(' ').trim()}
      >
        {value || 'Chưa cập nhật'}
      </strong>
    </div>
  );
}

function InfoList({ items, allowCopy = false, onCopy }) {
  return (
    <dl className="grid gap-4">
      {items.map((item) => (
        <div
          className="grid gap-1.5 border-b border-d4u-border/70 pb-4 last:border-b-0 last:pb-0"
          key={item.label}
        >
          <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-d4u-text-2">
            {item.label}
          </dt>
          <dd className="m-0">
            <div className="flex min-w-0 items-start gap-2">
              <span
                className={[
                  'min-w-0 flex-1 break-words text-sm leading-6 text-d4u-text-1',
                  item.truncate ? 'truncate' : ''
                ].join(' ').trim()}
              >
                {item.value || 'Chưa cập nhật'}
              </span>
              {allowCopy && item.copyValue ? (
                <Tooltip title="Sao chép giá trị đầy đủ">
                  <Button
                    aria-label={`Sao chép ${item.label.toLowerCase()}`}
                    className="!h-8 !w-8 !rounded-[10px] !border !border-d4u-border/80 !bg-white !text-d4u-text-2 hover:!border-d4u-cyan hover:!bg-d4u-soft hover:!text-d4u-cyan"
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

export function VerificationDetailHeader({ canReview, detail, onBack }) {
  const headerStats = buildHeaderStats(detail);

  return (
    <div className="mb-6 rounded-[24px] border border-d4u-border/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={detail.status} />
            <Tag
              className="!m-0 !rounded-full !border !border-amber-300/70 !bg-amber-50 !px-3 !py-1 !font-semibold !text-amber-800"
              icon={<SafetyCertificateOutlined />}
            >
              Dữ liệu nhạy cảm
            </Tag>
          </div>
          <h1 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight text-d4u-text-1 sm:text-[32px]">
            Chi tiết xác thực
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-d4u-text-2 sm:text-[15px]">
            Kiểm tra giấy tờ và đối chiếu hồ sơ trước khi đưa ra quyết định.
          </p>
          <div className="mt-4 flex items-start gap-3 rounded-[16px] border border-amber-300/40 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-900">
            <MailOutlined className="mt-0.5 text-base text-amber-700" />
            <span>
              Email được mask mặc định để an toàn hơn khi demo và review nội bộ.
              {!canReview ? ' Yêu cầu này đã có kết quả xử lý nên action review được khóa ở sidebar.' : ''}
            </span>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 xl:w-auto xl:min-w-[180px]">
          <Button
            className="!h-11 !rounded-[12px] !border !border-d4u-border/80 !bg-d4u-soft/70 !px-4 !font-semibold !text-d4u-text-2 hover:!border-d4u-cyan hover:!bg-d4u-soft hover:!text-d4u-teal-deep"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
          >
            Quay lại
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {headerStats.map((item) => (
          <div
            className={[
              'flex min-w-0 items-start gap-3 rounded-[18px] border border-d4u-border/80 bg-d4u-soft/60 px-4 py-3.5',
              item.muted ? 'text-d4u-text-2' : ''
            ].join(' ').trim()}
            key={item.key}
          >
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white text-d4u-cyan shadow-sm">
              {item.icon}
            </div>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-d4u-text-2">
                {item.label}
              </span>
              <strong className="mt-1 block min-w-0 break-words text-sm leading-5 text-d4u-text-1">
                {item.value}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FileMetadataGrid({ detail }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {buildMetadataItems(detail).map((item) => (
        <MetaItem
          key={item.key}
          label={item.label}
          mono={item.mono}
          muted={item.muted}
          value={item.value}
          wide={item.wide}
        />
      ))}
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

  return (
    <Card
      className={surfaceCardClassName()}
      title={(
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <strong className="block text-[17px] font-semibold text-d4u-text-1">File xác thực</strong>
            <span className="mt-1 block text-sm leading-6 text-d4u-text-2">
              Preview giấy tờ và metadata để đối chiếu nhanh.
            </span>
          </div>
          <Tag
            className="!m-0 !inline-flex !w-fit !items-center !gap-2 !rounded-full !border !border-d4u-cyan/25 !bg-d4u-soft !px-3 !py-1 !font-semibold !text-d4u-teal-deep"
            icon={fileKind.icon}
          >
            {fileKind.label}
          </Tag>
        </div>
      )}
    >
      {documentError ? (
        <Alert
          className="mb-5"
          description="Kiểm tra lại kết nối hoặc mở file trực tiếp nếu tài liệu đã khả dụng."
          message={documentError}
          showIcon
          type="error"
        />
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-[18px] border border-d4u-border/80 bg-d4u-soft/60 p-3">
        <Button
          aria-label="Mở tài liệu trong tab mới"
          className="!h-11 !rounded-[12px] !border !border-d4u-border/80 !bg-white !px-4 !font-medium !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
          icon={<EyeOutlined />}
          onClick={onOpenDocument}
        >
          {isImage ? 'Mở ảnh' : 'Mở file'}
        </Button>
        <Button
          aria-label="Tải xuống tài liệu xác thực"
          className="!h-11 !rounded-[12px] !border !border-d4u-border/80 !bg-white !px-4 !font-medium !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
          icon={<DownloadOutlined />}
          onClick={onDownload}
        >
          Tải xuống
        </Button>
        {hasPreview ? (
          <Button
            aria-label="Xem tài liệu toàn màn hình"
            className="!h-11 !rounded-[12px] !border !border-d4u-border/80 !bg-white !px-4 !font-medium !text-d4u-text-1 hover:!border-d4u-cyan hover:!text-d4u-teal-deep"
            icon={<ExpandOutlined />}
            onClick={onOpenDocument}
          >
            Xem toàn màn hình
          </Button>
        ) : null}
      </div>

      <div className="mb-5">
        <FileMetadataGrid detail={detail} />
      </div>

      <div className="grid min-h-[360px] place-items-center overflow-hidden rounded-[22px] border border-d4u-border/80 bg-gradient-to-b from-white to-d4u-soft/50 sm:min-h-[460px] xl:min-h-[560px]">
        {documentUrl && isImage ? (
          <img
            alt={`Giấy tờ xác thực ${detail.originalFilename}`}
            className="h-full max-h-[620px] w-full object-contain"
            src={documentUrl}
          />
        ) : null}
        {documentUrl && isPdf ? (
          <iframe
            className="h-[620px] w-full border-0"
            src={documentUrl}
            title={`Xem trước ${detail.originalFilename}`}
          />
        ) : null}
        {documentUrl && !isImage && !isPdf ? (
          <div className="grid max-w-[380px] justify-items-center gap-3 px-6 py-8 text-center">
            <FileTextOutlined className="text-[30px] text-d4u-teal-muted" />
            <strong className="text-base text-d4u-text-1">Không có preview trực tiếp cho loại file này.</strong>
            <span className="text-sm leading-6 text-d4u-text-2">
              Mở tài liệu trong tab mới hoặc tải xuống để kiểm tra chi tiết.
            </span>
            <Button icon={<EyeOutlined />} onClick={onOpenDocument} type="primary">
              Mở tài liệu
            </Button>
          </div>
        ) : null}
        {!documentUrl && !documentError ? (
          <div className="grid max-w-[380px] justify-items-center gap-3 px-6 py-8 text-center">
            <ClockCircleOutlined className="text-[30px] text-d4u-teal-muted" />
            <strong className="text-base text-d4u-text-1">Đang tải file xác thực...</strong>
            <span className="text-sm leading-6 text-d4u-text-2">
              Preview sẽ xuất hiện ngay khi tài liệu sẵn sàng.
            </span>
          </div>
        ) : null}
        {!documentUrl && documentError ? (
          <div className="grid max-w-[380px] justify-items-center gap-3 px-6 py-8 text-center">
            <FilePdfOutlined className="text-[30px] text-d4u-error" />
            <strong className="text-base text-d4u-error">Không thể hiển thị preview tài liệu.</strong>
            <span className="text-sm leading-6 text-d4u-text-2">
              Admin vẫn có thể thử mở trực tiếp hoặc tải xuống khi cần đối chiếu.
            </span>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export function VerificationAccountCard({ detail, onCopy }) {
  return (
    <Card className={surfaceCardClassName()} title="Tài khoản">
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
    <Card className={surfaceCardClassName()} title="Hồ sơ sinh viên">
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
    <Card className={surfaceCardClassName()} title="Checklist kiểm tra">
      <div className="grid gap-3">
        {buildChecklistItems().map((item) => (
          <div
            className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-[18px] border border-d4u-border/80 bg-d4u-soft/60 px-4 py-3.5"
            key={item.id}
          >
            <div className="grid h-9 w-9 place-items-center rounded-[12px] bg-green-50 text-d4u-success">
              <CheckCircleOutlined />
            </div>
            <div className="grid gap-1">
              <strong className="text-sm text-d4u-text-1">{item.label}</strong>
              <span className="text-sm leading-6 text-d4u-text-2">{item.helper}</span>
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
    <Card className={surfaceCardClassName()} title="Quyết định xác thực">
      <div className="grid gap-5">
        <div className="grid gap-1.5">
          <strong className="text-sm text-d4u-text-1">
            {canReview ? 'Sẵn sàng đưa ra quyết định' : 'Yêu cầu này đã được xử lý'}
          </strong>
          <span className="text-sm leading-6 text-d4u-text-2">
            {canReview
              ? 'Đối chiếu file và hồ sơ trước khi duyệt hoặc từ chối.'
              : 'Nút hành động được khóa để tránh thay đổi ngoài flow hiện tại.'}
          </span>
        </div>

        <div className="grid gap-2.5">
          <Button
            block
            className="!h-11 !rounded-[12px] !font-semibold"
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
            danger
            className="!h-11 !rounded-[12px] !border-red-300 !font-semibold hover:!border-red-500 hover:!bg-red-50"
            disabled={!canReview}
            icon={<CloseCircleOutlined />}
            loading={acting}
            onClick={onReject}
          >
            Từ chối
          </Button>
        </div>

        {detail.rejectionReason ? (
          <Alert
            description={detail.rejectionReason}
            message="Lý do từ chối hiện tại"
            showIcon
            type="error"
          />
        ) : null}
      </div>
    </Card>
  );
}
