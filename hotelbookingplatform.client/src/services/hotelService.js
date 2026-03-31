import apiClient from './apiClient';

// Hotel listing + filtering
export const getHotels = (params = {}) => {
    return apiClient.get('/Hotels', { params });
};

export const getHotelById = (id) => {
    return apiClient.get(`/Hotels/${id}`);
};

export const getRoomsByHotel = (hotelId) => {
    return apiClient.get(`/Hotels/${hotelId}/rooms`);
};

export const getRoomById = (hotelId, roomId) => {
    return apiClient.get(`/Hotels/${hotelId}/rooms/${roomId}`);
};

// Admin - create/update/delete hotels
export const createHotel = (data) => apiClient.post('/Hotels', data);
export const updateHotel = (id, data) => apiClient.put(`/Hotels/${id}`, data);
export const deleteHotel = (id) => apiClient.delete(`/Hotels/${id}`);
export const deleteAllHotels = () => apiClient.delete('/Hotels/all');
export const deleteNonAdminHotels = () => apiClient.delete('/Hotels/bulk-remove-non-admin');

// Admin - create/update/delete rooms
export const createRoom = (hotelId, data) => apiClient.post(`/Hotels/${hotelId}/rooms`, data);
export const updateRoom = (hotelId, roomId, data) => apiClient.put(`/Hotels/${hotelId}/rooms/${roomId}`, data);
export const deleteRoom = (hotelId, roomId) => apiClient.delete(`/Hotels/${hotelId}/rooms/${roomId}`);

// Amenities
export const getAmenities = () => apiClient.get('/Amenities');

// Image Upload
export const uploadHotelImage = (formData, config = {}) => {
    return apiClient.post('/Hotels/upload-image', formData, {
        ...config,
        headers: {
            'Content-Type': 'multipart/form-data',
            ...config.headers
        }
    });
};
