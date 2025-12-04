import { aiResolver } from "./ai.resolver"
import { projectResolvers } from "./project.resolver"
import { todoResolver } from "./todo.resolver"
import { userResolver } from "./user.resolver"

export const resolvers ={
    Query:{
        ...userResolver.Query,
        ...todoResolver.Query,
        ...projectResolvers.Query
    },
    Mutation: {
        ...userResolver.Mutation,
        ...todoResolver.Mutation,
        ...aiResolver.Mutation,
        ...projectResolvers.Mutation,
    },
    Subscription: {
        ...aiResolver.Subscription
    }
}