import { Tag } from 'antd';
import {
  applicationStatusLabels,
  offerStatusLabels,
  paymentStatusLabels,
  portfolioStatusLabels,
  projectStatusLabels,
  statusColors,
  verificationStatusLabels
} from '../constants/status';

export function StatusBadge({ status }) {
  const normalizedStatus = status || 'UNKNOWN';
  const label =
    verificationStatusLabels[normalizedStatus] ||
    projectStatusLabels[normalizedStatus] ||
    offerStatusLabels[normalizedStatus] ||
    applicationStatusLabels[normalizedStatus] ||
    paymentStatusLabels[normalizedStatus] ||
    portfolioStatusLabels[normalizedStatus] ||
    status ||
    'Không rõ';

  return (
    <Tag
      className="status-badge"
      color={statusColors[normalizedStatus] || 'default'}
      title={label}
    >
      {label}
    </Tag>
  );
}
