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
  const label =
    verificationStatusLabels[status] ||
    projectStatusLabels[status] ||
    offerStatusLabels[status] ||
    applicationStatusLabels[status] ||
    paymentStatusLabels[status] ||
    portfolioStatusLabels[status] ||
    status ||
    'Không rõ';

  return <Tag className="status-badge" color={statusColors[status] || 'default'}>{label}</Tag>;
}
