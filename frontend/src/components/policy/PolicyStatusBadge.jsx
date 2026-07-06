import Badge from '../common/Badge.jsx';

const statusVariantMap = {
  예정: 'neutral',
  신청가능: 'success',
  마감임박: 'warning',
  마감: 'danger',
  확인필요: 'neutral'
};

export default function PolicyStatusBadge({ status }) {
  return <Badge variant={statusVariantMap[status] || 'neutral'}>{status}</Badge>;
}
