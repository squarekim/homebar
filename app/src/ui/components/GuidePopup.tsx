/**
 * GuidePopup — 입문 안내 팝업. 사전조사 카드(beginnerGuide.ts)를 한 장씩 넘겨 보여 준다.
 *  - 탭마다 뜨던 안내 띠는 없앴다. 안내서 전체는 Q&A 화면(QnaPage)에 모여 있다.
 * 카드 문장과 출처는 데이터 그대로다. 여기서는 넘기는 것만 한다.
 */
import { useEffect, useState } from 'react';
import { useUI } from '../UIContext';
import { GUIDE_CHAPTERS, GUIDE_GROUPS, guideById, type GuideId } from '../../data/beginnerGuide';

export function GuidePopup() {
  const { guide, openGuide, closeGuide, guideSkipIntro } = useUI();
  const [at, setAt] = useState(-1); // -1 = 소개 장

  useEffect(() => { setAt(guideSkipIntro ? 0 : -1); }, [guide, guideSkipIntro]);
  useEffect(() => {
    if (!guide) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeGuide(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [guide, closeGuide]);

  if (!guide) return null;

  if (guide === 'menu') {
    return (
      <div className="guidepop" role="dialog" aria-modal="true" aria-label="입문 안내" onClick={closeGuide}>
        <div className="guidecard" onClick={(e) => e.stopPropagation()}>
          <button className="gx" onClick={closeGuide} aria-label="닫기">×</button>
          <p className="gkicker">입문 안내</p>
          <h2>안내서</h2>
          {GUIDE_GROUPS.map((g) => (
            <div key={g.key}>
              <div className="sechead in">{g.title}</div>
              <div className="gmenu">
                {GUIDE_CHAPTERS.filter((c) => c.group === g.key).map((c) => (
                  <button key={c.id} onClick={() => openGuide(c.id)}>
                    <b>{c.title}</b>
                    <span aria-hidden="true">›</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const ch = guideById(guide as GuideId);
  const card = at >= 0 ? ch.cards[at] : null;
  const last = at === ch.cards.length - 1;
  return (
    <div className="guidepop" role="dialog" aria-modal="true" aria-label={ch.title} onClick={closeGuide}>
      <div className="guidecard" onClick={(e) => e.stopPropagation()}>
        <button className="gx" onClick={closeGuide} aria-label="닫기">×</button>
        <p className="gkicker">{ch.title}{card ? ` · ${at + 1} / ${ch.cards.length}` : ''}</p>
        {!card ? (
          <>
            <h2>{ch.title}</h2>
            <p className="gbody">{ch.intro}</p>
          </>
        ) : card.myth ? (
          <>
            <p className="gtag myth">오해</p>
            <h2>"{card.myth}"</h2>
            <p className="gtag fact">사실</p>
            {card.body.map((t, i) => <p className="gbody" key={i}>{t}</p>)}
          </>
        ) : (
          <>
            <h2>{card.title}</h2>
            {card.body.map((t, i) => <p className="gbody" key={i}>{t}</p>)}
          </>
        )}
        {card && (
          <p className="gsrc">
            출처:{' '}
            {card.sources.map((s, i) => (
              <span key={s.url + i}>{i > 0 && ', '}<a href={s.url} target="_blank" rel="noreferrer noopener">{s.label}</a></span>
            ))}
          </p>
        )}
        <div className="gnav">
          {at >= 0
            ? <button className="btn" onClick={() => setAt(at - 1)}>이전</button>
            : <button className="btn" onClick={closeGuide}>닫기</button>}
          {last
            ? <button className="btn primary" onClick={() => openGuide('menu')}>목록</button>
            : <button className="btn primary" onClick={() => setAt(at + 1)}>{at < 0 ? '보기' : '다음'}</button>}
        </div>
      </div>
    </div>
  );
}
