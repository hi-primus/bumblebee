import axios from 'axios';
import { AxiosInstance } from 'axios';

let http: AxiosInstance | null = null;

export const initializeAxiosForGptRequests = (key: string) => {
  http = axios.create({
    baseURL: 'https://api.openai.com/v1/chat',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    }
  });
  return http;
};

export const getGptResponse = async (
  prompt: string,
  key: string
): Promise<string> => {
  try {
    if (!http) {
      http = initializeAxiosForGptRequests(key);
    }
    if (!http) {
      throw new Error('Axios instance not initialized, please try again');
    }
    const response = await http.post('/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });
    console.log('[DEBUG] GPT response', response.data);
    return response.data.choices[0].message.content;
  } catch (error) {
    http = null;
    console.error(error);
    return '';
  }
};
