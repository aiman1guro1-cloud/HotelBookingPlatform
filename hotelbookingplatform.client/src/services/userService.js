import apiClient from "./apiClient";

export const getProfile = () => apiClient.get("/Profile");
export const updateProfile = (data) => apiClient.put("/Profile", data);
export const getPaymentMethods = () => apiClient.get("/Profile/payment-methods");
export const addPaymentMethod = (data) => apiClient.post("/Profile/payment-methods", data);
export const deletePaymentMethod = (id) => apiClient.delete(`/Profile/payment-methods/${id}`);
