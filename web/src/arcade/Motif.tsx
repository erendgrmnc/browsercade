/**
 * Live, CSS-driven motif for each game's tile — a tiny looping "screen" that
 * hints at the real thing without spinning up five 3D canvases on the landing.
 * Styling + keyframes live in arcade.css.
 */
export function Motif({ id }: { id: string }) {
  switch (id) {
    case "chess":
      return (
        <div className="ac-motif">
          <div className="m-chess-board" />
          <span className="m-chess-piece">♞</span>
        </div>
      );

    case "ping-pong":
      return (
        <div className="ac-motif">
          <div className="m-pp-table" />
          <div className="m-pp-net" />
          <div className="m-pp-paddle m-pp-left" />
          <div className="m-pp-paddle m-pp-right" />
          <div className="m-pp-ball" />
        </div>
      );

    case "basketball":
      return (
        <div className="ac-motif">
          <div className="m-bb-board" />
          <div className="m-bb-rim" />
          <div className="m-bb-ball" />
        </div>
      );

    case "beer-pong":
      return (
        <div className="ac-motif">
          <div className="m-bp-rack">
            <div className="m-bp-row">
              <span className="m-bp-cup" />
              <span className="m-bp-cup sink" />
              <span className="m-bp-cup" />
            </div>
            <div className="m-bp-row">
              <span className="m-bp-cup" />
              <span className="m-bp-cup" />
            </div>
            <div className="m-bp-row">
              <span className="m-bp-cup" />
            </div>
          </div>
          <div className="m-bp-ball" />
        </div>
      );

    case "pool":
      return (
        <div className="ac-motif">
          <div className="m-pool-felt" />
          <div className="m-pool-ball m-pool-1" />
          <div className="m-pool-ball m-pool-2" />
          <div className="m-pool-ball m-pool-3" />
          <div className="m-pool-ball m-pool-cue" />
        </div>
      );

    default:
      return <div className="ac-motif" />;
  }
}
