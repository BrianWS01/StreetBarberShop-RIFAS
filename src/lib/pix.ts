import { mpPayment } from './mercadopago';

interface CreatePixPaymentParams {
    amount: number;
    description: string;
    externalId: string; // nosso transactionId do banco
    payerEmail: string;
}

interface PixPaymentResult {
    paymentId: string;
    qrCode: string;
    qrCodeBase64: string;
    status: string;
}

/**
 * Cria um pagamento PIX no Mercado Pago e retorna o QR Code para exibição.
 */
export async function createPixPayment({
    amount,
    description,
    externalId,
    payerEmail,
}: CreatePixPaymentParams): Promise<PixPaymentResult> {
    const payment = await mpPayment.create({
        body: {
            transaction_amount: amount,
            description,
            payment_method_id: 'pix',
            external_reference: externalId,
            payer: {
                email: payerEmail,
            },
            // O pagamento expira em 15 minutos
            date_of_expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            // URL que o Mercado Pago chama quando o pagamento é confirmado
            notification_url: process.env.MP_WEBHOOK_URL,
        },
    });

    if (!payment.point_of_interaction?.transaction_data?.qr_code) {
        throw new Error('Falha ao gerar QR Code PIX: dados incompletos na resposta do MP');
    }

    return {
        paymentId: String(payment.id),
        qrCode: payment.point_of_interaction.transaction_data.qr_code,
        qrCodeBase64: payment.point_of_interaction.transaction_data.qr_code_base64 ?? '',
        status: payment.status ?? 'pending',
    };
}

/**
 * Busca o status de um pagamento no Mercado Pago pelo ID externo (paymentId).
 */
export async function getPixPaymentStatus(paymentId: string) {
    const payment = await mpPayment.get({ id: paymentId });
    return {
        status: payment.status, // 'pending' | 'approved' | 'rejected' | 'cancelled'
        externalReference: payment.external_reference,
    };
}
