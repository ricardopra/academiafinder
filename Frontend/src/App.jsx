
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  Check,
  LogOut,
  MapPin,
  Medal,
  Search,
  Settings2,
  Star,
  Trophy,
  UserRound,
} from 'lucide-react'
import 'ol/ol.css'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import OLMap from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import { fromLonLat } from 'ol/proj'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'
import {
  autenticarUsuario,
  criarAgendamento,
  criarAvaliacao,
  listarAcademias,
  listarAgendamentos,
  listarAvaliacoes,
} from './services/api'
import hackerAvatar from './Academia/hacker.png'
import mackenzieLogo from './Academia/mackenzie.png'

const TIPOS_AGENDAMENTO = ['Aula Experimental', 'Visita Guiada', 'Avaliacao Fisica', 'Treino Funcional']
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const POSICAO_PADRAO = { lat: -23.5505, lon: -46.6333 } // Sao Paulo (fallback)
const COORDENADAS_FALLBACK_POR_NOME = {
  ironforge: { lat: -23.5949, lon: -46.6893 },
  zenstudio: { lat: -23.6009, lon: -46.6765 },
  pulsegym: { lat: -23.5641, lon: -46.6925 },
  urbanfit: { lat: -23.5617, lon: -46.6689 },
  academiapowerfit2: { lat: -23.5329, lon: -46.7917 },
}
const IMAGENS_ACADEMIA = Object.values(
  import.meta.glob('./Academia/*.{png,jpg,jpeg,webp,avif}', { eager: true, import: 'default' }),
).filter(Boolean)

function formatoDataISO(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

function montarCalendario(dataReferencia) {
  const ano = dataReferencia.getFullYear()
  const mes = dataReferencia.getMonth()
  const primeiroDia = new Date(ano, mes, 1)
  const ultimoDia = new Date(ano, mes + 1, 0)
  const inicioSemana = primeiroDia.getDay()
  const totalDias = ultimoDia.getDate()
  const celulas = []
  for (let i = 0; i < inicioSemana; i += 1) celulas.push(null)
  for (let dia = 1; dia <= totalDias; dia += 1) celulas.push(new Date(ano, mes, dia))
  while (celulas.length % 7 !== 0) celulas.push(null)
  return celulas
}

function criarDisponibilidadesFicticias(ano) {
  const result = {}
  for (let mes = 0; mes < 12; mes += 1) {
    ;[4, 8, 12, 15, 20, 24, 28].forEach((dia, idx) => {
      const data = new Date(ano, mes, dia)
      if (data.getMonth() !== mes) return
      const iso = formatoDataISO(data)
      result[iso] = {
        tipos: [TIPOS_AGENDAMENTO[(mes + idx) % TIPOS_AGENDAMENTO.length], TIPOS_AGENDAMENTO[(mes + idx + 1) % TIPOS_AGENDAMENTO.length]],
        horarios: [
          { hora: '07:00', vagas: (mes + idx) % 3 === 0 ? 0 : 2 },
          { hora: '08:00', vagas: 2 + ((mes + idx) % 3) },
          { hora: '10:00', vagas: 1 + (idx % 3) },
          { hora: '14:00', vagas: 1 + ((mes + 1) % 3) },
          { hora: '16:00', vagas: 2 + ((idx + 2) % 3) },
          { hora: '19:00', vagas: 1 + ((mes + idx + 1) % 2) },
        ],
      }
    })
  }
  return result
}

const DISPONIBILIDADES = criarDisponibilidadesFicticias(new Date().getFullYear())
const geocodeCache = new Map()

function formatarPreco(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? `R$${Math.round(n)}` : 'R$--'
}

function normalizarTexto(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

function selecionarImagemLocalAcademia(nome) {
  if (IMAGENS_ACADEMIA.length === 0) return ''
  const base = normalizarTexto(nome)
  let soma = 0
  for (let i = 0; i < base.length; i += 1) soma += base.charCodeAt(i)
  return IMAGENS_ACADEMIA[soma % IMAGENS_ACADEMIA.length]
}

function coordenadaFallbackAcademia(academia) {
  const chave = normalizarTexto(academia?.nome)
  return COORDENADAS_FALLBACK_POR_NOME[chave] || null
}

function distanciaEstimadaPorNome(nome) {
  const base = normalizarTexto(nome)
  if (!base) return 5
  let soma = 0
  for (let i = 0; i < base.length; i += 1) soma += base.charCodeAt(i)
  return Number((((soma % 140) + 10) / 10).toFixed(1)) // 1.0km a 15.0km
}

function selecionarFotoPerfilUsuario(usuario) {
  const chave = `${usuario?.email || ''} ${usuario?.nome || ''}`.toLowerCase()
  if (chave.includes('teste')) return hackerAvatar
  return ''
}

function formatarDistanciaKm(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? `${n.toFixed(1)} km` : '-'
}

function calcularDistanciaKm(origem, destino) {
  const rad = (grau) => (grau * Math.PI) / 180
  const r = 6371
  const dLat = rad(destino.lat - origem.lat)
  const dLon = rad(destino.lon - origem.lon)
  const lat1 = rad(origem.lat)
  const lat2 = rad(destino.lat)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * (Math.sin(dLon / 2) ** 2)
  return r * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

async function geocodeEnderecoGlobal(endereco) {
  const chave = String(endereco || '').trim().toLowerCase()
  if (!chave) return null
  if (geocodeCache.has(chave)) return geocodeCache.get(chave)

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`
  const response = await fetch(url)
  if (!response.ok) return null
  const data = await response.json()
  if (!Array.isArray(data) || !data[0]) return null

  const lat = Number(data[0].lat)
  const lon = Number(data[0].lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  const geo = { lat, lon }
  geocodeCache.set(chave, geo)
  return geo
}

function parseModalidades(academia) {
  if (Array.isArray(academia.modalidades)) return academia.modalidades.filter(Boolean)
  if (typeof academia.modalidade === 'string' && academia.modalidade.trim()) {
    return academia.modalidade.split(',').map((v) => v.trim()).filter(Boolean)
  }
  return []
}

function normalizarAcademia(academia) {
  return {
    id: academia.id,
    nome: academia.nome || 'Academia',
    endereco: academia.endereco || '',
    cidade: academia.cidade || '',
    bairro: academia.bairro || '',
    preco: Number(academia.preco),
    avaliacao: Number(academia.avaliacao),
    distanciaKm: Number(academia.distancia_km ?? academia.distanciaKm),
    modalidades: parseModalidades(academia),
    fotoUrl: academia.foto_url || academia.fotoUrl || '',
  }
}

function normalizarAgendamento(agendamento) {
  return {
    id: agendamento.id,
    usuarioId: agendamento.usuario_id,
    academiaId: agendamento.academia_id,
    data: agendamento.data || null,
    tipo: agendamento.tipo || '',
  }
}

function normalizarAvaliacao(avaliacao) {
  return {
    id: avaliacao.id,
    usuarioId: avaliacao.usuario_id,
    academiaId: avaliacao.academia_id,
    nota: Number(avaliacao.nota),
    comentario: avaliacao.comentario || '',
    createdAt: avaliacao.created_at || null,
  }
}

function RealTimeMap({ academias }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const gymLayerRef = useRef(null)
  const watchIdRef = useRef(null)
  const userLocatedRef = useRef(false)
  const resizeObserverRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return undefined

    const gymSource = new VectorSource()
    const userSource = new VectorSource()
    const gymLayer = new VectorLayer({
      source: gymSource,
      style: new Style({
        image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#ff4a0a' }), stroke: new Stroke({ color: '#ffffff', width: 2 }) }),
      }),
    })
    const userLayer = new VectorLayer({
      source: userSource,
      style: new Style({
        image: new CircleStyle({ radius: 7, fill: new Fill({ color: '#00d17c' }), stroke: new Stroke({ color: '#ffffff', width: 2 }) }),
      }),
    })

    const map = new OLMap({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), gymLayer, userLayer],
      view: new View({ center: fromLonLat([-46.6333, -23.5505]), zoom: 12 }),
    })

    mapInstanceRef.current = map
    gymLayerRef.current = gymLayer

    // Keeps the map sized correctly when container/layout changes.
    resizeObserverRef.current = new ResizeObserver(() => {
      map.updateSize()
    })
    resizeObserverRef.current.observe(mapRef.current)

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const coords = fromLonLat([position.coords.longitude, position.coords.latitude])
          userSource.clear()
          userSource.addFeature(new Feature({ geometry: new Point(coords) }))
          if (!userLocatedRef.current) {
            map.getView().setCenter(coords)
            map.getView().setZoom(15)
            userLocatedRef.current = true
          }
        },
        () => {
          // Ignore location errors; map stays on default center.
        },
      )
    }

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }
      map.setTarget(undefined)
      mapInstanceRef.current = null
      gymLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    async function geocodeEndereco(endereco) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`
      const response = await fetch(url)
      if (!response.ok) return null
      const data = await response.json()
      if (!Array.isArray(data) || !data[0]) return null
      const lat = Number(data[0].lat)
      const lon = Number(data[0].lon)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
      return { lat, lon }
    }

    async function desenharAcademias() {
      const layer = gymLayerRef.current
      if (!layer) return
      const source = layer.getSource()
      source.clear()

      const geocodes = await Promise.all(
        academias.slice(0, 8).map(async (a) => {
          if (!a.endereco) return null
          const geo = await geocodeEndereco(a.endereco)
          if (!geo) return null
          return { a, geo }
        }),
      )

      geocodes.filter(Boolean).forEach(({ a, geo }) => {
        source.addFeature(new Feature({ geometry: new Point(fromLonLat([geo.lon, geo.lat])), nome: a.nome }))
      })
    }

    desenharAcademias().catch(() => {})
  }, [academias])

  return <div className="mini-map map-square" ref={mapRef} />
}
function LoginScreen({ login, senha, setLogin, setSenha, onEntrar, erroLogin, carregando }) {
  return (
    <section className="login-wrap">
      <article className="login-card">
        <h1>Acessar Academia Finder</h1>
        <p className="subtitle login-subtitle">Sua próxima academia está a um clique de distância</p>

        <label className="field-label" htmlFor="login">Login</label>
        <input id="login" className="login-input" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="" />

        <label className="field-label" htmlFor="senha">Senha</label>
        <input id="senha" type="password" className="login-input" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="" />

        {erroLogin && <p className="muted">{erroLogin}</p>}
        <button type="button" className="cta-btn full" onClick={onEntrar} disabled={carregando}>{carregando ? 'Entrando...' : 'Entrar'}</button>
      </article>

      <aside className="login-info">
        <img className="login-logo" src={mackenzieLogo} alt="Logo Mackenzie" />
        <p><strong>Integrantes do Grupo:</strong></p>
        <p>Alan Araújo Paiva RA: 10423944</p>
        <p>Felipe Amorim RA: 10441136</p>
        <p>Ricardo Pereira RA: 10442905</p>
        <p>UNIVERSIDADE PRESBITERIANA MACKENZIE</p>
        <p>Curso de Análise e Desenvolvimento de Sistemas</p>
      </aside>
    </section>
  )
}

function HomeScreen({ academias, busca, setBusca, categoria, setCategoria, categorias, loading, erroApi, onVerDetalhes, onAgendar }) {
  return (
    <>
      <section className="hero-card">
        <p className="subtitle">Ola, boa tarde</p>
        <h1>Encontre sua <span>academia</span></h1>

        <div className="search-area">
          <Search size={18} />
          <input type="text" placeholder="Bairro, cidade ou endereco..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          <button type="button" className="square-btn" aria-label="Filtros"><Settings2 size={16} /></button>
        </div>

        <div className="pill-location"><MapPin size={14} /> Sao Paulo, SP - {academias.length} academias proximas</div>
        <RealTimeMap academias={academias} />

        <div className="chip-row">
          {categorias.map((item) => (
            <button key={item} type="button" className={`chip ${categoria === item ? 'active' : ''}`} onClick={() => setCategoria(item)}>{item}</button>
          ))}
        </div>
      </section>

      <section className="section-head"><h2>Proximas de voce</h2></section>
      {loading && <p className="muted">Carregando academias...</p>}
      {erroApi && <p className="muted">{erroApi}</p>}
      {!loading && !erroApi && academias.length === 0 && <p className="muted">Nenhuma academia no backend.</p>}

      <section className="gym-list">
        {academias.map((academia) => (
          <article className="gym-card" key={academia.id}>
            <div className="gym-banner" style={academia.fotoHomeUrl ? { backgroundImage: `url(${academia.fotoHomeUrl})` } : (academia.fotoUrl ? { backgroundImage: `url(${academia.fotoUrl})` } : undefined)} />
            <div className="gym-body">
              <div className="gym-title-row">
                <strong>{academia.nome}</strong>
                <span className="rating"><Star size={14} /> {Number.isFinite(academia.avaliacao) ? academia.avaliacao : '-'}</span>
              </div>

              <p className="muted"><MapPin size={12} /> {academia.endereco || '-'}</p>
              <div className="badge-row">{academia.modalidades.slice(0, 3).map((m) => <span className="badge" key={`${academia.id}-${m}`}>{m}</span>)}</div>

              <div className="gym-actions">
                <div><strong className="price-text">{formatarPreco(academia.preco)}</strong><span className="price-sufix">/mes</span></div>
                <div className="button-group-inline">
                  <button type="button" className="ghost-btn" onClick={() => onVerDetalhes(academia.id)}>Detalhes</button>
                  <button type="button" className="cta-btn" onClick={() => onAgendar(academia.id)}>Agendar</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

function DetailScreen({ academia, onBack, onAgendar }) {
  if (!academia) return <p className="muted">Nenhuma academia selecionada.</p>

  return (
    <>
      <header className="detail-top"><button type="button" className="circle-btn" onClick={onBack}><ArrowLeft size={16} /></button></header>
      <section className="detail-hero">
        <div className="hero-image" style={academia.fotoHomeUrl ? { backgroundImage: `url(${academia.fotoHomeUrl})` } : (academia.fotoUrl ? { backgroundImage: `url(${academia.fotoUrl})` } : undefined)} />
        <h1>{academia.nome}</h1>
        <p className="muted"><MapPin size={14} /> {academia.endereco || '-'}</p>
      </section>
      <section className="metric-grid">
        <div className="metric-box"><strong>{Number.isFinite(academia.avaliacao) ? academia.avaliacao : '-'}</strong><span>AVALIACAO</span></div>
        <div className="metric-box"><strong>{formatarDistanciaKm(academia.distanciaKm)}</strong><span>DISTANCIA</span></div>
        <div className="metric-box highlight"><strong>{formatarPreco(academia.preco)}</strong><span>/ MES</span></div>
      </section>
      <button type="button" className="cta-btn full" onClick={() => onAgendar(academia.id)}>Agendar nesta academia</button>
    </>
  )
}

function CompareScreen({ academias, selecionadas, onRemover, onAdicionar, onAgendar }) {
  const [abrirAdicionar, setAbrirAdicionar] = useState(false)
  const [academiaParaAdicionar, setAcademiaParaAdicionar] = useState('')

  const itens = selecionadas.map((id) => academias.find((a) => String(a.id) === String(id))).filter(Boolean)
  const disponiveis = academias.filter((a) => !selecionadas.some((id) => String(id) === String(a.id)))
  if (academias.length === 0) return <p className="muted">Sem academias para comparar.</p>

  const melhor = [...itens].sort((a, b) => (((b.avaliacao || 0) * 10) - (b.preco || 0)) - (((a.avaliacao || 0) * 10) - (a.preco || 0)))[0]

  return (
    <>
      <header className="page-header"><h1>Comparar</h1><p className="subtitle">Ate 4 academias lado a lado</p></header>
      <section className="compare-top-cards">
        {itens.map((academia) => (
          <button key={academia.id} type="button" className="compare-gym-card" onClick={() => onRemover(String(academia.id))}>
            <strong>{academia.nome}</strong><span>{formatarPreco(academia.preco)}</span><small>Clique para remover</small>
          </button>
        ))}

        {itens.length < 4 && (
          <article className="compare-gym-card add">
            <button type="button" className="text-btn" onClick={() => setAbrirAdicionar((v) => !v)}>+ Adicionar academia</button>
            {abrirAdicionar && (
              <div className="add-box">
                <select value={academiaParaAdicionar} onChange={(e) => setAcademiaParaAdicionar(e.target.value)}>
                  <option value="">Selecione</option>
                  {disponiveis.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
                <button type="button" className="cta-btn" onClick={() => {
                  if (!academiaParaAdicionar) return
                  onAdicionar(academiaParaAdicionar)
                  setAcademiaParaAdicionar('')
                  setAbrirAdicionar(false)
                }}>Adicionar</button>
              </div>
            )}
          </article>
        )}
      </section>

      {itens.length >= 2 && (
        <section className="compare-table">
          <div><span>ACADEMIA</span><strong>{itens[0].nome || '-'}</strong><strong>{itens[1].nome || '-'}</strong></div>
          <div><span>PRECO</span><strong>{formatarPreco(itens[0].preco)}/mes</strong><strong>{formatarPreco(itens[1].preco)}/mes</strong></div>
          <div><span>AVALIACAO</span><strong>{Number.isFinite(itens[0].avaliacao) ? itens[0].avaliacao : '-'}</strong><strong>{Number.isFinite(itens[1].avaliacao) ? itens[1].avaliacao : '-'}</strong></div>
          <div><span>DISTANCIA</span><strong>{formatarDistanciaKm(itens[0].distanciaKm)}</strong><strong>{formatarDistanciaKm(itens[1].distanciaKm)}</strong></div>
          <div><span>ENDERECO</span><strong>{itens[0].endereco || itens[0].bairro || '-'}</strong><strong>{itens[1].endereco || itens[1].bairro || '-'}</strong></div>
        </section>
      )}

      {melhor && <section className="winner-box"><Trophy size={18} /><div><strong>Melhor custo-beneficio: {melhor.nome}</strong></div></section>}
      <div className="button-group">{itens.slice(0, 2).map((a) => <button key={a.id} type="button" className="cta-btn" onClick={() => onAgendar(a.id)}>Agendar {a.nome}</button>)}</div>
    </>
  )
}
function ScheduleScreen({ academias, academiaSelecionada, setAcademiaSelecionada, usuario, onConfirmarAgendamento, statusAgendamento, mensagemAgendamento }) {
  const [tipo, setTipo] = useState(TIPOS_AGENDAMENTO[0])
  const [horario, setHorario] = useState('08:00')
  const anoAtual = new Date().getFullYear()
  const [mesReferencia, setMesReferencia] = useState(() => new Date(anoAtual, new Date().getMonth(), 1))
  const [dataSelecionada, setDataSelecionada] = useState(() => formatoDataISO(new Date()))

  const celulas = montarCalendario(mesReferencia)
  const disponibilidadeDia = DISPONIBILIDADES[dataSelecionada] || null
  const tipos = disponibilidadeDia?.tipos || TIPOS_AGENDAMENTO
  const horarios = disponibilidadeDia?.horarios || []
  const tipoAtivo = tipos.includes(tipo) ? tipo : (tipos[0] || '')
  const horarioAtivo = horarios.some((h) => h.hora === horario && h.vagas > 0) ? horario : (horarios.find((h) => h.vagas > 0)?.hora || '')

  return (
    <>
      <header className="page-header"><h1>Agendar</h1><p className="subtitle">Escolha academia, data e horario</p></header>

      <label className="field-label" htmlFor="academia-select">Academia</label>
      <select id="academia-select" className="login-input" value={academiaSelecionada?.id || ''} onChange={(e) => setAcademiaSelecionada(academias.find((a) => String(a.id) === e.target.value) || null)}>
        {academias.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
      </select>

      <div className="button-group-inline">{tipos.map((tipoItem) => <button key={tipoItem} type="button" className={`switch-btn ${tipoAtivo === tipoItem ? 'active' : ''}`} onClick={() => setTipo(tipoItem)}>{tipoItem}</button>)}</div>

      <section className="calendar-box">
        <div className="calendar-head">
          <button type="button" className="circle-btn" onClick={() => setMesReferencia((atual) => { const c = new Date(atual.getFullYear(), atual.getMonth() - 1, 1); return c.getFullYear() === anoAtual ? c : atual })}>{'<'}</button>
          <strong>{MESES[mesReferencia.getMonth()]} {mesReferencia.getFullYear()}</strong>
          <button type="button" className="circle-btn" onClick={() => setMesReferencia((atual) => { const c = new Date(atual.getFullYear(), atual.getMonth() + 1, 1); return c.getFullYear() === anoAtual ? c : atual })}>{'>'}</button>
        </div>
        <div className="calendar-weekdays">{DIAS_SEMANA.map((d, i) => <span key={`${d}-${i}`}>{d}</span>)}</div>
        <div className="calendar-grid">
          {celulas.map((d, i) => {
            if (!d) return <div key={`e-${i}`} className="day-cell empty" />
            const iso = formatoDataISO(d)
            const ativo = iso === dataSelecionada
            const comEvento = Boolean(DISPONIBILIDADES[iso])
            return <button key={iso} type="button" className={`day-cell ${ativo ? 'active' : ''} ${comEvento ? 'has-events' : ''}`} onClick={() => setDataSelecionada(iso)}>{d.getDate()}</button>
          })}
        </div>

        <small>Horarios disponiveis</small>
        <div className="time-grid">
          {horarios.map((h) => (
            <button key={h.hora} type="button" disabled={h.vagas === 0} className={`time-btn ${horarioAtivo === h.hora ? 'selected' : ''}`} onClick={() => setHorario(h.hora)}>
              <strong>{h.hora}</strong><span>{h.vagas === 0 ? 'Esgotado' : `${h.vagas} vagas`}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="summary-box">
        <div><span>Academia</span><strong>{academiaSelecionada?.nome || '-'}</strong></div>
        <div><span>Usuario</span><strong>{usuario?.nome || '-'}</strong></div>
        <div><span>Tipo</span><strong>{tipoAtivo || '-'}</strong></div>
        <div><span>Data</span><strong>{dataSelecionada}</strong></div>
        <div><span>Horario</span><strong>{horarioAtivo || '-'}</strong></div>
      </section>

      {mensagemAgendamento && <p className="muted">{mensagemAgendamento}</p>}
      <button type="button" className="cta-btn full" onClick={() => onConfirmarAgendamento({ academia: academiaSelecionada, horario: horarioAtivo, dataSelecionada, tipo: tipoAtivo })} disabled={!horarioAtivo || statusAgendamento === 'enviando'}>
        {statusAgendamento === 'enviando' ? 'Enviando...' : 'Confirmar Agendamento'} <Check size={16} />
      </button>
    </>
  )
}

function ProfileScreen({ usuario, academias, agendamentos, avaliacoes, onSalvarAvaliacao, statusAvaliacao, mensagemAvaliacao }) {
  const [academiaId, setAcademiaId] = useState(academias[0]?.id || '')
  const [nota, setNota] = useState('5')
  const [comentario, setComentario] = useState('')
  const academiaIdAtivo = academiaId || academias[0]?.id || ''

  return (
    <>
      <section className="profile-head">
        <div className="avatar">
          {usuario?.fotoPerfil
            ? <img src={usuario.fotoPerfil} alt={`Foto de perfil de ${usuario?.nome || 'Usuario'}`} />
            : (usuario?.nome || 'U').charAt(0).toUpperCase()}
        </div>
        <div><h1>{usuario?.nome || 'Usuario'}</h1><p className="muted">{usuario?.email || '-'}</p></div>
      </section>

      <section className="stat-grid">
        <article><strong>{agendamentos.length}</strong><span>AGENDADOS</span></article>
        <article><strong>{avaliacoes.length}</strong><span>AVALIACOES</span></article>
        <article><strong>{academias.length}</strong><span>ACADEMIAS</span></article>
      </section>

      <section className="detail-section">
        <h3>Meus Agendamentos</h3>
        <div className="appointments-list">
          {agendamentos.length === 0 && <p className="muted">Nenhum agendamento registrado.</p>}
          {agendamentos.map((a) => <article className="appointment-item" key={a.id}><strong>{a.academiaNome}</strong><span>{a.dataFormatada}</span><small>{a.tipo || '-'}</small></article>)}
        </div>
      </section>

      <section className="detail-section">
        <h3>Avaliacoes</h3>
        <div className="evaluation-form">
          <label className="field-label" htmlFor="avaliacao-academia">Academia</label>
          <select id="avaliacao-academia" className="login-input" value={academiaIdAtivo} onChange={(e) => setAcademiaId(e.target.value)}>
            {academias.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
          <label className="field-label" htmlFor="avaliacao-nota">Nota</label>
          <select id="avaliacao-nota" className="login-input" value={nota} onChange={(e) => setNota(e.target.value)}>
            <option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option>
          </select>
          <label className="field-label" htmlFor="avaliacao-comentario">Comentario</label>
          <textarea id="avaliacao-comentario" className="login-input" value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3} />
          {mensagemAvaliacao && <p className="muted">{mensagemAvaliacao}</p>}
          <button type="button" className="cta-btn" onClick={() => onSalvarAvaliacao({ academiaId: academiaIdAtivo, nota: Number(nota), comentario })} disabled={statusAvaliacao === 'enviando' || !academiaIdAtivo}>{statusAvaliacao === 'enviando' ? 'Salvando...' : 'Salvar avaliacao'}</button>
        </div>

        <div className="appointments-list" style={{ marginTop: 12 }}>
          {avaliacoes.length === 0 && <p className="muted">Sem avaliacoes ainda.</p>}
          {avaliacoes.map((v) => <article className="appointment-item" key={v.id}><strong>{v.academiaNome}</strong><span>{'★'.repeat(Math.max(1, Math.min(5, Math.round(v.nota || 0))))}</span><small>{v.comentario || '-'}</small></article>)}
        </div>
      </section>

      <section className="detail-section">
        <details className="combo-box"><summary>Privacidade e LGPD</summary><p>Seus dados sao usados apenas para funcionamento do app, agendamentos e melhorias de experiencia. Voce pode solicitar remocao de dados a qualquer momento.</p></details>
        <details className="combo-box"><summary>Ajuda e Suporte</summary><p>Entre em contato: dev@dev.com</p></details>
      </section>
    </>
  )
}

function BottomNav({ telaAtiva, setTelaAtiva }) {
  const itens = [
    { id: 'home', label: 'Inicio', icon: MapPin },
    { id: 'compare', label: 'Comparar', icon: Medal },
    { id: 'schedule', label: 'Agenda', icon: Calendar },
    { id: 'profile', label: 'Perfil', icon: UserRound },
  ]

  return (
    <nav className="bottom-nav">
      {itens.map((item) => {
        const Icone = item.icon
        return <button key={item.id} type="button" className={telaAtiva === item.id ? 'active' : ''} onClick={() => setTelaAtiva(item.id)}><Icone size={16} /><span>{item.label}</span></button>
      })}
    </nav>
  )
}
function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null)
  const [loginInput, setLoginInput] = useState('')
  const [senhaInput, setSenhaInput] = useState('')
  const [carregandoLogin, setCarregandoLogin] = useState(false)
  const [erroLogin, setErroLogin] = useState('')
  const [academias, setAcademias] = useState([])
  const [agendamentos, setAgendamentos] = useState([])
  const [avaliacoes, setAvaliacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erroApi, setErroApi] = useState('')
  const [statusAgendamento, setStatusAgendamento] = useState('idle')
  const [mensagemAgendamento, setMensagemAgendamento] = useState('')
  const [statusAvaliacao, setStatusAvaliacao] = useState('idle')
  const [mensagemAvaliacao, setMensagemAvaliacao] = useState('')
  const [telaAtiva, setTelaAtiva] = useState('home')
  const [idAcademiaSelecionada, setIdAcademiaSelecionada] = useState(null)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('Todas')
  const [idsComparacao, setIdsComparacao] = useState([])
  const [posicaoUsuario, setPosicaoUsuario] = useState(POSICAO_PADRAO)
  const [distanciasPorAcademia, setDistanciasPorAcademia] = useState({})

  useEffect(() => {
    if (!usuarioLogado || !navigator.geolocation) return undefined

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosicaoUsuario({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      () => {
        // Ignore geolocation permission/availability issues.
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [usuarioLogado])

  useEffect(() => {
    if (!usuarioLogado) return

    async function carregar() {
      let statusAcademias = 'fulfilled'
      let statusAgendamentos = 'fulfilled'
      let statusAvaliacoes = 'fulfilled'

      try {
        setLoading(true)
        setErroApi('')

        const [respAcademias, respAgendamentos, respAvaliacoes] = await Promise.allSettled([
          listarAcademias(),
          listarAgendamentos(),
          listarAvaliacoes(),
        ])

        statusAcademias = respAcademias.status
        statusAgendamentos = respAgendamentos.status
        statusAvaliacoes = respAvaliacoes.status

        const ac = respAcademias.status === 'fulfilled' && Array.isArray(respAcademias.value)
          ? respAcademias.value.map(normalizarAcademia)
          : []
        const ag = respAgendamentos.status === 'fulfilled' && Array.isArray(respAgendamentos.value)
          ? respAgendamentos.value.map(normalizarAgendamento)
          : []
        const av = respAvaliacoes.status === 'fulfilled' && Array.isArray(respAvaliacoes.value)
          ? respAvaliacoes.value.map(normalizarAvaliacao)
          : []

        setAcademias(ac)
        setAgendamentos(ag)
        setAvaliacoes(av)

        if (ac.length > 0) {
          setIdAcademiaSelecionada(ac[0].id)
          setIdsComparacao(ac.slice(0, 2).map((item) => String(item.id)))
        } else {
          setIdAcademiaSelecionada(null)
          setIdsComparacao([])
        }
      } finally {
        if (statusAcademias === 'rejected') {
          setErroApi('Falha ao carregar academias do backend.')
        } else if (statusAgendamentos === 'rejected' || statusAvaliacoes === 'rejected') {
          setErroApi('Academias carregadas, mas alguns dados auxiliares falharam.')
        }
        setLoading(false)
      }
    }

    carregar()
  }, [usuarioLogado])

  useEffect(() => {
    if (!posicaoUsuario || academias.length === 0) return undefined

    let cancelado = false

    async function calcularDistancias() {
      const entradas = await Promise.all(
        academias.map(async (academia) => {
          const id = String(academia.id)
          if (!academia.endereco) {
            return [id, Number.isFinite(academia.distanciaKm) ? academia.distanciaKm : null]
          }
          try {
            const geo = await geocodeEnderecoGlobal(academia.endereco)
            if (!geo) {
              const geoFallback = coordenadaFallbackAcademia(academia)
              if (geoFallback) {
                const distanciaFallback = Number(calcularDistanciaKm(posicaoUsuario, geoFallback).toFixed(1))
                return [id, distanciaFallback]
              }
              return [id, Number.isFinite(academia.distanciaKm) ? academia.distanciaKm : distanciaEstimadaPorNome(academia.nome)]
            }
            const distancia = Number(calcularDistanciaKm(posicaoUsuario, geo).toFixed(1))
            return [id, distancia]
          } catch {
            const geoFallback = coordenadaFallbackAcademia(academia)
            if (geoFallback) {
              const distanciaFallback = Number(calcularDistanciaKm(posicaoUsuario, geoFallback).toFixed(1))
              return [id, distanciaFallback]
            }
            return [id, Number.isFinite(academia.distanciaKm) ? academia.distanciaKm : distanciaEstimadaPorNome(academia.nome)]
          }
        }),
      )

      if (cancelado) return

      const mapa = {}
      entradas.forEach(([id, distancia]) => {
        if (Number.isFinite(distancia)) mapa[id] = distancia
      })
      setDistanciasPorAcademia(mapa)
    }

    calcularDistancias().catch(() => {})
    return () => { cancelado = true }
  }, [academias, posicaoUsuario])

  const mediaAvaliacaoPorAcademia = useMemo(() => {
    const bucket = {}
    avaliacoes.forEach((item) => {
      const id = String(item.academiaId)
      const nota = Number(item.nota)
      if (!Number.isFinite(nota)) return
      if (!bucket[id]) bucket[id] = { soma: 0, total: 0 }
      bucket[id].soma += nota
      bucket[id].total += 1
    })

    const medias = {}
    Object.entries(bucket).forEach(([id, valor]) => {
      medias[id] = Number((valor.soma / valor.total).toFixed(1))
    })
    return medias
  }, [avaliacoes])

  const academiasComMetricas = useMemo(() => {
    return academias.map((academia) => {
      const id = String(academia.id)
      const avaliacaoMedia = mediaAvaliacaoPorAcademia[id]
      const distanciaCalculada = distanciasPorAcademia[id]
      const avaliacaoFinal = Number.isFinite(academia.avaliacao) ? academia.avaliacao : avaliacaoMedia
      const distanciaFinal = Number.isFinite(distanciaCalculada)
        ? distanciaCalculada
        : (Number.isFinite(academia.distanciaKm) ? academia.distanciaKm : distanciaEstimadaPorNome(academia.nome))
      const fotoLocal = selecionarImagemLocalAcademia(academia.nome)
      return {
        ...academia,
        avaliacao: Number.isFinite(avaliacaoFinal) ? avaliacaoFinal : academia.avaliacao,
        distanciaKm: Number.isFinite(distanciaFinal) ? distanciaFinal : academia.distanciaKm,
        fotoHomeUrl: fotoLocal || academia.fotoUrl || '',
      }
    })
  }, [academias, mediaAvaliacaoPorAcademia, distanciasPorAcademia])

  const academiaSelecionada = useMemo(() => {
    return academiasComMetricas.find((a) => String(a.id) === String(idAcademiaSelecionada)) || academiasComMetricas[0] || null
  }, [academiasComMetricas, idAcademiaSelecionada])

  const categorias = useMemo(() => {
    const set = new Set()
    academiasComMetricas.forEach((a) => a.modalidades.forEach((m) => set.add(m)))
    return ['Todas', ...Array.from(set)]
  }, [academiasComMetricas])

  const academiasFiltradas = useMemo(() => {
    return academiasComMetricas.filter((a) => {
      const termo = busca.trim().toLowerCase()
      const texto = `${a.nome} ${a.endereco} ${a.bairro} ${a.cidade}`.toLowerCase()
      const okBusca = !termo || texto.includes(termo)
      const okCat = categoria === 'Todas' || a.modalidades.some((m) => m.toLowerCase() === categoria.toLowerCase())
      return okBusca && okCat
    })
  }, [academiasComMetricas, busca, categoria])

  const meusAgendamentos = useMemo(() => {
    if (!usuarioLogado) return []
    return agendamentos
      .filter((a) => String(a.usuarioId) === String(usuarioLogado.id))
      .map((a) => {
        const academia = academiasComMetricas.find((item) => String(item.id) === String(a.academiaId))
        const d = a.data ? new Date(a.data) : null
        return {
          id: a.id,
          academiaNome: academia?.nome || `Academia #${a.academiaId}`,
          dataFormatada: d && !Number.isNaN(d.getTime()) ? d.toLocaleString('pt-BR') : (a.data || '-'),
          tipo: a.tipo || '',
          ts: d && !Number.isNaN(d.getTime()) ? d.getTime() : 0,
        }
      })
      .sort((x, y) => y.ts - x.ts)
  }, [agendamentos, academiasComMetricas, usuarioLogado])

  const minhasAvaliacoes = useMemo(() => {
    if (!usuarioLogado) return []
    return avaliacoes
      .filter((a) => String(a.usuarioId) === String(usuarioLogado.id))
      .map((a) => ({ ...a, academiaNome: academiasComMetricas.find((item) => String(item.id) === String(a.academiaId))?.nome || `Academia #${a.academiaId}` }))
  }, [avaliacoes, academiasComMetricas, usuarioLogado])

  async function fazerLogin() {
    try {
      setCarregandoLogin(true)
      setErroLogin('')
      const resposta = await autenticarUsuario({ login: loginInput, senha: senhaInput })
      setUsuarioLogado({
        id: resposta.usuario.id,
        nome: resposta.usuario.nome || 'Teste',
        email: resposta.usuario.email || '-',
        fotoPerfil: selecionarFotoPerfilUsuario(resposta.usuario),
      })
    } catch (erro) {
      setErroLogin(erro.message)
    } finally {
      setCarregandoLogin(false)
    }
  }

  function sair() {
    setUsuarioLogado(null)
    setTelaAtiva('home')
    setAcademias([])
    setAgendamentos([])
    setAvaliacoes([])
  }

  function adicionarComparacao(idAcademia) {
    setIdsComparacao((atual) => {
      const idNormalizado = String(idAcademia)
      if (atual.some((id) => String(id) === idNormalizado) || atual.length >= 4) return atual
      return [...atual, idNormalizado]
    })
  }

  function removerComparacao(idAcademia) {
    const idNormalizado = String(idAcademia)
    setIdsComparacao((atual) => atual.filter((id) => String(id) !== idNormalizado))
  }

  async function confirmarAgendamento({ academia, horario, dataSelecionada, tipo }) {
    if (!usuarioLogado || !academia || !horario) return

    try {
      setStatusAgendamento('enviando')
      setMensagemAgendamento('')
      const data = `${dataSelecionada} ${horario}:00`
      const resultado = await criarAgendamento({ usuario_id: usuarioLogado.id, academia_id: academia.id, data, tipo })
      const novos = Array.isArray(resultado) ? resultado.map(normalizarAgendamento) : []
      setAgendamentos((atual) => [...novos, ...atual])
      setMensagemAgendamento('Agendamento salvo no backend/Supabase.')
      setStatusAgendamento('sucesso')
    } catch (erro) {
      setMensagemAgendamento(`Falha ao salvar: ${erro.message}`)
      setStatusAgendamento('erro')
    }
  }

  async function salvarAvaliacao({ academiaId, nota, comentario }) {
    if (!usuarioLogado || !academiaId || !nota) return
    try {
      setStatusAvaliacao('enviando')
      setMensagemAvaliacao('')
      const resultado = await criarAvaliacao({ usuario_id: usuarioLogado.id, academia_id: academiaId, nota, comentario })
      const novas = Array.isArray(resultado) ? resultado.map(normalizarAvaliacao) : []
      setAvaliacoes((atual) => [...novas, ...atual])
      setMensagemAvaliacao('Avaliacao salva no backend/Supabase.')
      setStatusAvaliacao('sucesso')
    } catch (erro) {
      setMensagemAvaliacao(`Falha ao salvar avaliacao: ${erro.message}`)
      setStatusAvaliacao('erro')
    }
  }

  function renderTela() {
    if (telaAtiva === 'details') {
      return <DetailScreen academia={academiaSelecionada} onBack={() => setTelaAtiva('home')} onAgendar={(id) => { setIdAcademiaSelecionada(id); setTelaAtiva('schedule') }} />
    }

    if (telaAtiva === 'compare') {
      return <CompareScreen academias={academiasComMetricas} selecionadas={idsComparacao} onRemover={removerComparacao} onAdicionar={adicionarComparacao} onAgendar={(id) => { setIdAcademiaSelecionada(id); setTelaAtiva('schedule') }} />
    }

    if (telaAtiva === 'schedule') {
      return <ScheduleScreen academias={academiasComMetricas} academiaSelecionada={academiaSelecionada} setAcademiaSelecionada={(a) => setIdAcademiaSelecionada(a?.id || null)} usuario={usuarioLogado} onConfirmarAgendamento={confirmarAgendamento} statusAgendamento={statusAgendamento} mensagemAgendamento={mensagemAgendamento} />
    }

    if (telaAtiva === 'profile') {
      return <ProfileScreen usuario={usuarioLogado} academias={academiasComMetricas} agendamentos={meusAgendamentos} avaliacoes={minhasAvaliacoes} onSalvarAvaliacao={salvarAvaliacao} statusAvaliacao={statusAvaliacao} mensagemAvaliacao={mensagemAvaliacao} />
    }

    return <HomeScreen academias={academiasFiltradas} busca={busca} setBusca={setBusca} categoria={categoria} setCategoria={setCategoria} categorias={categorias} loading={loading} erroApi={erroApi} onVerDetalhes={(id) => { setIdAcademiaSelecionada(id); setTelaAtiva('details') }} onAgendar={(id) => { setIdAcademiaSelecionada(id); setTelaAtiva('schedule') }} />
  }

  if (!usuarioLogado) {
    return (
      <main className="mobile-shell">
        <section className="screen-content">
          <LoginScreen login={loginInput} senha={senhaInput} setLogin={setLoginInput} setSenha={setSenhaInput} onEntrar={fazerLogin} erroLogin={erroLogin} carregando={carregandoLogin} />
        </section>
      </main>
    )
  }

  return (
    <main className="mobile-shell">
      <header className="app-topbar">
        <button type="button" className="logout-global-btn" onClick={sair}><LogOut size={14} /> Sair</button>
      </header>
      <section className="screen-content">{renderTela()}</section>
      {telaAtiva !== 'details' && <BottomNav telaAtiva={telaAtiva} setTelaAtiva={setTelaAtiva} />}
    </main>
  )
}

export default App
