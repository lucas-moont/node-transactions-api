// eslint-disable-next-line
import { Knex } from "knex"

declare module 'knex/types/tables' {
  export interface Tables {
    transactions: {
      id: string, 
      title: string,
      amount: number, 
      created_at: string, 
      sessionId?: string // o ponto de interrogação após a chave indica que é opcional
    }
  }
}