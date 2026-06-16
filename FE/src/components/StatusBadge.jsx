import { Tag } from 'antd';
import {
  applicationStatusLabels,
  featurePackageStatusLabels,
  offerStatusLabels,
  paymentStatusLabels,
  portfolioStatusLabels,
  projectStatusLabels,
  statusColors,
  userStatusLabels,
  verificationStatusLabels
} from '../constants/status';

export function StatusBadge({ status }) {
  const normalizedStatus = status || 'UNKNOWN';
  const label =
    verificationStatusLabels[normalizedStatus] ||
    userStatusLabels[normalizedStatus] ||
    projectStatusLabels[normalizedStatus] ||
    offerStatusLabels[normalizedStatus] ||
    applicationStatusLabels[normalizedStatus] ||
    paymentStatusLabels[normalizedStatus] ||
    featurePackageStatusLabels[normalizedStatus] ||
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
