import { axiosInstance } from '@/request/request';
import { BASE_URL } from '@/config/serverApiConfig';
export default async function checkImage(path) {
  const result = await axiosInstance
    .get(path, {
      headers: {
        'Access-Control-Allow-Origin': BASE_URL,
      },
    })
    .then((response) => {
      if (response.status === 200) return true;
      else return false;
    })
    .catch(() => {
      return false;
    });

  return result;
}
