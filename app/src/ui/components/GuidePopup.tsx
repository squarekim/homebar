/**
 * GuidePopup — 입문 안내 팝업. 사전조사 카드(beginnerGuide.ts)를 한 장씩 넘겨 보여 준다.
 *  - 위스키·칵테일·술장 탭에 처음 들어가면 그 탭에 맞는 안내가 한 번 뜬다. 닫으면 다시 뜨지 않는다.
 *  - 메인의 '입문 안내'에서 언제든 목록으로 다시 열 수 있다.
 * 카드 문장과 출처는 데이터 그대로다. 여기서는 넘기는 것만 한다.
 */
import { useEffect, useState } from 'react';
import { useUI } from '../UIContext';
import { GUIDE_CHAPTERS, GUIDE_GROUPS, GUIDE_FOR_TAB, guideById, type GuideId } from '../../data/beginnerGuide';

const SEEN_PREFIX = 'homebar.guideSeen.';
const FIRST_RUN_KEY = 'homebar.firstRunSeen';
const read = (k: string): boolean => { try { return localStorage.getItem(k) === '1'; } catch { return true; } };
const mark = (k: string): void => { try { localStorage.setItem(k, '1'); } catch { /* 저장이 막혀도 계속 */ } };

export function GuidePopup() {
  const { tab, guide, openGuide, closeGuide } = useUI();
  const [at, setAt] = useState(-1); // -1 = 소개 장

  // 탭에 처음 들어왔을 때 한 번. 첫 실행 안내가 끝난 뒤에만 띄운다
  useEffect(() => {
    const id = GUIDE_FOR_TAB[tab];
    if (!id || !read(FIRST_RUN_KEY) || read(SEEN_PREFIX + id)) return;
    mark(SEEN_PREFIX + id);
    openGuide(id);
  }, [tab, openGuide]);

  useEffect(() => { setAt(-1); }, [guide]);
  useEffect(() => {
    if (!guide) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeGuide(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [guide, closeGuide]);

  if (!guide) return null;

  if (guide === 'menu') {
    return (
      <div className="guide" role="dialog" aria-modal="true" aria-label="입문 안내" onClick={closeGuide}>
        <div className="guidecard" onClick={(e) => e.stopPropagation()}>
          <button className="gx" onClick={closeGuide} aria-label="닫기">×</button>
          <p className="gkicker">입문 안내</p>
          <h2>무엇이 궁금하세요?</h2>
          {GUIDE_GROUPS.map((g) => (
            <div key={g.key}>
              <div className="sechead in">{g.title}</div>
              <div className="gmenu">
                {GUIDE_CHAPTERS.filter((c) => c.group === g.key).map((c) => (
                  <button key={c.id} onClick={() => openGuide(c.id)}>
                    <b>{c.title}</b>
                    <span>카드 {c.cards.length}장</span>
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
    <div className="guide" role="dialog" aria-modal="true" aria-label={ch.title} onClick={closeGuide}>
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
            <p className="gtag myth">흔한 오해</p>
            <h2>"{card.myth}"</h2>
            <p className="gtag fact">실제로는</p>
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
            : <button className="btn" onClick={closeGuide}>나중에 볼게요</button>}
          {last
            ? <button className="btn primary" onClick={() => openGuide('menu')}>다른 안내 보기</button>
            : <button className="btn primary" onClick={() => setAt(at + 1)}>{at < 0 ? '보기' : '다음'}</button>}
        </div>
      </div>
    </div>
  );
}
