import axios, { type AxiosInstance } from "axios";
import { logger } from "../../infra/logger.js";

/**
 * Cliente HTTP ERP Atlaz.
 * Ajuste `baseURL` e headers conforme documentação oficial da sua instância.
 */
export function createAtlazClient(baseURL: string, token: string): AxiosInstance {
  const client = axios.create({
    baseURL: baseURL.replace(/\/$/, ""),
    timeout: 30_000,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  client.interceptors.response.use(
    (r) => r,
    (err) => {
      logger.warn("Atlaz API erro", { status: err.response?.status, data: err.response?.data });
      return Promise.reject(err);
    },
  );
  return client;
}

/** Contrato genérico — adapte campos ao payload real do Atlaz. */
export interface AtlazCustomer {
  id: string;
  name: string;
  document?: string;
  email?: string;
}

export interface AtlazContract {
  id: string;
  customerId: string;
  status: string;
}

export interface AtlazInvoice {
  id: string;
  customerId: string;
  amountCents: number;
  dueDate: string;
  status: string;
}

export class AtlazService {
  constructor(private readonly client: AxiosInstance) {}

  async fetchCustomers(params?: { page?: number; search?: string }): Promise<AtlazCustomer[]> {
    const { data } = await this.client.get("/customers", { params });
    return Array.isArray(data) ? data : data.items ?? [];
  }

  async fetchContracts(customerId: string): Promise<AtlazContract[]> {
    const { data } = await this.client.get(`/customers/${customerId}/contracts`);
    return Array.isArray(data) ? data : data.items ?? [];
  }

  async fetchInvoices(customerId: string): Promise<AtlazInvoice[]> {
    const { data } = await this.client.get(`/customers/${customerId}/invoices`);
    return Array.isArray(data) ? data : data.items ?? [];
  }

  async registerPayment(invoiceId: string, body: { amountCents: number; paidAt: string; reference: string }) {
    const { data } = await this.client.post(`/invoices/${invoiceId}/payments`, body);
    return data;
  }
}
