import type {
  BalanceResponse,
  EstimateGasRequest,
  EstimateGasResponse,
  TransactionStatus,
  TransferRequest,
  TransferResponse,
} from "@/app/types";
import axios from "axios";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("[API] Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error("[API] Response error:", error.response || error);

    if (error.response) {
      // Server responded with error
      const errorMessage = error.response.data?.error || "An error occurred";
      const errorDetails = error.response.data?.details;

      return Promise.reject({
        message: errorMessage,
        details: errorDetails,
        status: error.response.status,
      });
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({
        message: "Network error. Please check your connection.",
        status: 0,
      });
    } else {
      // Error in request setup
      return Promise.reject({
        message: error.message || "Ocorreu um erro inesperado",
        status: 0,
      });
    }
  }
);

// API methods
const api = {
  /**
   * Execute a gasless transfer
   */
  executeTransfer: async (transferData: TransferRequest) => {
    return apiClient.post<TransferResponse>("/gasless/transfer", transferData);
  },

  /**
   * Estimate gas for a transfer
   */
  estimateGas: async (transferData: EstimateGasRequest) => {
    return apiClient.post<EstimateGasResponse>(
      "/gasless/estimate",
      transferData
    );
  },

  /**
   * Get transaction status
   */
  getTransactionStatus: async (txHash: string) => {
    return apiClient.get<TransactionStatus>(`/gasless/status/${txHash}`);
  },

  /**
   * Get user's USD1 balance
   */
  getBalance: async (address: string) => {
    return apiClient.get<BalanceResponse>(`/gasless/balance/${address}`);
  },

  /**
   * Check if nonce has been used
   */
  checkNonce: async (address: string, nonce: string) => {
    return apiClient.get(`/gasless/nonce/${address}/${nonce}`);
  },

  /**
   * Get contract configuration
   */
  getConfig: async () => {
    return apiClient.get("/gasless/config");
  },

  /**
   * Health check
   */
  healthCheck: async () => {
    return apiClient.get("/health");
  },
};

export default api;
