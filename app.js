// SMECEL · Apresentação Financeira 2026 — App.js
'use strict';

const D = window.DADOS;
const MESES = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
const MESES_CURTOS = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const MESES_MAI_DEZ = ['MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
const MESES_CURTOS_MAI_DEZ = ['MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

// === FORMATADORES ===
function fmtBRL(v) {
  if (v == null || isNaN(v)) return '—';
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtBRLcompact(v) {
  if (v == null || isNaN(v) || v === 0) return '—';
  const abs = Math.abs(v);
  let formatted;
  if (abs >= 1e9) formatted = (v / 1e9).toFixed(2).replace('.', ',') + ' bi';
  else if (abs >= 1e6) formatted = (v / 1e6).toFixed(2).replace('.', ',') + ' mi';
  else if (abs >= 1e3) formatted = (v / 1e3).toFixed(1).replace('.', ',') + ' mil';
  else formatted = v.toFixed(0);
  return v < 0 ? '−' + formatted.replace('-', '') : formatted;
}
function fmtSinal(v) {
  if (v == null || isNaN(v) || v === 0) return '—';
  return (v > 0 ? '+' : '−') + fmtBRLcompact(Math.abs(v));
}
function fmtInt(v) {
  return v == null ? '—' : v.toLocaleString('pt-BR');
}

// ============================================
// SEÇÃO 01 · TABELA CRONOGRAMA
// ============================================
function renderTabelaCronograma() {
  const head = document.getElementById('tabela-cronograma-head');
  const body = document.getElementById('tabela-cronograma-body');

  // CABEÇALHO
  let thHtml = '<tr><th>Item</th>';
  MESES_CURTOS_MAI_DEZ.forEach(m => {
    thHtml += `<th>${m}</th>`;
  });
  thHtml += '<th class="total-col">TOTAL Mai-Dez</th></tr>';
  head.innerHTML = thHtml;

  let html = '';

  // ===== BLOCO 1: DESPESA =====
  html += `<tr class="grupo-header" data-grupo="despesa">
    <td>▼ DESPESA PROJETADA · Total</td>
    ${MESES_MAI_DEZ.map(m => {
      const v = D.despesa_por_mes[m] || 0;
      return `<td class="right">${fmtBRLcompact(v)}</td>`;
    }).join('')}
    <td class="total">${fmtBRLcompact(somaMesesMaiDez(D.despesa_por_mes))}</td>
  </tr>`;

  // SUB: por diretoria, ordenado por valor desc
  const dirsOrdenadas = Object.entries(D.por_diretoria || {})
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0]);

  dirsOrdenadas.forEach((dir, idxDir) => {
    const dirMes = D.por_dir_mes[dir] || {};
    const totalMaiDez = somaMesesMaiDez(dirMes);
    if (totalMaiDez === 0) return;

    // Linha da diretoria (sub-row coord — expande/recolhe seus itens)
    const dirId = `dir-${idxDir}`;
    html += `<tr class="sub-row coord despesa-coord" data-target="${dirId}" data-grupo-pai="despesa">
      <td>${dir}</td>
      ${MESES_MAI_DEZ.map(m => `<td class="right">${fmtBRLcompact(dirMes[m] || 0)}</td>`).join('')}
      <td class="total">${fmtBRLcompact(totalMaiDez)}</td>
    </tr>`;

    // Itens detalhados
    const itensDir = (D.itens_despesa || []).filter(i => i.diretoria === dir);
    itensDir.forEach((item, idxItem) => {
      const totalItem = somaMesesMaiDez(item.meses);
      if (totalItem === 0) return;
      html += `<tr class="sub-row item ${dirId}" data-parent="${dirId}" data-grupo-pai="despesa" hidden>
        <td>${item.despesa}</td>
        ${MESES_MAI_DEZ.map(m => `<td class="right">${fmtBRLcompact(item.meses[m] || 0)}</td>`).join('')}
        <td class="total">${fmtBRLcompact(totalItem)}</td>
      </tr>`;
    });
  });

  // ===== BLOCO 2: RECEITA =====
  html += `<tr class="grupo-header" data-grupo="receita">
    <td>▼ RECEITA VINCULADA · Outras Fontes (FUNDEB, Sal. Educação, PNAE, PNATE)</td>
    ${MESES_MAI_DEZ.map(m => `<td class="right">${fmtBRLcompact(D.receita_outras_fontes[m] || 0)}</td>`).join('')}
    <td class="total">${fmtBRLcompact(somaMesesMaiDez(D.receita_outras_fontes))}</td>
  </tr>`;

  // ===== BLOCO 3: AÇÕES DE CONTENÇÃO =====
  html += `<tr class="grupo-header economia" data-grupo="economia">
    <td>▼ AÇÕES DE CONTENÇÃO DA SMECEL · economia mensal</td>
    ${MESES_MAI_DEZ.map(m => {
      const v = -1 * (D.economia_por_mes[m] || 0);
      return `<td class="right" style="color: #B8F0BD;">${v === 0 ? '—' : fmtSinal(v)}</td>`;
    }).join('')}
    <td class="total" style="color: var(--c-success);">${fmtSinal(-D.economia_mai_dez)}</td>
  </tr>`;

  // Cada ação como item dentro do grupo economia
  D.acoes_contencao.forEach((acao, i) => {
    html += `<tr class="sub-row item" data-grupo-pai="economia">
      <td>${acao.nome}</td>
      ${MESES_MAI_DEZ.map(m => {
        const v = acao.economia_meses[m] || 0;
        return `<td class="right" style="color: ${v > 0 ? 'var(--c-success)' : 'var(--c-text-soft)'};">${v === 0 ? '—' : fmtSinal(-v)}</td>`;
      }).join('')}
      <td class="total" style="color: var(--c-success);">${fmtSinal(-somaMesesMaiDez(acao.economia_meses))}</td>
    </tr>`;
  });

  // ===== BLOCO 4: FECHAMENTO =====
  html += `<tr class="grupo-header fechamento" data-grupo="fechamento">
    <td>FECHAMENTO · Receita necessária × Cumprimento MDE 25%</td>
    ${MESES_MAI_DEZ.map(m => '<td></td>').join('')}
    <td></td>
  </tr>`;

  // Linha 1: Receita necessária SEM RP (oficial da planilha COMPARATIVOS)
  html += `<tr class="sub-row receita-necessaria" data-grupo-pai="fechamento">
    <td><strong>Receita necessária (sem RP)</strong></td>
    ${MESES_MAI_DEZ.map(m => {
      let v = D.receita_necessaria_sem_rp[m] || 0;
      // Aplicar economia da SMECEL (reduz a receita necessária)
      v = v - (D.economia_por_mes[m] || 0);
      return `<td class="right">${fmtBRLcompact(v)}</td>`;
    }).join('')}
    <td class="total">${(() => {
      let s = 0;
      MESES_MAI_DEZ.forEach(m => s += (D.receita_necessaria_sem_rp[m] || 0) - (D.economia_por_mes[m] || 0));
      return fmtBRLcompact(s);
    })()}</td>
  </tr>`;

  // Linha 2: Cumprimento MDE 25% pelo Tesouro Municipal (obrigação constitucional)
  html += `<tr class="sub-row aporte-proposto" data-grupo-pai="fechamento">
    <td><strong>Cumprimento MDE 25% pelo Tesouro</strong> <small class="muted">(obrigação constitucional · art. 212 CF/88)</small></td>
    ${MESES_MAI_DEZ.map(m => `<td class="right">${fmtBRLcompact(D.cumprimento_mde_25[m] || 0)}</td>`).join('')}
    <td class="total">${fmtBRLcompact(D.cumprimento_mde_25.TOTAL || 0)}</td>
  </tr>`;

  // Linha 3: GAP / SOBRA
  html += `<tr class="sub-row gap-negativo" data-grupo-pai="fechamento">
    <td><strong>Resultado mensal</strong> <small class="muted">(receita necessária menos cumprimento MDE)</small></td>
    ${MESES_MAI_DEZ.map(m => {
      const necessario = (D.receita_necessaria_sem_rp[m] || 0) - (D.economia_por_mes[m] || 0);
      const mde = D.cumprimento_mde_25[m] || 0;
      const gap = necessario - mde;
      const cls = gap > 0 ? 'right' : 'right';
      const sinal = gap > 0 ? '−' : '+';
      return `<td class="${cls}">${gap === 0 ? '—' : sinal + fmtBRLcompact(Math.abs(gap))}</td>`;
    }).join('')}
    <td class="total">${(() => {
      let totalGap = 0;
      MESES_MAI_DEZ.forEach(m => {
        const necessario = (D.receita_necessaria_sem_rp[m] || 0) - (D.economia_por_mes[m] || 0);
        totalGap += necessario - (D.cumprimento_mde_25[m] || 0);
      });
      const sinal = totalGap > 0 ? '−' : '+';
      return sinal + fmtBRLcompact(Math.abs(totalGap));
    })()}</td>
  </tr>`;

  body.innerHTML = html;

  // Setup interação cascata
  configurarCascata();
}

function somaMesesMaiDez(obj) {
  if (!obj) return 0;
  let s = 0;
  MESES_MAI_DEZ.forEach(m => s += (obj[m] || 0));
  return s;
}

function configurarCascata() {
  // Click no header de grupo → colapsa/expande TODO o grupo
  document.querySelectorAll('.grupo-header').forEach(header => {
    header.addEventListener('click', () => {
      const grupo = header.dataset.grupo;
      header.classList.toggle('colapsado');
      const colapsado = header.classList.contains('colapsado');
      document.querySelectorAll(`[data-grupo-pai="${grupo}"]`).forEach(row => {
        if (colapsado) {
          row.hidden = true;
          row.dataset.colapsadoPorGrupo = '1';
        } else {
          // só revela se NÃO estiver oculto por coord pai
          if (row.classList.contains('item') && row.classList.contains(getCoordId(row))) {
            // verifica se a coord pai está expandida
            const coordId = row.dataset.parent;
            if (coordId) {
              const coord = document.querySelector(`.coord[data-target="${coordId}"]`);
              if (coord && !coord.classList.contains('expandido')) return; // mantém oculto
            }
          }
          row.hidden = false;
          delete row.dataset.colapsadoPorGrupo;
        }
      });
    });
  });

  // Click em uma coord (sub-row.coord) → mostra/oculta itens filhos
  document.querySelectorAll('.sub-row.coord').forEach(coord => {
    coord.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = coord.dataset.target;
      coord.classList.toggle('expandido');
      const expandido = coord.classList.contains('expandido');
      document.querySelectorAll(`.${targetId}[data-parent="${targetId}"]`).forEach(item => {
        item.hidden = !expandido;
      });
    });
  });
}

function getCoordId(row) {
  for (const cls of row.classList) {
    if (cls.startsWith('dir-')) return cls;
  }
  return null;
}

// ============================================
// SEÇÃO 02 · TABELA DE AÇÕES DE CONTENÇÃO
// ============================================
function renderAcoes() {
  const container = document.getElementById('tabela-acoes');
  const statusMap = {
    'Em execução': 'exec',
    'Em negociação': 'neg',
    'Aquisição em curso': 'aquis',
  };

  let html = `<table class="cenarios-tabela">
    <thead>
      <tr>
        <th>#</th>
        <th>Ação</th>
        <th>Período</th>
        <th>Economia mensal</th>
        <th>Total Mai-Dez</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>`;

  D.acoes_contencao.forEach((a, i) => {
    const totalMaiDez = somaMesesMaiDez(a.economia_meses);
    const statusClass = statusMap[a.status] || '';
    html += `<tr>
      <td><strong>${i + 1}</strong></td>
      <td>
        <strong>${a.nome}</strong><br>
        <small class="muted">${a.descricao}</small>
      </td>
      <td>${a.periodo}</td>
      <td class="right"><strong>${fmtBRL(a.valor_mensal)}</strong></td>
      <td class="right"><strong style="color: var(--c-success);">${fmtBRL(totalMaiDez)}</strong></td>
      <td><span class="tag-status ${statusClass}">${a.status}</span></td>
    </tr>`;
  });

  // Linha de TOTAL
  html += `<tr style="background: #F0F4ED; font-weight: 700;">
    <td colspan="4" style="text-align: right; padding-right: 16px;">TOTAL DE ECONOMIA Mai-Dez/2026:</td>
    <td class="right" style="color: var(--c-success); font-size: 16px;">${fmtBRL(D.economia_mai_dez)}</td>
    <td>${D.acoes_contencao.length} ações</td>
  </tr>`;

  html += `</tbody></table>`;
  container.innerHTML = html;
}

// ============================================
// SEÇÃO 03 · PEDIDOS AO PREFEITO
// ============================================
function renderPedidos() {
  const grid = document.getElementById('pedidos-grid');
  let html = '';
  D.pedidos.forEach(p => {
    html += `<div class="pedido">
      <div class="num">${p.num}</div>
      <div>
        <div class="titulo">${p.titulo}</div>
        <div class="detalhe">${p.detalhe}</div>
        <div class="instrumento">${p.instrumento}</div>
      </div>
      <div class="valor-pedido">${p.valor}</div>
    </div>`;
  });
  grid.innerHTML = html;
}

// ============================================
// TOOLBAR
// ============================================
function configurarToolbar() {
  document.getElementById('btn-exp-todas').addEventListener('click', () => {
    // Garante grupos abertos
    document.querySelectorAll('.grupo-header.colapsado').forEach(h => h.click());
    // Garante coords expandidas
    document.querySelectorAll('.sub-row.coord:not(.expandido)').forEach(c => c.click());
  });

  document.getElementById('btn-rec-todas').addEventListener('click', () => {
    // Recolhe coords primeiro
    document.querySelectorAll('.sub-row.coord.expandido').forEach(c => c.click());
    // Depois recolhe grupos
    document.querySelectorAll('.grupo-header:not(.colapsado)').forEach(h => h.click());
  });

  document.getElementById('btn-imprimir').addEventListener('click', () => {
    // Expande tudo antes de imprimir
    document.getElementById('btn-exp-todas').click();
    setTimeout(() => window.print(), 200);
  });
}

// ============================================
// INIT
// ============================================
window.addEventListener('DOMContentLoaded', () => {
  renderTabelaCronograma();
  renderAcoes();
  renderPedidos();
  configurarToolbar();
  console.log('SMECEL · Apresentação 2026 carregada.');
  console.log('Total ações:', D.acoes_contencao.length);
  console.log('Economia Mai-Dez:', fmtBRL(D.economia_mai_dez));
});
