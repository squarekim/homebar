/**
 * DistilleryCard — 증류소 한 곳. 위스키 상세와 증류소 지도가 함께 쓴다.
 * 출처를 확인한 정보만 보여 준다. 투어는 확인하지 못했으면 '없음'으로 적지 않고 '확인 안 됨'으로 적는다.
 */
import { type Distillery, type DistilleryVisit } from '../../models/types';
import { displayRegionLabel } from '../../data/whiskySpec';
import { productsOfDistillery } from '../../data/distilleries';

const joinDot = (xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' · ');

function TourLine({ visit }: { visit: DistilleryVisit | null }) {
  if (!visit) return <span className="sub">정규 투어 확인 안 됨</span>;
  const label = visit.status === '운영' ? '투어 안내 ↗' : visit.status === '중단' ? '투어 중단 (공식 안내) ↗' : '정규 투어 없음 (공식 안내) ↗';
  return (
    <>
      {visit.url ? <a href={visit.url} target="_blank" rel="noopener">{label}</a> : <span>{label.replace(' ↗', '')}</span>}
      <small className="sub"> ({visit.checked} 확인)</small>
    </>
  );
}

export function DistilleryCard({ d, showProducts = false }: { d: Distillery; showProducts?: boolean }) {
  const founded = d.founded ? `${d.founded}년 설립${d.foundedNote ? ` · ${d.foundedNote}` : ''}` : '';
  const products = showProducts ? productsOfDistillery(d.id) : [];
  return (
    <div className="makernote">
      <p className="mn-line"><b>{d.nameKo}</b> {d.nameEn}</p>
      <p className="mn-line">{joinDot([d.country, displayRegionLabel(d.legalRegion, d.subRegion, true), d.place])}</p>
      {founded && <p className="mn-line">{founded}</p>}
      {d.owner && <p className="mn-line">소유 {d.owner}</p>}
      {d.note && <p className="mn-line">{d.note}</p>}
      {products.length > 0 && <p className="mn-line">이 앱의 제품 {products.map((p) => p.nameKo).join(', ')}</p>}
      <p className="mn-line"><TourLine visit={d.visit} /></p>
      {d.web && <a className="mn-src" href={d.web} target="_blank" rel="noopener">공식 사이트 ↗</a>}
      {d.lat !== null && d.lng !== null && (
        <> · <a className="mn-src" href={`https://www.openstreetmap.org/?mlat=${d.lat}&mlon=${d.lng}#map=11/${d.lat}/${d.lng}`} target="_blank" rel="noopener">지도에서 보기 ↗</a></>
      )}
    </div>
  );
}
