/**
 * Boot — 첫 화면이 뜨기 전/도중에 죽는 경우를 사용자에게 설명한다.
 * 이 앱은 브라우저 저장소(IndexedDB)에 의존하는데, 카카오톡·인스타그램 같은 앱 내장 브라우저나
 * 사파리 시크릿 모드에서는 저장소가 막혀 있어 그대로 두면 아무것도 안 뜨는 흰 화면이 된다.
 */
import { Component, ErrorInfo, ReactNode } from 'react';

function Failure({ title, detail, hint }: { title: string; detail?: string; hint: ReactNode }) {
  return (
    <div className="wrap" style={{ paddingTop: 48 }}>
      <div className="hero">
        <b>{title}</b>
        <p>{hint}</p>
        {detail && <p className="betaline" style={{ fontFamily: 'monospace', fontSize: 11 }}>{detail}</p>}
        <div className="btnrow">
          <button className="btn primary" onClick={() => location.reload()}>다시 시도</button>
        </div>
      </div>
    </div>
  );
}

/** 저장소를 열 수 없을 때 */
export function StorageBlocked({ detail }: { detail?: string }) {
  return (
    <Failure
      title="이 브라우저에서는 저장소를 쓸 수 없습니다"
      detail={detail}
      hint={<>
        재고·기록을 브라우저에 저장해야 동작하는데, 지금 저장소가 막혀 있습니다.
        <b> 카카오톡·인스타그램 등 앱 안에서 열었거나 시크릿 모드</b>일 때 자주 생깁니다.
        우측 상단 메뉴에서 <b>다른 브라우저로 열기</b>(사파리·크롬)를 눌러 주세요.
      </>}
    />
  );
}

/** 렌더 도중 예외 — 흰 화면 대신 이유와 복구 수단을 보여준다 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[홈바] 렌더 오류', error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Failure
        title="화면을 그리는 중 문제가 생겼습니다"
        detail={this.state.error.message}
        hint={<>저장된 데이터는 그대로 있습니다. 다시 시도해도 같은 화면이면 알려주세요.</>}
      />
    );
  }
}
