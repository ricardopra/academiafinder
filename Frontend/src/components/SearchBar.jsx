function SearchBar({ cidade, setCidade, busca, setBusca }) {
  return (
    <section className="search-box">
      <div>
        <label>Cidade</label>
        <input
          type="text"
          placeholder="Digite a cidade"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
        />
      </div>

      <div>
        <label>Busca</label>
        <input
          type="text"
          placeholder="Nome, bairro ou modalidade"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
    </section>
  )
}

export default SearchBar