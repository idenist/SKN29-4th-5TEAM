import React, { useState, useEffect } from 'react';

const VideoPage = () => {
  const [videoList, setVideoList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        
        // 📜 입력해주신 video_info 데이터 30개 전수 적재 및 문법 오류 교정 완료[cite: 1]
        setVideoList([
          {
            "id": 1,
            "title": "2026 서울시 청년수당 오리엔테이션 | 이거 모르면 큰일 나!",
            "description": "매월 50만원 x 최대 6개월 + 성장지원 프로그램 ‘청년수당’ 오리엔테이션 영상을 공개합니다.",
            "source": "서울광역청년센터",
            "embedId": "OIxqbaCMZVs"
          },
          {
            "id": 2,
            "title": "2026 서울청년문화패스 신청자 모집중! (feat. 21~23세 서울 청년)",
            "description": "서울시가 '21~23세' 청년들에게 문화관람비 20만 원을 지원하는 '2026년 서울청년문화패스'의 신청자를 모집합니다👏",
            "source": "서울시 문화본부",
            "embedId": "WNhdjcDN_Zs"
          },
          {
            "id": 3,
            "title": "대중교통 탈수록 돈 들어옵니다 💰 (K패스 실화)",
            "description": "2026년형 K-패스, 이용만 하면 시스템이 알아서 가장 유리한 환급 방식을 자동 적용해드립니다! 💙",
            "source": "국토교통부",
            "embedId": "tKQunNX8MyA"
          },
          {
            "id": 4,
            "title": "(선착순!) 면접 볼 사람! 결혼식 갈 사람 집중! 사지마세요. 빌려드립니다!",
            "description": "면접을 앞두고 어떤 옷을 입어야 할지 고민이라면? 용인시가 취업을 준비하는 청년들을 위해 운영하는 ‘용인청년희망옷장’을 소개합니다✨",
            "source": "용인시 청년정책과 용튜버",
            "embedId": "89qs6h5ucv0"
          },
          {
            "id": 5,
            "title": "청년월세지원, 그냥 신청하면 떨어집니다｜지원금 받는 법 총정리｜법무법인 고구려",
            "description": "청년월세지원의 현실적인 탈락 이유와 예외 기준을 짚어보고, 수천만 원의 소중한 보증금을 지키기 위한 필수 법률 체크리스트 및 계약서 특약 조항을 정리해 드립니다.",
            "source": "법무법인 고구려",
            "embedId": "bRkONeiIVlU"
          },
          {
            "id": 6,
            "title": "💲 청년을 위한 단 하나의 적금계좌ㅣ청미적을 할까, 투자를 할까?ㅣ청년미래적금 ㅣ금융꿀팁",
            "description": "청년들의 자산형성을 위해 올해 새로 출시된 청년미래적금에 대한 총정리 영상을 준비했습니다.",
            "source": "박곰희TV",
            "embedId": "NOl9u50dgao"
          },
          {
            "id": 7,
            "title": "“매달 50만 원 준다고?” 취준생, 알바생 주목! 국민취업지원제도의 모든 것 (신청부터 지급까지)",
            "description": "취업 준비와 생활비 걱정을 동시에 해결해 줄 국민취업지원제도의 자격 조건부터 신청 방법, 그리고 놓치면 안 될 알짜 혜택까지 핵심만 깔끔하게 정리해 드립니다.",
            "source": "김짠부",
            "embedId": "YyQIX4GtIcA"
          },
          {
            "id": 8,
            "title": "꼭 알아야할 2026년 '청년 대상' 지원금 총정리!",
            "description": "2026년부터 청년들이 가장 체감할 수 있는 지원들이 크게 바뀝니다. 청년 대상 적금, 공공임대주택, 국민취업지원제도 등의 소득 기준과 지원 금액까지! 달라지는 핵심 정보만 빠르게 정리했습니다.",
            "source": "성장가이드, 조은언니",
            "embedId": "S0HqJccz6xo"
          },
          {
            "id": 9,
            "title": "최대 500만원 지원? 2026년 최신! 국민내일배움카드 신청방법 💳2분 요약 정리!",
            "description": "2026년 취업준비, 이직준비, 자격증... 내돈내산 말고 내일배움카드💳로 해결하자! 최대 500만원까지 국비지원되는 국민내일배움카드 혜택을 지금바로 확인해보세요🙌",
            "source": "한직교",
            "embedId": "L8WRtRfik3U"
          },
          {
            "id": 10,
            "title": "수업만 들어도 매달 최대 80만원💸 2026 국민내일배움카드 훈련장려금 완전 정리 3분 요약!",
            "description": "국비지원 교육을 들으면서 월 최대 80만원까지 받을 수 있는 훈련장려금이 있다는 사실 알고 계시나요?",
            "source": "한직교",
            "embedId": "dYFCCaQvdPA"
          },
          {
            "id": 11,
            "title": "청년창업지원금 95%가 몰라서 못 받는 정부지원 l 📢청년창업자금 2026 총정리🏅",
            "description": "사업 시작을 위한 예비·초기창업패키지 핵심 요건부터 청년창업자금의 특징까지, 든든한 정부 지원 창업 자금 정보를 표 한 장으로 깔끔하게 총정리해 드립니다.",
            "source": "여팀장 여바른 l 정책자금 l 엘아이파트너스",
            "embedId": "e52rX4FfZdE"
          },
          {
            "id": 12,
            "title": "경쟁자 없어 남아도는 지원금? 2026년 창업지원금 5천만원 몰래 챙기세요",
            "description": "정부지원사업 완전정복! 나는솔로 28기 영수 사례로 본 지원금 전략? 예비창업자라면 지금부터 준비해야 할 핵심 포인트까지!",
            "source": "법학자훈훈이 인사이트 _ 사람과 경제",
            "embedId": "jINNCqnUSL8"
          },
          {
            "id": 13,
            "title": "2026년 창업지원정책 총정리! 창업3종패키지부터 글로벌 진출 정책까지!!",
            "description": "예비창업자부터 스케일업을 꿈꾸는 대표님들까지, 올해 놓치면 100% 후회할 중소벤처기업부 핵심 정책을 머니포차에서 싹 다 정리해 드립니다.",
            "source": "중소벤처기업부",
            "embedId": "H_-doODQSKo"
          },
          {
            "id": 14,
            "title": "매주 쏟아지는 창업지원사업, 52선! (2026년 7월 2주차) 알아두면 도움되는 지원사업들 | MNL뉴스",
            "description": "2026년 7월 2주차, 창업가들이 꼭 알아두어야 할 52가지 유망 창업 지원 사업과 공모전 정보를 깔끔하게 정리해 드립니다.",
            "source": "엠엔엘 - 스타트업 클럽",
            "embedId": "MiET3xmL7uo"
          },
          {
            "id": 15,
            "title": "서울 사는 청년인데 이거 모른다고? | 복지탐정단 1화 청년복지",
            "description": "서울시 복지탐정단이 미처 몰랐던 다양한 청년 지원 정책과 혜택을 샅샅이 파헤쳐 드립니다!",
            "source": "서울시복지재단TV",
            "embedId": "8gqEEHOvb2A"
          },
          {
            "id": 16,
            "title": "무엇이든 물어보시게 2026 청년지원 예산안! #2026년청년예산안",
            "description": "요즘 청년들의 고민을 덜어주기 위해 대학생 기자단이 직접 기재부 상담소 무엇이든 물어보시게~ 를 찾아갔습니다.",
            "source": "재정경제부",
            "embedId": "l5niwo_dSCY"
          },
          {
            "id": 17,
            "title": "(주)구직단념청년(목) 예은이도 놓지지 않을 결심한 청년도전지원사업",
            "description": "예은이도 감동받은 고용노동부 청년도전지원사업! 6개월 이상 취직 안 하신 청년들은 여기 주목!",
            "source": "고용노동부",
            "embedId": "-9o-uWz8Cww"
          },
          {
            "id": 18,
            "title": "대기업이 ‘취준생 교육’ 나선다…청년 정책 발표",
            "description": "취업난을 겪는 청년들을 위해 정부가 대기업 주도의 직무 교육 프로그램과 AI 부트캠프 등 실질적인 취업 지원책을 대폭 확대합니다.",
            "source": "KBS News",
            "embedId": "Hy6bUKbe18k"
          },
          {
            "id": 19,
            "title": "📢2026년 경기도 청년기본소득 1분기 모집",
            "description": "경기도 거주 24세 청년이라면? 지금 바로 신청하세요! 분기별 25만 원(최대 100만 원)💰을 받을 수 있는 기회!",
            "source": "경기도미래세대재단",
            "embedId": "YIJSt_XRSOY"
          },
          {
            "id": 20,
            "title": "오세훈, 임기 첫 정책은 '청년'...\"AI 이용권 무료\"",
            "description": "오세훈 서울시장, 민선 9기 첫 정책으로 청년 지원 서울 청년들에게 AI 무료 이용권 제공 추진",
            "source": "YTN",
            "embedId": "1qK6pHBeGsU"
          },
          {
            "id": 21,
            "title": "청년도전지원사업 후기 브이로그VLOG I 고용노동부 I 청도지 I 중기프로그램 I 월50만원 I 국가사업 I 청년 I 취업지원제도 I 청도지 I 국민취업지원제도 I 내일배움",
            "description": "백수에서 공방 사장으로! 고용노동부 '청년도전지원사업'을 통해 3개월간 지원금 170만 원을 받고 취업에 성공한 생생한 수료 후기 브이로그입니다.",
            "source": "링이 RINGEE",
            "embedId": "5XLtIMDZ1jk"
          },
          {
            "id": 22,
            "title": "요즘 2030이 빨리 퇴사하는 이유 (김경일X장동선)ㅣ10분 토론 / 14F",
            "description": "2025년 8월 기준, 일도 구직도 하지 않는 20대·30대 '쉬었음’ 인구가 76만명을 넘어섰다. 청년들이 쉬는 이유는 뭘까?",
            "source": "14F 일사에프",
            "embedId": "hoQxOqJhZ5U"
          },
          {
            "id": 23,
            "title": "경기도, '청년면접수당' 접수…최대 15만원 지원 [경기]",
            "description": "경기도가 구직 청년의 면접 비용 부담을 덜어주기 위해 1회당 5만 원씩, 연간 최대 3회까지 총 15만 원의 면접 수당을 지역화폐로 지원합니다.",
            "source": "B tv 뉴스",
            "embedId": "rElDJcnATrk"
          },
          {
            "id": 24,
            "title": "원주시, ‘정착 청년 4배 통장’ 지원사업 첫 시행 (2026. 5. 19 원주MBC)",
            "description": "원주시가 지역 정착 청년 근로자의 자산 형성을 돕기 위해 매월 최대 40만 원을 적립해 주는 ‘정착 청년 4배 통장’ 지원사업을 새롭게 시행합니다.",
            "source": "원주MBC NEWS",
            "embedId": "WZBWus0yqyw"
          },
          {
            "id": 25,
            "title": "서울시, ‘개인회생 청년’ 백만 원 지원 모집 / KBS 2026.04.03.",
            "description": "서울시 복지재단에서 개인회생 절차를 마친 만 19~39세 청년을 대상으로 금융 교육, 상담, 자립 지원금 100만 원을 제공하는 '청년 자립 토대 지원사업' 참가자를 모집합니다.",
            "source": "KBS News",
            "embedId": "EAuEbzruXNY"
          },
          {
            "id": 26,
            "title": "“AI로 면접 준비해요”…지자체 청년 취업 지원 정책 호응",
            "description": "취업난을 겪는 청년을 위해 AI 면접 준비부터 자격증 응시료 지원까지, 지자체의 실질적이고 다양한 취업 지원 정책을 소개합니다.",
            "source": "KBS News",
            "embedId": "hWCKxYqlrxM"
          },
          {
            "id": 27,
            "title": "[한눈에 경제] 정부 지원금 받는 '청년통장'…나만 몰랐던 세부 자격",
            "description": "정부 지원금을 더해주는 다양한 '청년 통장'의 대상과 혜택을 낱낱이 분석하고, 나에게 꼭 맞는 목돈 마련 전략을 확인해 보세요.",
            "source": "KBS News",
            "embedId": "O8OrRJuTNjk"
          },
          {
            "id": 28,
            "title": "결혼 페널티부터 청년주택까지…청년재단이 정책을 바꾼 방법",
            "description": "결혼 페널티 완화부터 청년 정착 지원까지, 청년재단 오창석 이사장과 함께 청년들의 현실적인 고민과 이를 해결하기 위한 실효성 있는 정책의 변화 방향을 심도 있게 짚어봅니다.",
            "source": "한국경제TV뉴스",
            "embedId": "UZqWqpoCAko"
          },
          {
            "id": 29,
            "title": "2026년 고졸 취업 활성화 지원 사업설명회",
            "description": "직업계고 학생의 성공적인 사회 진출과 취업 후 성장을 지원하기 위한 현장실습 지원금, 기업 현장교육 지원, 취업연계 및 청년일자리도약장려금 등 주요 4대 지원 사업의 핵심 내용과 신청 절차를 안내합니다.",
            "source": "한국장학재단",
            "embedId": "GkPwbolGnc4"
          },
          {
            "id": 30,
            "title": "[오늘의 장학] 신청할 수 있는 장학금 정보 전부 알려드림🎓 | 국가장학금, 국가근로장학금, 주거안정장학금, 대학생 청소년 AI 교육지원사업",
            "description": "국가장학금부터 국가근로, 주거안정장학금, 그리고 대학생 청소년 AI 교육지원사업까지! 이번 학기 놓치지 말아야 할 필수 장학금 신청 정보와 핵심 가이드를 한 번에 정리해 드립니다.",
            "source": "한국장학재단",
            "embedId": "w-jr7TZ-Jnc"
          }
        ]);
      } catch (err) {
        setError('영상 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (isLoading) return <div style={{ padding: '40px', backgroundColor: '#f4f5f9', minHeight: '100vh', textAlign: 'center' }}>로딩 중...</div>;
  if (error) return <div style={{ padding: '40px', backgroundColor: '#f4f5f9', minHeight: '100vh', color: 'red', textAlign: 'center' }}>{error}</div>;
  if (videoList.length === 0) return <div style={{ padding: '40px', backgroundColor: '#f4f5f9', minHeight: '100vh', textAlign: 'center' }}>표시할 영상이 없습니다.</div>;

  return (
    // 🎨 image_5a1740.jpg 대시보드 배경색 동기화 (#f4f5f9 연회색 배경)
    <div style={{ backgroundColor: '#f4f5f9', minHeight: '100vh', padding: '40px 60px' }}>
      
      {/* 🏷️ 상단 타이틀 및 액션 영역 레이아웃 설정 */}
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', marginBottom: '35px', width: '100%' }}>
        <div style={{ flexGrow: 1 }}>
          {/* 제목 텍스트 일치 처리 */}
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111', margin: '0 0 8px 0' }}>정책 안내 영상</h1>
          {/* 요구사항 배지 UI 스타일 구현 */}
          <span style={{ display: 'inline-block', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace' }}>
            REQ-F-08
          </span>
        </div>

        {/* 🛠️ 설계서 우측 상단 가상 관리용 버튼 컴포넌트 동기화 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            🔒 공개
          </button>
          <button style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#4b5563', cursor: 'pointer' }}>
            ⚙️ MVT ∨
          </button>
        </div>
      </div>

      {/* 📊 설계서의 넓은 2열(2-Column Grid) 종횡비 전용 배치 적용 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(48%, 1fr))', gap: '30px' }}>
        {videoList.map((video) => (
          <div 
            key={video.id} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              backgroundColor: '#fff', 
              borderRadius: '20px', // 라운딩 볼륨 확대
              overflow: 'hidden', 
              boxShadow: '0 10px 25px rgba(0,0,0,0.03)', // 세련된 쉐도우
              border: '1px solid #eef0f5' 
            }}
          >
            {/* 16:9 최우선 반응형 스크린 레이어 */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#000' }}>
              
              {/* 안전 자산 백그라운드 텍스트 */}
              <span style={{ position: 'absolute', color: '#555', fontSize: '14px', zIndex: 0, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                현재 영상을 불러올 수 없습니다.
              </span>

              {/* 임베딩 iframe (자동재생 파라미터 제외 차단 적용) */}
              <iframe
                style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', border: '0' }}
                src={`https://www.youtube.com/embed/${video.embedId}`}
                title={video.title}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            {/* 텍스트 내용 메타 데이터 파트 */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              {/* 제목 두껍게 강조 처리 */}
              <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 'bold', color: '#1a1a1a', lineHeight: '1.4' }}>
                {video.title}
              </h3>
              {/* 회색 요약 안내 문구 */}
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5', flexGrow: 1 }}>
                {video.description}
              </p>
              
              {/* 🔵 설계서 지정 - "출처:" 글자 없이 선명한 블루 계열 단독 출처 텍스트 표기 */}
              <div style={{ marginTop: 'auto' }}>
                <span style={{ color: '#2563eb', fontWeight: '600', fontSize: '13px' }}>
                  {video.source}
                </span>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

export default VideoPage;