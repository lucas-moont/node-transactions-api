import { FastifyInstance } from "fastify"
import { knex } from "../database"
import {z} from 'zod'
import {randomUUID} from "node:crypto"
import { checkSessionIdExists } from "../middlewares/check-session-id-exists"

export async function transactionsRoutes(app: FastifyInstance){

  
  app.get('/', {
    preHandler: [checkSessionIdExists]
  }, async (request) => {
    const {sessionId} = request.cookies

    const transactions = await knex('transactions')
    .where('sessionId', sessionId).select('*')

    return {
      transactions
    }
  })

  app.get('/:id', {
    preHandler: [checkSessionIdExists],
  }, async (request) => {
    const {sessionId} = request.cookies
    const getTransactionsParamSchema = z.object({
      id: z.string().uuid()
    })

    const {id} = getTransactionsParamSchema.parse(request.params)

    const transaction = await knex('transactions').
      where(
        {id,
        sessionId
        }
      )
      .first()

    return {transaction}
  })
  
  app.get('/summary', {
    preHandler: [checkSessionIdExists]
  }, async (request) => {
    const {sessionId} = request.cookies
    const summary = await knex('transactions')
      .sum('amount', {
        as: 'summary'
      })
      .where('sessionId', sessionId)
      .first()

    return {
      'summary': {
        amount: summary.summary
      }
    }
  })

  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit'])
    })
  
    const {title, amount, type} = createTransactionBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId 

    if(!sessionId){
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      sessionId
    })

    return reply.status(201).send()
  })
}