import AppLogo from "@/components/AppLogo";

export default function Loading() {
  return (
    <main className="route-loading">
      <section>
        <AppLogo href="" priority />
        <div className="magic-loader" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p>Cargando...</p>
      </section>
    </main>
  );
}
