/**
 * S.Previews - lógica dos botões de preview (Toast, Modal Categoria, Payment Confirm, Checkout Toast).
 * Script externo para compatibilidade com Content-Security-Policy (CSP).
 */
(function() {
    function init() {
        // Toast Admin
        document.querySelectorAll('[data-toast]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var type = this.dataset.toast;
                var messages = {
                    success: 'Operação realizada com sucesso!',
                    error: 'Erro ao processar. Tente novamente.',
                    warning: 'Atenção: verifique os dados.',
                    info: 'Informação enviada.'
                };
                if (typeof showToast === 'function') {
                    showToast(messages[type], type);
                }
            });
        });

        // Modal Categoria
        var modalCategoria = document.getElementById('modalCategoria');
        var btnModal = document.getElementById('btnModalCategoria');
        var btnClose = modalCategoria ? modalCategoria.querySelector('.modal-close') : null;
        var btnCancel = document.getElementById('modalCategoriaCancel');

        function openModalCategoria() {
            if (modalCategoria) modalCategoria.classList.remove('hidden');
        }
        function closeModalCategoria() {
            if (modalCategoria) modalCategoria.classList.add('hidden');
        }

        if (btnModal) btnModal.addEventListener('click', openModalCategoria);
        if (btnClose) btnClose.addEventListener('click', closeModalCategoria);
        if (btnCancel) btnCancel.addEventListener('click', closeModalCategoria);
        if (modalCategoria) {
            modalCategoria.addEventListener('click', function(e) {
                if (e.target === modalCategoria) closeModalCategoria();
            });
        }

        // Payment Confirm
        var paymentOverlay = document.getElementById('paymentConfirmOverlay');
        var btnPaymentConfirm = document.getElementById('btnPaymentConfirm');
        if (btnPaymentConfirm) {
            btnPaymentConfirm.addEventListener('click', function() {
                if (paymentOverlay) paymentOverlay.style.display = 'flex';
            });
        }
        if (paymentOverlay) {
            paymentOverlay.addEventListener('click', function(e) {
                if (e.target === paymentOverlay) paymentOverlay.style.display = 'none';
            });
        }
        var btnClosePaymentConfirm = document.getElementById('btnClosePaymentConfirm');
        if (btnClosePaymentConfirm) {
            btnClosePaymentConfirm.addEventListener('click', function(e) {
                e.preventDefault();
                if (paymentOverlay) paymentOverlay.style.display = 'none';
            });
        }

        // Checkout Toast
        var checkoutToast = document.getElementById('checkoutToast');
        document.querySelectorAll('[data-checkout-toast]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var type = this.dataset.checkoutToast;
                var messages = {
                    success: 'Pagamento confirmado! Redirecionando...',
                    error: 'Erro ao processar pagamento.',
                    info: 'Processando pagamento...'
                };
                if (checkoutToast) {
                    checkoutToast.textContent = messages[type];
                    checkoutToast.className = 'checkout-toast ' + type;
                    checkoutToast.style.display = 'flex';
                    setTimeout(function() {
                        checkoutToast.style.display = 'none';
                    }, 3000);
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
