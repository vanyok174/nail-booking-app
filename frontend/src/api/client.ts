const BASE_URL = import.meta.env.PROD 
  ? '/nail-app/api' 
  : '/api'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`)
    if (!res.ok) {
      throw new Error(`GET ${path} failed: ${res.status}`)
    }
    return res.json()
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    })
    if (!res.ok) {
      throw new Error(`POST ${path} failed: ${res.status}`)
    }
    return res.json()
  }

  async postFormData<T>(path: string, data: FormData): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      body: data
    })
    if (!res.ok) {
      throw new Error(`POST ${path} failed: ${res.status}`)
    }
    return res.json()
  }

  async put<T>(path: string, data?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    })
    if (!res.ok) {
      throw new Error(`PUT ${path} failed: ${res.status}`)
    }
    return res.json()
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      throw new Error(`DELETE ${path} failed: ${res.status}`)
    }
  }
}

export const api = new ApiClient(BASE_URL)
