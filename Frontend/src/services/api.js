const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)

  if (!response.ok) {
    let detalhe = ''

    try {
      const body = await response.json()
      detalhe = body?.erro || body?.detalhe || ''
    } catch {
      detalhe = ''
    }

    throw new Error(`Erro ${response.status} em ${path}${detalhe ? `: ${detalhe}` : ''}`)
  }

  return response.json()
}

export function autenticarUsuario(payload) {
  return request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function listarAcademias() {
  return request('/academias')
}

export function listarAgendamentos() {
  return request('/agendamentos')
}

export function criarAgendamento(payload) {
  return request('/agendamentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function listarAvaliacoes(usuarioId) {
  const query = usuarioId ? `?usuario_id=${encodeURIComponent(usuarioId)}` : ''
  return request(`/avaliacoes${query}`)
}

export function criarAvaliacao(payload) {
  return request('/avaliacoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
