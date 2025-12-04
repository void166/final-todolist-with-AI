export const typeDefs =`#graphql
scalar Date
    type Todo{
        id: ID!
        title: String!
        todoDate: Date
        done: Boolean
        userId: ID!
        createdAt: Date
        updatedAt: Date
    }
    type User{
        id: ID!
        email: String!
        password: String!
        createdAt: Date
        updatedAt: Date
    }

    input CreateTodoInput{
        title: String!
        todoDate: Date
        done: Boolean
    }
    input UpdatedTodoInput{
        title: String
        done: Boolean
        todoDate: Date
    }


    type Query{
        users:[User!]!
        user(id: ID!): User
        todos: [Todo!]!
        todo(id:ID!): Todo
    }

    type Mutation{
        createTodo(input: CreateTodoInput): Todo!
        updateTodo(id: ID!, input: UpdatedTodoInput): Todo!
        deleteTodo(id:ID!): Boolean
    }
`