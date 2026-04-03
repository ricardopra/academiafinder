function AcademiaCard({ academia }) {
  const modalidade = academia.modalidade || 'Musculação'
  const preco = academia.preco !== undefined ? `R$${academia.preco}/mês` : 'R$–/mês'
  const tag = academia.premium ? 'PREMIUM' : 'NOVO'

  return (
    <article className="card">
      <div className="card-top">
        <span className={`tag ${academia.premium ? 'premium' : 'novo'}`}>{tag}</span>
        <strong className="price">{preco}</strong>
      </div>

      <h3>{academia.nome || 'Academia'}</h3>
      <p className="location">{academia.bairro || 'Bairro'} • {academia.cidade || 'Cidade'}</p>

      <div className="badge-row">
        <span className="badge">{modalidade}</span>
        <span className="badge">CrossFit</span>
        <span className="badge">Spinning</span>
      </div>

      <div className="card-actions">
        <button type="button" className="btn-schedule">Agendar</button>
      </div>
    </article>
  )
}

export default AcademiaCard