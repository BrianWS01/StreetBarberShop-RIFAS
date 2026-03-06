import MercadoPagoConfig, { Payment } from 'mercadopago';

// Inicializa o cliente do Mercado Pago com o Access Token do .env
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
});

// Exporta instâncias dos recursos utilizados
export const mpPayment = new Payment(client);
export default client;
