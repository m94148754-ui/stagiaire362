import { apiService } from './api';

export interface UpdateProfileRequest {
  nom?: string;
  prenom?: string;
  phone?: string;
  departement?: string;
  avatar?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  phone?: string;
  departement?: string;
  avatar?: string;
  role: string;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
}

export const userService = {
  getCurrentProfile: async (): Promise<UserProfile> => {
    return await apiService.get<UserProfile>('/users/profile');
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    return await apiService.put<UserProfile>('/users/profile', data);
  },

  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = apiService.getToken();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

    const response = await fetch(`${API_URL}/users/profile/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'upload de l\'avatar');
    }

    const result = await response.json();
    return result.data;
  },
};
