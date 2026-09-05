import { GraphQLClient } from 'graphql-request'
import { env } from '#/env'

// Prepared for future API integration; construction does not send a request.
export const graphqlClient = new GraphQLClient(env.VITE_GRAPHQL_URL)
