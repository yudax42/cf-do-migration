export interface KeyValue {
  [key: string]: any
}

export interface RetryOptions {
  retries: number
  delay: number
}

export interface FetchDataResponse {
  data: KeyValue[]
  lastKey?: string
}
