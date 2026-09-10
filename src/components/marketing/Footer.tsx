export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-brand-dark">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
              Lumina
            </div>
            <p className="mt-3 text-sm text-foreground/60">
              Camada autónoma de tesouraria integrada para o mercado médio paulista, orientada
              por inteligência preditiva.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Produto</h4>
            <ul className="mt-3 space-y-2 text-sm text-foreground/60">
              <li><a href="#modulos" className="hover:text-brand">Módulos</a></li>
              <li><a href="#precos" className="hover:text-brand">Preços</a></li>
              <li><a href="#split-payment" className="hover:text-brand">Simulador de Split Payment</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Conformidade</h4>
            <ul className="mt-3 space-y-2 text-sm text-foreground/60">
              <li>Open Finance Brasil &middot; FAPI 2.0 / DPoP</li>
              <li>Resolução Conjunta BCB/CMN nº 16/2025 (BaaS)</li>
              <li>LGPD &middot; PL 2338/2023 (Marco Legal da IA)</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Parceiros de infraestrutura</h4>
            <ul className="mt-3 space-y-2 text-sm text-foreground/60">
              <li>Open Finance: Pluggy, Klavi</li>
              <li>BaaS / Crédito: Celcoin, QI Tech</li>
              <li>ERP: TOTVS, SAP, Senior Sistemas</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-foreground/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Lumina Tesouraria Inteligente Ltda. São Paulo, SP.</p>
          <p className="max-w-xl text-center sm:text-right">
            A Lumina atua como Entidade Tomadora nos serviços de Banking as a Service. A gestão
            de risco, PLD/FT e crédito é de responsabilidade exclusiva das Instituições
            Prestadoras licenciadas pelo Banco Central.
          </p>
        </div>
      </div>
    </footer>
  );
}
