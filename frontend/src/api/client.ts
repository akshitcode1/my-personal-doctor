import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const client = axios.create({ baseURL: '/api' })

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default client
