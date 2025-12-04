export const userTypedefs = `#graphql

scalar Date

    type User{
        id: ID!
        email: String!
        password: String!
        updatedAt: Date
        createdAt: Date
        todos:[Todo!]
    }

    type AuthPayload{
        token: String!
        user: User!
    }
    
    input AddUserInput{
        email: String!
        password: String!
    }
    input LoginUserInput{
        email: String!
        password: String!
    }

    type Query{
        users: [User!]
        user(id: ID!): User
        getTodosByWeek(startDate: String): [Todo!]!
    }

    type Mutation{
        createUser(input: AddUserInput!): AuthPayload!
        loginUser(input: LoginUserInput!): AuthPayload!
    }
`