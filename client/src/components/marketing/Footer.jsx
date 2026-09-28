export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand-mark">
              <span className="brand-dot" />
              Lumina
            </div>
            <p style={{ marginTop: 12, fontSize: "0.85rem", color: "var(--muted)" }}>
              Camada autónoma de tesouraria integrada para o mercado médio paulista, orientada
              por inteligência preditiva.
            </p>
          </div>
          <div>
            <h4>Produto</h4>
            <ul>
              <li><a href="#modulos">Módulos</a></li>
              <li><a href="#precos">Preços</a></li>
              <li><a href="#split-payment">Simulador de Split Payment</a></li>
            </ul>
          </div>
          <div>
            <h4>Conformidade</h4>
            <ul>
              <li>Open Finance Brasil · FAPI 2.0 / DPoP</li>
              <li>Resolução Conjunta BCB/CMN nº 16/2025 (BaaS)</li>
              <li>LGPD · PL 2338/2023 (Marco Legal da IA)</li>
            </ul>
          </div>
          <div>
            <h4>Parceiros de infraestrutura</h4>
            <ul>
              <li>Open Finance: Pluggy, Klavi</li>
              <li>BaaS / Crédito: Celcoin, QI Tech</li>
              <li>ERP: TOTVS, SAP, Senior Sistemas</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Lumina Tesouraria Inteligente Ltda. São Paulo, SP.</p>
          <p style={{ maxWidth: 480 }}>
            A Lumina atua como Entidade Tomadora nos serviços de Banking as a Service. A gestão
            de risco, PLD/FT e crédito é de responsabilidade exclusiva das Instituições
            Prestadoras licenciadas pelo Banco Central.
          </p>
        </div>
      </div>
    </footer>
  );
}
