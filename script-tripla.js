document.getElementById("btnScreenshot").addEventListener("click", () => {
  const titulo = document.getElementById("tituloJogo").value.trim();
  
  // Data no formato DD-MM-YYYY
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = hoje.getFullYear();
  const dataStr = `${dia}-${mes}-${ano}`;

  // Nome do arquivo
  const nomeArquivo = (titulo ? titulo : "APOSTA") + "-" + dataStr + ".jpg";

  // Captura a tela
  html2canvas(document.body).then((canvas) => {
    const link = document.createElement("a");
    link.download = nomeArquivo;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  });
});


function alternarTipo(i) {
    const symbolEl = document.getElementById(`s${i}`);
    const isBack = symbolEl.textContent.trim() === '+';
  
    const layGroup = document.getElementById(`layGroup${i}`);
    const backGroup = document.getElementById(`backGroup${i}`);
  
    if (isBack) {
      symbolEl.textContent = '-';
      layGroup.style.display = 'block';
      backGroup.style.display = 'none';
    } else {
      symbolEl.textContent = '+';
      layGroup.style.display = 'none';
      backGroup.style.display = 'block';
    }
  
    atualizarTotal();
  }
  
  function travar(index) {
    atualizarTotal();
    calcularLucroEquilibrado();
  }
  
  function atualizarTotal() {
    let total = 0;
    for (let i = 1; i <= 3; i++) {
      const tipo = document.getElementById(`s${i}`).textContent.trim();
      const val = tipo === '+'
        ? parseFloat(document.getElementById(`aposta${i}`).value) || 0
        : parseFloat(document.getElementById(`resp${i}`).value) || 0;
      total += val;
    }
    document.getElementById('montanteTotal').value = total.toFixed(2);
  }
  
function calcularLucrosSimples() {
  const apostas = [];
  const conv = parseFloat(document.getElementById('freebetConversion').value) / 100;

  for (let i = 1; i <= 3; i++) {
    const symbolEl = document.getElementById(`s${i}`).textContent.trim();
    const rawCb    = parseFloat(document.getElementById(`cashback${i}`).value) || 0;
    const cbType   = document.getElementById(`tipo${i}`).value;
    const odd      = parseFloat(document.getElementById(`odd${i}`).value) || 0;
    const com      = (parseFloat(document.getElementById(`comissao${i}`).value) || 0) / 100;

    const valor = symbolEl === '+'
      ? parseFloat(document.getElementById(`aposta${i}`).value) || 0
      : parseFloat(document.getElementById(`resp${i}`).value)   || 0;

    const oddReal = symbolEl === '+' ? odd : odd / (odd - 1);
    const retorno = (oddReal - 1) * (1 - com);

    let cbFrac = 0;
    let cbDeposito = 0;

    if (cbType === 'deposito') {
      // Depósito: não influencia o balanceamento (cbFrac=0),
      // vira bônus fixo somado no fim
      cbFrac = 0;
      cbDeposito = (rawCb / 100) * valor;
    } else if (cbType === 'real') {
      cbFrac = rawCb / 100;
    } else if (cbType === 'freebet' && valor > 0) {
      const maxFb      = parseFloat(document.getElementById(`maxFreebet${i}`).value) || Infinity;
      const freebetAmt = Math.min((rawCb / 100) * valor, maxFb);
      cbFrac = (freebetAmt * conv) / valor;
    }

    // >>> AQUI ESTÁ A CORREÇÃO: persistir cbDeposito <<<
    apostas.push({ symbol: symbolEl, retorno, cashback: cbFrac, valor, cbDeposito });
  }

  const depositoTotal = apostas.reduce((sum, ap) => sum + (ap.cbDeposito || 0), 0);

  apostas.forEach((a, idx) => {
    const perda = apostas
      .filter((_, j) => j !== idx)
      .reduce((sum, ap) => sum + ap.valor * (1 - ap.cashback), 0);

    // Cashback só entra como ganho da vencedora no caso LAY (“-”)
    const cbVencedora = a.symbol === '-' ? a.valor * a.cashback : 0;

    const lucro = a.valor * a.retorno - perda + cbVencedora + depositoTotal;
    document.getElementById(`lucro${idx + 1}`).textContent = lucro.toFixed(2);
  });
}

  function calcularLay(i, base = 'aFavor') {
    const odd = parseFloat(document.getElementById(`odd${i}`).value);
    const aFavorInput = document.getElementById(`aFavor${i}`);
    const respInput = document.getElementById(`resp${i}`);
  
    if (odd <= 1.01) return;
    const oddReal = odd / (odd - 1);
  
    if (base === 'aFavor') {
      const aFavor = parseFloat(aFavorInput.value) || 0;
      const resp = aFavor / (oddReal - 1);
      respInput.value = resp.toFixed(2);
    } else if (base === 'resp') {
      const resp = parseFloat(respInput.value) || 0;
      const aFavor = resp * (oddReal - 1);
      aFavorInput.value = aFavor.toFixed(2);
    }
  
    atualizarTotal();
  }
 
  function calcularLucroEquilibrado() {
  const travadoRadio = document.querySelector('input[name="travar"]:checked');
  const indexTravado = parseInt(travadoRadio.id.replace('travar', ''), 10);
  const apostas = [];

  for (let i = 1; i <= 3; i++) {
    const tipo = document.getElementById(`s${i}`).textContent.trim();
    const odd = parseFloat(document.getElementById(`odd${i}`).value);
    const comissao = parseFloat(document.getElementById(`comissao${i}`).value) / 100;

    let valor = 0;
    if (tipo === '+') {
      valor = parseFloat(document.getElementById(`aposta${i}`).value) || 0;
    } else {
      valor = parseFloat(document.getElementById(`resp${i}`).value) || 0;
    }

    const rawCb = parseFloat(document.getElementById(`cashback${i}`).value) || 0;
    const tipoCashback = document.getElementById(`tipo${i}`).value;
    let cashback = 0;
    let cbDeposito = 0;

    if (tipoCashback === 'deposito') {
    cbDeposito = null; // será recalculado para todos após os valores estarem definidos
    } else if (tipoCashback === 'real') {
      cashback = rawCb / 100;
    } else if (tipoCashback === 'freebet') {
      cashback = null; // será definido depois, com valor real de aposta
    }

    const oddReal = tipo === '+' ? odd : odd / (odd - 1);
    const retorno = tipo === '+'
      ? (odd - 1) * (1 - comissao)
      : (oddReal - 1) * (1 - comissao);

    apostas.push({
      tipo,
      odd,
      comissao,
      cashback,
      cbDeposito,
      valor,
      oddReal,
      retorno,
      tipoCashback,
      rawCb
    });
    console.log(`[APOSTA ${i}] tipo: ${tipo}, valor: ${valor}, tipoCashback: ${tipoCashback}, rawCb: ${rawCb}, cashback INICIAL: ${cashback}`);

  }
  
  const ids = [0, 1, 2];
  const idxTravado = indexTravado - 1;
  const idsLivres = ids.filter(i => i !== idxTravado);
  const i1 = idsLivres[0];
  const i2 = idsLivres[1];

  const arredondar = document.getElementById("arredondarCheck").checked;
  const passo = parseFloat(document.getElementById("arredondarValor").value) || 1;
  const arredondarPara = (v) => arredondar ? Math.round(v / passo) * passo : v;

  const travada = apostas[idxTravado];

  // Se a aposta travada for freebet, calcular o cashback com base no valor travado
  if (travada.tipoCashback === 'freebet' && travada.valor > 0) {
    const maxFb = parseFloat(document.getElementById(`maxFreebet${indexTravado}`).value) || Infinity;
    const conv = parseFloat(document.getElementById('freebetConversion').value) || 0;
    const freebetBruta = (travada.rawCb / 100) * travada.valor;
    const freebetAplicada = Math.min(freebetBruta, maxFb);
    travada.cashback = (freebetAplicada * (conv / 100)) / travada.valor;

    console.log(`[CB FREEBET TRAVADA] valor: ${travada.valor}, rawCb: ${travada.rawCb}, maxFb: ${maxFb}, conv: ${conv}`);
    console.log(`→ freebetBruta: ${freebetBruta}, aplicada: ${freebetAplicada}, cashback: ${travada.cashback}`);
  }

  const A = travada.valor;
  const R = travada.retorno * A;
  const cbA = travada.cashback || 0;

  // rodagem 1: com cashback de outros como zero
  const cb1_temp = apostas[i1].cashback || 0;
  const cb2_temp = apostas[i2].cashback || 0;
  const r1 = apostas[i1].retorno;
  const r2 = apostas[i2].retorno;

  let x = arredondarPara((R + (A - (A * cbA))) / (r1 + (1 - cb1_temp)));
  let y = arredondarPara((R + (A - (A * cbA))) / (r2 + (1 - cb2_temp)));
  console.log(`\n[RODAGEM 1] x = ${x}, y = ${y}`);

  apostas[i1].valor = x;
  apostas[i2].valor = y;

    apostas.forEach((a, i) => {
  if (a.tipoCashback === 'deposito') {
    const rawCb = parseFloat(document.getElementById(`cashback${i+1}`).value) || 0;
    a.cbDeposito = (rawCb / 100) * a.valor;

    console.log(`[CB DEPOSITO] Aposta ${i+1} → valor: ${a.valor}, rawCb: ${rawCb}, cbDeposito: ${a.cbDeposito}`);
  }
});

  // Recalcular cashback freebet se não for o travado
  [i1, i2].forEach((i) => {
    const a = apostas[i];
    const isTravado = i === idxTravado;
    if (a.tipoCashback === 'freebet' && !isTravado && a.valor > 0) {
      const maxFb = parseFloat(document.getElementById(`maxFreebet${i + 1}`).value) || Infinity;
      const conv = parseFloat(document.getElementById('freebetConversion').value) || 0;
      const freebetBruta = (a.rawCb / 100) * a.valor;
      const freebetAplicada = Math.min(freebetBruta, maxFb);
      a.cashback = (freebetAplicada * (conv / 100)) / a.valor;
      console.log(`[FB RECALCULADA] Aposta ${i + 1}`);
      console.log(`→ valor: ${a.valor}, rawCb: ${a.rawCb}, maxFb: ${maxFb}, conv: ${conv}`);
      console.log(`→ freebetBruta: ${freebetBruta}, aplicada: ${freebetAplicada}, cashback final: ${a.cashback}`);
    }
  });

  // Recalcular cb1, cb2
  const cb1 = apostas[i1].cashback || 0;
  const cb2 = apostas[i2].cashback || 0;

  // rodagem 2: agora com cashback real
  x = arredondarPara((R + (A - (A * cbA))) / (r1 + (1 - cb1)));
  y = arredondarPara((R + (A - (A * cbA))) / (r2 + (1 - cb2)));
  console.log(`\n[RODAGEM 2] x = ${x}, y = ${y}`);

  apostas[i1].valor = x;
  apostas[i2].valor = y;

  // Atualiza campos HTML
  [i1, i2].forEach((i) => {
    const a = apostas[i];
    const id = i + 1;
    if (a.tipo === '+') {
      document.getElementById(`aposta${id}`).value = a.valor.toFixed(2);
    } else {
      const aFavor = a.valor * (a.oddReal - 1);
      document.getElementById(`aFavor${id}`).value = aFavor.toFixed(2);
      document.getElementById(`resp${id}`).value = a.valor.toFixed(2);
    }
  });

  // Atualiza montante
  const total = apostas.reduce((s, a) => s + a.valor, 0);
  const depositoTotal = apostas.reduce((s, a) => s + (a.cbDeposito || 0), 0);
  document.getElementById('montanteTotal').value = total.toFixed(2);

  // Calcula lucros por cenário
  apostas.forEach((a, i) => {
    let perdaOutros = 0;
    for (let j = 0; j < apostas.length; j++) {
      if (j !== i) {
        perdaOutros += apostas[j].valor * (1 - (apostas[j].cashback || 0));
      }
    }

    const cashbackVencedora = a.tipo === '+' ? 0 : a.valor * (a.cashback || 0);
    const lucroBase = a.valor * a.retorno - perdaOutros + cashbackVencedora;
    const lucro = lucroBase + depositoTotal;
    console.log(`[LUCRO] Aposta ${i + 1}`);
    console.log(`→ valor: ${a.valor}, retorno: ${a.retorno}, perdaOutros: ${perdaOutros}`);
    console.log(`→ cashback: ${a.cashback}, cbVencedora: ${cashbackVencedora}`);
    console.log(`→ lucro final: ${lucro}`);
    document.getElementById(`lucro${i + 1}`).textContent = lucro.toFixed(2);
  });
}




  function toggleFreebetMax(i) {
  const tipo   = document.getElementById(`tipo${i}`).value;
  const maxEl  = document.getElementById(`maxFreebet${i}`);
  const labelEl = document.getElementById(`labelFreebet${i}`);

  if (tipo === 'freebet') {
    maxEl.style.display   = 'block';
    labelEl.style.display = 'block';
  } else {
    maxEl.style.display   = 'none';
    labelEl.style.display = 'none';
    maxEl.value           = '';
  }
}
  
  document.addEventListener('DOMContentLoaded', () => {
      // Título do jogo (salva/restaura)
  const tituloEl = document.getElementById('tituloJogo');
  if (tituloEl) {
    const KEY = 'tituloJogoTripla';
    const saved = localStorage.getItem(KEY);
    if (saved) tituloEl.value = saved;

    tituloEl.addEventListener('input', () => {
      localStorage.setItem(KEY, tituloEl.value.trim());
    });
  }

    for (let i = 1; i <= 3; i++) {
  document.getElementById(`aposta${i}`).disabled = true;
  document.getElementById(`resp${i}`).disabled   = true;
  document.getElementById(`aFavor${i}`).disabled = true;
}


document
  .querySelectorAll('input[name="travar"]')
  .forEach(radio =>
    radio.addEventListener('change', () => {
      for (let j = 1; j <= 3; j++) {
        document.getElementById(`aposta${j}`).disabled = false;
        document.getElementById(`resp${j}`).disabled   = false;
        document.getElementById(`aFavor${j}`).disabled = false;
      }
    })
  );
    for (let i = 1; i <= 3; i++) {
  
      const aFavorInput = document.getElementById(`aFavor${i}`);
      const respInput = document.getElementById(`resp${i}`);
      const oddInput = document.getElementById(`odd${i}`);
      const comissaoInput = document.getElementById(`comissao${i}`);
      const cashbackInput = document.getElementById(`cashback${i}`);
      const tipoEl = document.getElementById(`tipo${i}`);
      const perdaToggle = document.getElementById(`cbPerda${i}`);
      tipoEl.addEventListener('change', () => {
       
        toggleFreebetMax(i);
        
        atualizarTotal();
        calcularLucroEquilibrado();
      });
      tipoEl.addEventListener('change', () => toggleFreebetMax(i));
      const maxFbInput = document.getElementById(`maxFreebet${i}`);
      if (maxFbInput) {
        maxFbInput.addEventListener('input', () => {
          calcularLucroEquilibrado();
        });
      }

      [oddInput, comissaoInput, cashbackInput].forEach(input => {
        if (input) input.addEventListener('input', () => {
          calcularLay(i, 'aFavor');
          calcularLucroEquilibrado();
          atualizarTotal();
        });
      });

      ['aposta', 'resp'].forEach(prefix => {
        const el = document.getElementById(`${prefix}${i}`);
        if (el) el.addEventListener('input', () => {
          atualizarTotal();
          const isLocked = document.getElementById(`travar${i}`).checked;
          if (isLocked) calcularLucroEquilibrado();
          else       calcularLucrosSimples();
        });
      });

      if (aFavorInput) aFavorInput.addEventListener('input', () => {
        calcularLay(i, 'aFavor');
        calcularLucroEquilibrado();
      });
  
      if (respInput) respInput.addEventListener('input', () => {
        calcularLay(i, 'resp');
        calcularLucroEquilibrado();
      });
    }
  
    const arredondarCheck = document.getElementById('arredondarCheck');
    const arredondarValor = document.getElementById('arredondarValor');
    if (arredondarCheck) arredondarCheck.addEventListener('change', calcularLucroEquilibrado);
    if (arredondarValor) arredondarValor.addEventListener('input', calcularLucroEquilibrado);

    const freebetConvEl = document.getElementById('freebetConversion');
    if (freebetConvEl) {
      freebetConvEl.addEventListener('input', () => {
        calcularLucroEquilibrado();
      });
    }
    atualizarTotal();

    const toggleCheckbox = document.getElementById('toggleCommissionCheckbox');
const tableEl = document.querySelector('table');

// agora começa como falso
let commissionVisible = false;

// já aplica o estado inicial ao carregar
toggleCheckbox.checked = false;
tableEl.classList.add('hide-commission');

const totalCol = document.getElementById('totalColspan');
totalCol.setAttribute('colspan', '2');

// desabilita inputs de comissão no início
for (let i = 1; i <= 3; i++) {
  const comInput = document.getElementById(`comissao${i}`);
  comInput.disabled = true;
  comInput.value = 0;
}

toggleCheckbox.addEventListener('change', () => {
  commissionVisible = toggleCheckbox.checked;

  tableEl.classList.toggle('hide-commission', !commissionVisible);
  totalCol.setAttribute('colspan', commissionVisible ? '3' : '2');

  for (let i = 1; i <= 3; i++) {
    const comInput = document.getElementById(`comissao${i}`);
    comInput.disabled = !commissionVisible;
    if (!commissionVisible) comInput.value = 0;
  }

  calcularLucroEquilibrado();
    });
  });

function _num(v){ const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }

function _odds(){
  const arr = [];
  for (let i = 1; i <= 3; i++){
    arr.push(_num(document.getElementById(`odd${i}`)?.value));
  }
  return arr;
}

// Probabilidades implícitas normalizadas pelas odds
function _impliedProbs(odds){
  const inv = odds.map(o => (o > 1 ? 1/o : 0));
  const s = inv.reduce((a,b)=>a+b,0);
  if (s <= 0){
    // fallback: pesos iguais se não houver odds válidas
    return [1/3, 1/3, 1/3];
  }
  return inv.map(x => x / s);
}

// Total apostado ( + usa aposta; - usa responsabilidade )
function _apostaTotal(){
  let total = 0;
  for (let i = 1; i <= 3; i++){
    const sym = document.getElementById(`s${i}`)?.textContent.trim() || "+";
    total += sym === "+" ? _num(document.getElementById(`aposta${i}`)?.value)
                         : _num(document.getElementById(`resp${i}`)?.value);
  }
  return total;
}

// Lê lucros mostrados na UI
function _lucrosUI(){
  const arr = [];
  for (let i = 1; i <= 3; i++){
    arr.push(_num(document.getElementById(`lucro${i}`)?.textContent));
  }
  return arr;
}

function _renderPercentualRetornoEV(){
  const badge = document.getElementById("percentualRetorno");
  if (!badge) return;

  const total = _apostaTotal();
  const lucros = _lucrosUI();
  const odds = _odds();
  const probs = _impliedProbs(odds);

  // EV do lucro ponderado pelas odds
  let ev = 0;
  for (let i = 0; i < 3; i++){
    ev += probs[i] * (lucros[i] || 0);
  }

  const pct = total > 0 ? (ev / total) * 100 : 0;
  badge.textContent = `${pct.toFixed(2)}%`;
}

// Observa mudanças nos lucros e nos inputs para atualizar sempre
(function setupObservers(){
  const ids = ["lucro1", "lucro2", "lucro3"];
  const obs = new MutationObserver(_renderPercentualRetornoEV);
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) obs.observe(el, { childList:true, characterData:true, subtree:true });
  });

  document.addEventListener("input", (e)=>{
    const id = e.target?.id || "";
    // Qualquer coisa que altere odds, stakes, comissões, cashback etc. -> recalcula
    if (/^(aposta|resp|odd|comissao|cashback|maxFreebet|tipo|s)[123]$/.test(id) || id === "freebetConversion") {
      _renderPercentualRetornoEV();
    }
  });

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", _renderPercentualRetornoEV);
  } else {
    _renderPercentualRetornoEV();
  }

  // Opcional: expõe função global
  window.updatePercentualRetorno = _renderPercentualRetornoEV;
})();
  