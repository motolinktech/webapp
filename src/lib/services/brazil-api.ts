import axios from "axios";

const BRASIL_API_BASE_URL = "https://brasilapi.com.br/api";

export async function searchCep(cep: string) {
  try {
    const response = await axios.get(`${BRASIL_API_BASE_URL}/cep/v1/${cep}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Error searching CEP");
    }
    throw new Error("An unexpected error occurred while searching CEP");
  }
}

export async function searchCnpj(cnpj: string) {
  try {
    const response = await axios.get(`${BRASIL_API_BASE_URL}/cnpj/v1/${cnpj}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Error searching CNPJ");
    }
    throw new Error("An unexpected error occurred while searching CNPJ");
  }
}

export async function getBanks() {
  try {
    const response = await axios.get(`${BRASIL_API_BASE_URL}/banks/v1`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Error fetching banks");
    }
    throw new Error("An unexpected error occurred while fetching banks");
  }
}
