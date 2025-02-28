import axios from 'axios';

const api = axios.create({
  baseURL: '/api/directory',
});

export interface UserGroup {
  user_id: string;
  group_name: string;
}

export interface Permission {
  group_name: string;
  service: string;
  action: string;
  service_action: string;
}

export interface Contact {
  target: string;
  type: string;
  data: string;
}

export const DirectoryService = {
  getUserGroups: async (userId?: string) => {
    const response = await api.get('/users', {
      params: { user_id: userId }
    });
    return response.data;
  },

  getGroupUsers: async (groupName: string) => {
    const response = await api.get('/users', {
      params: { group_name: groupName }
    });
    return response.data;
  },

  assignUserToGroup: async (userGroup: UserGroup) => {
    const response = await api.post('/users', userGroup);
    return response.data;
  },

  removeUserFromGroup: async (userId: string, groupName: string) => {
    const response = await api.delete('/users', {
      params: { user_id: userId, group_name: groupName }
    });
    return response.data;
  },

  getPermissions: async () => {
    const response = await api.get('/permissions');
    return response.data;
  },

  createPermission: async (permission: Permission) => {
    const response = await api.post('/permissions', permission);
    return response.data;
  },

  deletePermission: async (groupName: string, serviceAction: string) => {
    const response = await api.delete('/permissions', {
      params: { 
        group_name: groupName,
        service_action: serviceAction
      }
    });
    return response.data;
  },

  getContacts: async () => {
    const response = await api.get('/contacts');
    return response.data;
  },

  createContact: async (contact: Contact) => {
    const response = await api.post('/contacts', contact);
    return response.data;
  },

  deleteContact: async (target: string, type: string) => {
    const response = await api.delete('/contacts', {
      params: { target, type }
    });
    return response.data;
  }
};