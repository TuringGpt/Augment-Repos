import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';

import errorHandler from './errorHandler';
import successHandler from './successHandler';
import storePersist from '@/redux/storePersist';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const auth = storePersist.get('auth');
    config.headers = config.headers || {};

    if (auth?.current?.token) {
      config.headers.Authorization = `Bearer ${auth.current.token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

function buildQuery(options = {}) {
  let query = '?';
  for (var key in options) {
    query += key + '=' + options[key] + '&';
  }
  return query.slice(0, -1);
}

const request = {
  create: async ({ entity, jsonData }) => {
    try {
      const response = await apiClient.post(entity + '/create', jsonData);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  createAndUpload: async ({ entity, jsonData }) => {
    try {
      const response = await apiClient.post(entity + '/create', jsonData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  read: async ({ entity, id }) => {
    try {
      const response = await apiClient.get(entity + '/read/' + id);
      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  update: async ({ entity, id, jsonData }) => {
    try {
      const response = await apiClient.patch(entity + '/update/' + id, jsonData);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  updateAndUpload: async ({ entity, id, jsonData }) => {
    try {
      const response = await apiClient.patch(entity + '/update/' + id, jsonData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  delete: async ({ entity, id }) => {
    try {
      const response = await apiClient.delete(entity + '/delete/' + id);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  filter: async ({ entity, options = {} }) => {
    try {
      let filter = options.filter ? 'filter=' + options.filter : '';
      let equal = options.equal ? '&equal=' + options.equal : '';
      let query = `?${filter}${equal}`;

      const response = await apiClient.get(entity + '/filter' + query);
      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  search: async ({ entity, options = {} }) => {
    try {
      const query = buildQuery(options);
      // headersInstance.cancelToken = source.token;
      const response = await apiClient.get(entity + '/search' + query);

      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  list: async ({ entity, options = {} }) => {
    try {
      const query = buildQuery(options);

      const response = await apiClient.get(entity + '/list' + query);

      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  listAll: async ({ entity, options = {} }) => {
    try {
      const query = buildQuery(options);

      const response = await apiClient.get(entity + '/listAll' + query);

      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  post: async ({ entity, jsonData }) => {
    try {
      const response = await apiClient.post(entity, jsonData);

      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  get: async ({ entity }) => {
    try {
      const response = await apiClient.get(entity);
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
  patch: async ({ entity, jsonData }) => {
    try {
      const response = await apiClient.patch(entity, jsonData);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  upload: async ({ entity, id, jsonData }) => {
    try {
      const response = await apiClient.patch(entity + '/upload/' + id, jsonData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  source: () => {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();
    return source;
  },

  summary: async ({ entity, options = {} }) => {
    try {
      const query = buildQuery(options);
      const response = await apiClient.get(entity + '/summary' + query);

      successHandler(response, {
        notifyOnSuccess: false,
        notifyOnFailed: false,
      });

      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  mail: async ({ entity, jsonData }) => {
    try {
      const response = await apiClient.post(entity + '/mail/', jsonData);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },

  convert: async ({ entity, id }) => {
    try {
      const response = await apiClient.get(`${entity}/convert/${id}`);
      successHandler(response, {
        notifyOnSuccess: true,
        notifyOnFailed: true,
      });
      return response.data;
    } catch (error) {
      return errorHandler(error);
    }
  },
};
export default request;
