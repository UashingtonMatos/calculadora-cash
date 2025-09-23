function alternarTipo(i) {
  const symbolEl = document.getElementById(`s${i}`);
  const wasBack  = symbolEl.textContent.trim() === '+';
  const layGroup  = document.getElementById(`layGroup${i}`);
  const backGroup = document.getElementById(`backGroup${i}`);

  // 1) Alterna símbolo e grupos Back/Lay
  if (wasBack) {
    symbolEl.textContent   = '-';
    layGroup.style.display  = 'block';
    backGroup.style.display = 'none';
  } else {
    symbolEl.textContent   = '+';
    layGroup.style.display  = 'none';
    backGroup.style.display = 'block';
  }

   const isLay    = symbolEl.textContent.trim() === '-';
  const travarEl = document.getElementById(`travar${i}`);

  if (isLay) {
    // Se estava travada, desmarca e tenta transferir para a 1ª linha BACK
    if (travarEl.checked) {
      travarEl.checked = false;
      const N = document.querySelectorAll('td.symbol').length; // detecta 2 ou 3 linhas
      for (let k = 1; k <= N; k++) {
        if (k !== i && document.getElementById(`s${k}`).textContent.trim() === '+') {
          const travK = document.getElementById(`travar${k}`);
          travK.checked = true;
          // aciona sua rotina atual de travar (recalcula etc.)
          if (typeof travar === 'function') travar(k);
          break;
        }
      }
    }
    travarEl.disabled = true;
    travarEl.title = 'Não é possível travar uma linha em Lay';
  } else {
    travarEl.disabled = false;
    travarEl.title = '';
  }

  // 2) Recalcula total e lucros
  atualizarTotal();
  const travado = document.querySelector('input[name="travar"]:checked');
  if (travado && parseInt(travado.id.replace('travar', ''), 10) === i) {
    calcularLucroEquilibrado();
  } else {
    calcularLucrosSimples();
  }
}



  
  function travar(index) {
    atualizarTotal();
    calcularLucroEquilibrado();
  }
  
  function atualizarTotal() {
    let total = 0;
    for (let i = 1; i <= 2; i++) {
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
  const conv = parseFloat(
    document.getElementById('freebetConversion').value
  ) / 100;

  
  for (let i = 1; i <= 2; i++) {
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
    if(cbType === 'deposito'){
      cbFrac = 0;
      cbDeposito = (rawCb / 100) * valor;
    }else if (cbType === 'real') {
      cbFrac = rawCb / 100;
    } else if (valor > 0) {
      const maxFb     = parseFloat(document.getElementById(`maxFreebet${i}`).value) || Infinity;
      const freebetAmt = Math.min((rawCb / 100) * valor, maxFb);
      cbFrac = (freebetAmt * conv) / valor;
    }

    apostas.push({ symbol: symbolEl, retorno, cashback: cbFrac, cbDeposito, valor });
  }
  const depositoTotal = apostas.reduce((s, ap) => s + (ap.cbDeposito || 0), 0);
  
  apostas.forEach((a, idx) => {
    const perda = apostas
      .filter((_, j) => j !== idx)
      .reduce((sum, ap) => sum + ap.valor * (1 - ap.cashback), 0);

    
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
  if (!travadoRadio) return; 
  const idxTravado = parseInt(travadoRadio.id.replace('travar', ''), 10) - 1;

 
  const apostas = [];
  for (let i = 0; i < 2; i++) {
    const sym   = document.getElementById(`s${i+1}`).textContent.trim();  
    const odd   = parseFloat(document.getElementById(`odd${i+1}`).value) || 0;
    const com   = (parseFloat(document.getElementById(`comissao${i+1}`).value) || 0) / 100;
    const rawCb = parseFloat(document.getElementById(`cashback${i+1}`).value)    || 0;
    const type  = document.getElementById(`tipo${i+1}`).value;                  
    const val   = sym === '+'
      ? parseFloat(document.getElementById(`aposta${i+1}`).value) || 0
      : parseFloat(document.getElementById(`resp${i+1}`).value)   || 0;
    const oddR  = sym === '+' ? odd : odd / (odd - 1);
    const ret   = (oddR - 1) * (1 - com);

   
    let cbFrac = 0;
    let cbDeposito = 0;
    if(type === 'deposito'){
      cbFrac = 0;
      cbDeposito = (rawCb / 100) * val;
    } else if (type === 'real') {
      cbFrac = rawCb / 100;
    } else if (val > 0) {
      const maxFb     = parseFloat(document.getElementById(`maxFreebet${i+1}`).value) || Infinity;
      const conv      = parseFloat(document.getElementById('freebetConversion').value) / 100;
      const freebetAmt= Math.min((rawCb/100)*val, maxFb);
      cbFrac = (freebetAmt * conv)/ val;
    }

    apostas.push({ sym, odd, com, retorno: ret, cashback: cbFrac, cbDeposito, valor: val, oddReal: oddR });
  }
  const depositoTotal = apostas.reduce((s, ap) => s + (ap.cbDeposito || 0), 0);

  const A   = apostas[idxTravado].valor;
  const R   = apostas[idxTravado].retorno * A;
  const cbA = apostas[idxTravado].cashback;

  const outro = idxTravado === 0 ? 1 : 0;

  const rO   = apostas[outro].retorno;
  const cbO  = apostas[outro].cashback;

  const arred   = document.getElementById("arredondarCheck").checked;
  const passo   = parseFloat(document.getElementById("arredondarValor").value) || 1;
  const arPar   = v => arred ? Math.round(v/passo)*passo : v;
  const x       = arPar((R + (A - (A * cbA))) / (rO + (1 - cbO)));
  apostas[outro].valor = x;

  
  const idOut = outro + 1;
  if (apostas[outro].sym === '+') {
    document.getElementById(`aposta${idOut}`).value = x.toFixed(2);
  } else {
    document.getElementById(`resp${idOut}`).value  = x.toFixed(2);
    const aFav = x * (apostas[outro].oddReal - 1);
    document.getElementById(`aFavor${idOut}`).value= aFav.toFixed(2);
  }

 
  const total = apostas.reduce((sum, a) => sum + a.valor, 0);
  document.getElementById('montanteTotal').value = total.toFixed(2);

  
  apostas.forEach((a, i) => {
    const perda = apostas
      .filter((_, j) => j !== i)
      .reduce((s, ap) => s + ap.valor*(1-ap.cashback), 0);
    
    const cbWin = a.sym==='-' ? a.valor*a.cashback : 0;
    const lucroBase = a.sym==='-' ? a.valor*a.retorno - perda:a.valor*a.retorno - perda + cbWin;
    const lucro = lucroBase + depositoTotal;
    document.getElementById(`lucro${i+1}`).textContent = lucro.toFixed(2);
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
    for (let i = 1; i <= 2; i++) {
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
    for (let i = 1; i <= 2; i++) {
  
      const aFavorInput = document.getElementById(`aFavor${i}`);
      const respInput = document.getElementById(`resp${i}`);
      const oddInput = document.getElementById(`odd${i}`);
      const comissaoInput = document.getElementById(`comissao${i}`);
      const cashbackInput = document.getElementById(`cashback${i}`);
      const tipoEl = document.getElementById(`tipo${i}`);
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

      if (aFavorInput) {
  aFavorInput.addEventListener('input', () => {
    calcularLay(i, 'aFavor');
    atualizarTotal();
    const isLocked = document.getElementById(`travar${i}`).checked;
    const isLay    = document.getElementById(`s${i}`).textContent.trim() === '-';
    if (isLay || !isLocked) {
      calcularLucrosSimples();
    } else {
      calcularLucroEquilibrado();
    }
  });
}

if (respInput) {
  respInput.addEventListener('input', () => {
    calcularLay(i, 'resp');
    atualizarTotal();
    const isLocked = document.getElementById(`travar${i}`).checked;
    const isLay    = document.getElementById(`s${i}`).textContent.trim() === '-';
    if (isLay || !isLocked) {
      calcularLucrosSimples();
    } else {
      calcularLucroEquilibrado();
    }
  });
}
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
    const tableEl   = document.querySelector('table');
    let commissionVisible = true;

    toggleCheckbox.addEventListener('change', () => {
  const commissionVisible = toggleCheckbox.checked;
 
  tableEl.classList.toggle('hide-commission', !commissionVisible);
  const totalCol = document.getElementById('totalColspan');
totalCol.setAttribute(
  'colspan',
  toggleCheckbox.checked ? '3' : '2'
);


  for (let i = 1; i <= 2; i++) {
    const comInput = document.getElementById(`comissao${i}`);
    comInput.disabled = !commissionVisible;
    if (!commissionVisible) comInput.value = 0;
  }

  calcularLucroEquilibrado();
    });
  });

  (function ensurePercentDivDupla() {
  if (!document.getElementById("percentualRetorno")) {
    const div = document.createElement("div");
    div.id = "percentualRetorno";
    div.style.position = "absolute";
    div.style.top = "10px";
    div.style.right = "10px";
    div.style.fontSize = "18px";
    div.style.fontWeight = "bold";
    div.style.color = "#006400";
    div.style.background = "#f0f0f0";
    div.style.padding = "6px 10px";
    div.style.borderRadius = "8px";
    div.style.boxShadow = "0 0 4px rgba(0,0,0,0.2)";
    div.textContent = "Retorno (EV): 0.00%";
    (document.body || document.documentElement).prepend(div);
  }
})();

function _num(v){ const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }

// Odds (2 cenários)
function _oddsDupla(){
  return [1,2].map(i => _num(document.getElementById(`odd${i}`)?.value));
}

// Probabilidades implícitas normalizadas (remove overround)
function _impliedProbsDupla(odds){
  const inv = odds.map(o => (o > 1 ? 1/o : 0));
  const s = inv.reduce((a,b)=>a+b,0);
  if (s <= 0) return [0.5, 0.5]; // fallback
  return inv.map(x => x / s);
}

// Total apostado ( + usa aposta; - usa responsabilidade )
function _apostaTotalDupla(){
  let total = 0;
  for (let i = 1; i <= 2; i++){
    const sym = document.getElementById(`s${i}`)?.textContent.trim() || "+";
    total += sym === "+"
      ? _num(document.getElementById(`aposta${i}`)?.value)
      : _num(document.getElementById(`resp${i}`)?.value);
  }
  return total;
}

// Lê lucros da UI
function _lucrosUIDupla(){
  return [1,2].map(i => _num(document.getElementById(`lucro${i}`)?.textContent));
}

function _renderPercentualRetornoEVDupla(){
  const badge = document.getElementById("percentualRetorno");
  if (!badge) return;

  const total = _apostaTotalDupla();
  const lucros = _lucrosUIDupla();     // já incluem comissão/cashback aplicados pelas suas funções
  const odds   = _oddsDupla();
  const probs  = _impliedProbsDupla(odds);

  // EV do lucro ponderado pelas odds
  const ev = probs[0]*(lucros[0] || 0) + probs[1]*(lucros[1] || 0);

  const pct = total > 0 ? (ev / total) * 100 : 0;
  badge.textContent = `Retorno (EV): ${pct.toFixed(2)}%`;
}

// Observa mudanças e atualiza sempre
(function setupObserversDupla(){
  const ids = ["lucro1", "lucro2"];
  const obs = new MutationObserver(_renderPercentualRetornoEVDupla);
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) obs.observe(el, { childList:true, characterData:true, subtree:true });
  });

  document.addEventListener("input", (e)=>{
    const id = e.target?.id || "";
    // Qualquer coisa que altere odds, stakes, comissões, cashback etc. -> recalcula
    if (/^(aposta|resp|odd|comissao|cashback|maxFreebet|tipo|s)[12]$/.test(id) || id === "freebetConversion") {
      _renderPercentualRetornoEVDupla();
    }
  });

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", _renderPercentualRetornoEVDupla);
  } else {
    _renderPercentualRetornoEVDupla();
  }

  // Opcional: função global para forçar update manualmente
  window.updatePercentualRetorno = _renderPercentualRetornoEVDupla;
})();