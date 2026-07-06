import { Link } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import Badge from '../common/Badge.jsx';
import Card from '../common/Card.jsx';

export default function ProfileCard({ user }) {
  return (
    <Card className="mypage-profile-card">
      <div className="mypage-avatar" aria-hidden="true">
        {user.profileImage ? <img src={user.profileImage} alt="" /> : <UserRound size={28} />}
      </div>
      <div className="mypage-profile-info">
        <p className="eyebrow">Profile</p>
        <h2>{user.nickname || user.name || '사용자'}</h2>
        <p>{user.email}</p>
        <div className="mypage-profile-badges">
          <Badge variant="primary">{user.region || '지역 미설정'}</Badge>
          {(user.interests || []).map((interest) => (
            <Badge key={interest}>{interest}</Badge>
          ))}
        </div>
      </div>
      <Link to="/mypage/profile" className="ui-button ui-button-secondary ui-button-sm">
        프로필 수정
      </Link>
    </Card>
  );
}
