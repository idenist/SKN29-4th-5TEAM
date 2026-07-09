export default function Footer() {
  return (
    <footer className="layout-footer">
      <div className="layout-footer-inner">
        <section className="layout-footer-about">
          <h2>
            <img className="layout-footer-logo" src="/home_logo.png" alt="" aria-hidden="true" />
            이젠, 안쉼
          </h2>
          <p>청년 정책 통합 플랫폼</p>
        </section>
        <div className="layout-footer-info" aria-label="프로젝트 정보">
          <p>SK Networks ENCORE</p>
          <p>SKN-29-백수구조대</p>
          <p>서울 금천구 가산디지털1로 25 18층 플레이데이터</p>
        </div>
      </div>
    </footer>
  );
}
