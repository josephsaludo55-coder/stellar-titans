/** Shared vehicle artwork keeps the launch, transfer, and orbit views visually connected. */
export function RocketVehicleArtwork() {
  return <div className="launch-vehicle-rocket" aria-hidden="true">
    <div className="launch-payload-fairing"><span className="launch-payload-craft" /></div>
    <div className="launch-core-stage"><i /><b /></div>
    <div className="launch-side-booster launch-booster-left" />
    <div className="launch-side-booster launch-booster-right" />
    <div className="launch-engine-bell" />
    <div className="launch-engine-flame" />
  </div>;
}
