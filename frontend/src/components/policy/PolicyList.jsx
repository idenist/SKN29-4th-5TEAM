import PolicyCard from './PolicyCard.jsx';

export default function PolicyList({ policies = [] }) {
  return (
    <div className="policy-list">
      {policies.map((policy, index) => (
        <PolicyCard key={policy.id} policy={policy} index={index} />
      ))}
    </div>
  );
}
