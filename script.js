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
    const conv = parseFloat(
        document.getElementById('freebetConversion').value
    ) / 100;

    for (let i = 1; i <= 3; i++) {
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
        const rawCb = parseFloat(
            document.getElementById(`cashback${i}`).value
        ) || 0;
        const tipoCashback = document.getElementById(`tipo${i}`).value;
        let cashback = 0;
        if (tipoCashback === 'real') {
            cashback = rawCb / 100;
        } else {
            if (valor > 0) {
                const maxFb = parseFloat(
                    document.getElementById(`maxFreebet${i}`).value
                ) || Infinity;
                const conv = parseFloat(
                    document.getElementById('freebetConversion').value
                ) / 100;

                const freebetAmt = Math.min((rawCb / 100) * valor, maxFb);

                cashback = (freebetAmt * conv) / valor;
            }
        }
        const oddReal = tipo === '+' ? odd : odd / (odd - 1);
        const retorno = tipo === '+'
            ? (odd - 1) * (1 - comissao)
            : (oddReal - 1) * (1 - comissao);

        apostas.push({ tipo, odd, comissao, cashback, valor, oddReal, retorno });
    }

    const travada = apostas[indexTravado - 1];
    const A = travada.valor;

    let x = 0, y = 0;

    const ids = [0, 1, 2].filter(i => i !== (indexTravado - 1));
    const i1 = ids[0];
    const i2 = ids[1];

    const R = travada.retorno * A;
    const cbA = travada.cashback;
    const cb1 = apostas[i1].cashback;
    const cb2 = apostas[i2].cashback;

    const r_i1 = apostas[i1].retorno;
    const r_i2 = apostas[i2].retorno;

    const arredondar = document.getElementById("arredondarCheck").checked;
    const passo = parseFloat(document.getElementById("arredondarValor").value) || 1;

    const arredondarPara = (valor) => arredondar ? Math.round(valor / passo) * passo : valor;

    x = arredondarPara((R + (A - (A * cbA))) / (r_i1 + (1 - cb1)));
    y = arredondarPara((R + (A - (A * cbA))) / (r_i2 + (1 - cb2)));

    apostas[i1].valor = x;
    apostas[i2].valor = y;

    [i1, i2].forEach((i, idx) => {
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

    const total = apostas.reduce((acc, ap) => acc + ap.valor, 0);
    document.getElementById('montanteTotal').value = total.toFixed(2);

    apostas.forEach((a, i) => {
        const retornoBruto = a.valor * a.retorno;
        let perdaTotal = 0;
        for (let j = 0; j < apostas.length; j++) {
            if (j !== i) {
                const ap = apostas[j];
                perdaTotal += ap.valor * (1 - ap.cashback);
            }
        }

        const cashbackVencedora = a.tipo === '+' ? 0 : a.valor * a.cashback;
        const lucro = a.tipo === '+' ? a.valor * a.retorno - perdaTotal + cashbackVencedora : a.valor * a.retorno - perdaTotal;

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
    for (let i = 1; i <= 3; i++) {
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
    for (let i = 1; i <= 3; i++) {

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
    let commissionVisible = true;

    toggleCheckbox.addEventListener('change', () => {
        const commissionVisible = toggleCheckbox.checked;

        tableEl.classList.toggle('hide-commission', !commissionVisible);
        const totalCol = document.getElementById('totalColspan');
        totalCol.setAttribute(
            'colspan',
            toggleCheckbox.checked ? '3' : '2'
        );


        for (let i = 1; i <= 3; i++) {
            const comInput = document.getElementById(`comissao${i}`);
            comInput.disabled = !commissionVisible;
            if (!commissionVisible) comInput.value = 0;
        }

        calcularLucroEquilibrado();
    });
});