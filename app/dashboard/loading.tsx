export default function DashboardLoading() {
  return (
    <div className="simple-dashboard-loading" role="status" aria-live="polite">
      <div className="simple-loading-spinner" aria-hidden="true" />
      <strong>Cargando información...</strong>
    </div>
  );
}
