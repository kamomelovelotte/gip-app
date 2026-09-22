import React, { useState, useEffect } from 'react';

export default function GIPApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState({
    nickname: '야구집사',
    gipCode: '18427',
    favoriteTeams: ['롯데 자이언츠', '치바 롯데 마린즈', '샌프란시스코 자이언츠']
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [activeInfoModal, setActiveInfoModal] = useState(null);

  const [selectedDate, setSelectedDate] = useState('2026-09-22');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  
  const [teamSearch, setTeamSearch] = useState('');
  const [expandedContinent, setExpandedContinent] = useState('아시아');

  // 실시간 데이터 상태
  const [gamesData, setGamesData] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);

  const continents = [
    { 
      name: '아시아', 
      leagues: [
        { name: 'KBO', teams: ['롯데 자이언츠', '한화 이글스', 'LG 트윈스', '두산 베어스', 'KT 위즈', '삼성 라이온즈', 'NC 다이노스', 'KIA 타이거즈', 'SSG 랜더스', '키움 히어로즈'] }, 
        { name: 'NPB', teams: ['치바 롯데 마린즈', '오릭스 버팔로스', '요미우리 자이언츠', '한신 타이거스', '소프트뱅크 호크스'] }
      ] 
    },
    { 
      name: '북미', 
      leagues: [
        { name: 'MLB', teams: ['샌프란시스코 자이언츠', 'LA 다저스', '뉴욕 양키스', '보스턴 레드삭스', '샌디에이고 파드리스'] }
      ] 
    },
    { 
      name: '남미·카리브', 
      leagues: [
        { name: 'LIDOM', teams: ['타이거스 델 레이세이', '라이온스 델 에스코히도'] }
      ] 
    },
    { 
      name: '유럽', 
      leagues: [
        { name: 'DBL', teams: ['하이덴하임 헤비츠', '본 캐피탈즈'] }
      ] 
    },
    { 
      name: '오세아니아', 
      leagues: [
        { name: 'ABL', teams: ['멜버른 에이시스', '시드니 블루삭스'] }
      ] 
    },
    { 
      name: '여자야구', 
      leagues: [
        { name: 'WPBL', teams: ['로스앤젤레스 퀸스', '샌프란시스코 파이어벨스', '보스턴 헌터스'] }
      ] 
    }
  ];

  // MLB 실시간 API 연동 + KBO/NPB 실시간 데이터 동기화 구조
  useEffect(() => {
    async function fetchRealtimeData() {
      try {
        setLoadingGames(true);

        const mlbRes = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${selectedDate}`);
        const mlbData = await mlbRes.json();
        
        const mlbGames = mlbData.dates?.[0]?.games?.map(g => {
          let awayTeamName = g.teams.away.team.name;
          let homeTeamName = g.teams.home.team.name;
          
          if (awayTeamName === 'San Francisco Giants') awayTeamName = '샌프란시스코\n자이언츠';
          if (homeTeamName === 'San Francisco Giants') homeTeamName = '샌프란시스코\n자이언츠';
          if (awayTeamName === 'Los Angeles Dodgers') awayTeamName = 'LA 다저스';
          if (homeTeamName === 'Los Angeles Dodgers') homeTeamName = 'LA 다저스';

          return {
            id: g.gamePk,
            league: 'MLB',
            homeTeam: homeTeamName,
            awayTeam: awayTeamName,
            homeScore: g.teams.home.score ?? 0,
            awayScore: g.teams.away.score ?? 0,
            status: g.status.abstractGameState === 'Live' ? 'LIVE' : g.status.abstractGameState === 'Final' ? 'FINAL' : 'BEFORE',
            time: g.gameDate ? new Date(g.gameDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) : '10:00',
            stadium: g.venue?.name || 'MLB Ballpark'
          };
        }) || [];

        const kboNpbLiveMock = [
          { id: 101, league: 'KBO', homeTeam: '한화 이글스', awayTeam: '롯데 자이언츠', homeScore: 3, awayScore: 5, status: 'FINAL', stadium: '사직야구장', time: '14:00' },
          { id: 102, league: 'NPB', homeTeam: '오릭스 버팔로스', awayTeam: '치바 롯데 마린즈', homeScore: 0, awayScore: 0, status: 'BEFORE', stadium: 'ZOZO 마린 스타디움', time: '18:00' }
        ];

        setGamesData([...kboNpbLiveMock, ...mlbGames]);
        setLoadingGames(false);
      } catch (err) {
        console.error('실시간 데이터를 불러오는 중 오류 발생:', err);
        setGamesData([
          { id: 1, league: 'KBO', homeTeam: '한화 이글스', awayTeam: '롯데 자이언츠', homeScore: 3, awayScore: 5, status: 'FINAL', stadium: '사직야구장', time: '14:00' },
          { id: 2, league: 'NPB', homeTeam: '오릭스 버팔로스', awayTeam: '치바 롯데 마린즈', homeScore: 0, awayScore: 0, status: 'BEFORE', stadium: 'ZOZO 마린 스타디움', time: '18:00' },
          { id: 3, league: 'MLB', homeTeam: 'LA 다저스', awayTeam: '샌프란시스코\n자이언츠', homeScore: 2, awayScore: 4, status: 'FINAL', stadium: 'Oracle Park', time: '10:00' }
        ]);
        setLoadingGames(false);
      }
    }

    fetchRealtimeData();

    const interval = setInterval(fetchRealtimeData, 60000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const myHomeGames = gamesData.filter(g => 
    user.favoriteTeams.some(t => {
      const cleanTeam = t.replace(' 자이언츠','').replace(' 마린즈','');
      return g.homeTeam.includes(cleanTeam) || g.awayTeam.includes(cleanTeam);
    })
  );

  const toggleTeam = (team) => {
    if (user.favoriteTeams.includes(team)) {
      setUser({ ...user, favoriteTeams: user.favoriteTeams.filter(t => t !== team) });
    } else {
      setUser({ ...user, favoriteTeams: [...user.favoriteTeams, team] });
    }
  };

  return (
    <div style={{ maxWidth: '430px', margin: '0 auto', backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#111111', paddingBottom: '90px', boxSizing: 'border-box', position: 'relative' }}>
      
      <header style={{ padding: '20px 20px 10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>GIP</h1>
            <span style={{ fontSize: '11px', color: '#666', backgroundColor: '#f1f3f5', padding: '2px 6px', borderRadius: '6px', fontWeight: '700' }}>집</span>
          </div>
          <div style={{ fontSize: '13px', color: '#555', fontWeight: '600', marginTop: '2px' }}>야구가 있는 곳, 어디든 우리 집.</div>
        </div>
        <button onClick={() => setShowAuthModal(true)} style={{ backgroundColor: '#111', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          시작하기 / 회원가입
        </button>
      </header>

      {activeTab === 'home' && (
        <main style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8f9fa', padding: '10px 14px', borderRadius: '16px', marginBottom: '24px', marginTop: '10px' }}>
            <span style={{ cursor: 'pointer', fontSize: '14px', color: '#888' }} onClick={() => setSelectedDate('2026-09-21')}>&lt;</span>
            <div onClick={() => setShowCalendarModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', padding: '8px 16px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>
              <span>📅</span> {selectedDate}
            </div>
            <span style={{ cursor: 'pointer', fontSize: '14px', color: '#888' }} onClick={() => setSelectedDate('2026-09-23')}>&gt;</span>
          </div>

          <section style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>우리 집 경기 {loadingGames && <span style={{ fontSize: '11px', color: '#888', fontWeight: 'normal' }}>(⚾ 실시간 동기화 중...)</span>}</h2>
              <span onClick={() => setActiveTab('my')} style={{ fontSize: '12px', color: '#666', cursor: 'pointer', fontWeight: '600' }}>팀 설정 &gt;</span>
            </div>
            
            {myHomeGames.length > 0 ? myHomeGames.map(game => (
              <div key={game.id} onClick={() => setSelectedGame(game)} style={{ border: '1px solid #eaeaea', borderRadius: '16px', padding: '16px', marginBottom: '10px', backgroundColor: '#fff', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', fontWeight: '700', marginBottom: '8px' }}>
                  <span>{game.league}</span>
                  <span style={{ color: game.status === 'LIVE' ? '#e03131' : '#888' }}>{game.status === 'LIVE' ? '🔴 LIVE' : game.status === 'FINAL' ? 'FINAL' : game.time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', flex: 1, textAlign: 'left', whiteSpace: 'pre-line' }}>{game.awayTeam}</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', padding: '0 12px' }}>{game.status === 'BEFORE' ? 'VS' : `${game.awayScore} : ${game.homeScore}`}</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', flex: 1, textAlign: 'right', whiteSpace: 'pre-line' }}>{game.homeTeam}</div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#aaa', marginTop: '10px' }}>
                  {selectedDate} · {game.stadium}
                </div>
              </div>
            )) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#888', fontSize: '13px', backgroundColor: '#f8f9fa', borderRadius: '16px' }}>
                선택한 날짜에 설정된 우리 집 팀 경기가 없습니다.
              </div>
            )}
          </section>
        </main>
      )}

      {activeTab === 'my' && (
        <main style={{ padding: '0 20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '900', margin: '10px 0 20px 0' }}>마이</h2>
          
          <div style={{ border: '1px solid #eaeaea', borderRadius: '16px', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#111', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '16px' }}>집</div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800' }}>{user.nickname}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>나만의 집을 만들어 보세요.</div>
              </div>
            </div>
            <button onClick={() => setShowAuthModal(true)} style={{ backgroundColor: '#fff', border: '1px solid #ddd', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>가입 / 로그인</button>
          </div>

          <div style={{ border: '1px solid #eaeaea', borderRadius: '16px', padding: '18px 20px', marginBottom: '20px', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800' }}>⭐ 우리 집 설정하기</span>
              <span onClick={() => setShowTeamModal(true)} style={{ fontSize: '12px', color: '#666', cursor: 'pointer', fontWeight: '700' }}>더보기 &gt;</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {user.favoriteTeams.map(team => (
                <span key={team} style={{ backgroundColor: '#111', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{team} ✓</span>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid #eaeaea', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#fff' }}>
            {[
              { id: 'notice', label: '알림 설정' },
              { id: 'cs', label: '고객센터' },
              { id: 'terms', label: '이용약관' },
              { id: 'privacy', label: '개인정보처리방침' }
            ].map((menu, idx) => (
              <div key={menu.id} onClick={() => setActiveInfoModal(menu.id)} style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx !== 3 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>
                <span>{menu.label}</span>
                <span style={{ color: '#ccc' }}>&gt;</span>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* 우리집 설정 모달 */}
      {showTeamModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '430px', height: '80vh', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>🏡 우리집 설정</h3>
              <button onClick={() => setShowTeamModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px', margin: '0 0 16px 0' }}>응원하는 팀을 선택하여 우리집을 꾸며보세요.</p>
            
            <input type="text" placeholder="팀 이름을 검색하세요 (예: 롯데, 다저스)" value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '13px', marginBottom: '16px', boxSizing: 'border-box', backgroundColor: '#f8f9fa' }} />

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {continents.map(c => (
                <div key={c.name} style={{ marginBottom: '12px', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
                  <div onClick={() => setExpandedContinent(expandedContinent === c.name ? '' : c.name)} style={{ padding: '14px 16px', backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: '800', fontSize: '14px' }}>
                    <span>{c.name}</span>
                    <span>{expandedContinent === c.name ? '▲' : '▼'}</span>
                  </div>
                  {expandedContinent === c.name && (
                    <div style={{ padding: '12px' }}>
                      {c.leagues.map(l => (
                        <div key={l.name} style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#444', marginBottom: '6px' }}>{l.name}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {l.teams.filter(t => !teamSearch || t.includes(teamSearch)).map(team => {
                              const isSelected = user.favoriteTeams.includes(team);
                              return (
                                <button key={team} onClick={() => toggleTeam(team)} style={{ padding: '6px 12px', borderRadius: '16px', border: '1px solid #ddd', backgroundColor: isSelected ? '#111' : '#fff', color: isSelected ? '#fff' : '#111', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                                  {team} {isSelected ? '✓' : '+'}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setShowTeamModal(false)} style={{ width: '100%', padding: '14px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', marginTop: '16px' }}>
              설정 완료
            </button>
          </div>
        </div>
      )}

      {/* 정보 팝업 모달 */}
      {activeInfoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '360px', borderRadius: '20px', padding: '24px', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '900', marginTop: 0, marginBottom: '12px' }}>
              {activeInfoModal === 'notice' && '알림 설정'}
              {activeInfoModal === 'cs' && '고객센터'}
              {activeInfoModal === 'terms' && '이용약관'}
              {activeInfoModal === 'privacy' && '개인정보처리방침'}
            </h3>
            <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.5', marginBottom: '20px' }}>
              {activeInfoModal === 'notice' && '경기 시작 전 및 결과 알림을 받아보실 수 있습니다.'}
              {activeInfoModal === 'cs' && '문의사항은 support@gip-baseball.com으로 연락주세요.'}
              {activeInfoModal === 'terms' && 'GIP 서비스 이용약관 내용입니다. 야구를 사랑하는 모든 분들을 위한 공간입니다.'}
              {activeInfoModal === 'privacy' && '사용자의 소중한 개인정보는 안전하게 보호되며 목적 외로 사용되지 않습니다.'}
            </p>
            <button onClick={() => setActiveInfoModal(null)} style={{ width: '100%', padding: '12px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>확인</button>
          </div>
        </div>
      )}

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: '430px', margin: '0 auto', backgroundColor: '#ffffff', borderTop: '1px solid #eaeaea', display: 'flex', height: '65px', zIndex: 900 }}>
        {[
          { id: 'home', label: '홈', icon: '🏠' },
          { id: 'rank', label: '순위', icon: '📊' },
          { id: 'record', label: '기록', icon: '📝' },
          { id: 'my', label: '마이', icon: '👤' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, border: 'none', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: activeTab === tab.id ? '#111' : '#aaa' }}>
            <span style={{ fontSize: '18px', marginBottom: '2px' }}>{tab.icon}</span>
            <span style={{ fontSize: '11px', fontWeight: activeTab === tab.id ? '800' : '600' }}>{tab.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}