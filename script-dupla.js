function alternarTipo(i) {
    const symbolEl = document.getElementById(`s${i}`);
    const wasBack = symbolEl.textContent.trim() === '+';
    const layGroup = document.getElementById(`layGroup${i}`);
    const backGroup = document.getElementById(`backGroup${i}`);

    // 1) Alterna símbolo e grupos Back/Lay
    if (wasBack) {
        symbolEl.textContent = '-';
        layGroup.style.display = 'block';
        backGroup.style.display = 'none';
    } else {
        symbolEl.textContent = '+';
        layGroup.style.display = 'none';
        backGroup.style.display = 'block';
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
        const rawCb = parseFloat(document.getElementById(`cashback${i}`).value) || 0;
        const cbType = document.getElementById(`tipo${i}`).value;
        const odd = parseFloat(document.getElementById(`odd${i}`).value) || 0;
        const com = (parseFloat(document.getElementById(`comissao${i}`).value) || 0) / 100;


        const valor = symbolEl === '+'
            ? parseFloat(document.getElementById(`aposta${i}`).value) || 0
            : parseFloat(document.getElementById(`resp${i}`).value) || 0;


        const oddReal = symbolEl === '+' ? odd : odd / (odd - 1);
        const retorno = (oddReal - 1) * (1 - com);


        let cbFrac = 0;
        if (cbType === 'real') {
            cbFrac = rawCb / 100;
        } else if (valor > 0) {
            const maxFb = parseFloat(document.getElementById(`maxFreebet${i}`).value) || Infinity;
            const freebetAmt = Math.min((rawCb / 100) * valor, maxFb);
            cbFrac = (freebetAmt * conv) / valor;
        }

        apostas.push({ symbol: symbolEl, retorno, cashback: cbFrac, valor });
    }


    apostas.forEach((a, idx) => {
        const perda = apostas
            .filter((_, j) => j !== idx)
            .reduce((sum, ap) => sum + ap.valor * (1 - ap.cashback), 0);


        const cbVencedora = a.symbol === '-' ? a.valor * a.cashback : 0;

        const lucro = a.valor * a.retorno - perda + cbVencedora;
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
        const sym = document.getElementById(`s${i + 1}`).textContent.trim();
        const odd = parseFloat(document.getElementById(`odd${i + 1}`).value) || 0;
        const com = (parseFloat(document.getElementById(`comissao${i + 1}`).value) || 0) / 100;
        const rawCb = parseFloat(document.getElementById(`cashback${i + 1}`).value) || 0;
        const type = document.getElementById(`tipo${i + 1}`).value;
        const val = sym === '+'
            ? parseFloat(document.getElementById(`aposta${i + 1}`).value) || 0
            : parseFloat(document.getElementById(`resp${i + 1}`).value) || 0;
        const oddR = sym === '+' ? odd : odd / (odd - 1);
        const ret = (oddR - 1) * (1 - com);


        let cbFrac = 0;
        if (type === 'real') {
            cbFrac = rawCb / 100;
        } else if (val > 0) {
            const maxFb = parseFloat(document.getElementById(`maxFreebet${i + 1}`).value) || Infinity;
            const conv = parseFloat(document.getElementById('freebetConversion').value) / 100;
            const freebetAmt = Math.min((rawCb / 100) * val, maxFb);
            cbFrac = (freebetAmt * conv) / val;
        }

        apostas.push({ sym, odd, com, retorno: ret, cashback: cbFrac, valor: val, oddReal: oddR });
    }


    const A = apostas[idxTravado].valor;
    const R = apostas[idxTravado].retorno * A;
    const cbA = apostas[idxTravado].cashback;

    const outro = idxTravado === 0 ? 1 : 0;

    const rO = apostas[outro].retorno;
    const cbO = apostas[outro].cashback;

    const arred = document.getElementById("arredondarCheck").checked;
    const passo = parseFloat(document.getElementById("arredondarValor").value) || 1;
    const arPar = v => arred ? Math.round(v / passo) * passo : v;
    const x = arPar((R + (A - (A * cbA))) / (rO + (1 - cbO)));
    apostas[outro].valor = x;


    const idOut = outro + 1;
    if (apostas[outro].sym === '+') {
        document.getElementById(`aposta${idOut}`).value = x.toFixed(2);
    } else {
        document.getElementById(`resp${idOut}`).value = x.toFixed(2);
        const aFav = x * (apostas[outro].oddReal - 1);
        document.getElementById(`aFavor${idOut}`).value = aFav.toFixed(2);
    }


    const total = apostas.reduce((sum, a) => sum + a.valor, 0);
    document.getElementById('montanteTotal').value = total.toFixed(2);


    apostas.forEach((a, i) => {
        const perda = apostas
            .filter((_, j) => j !== i)
            .reduce((s, ap) => s + ap.valor * (1 - ap.cashback), 0);

        const cbWin = a.sym === '-' ? a.valor * a.cashback : 0;
        const lucro = a.sym === '-' ? a.valor * a.retorno - perda : a.valor * a.retorno - perda + cbWin;
        document.getElementById(`lucro${i + 1}`).textContent = lucro.toFixed(2);
    });
}

function toggleFreebetMax(i) {
    const tipo = document.getElementById(`tipo${i}`).value;
    const maxEl = document.getElementById(`maxFreebet${i}`);
    const labelEl = document.getElementById(`labelFreebet${i}`);

    if (tipo === 'freebet') {
        maxEl.style.display = 'block';
        labelEl.style.display = 'block';
    } else {
        maxEl.style.display = 'none';
        labelEl.style.display = 'none';
        maxEl.value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    for (let i = 1; i <= 2; i++) {
        document.getElementById(`aposta${i}`).disabled = true;
        document.getElementById(`resp${i}`).disabled = true;
        document.getElementById(`aFavor${i}`).disabled = true;
    }


    document
        .querySelectorAll('input[name="travar"]')
        .forEach(radio =>
            radio.addEventListener('change', () => {
                for (let j = 1; j <= 3; j++) {
                    document.getElementById(`aposta${j}`).disabled = false;
                    document.getElementById(`resp${j}`).disabled = false;
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
                else calcularLucrosSimples();
            });
        });

        if (aFavorInput) {
            aFavorInput.addEventListener('input', () => {
                calcularLay(i, 'aFavor');
                atualizarTotal();
                const isLocked = document.getElementById(`travar${i}`).checked;
                const isLay = document.getElementById(`s${i}`).textContent.trim() === '-';
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
                const isLay = document.getElementById(`s${i}`).textContent.trim() === '-';
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
    const tableEl = document.querySelector('table');
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