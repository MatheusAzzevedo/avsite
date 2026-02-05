# Configuração do Asaas (Gateway de Pagamento)

## ⚠️ IMPORTANTE - SEGURANÇA

**NUNCA commite a chave de API de produção no repositório!**

A chave de produção deve ficar **APENAS** no arquivo `.env` do servidor de produção.

---

## 📝 Sua Chave de API

Você forneceu a chave:
```
$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjFkNmVhYjQxLTMwNzktNDgzYS1iMjljLTNhOGY3NWI3YjUzZTo6JGFhY2hfMDM5YTAyZTYtY2Q2Yy00MGIwLTg5YzYtYjk4NTliMzNjZGYw
```

---

## 🔧 Como Configurar

### 1. **No Servidor de Produção (Railway, Heroku, etc)**

Adicione as seguintes variáveis de ambiente:

```env
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjFkNmVhYjQxLTMwNzktNDgzYS1iMjljLTNhOGY3NWI3YjUzZTo6JGFhY2hfMDM5YTAyZTYtY2Q2Yy00MGIwLTg5YzYtYjk4NTliMzNjZGYw
ASAAS_ENVIRONMENT=production
ASAAS_WEBHOOK_URL=https://seudominio.com/api/webhooks/asaas
```

### 2. **Localmente (desenvolvimento)**

Adicione no arquivo `api/.env`:

```env
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjFkNmVhYjQxLTMwNzktNDgzYS1iMjljLTNhOGY3NWI3YjUzZTo6JGFhY2hfMDM5YTAyZTYtY2Q2Yy00MGIwLTg5YzYtYjk4NTliMzNjZGYw
ASAAS_ENVIRONMENT=production
ASAAS_WEBHOOK_URL=http://localhost:3001/api/webhooks/asaas
```

**Nota:** Para testes locais com webhook, use ngrok ou similar para expor localhost.

---

## 🔔 Configurar Webhook no Asaas

1. Acesse: https://www.asaas.com/config/webhook
2. Adicione a URL: `https://seudominio.com/api/webhooks/asaas`
3. Selecione os eventos:
   - ✅ Pagamento recebido (PAYMENT_RECEIVED)
   - ✅ Pagamento confirmado (PAYMENT_CONFIRMED)
   - ✅ Pagamento vencido (PAYMENT_OVERDUE)
   - ✅ Pagamento deletado (PAYMENT_DELETED)
4. Salve a configuração

---

## 🧪 Testar Integração

### Criar cobrança PIX:

```bash
POST /api/cliente/pagamento/pix
Authorization: Bearer {token_cliente}
Content-Type: application/json

{
  "pedidoId": "uuid-do-pedido"
}

# Retorna:
{
  "success": true,
  "data": {
    "qrCode": "00020126...",
    "qrCodeImage": "data:image/png;base64,...",
    "valor": 450.00,
    "cobrancaId": "pay_..."
  }
}
```

### Consultar status:

```bash
GET /api/cliente/pagamento/{pedidoId}/status
Authorization: Bearer {token_cliente}
```

---

## 📊 Fluxo de Pagamento PIX

```
1. Cliente finaliza pedido → Status: PENDENTE
2. Cliente escolhe PIX
3. Sistema cria cobrança no Asaas
4. Status: AGUARDANDO_PAGAMENTO
5. Sistema retorna QR Code
6. Cliente escaneia e paga
7. Asaas detecta pagamento
8. Asaas envia webhook → /api/webhooks/asaas
9. Sistema atualiza: Status → PAGO, dataPagamento
10. Cliente vê confirmação
```

---

## 💳 Valores mínimos (regras do Asaas)

O **gateway Asaas** aplica valores mínimos por cobrança; não é possível desativar no painel:

- **Cartão de crédito:** valor mínimo **R$ 5,00** por cobrança.
- **PIX:** consulte a documentação do Asaas para o mínimo atual.

A API trata assim:

- **Cartão:** se o valor do pedido for menor que R$ 5,00, a rota `POST /api/cliente/pagamento/cartao` retorna **400** com a mensagem explicando o mínimo e sugerindo PIX para valores menores.
- **PIX:** se o Asaas retornar erro de validação (ex.: valor mínimo), a API repassa o erro como **400** (em vez de 500) para o front exibir a mensagem.

Para pedidos com total &lt; R$ 5,00, o checkout pode orientar o cliente a usar **PIX** ou definir um preço mínimo nas excursões.

---

## 🔒 Segurança

- ✅ Chave API nunca exposta no frontend
- ✅ Rotas de pagamento requerem autenticação
- ✅ Cliente só pode pagar seus próprios pedidos
- ✅ Webhook registra IP e logs detalhados
- ✅ Validações Zod em todos endpoints

---

## 📞 Suporte Asaas

- Documentação: https://docs.asaas.com
- Dashboard: https://www.asaas.com
- Suporte: suporte@asaas.com
