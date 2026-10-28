/**
 * Explicação do Arquivo [parcelas-bandeira.js]
 *
 * Limite de parcelas do Asaas por bandeira: Visa e Mastercard aceitam até 21x,
 * as demais até 12x. Usado pelo checkout e pela tela de pagamento para cortar
 * o select de parcelas assim que o número do cartão é digitado. A mesma regra
 * existe no backend (src/utils/bandeira-cartao.ts), que é quem decide de fato.
 */
(function () {
    var LIMITE_VISA_MASTER = 21;
    var LIMITE_OUTRAS = 12;

    // Elo usa alguns BINs que começam com 4; sem isso viraria "Visa" e o Asaas recusaria acima de 12x.
    // shortcut: só os BINs Elo começados em 4 mais comuns; se aparecer recusa de Elo acima de 12x, ampliar a lista.
    var BINS_ELO_COM_4 = ['401178', '401179', '431274', '438935', '451416', '457393', '457631', '457632'];

    /**
     * Explicação da função [ehVisaOuMaster]:
     * true para Visa (começa com 4, fora dos BINs Elo) ou Mastercard (51-55 ou 2221-2720).
     */
    function ehVisaOuMaster(numero) {
        var n = String(numero || '').replace(/\D/g, '');
        if (n.length < 6) return false;
        if (n.charAt(0) === '4') return BINS_ELO_COM_4.indexOf(n.substring(0, 6)) === -1;
        var dois = parseInt(n.substring(0, 2), 10);
        var quatro = parseInt(n.substring(0, 4), 10);
        return (dois >= 51 && dois <= 55) || (quatro >= 2221 && quatro <= 2720);
    }

    /**
     * Explicação da função [limitePorNumero]:
     * Máximo de parcelas permitido pela bandeira. Sem número suficiente para
     * identificar, devolve o limite geral (21) e o aviso fica a cargo da tela.
     */
    function limitePorNumero(numero) {
        var n = String(numero || '').replace(/\D/g, '');
        if (n.length < 6) return LIMITE_VISA_MASTER;
        return ehVisaOuMaster(n) ? LIMITE_VISA_MASTER : LIMITE_OUTRAS;
    }

    window.ParcelasBandeira = {
        LIMITE_VISA_MASTER: LIMITE_VISA_MASTER,
        LIMITE_OUTRAS: LIMITE_OUTRAS,
        ehVisaOuMaster: ehVisaOuMaster,
        limitePorNumero: limitePorNumero
    };
})();
