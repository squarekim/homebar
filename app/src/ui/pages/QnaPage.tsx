/**
 * QnaPage — 'Q&A'. 탭마다 띄우던 안내 띠를 없애고 안내서 내용을 한곳에 모았다.
 * 안내서(beginnerGuide.ts)의 카드 한 장이 질문 하나다. 누르면 본문과 출처가 펼쳐진다.
 * 카드 문장과 출처는 데이터 그대로 쓰고, 여기서는 묶어서 보여 주기만 한다.
 */
import { GUIDE_CHAPTERS, GUIDE_GROUPS } from '../../data/beginnerGuide';

export function QnaPage() {
  return (
    <>
      <h2 className="pagetitle" data-k="Q&amp;A">Q&amp;A</h2>
      {GUIDE_GROUPS.map((g) => (
        <section key={g.key}>
          <div className="sechead">{g.title}</div>
          {GUIDE_CHAPTERS.filter((c) => c.group === g.key).map((c) => (
            <div className="qa-chapter" key={c.id}>
              <h3>{c.title}</h3>
              {c.cards.map((card, i) => (
                <details className="qa" key={i}>
                  <summary>
                    {card.myth ? <><span className="qa-tag">오해</span>"{card.myth}"</> : card.title}
                  </summary>
                  <div className="qa-body">
                    {card.myth && <p className="qa-tag fact">사실</p>}
                    {card.body.map((t, j) => <p key={j}>{t}</p>)}
                    {card.sources.length > 0 && (
                      <p className="qa-src">
                        출처{' '}
                        {card.sources.map((s, j) => (
                          <span key={s.url + j}>{j > 0 && ', '}<a href={s.url} target="_blank" rel="noreferrer noopener">{s.label}</a></span>
                        ))}
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          ))}
        </section>
      ))}
    </>
  );
}
