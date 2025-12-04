export const projectTypedefs = `#graphql

type Project {
  id: ID!
  name: String!
  userId: ID!
  createdAt: Date
  updatedAt: Date
  todos: [Todo!]
}

input AddProjectInput {
  name: String!
}

type Query {
  projects: [Project!]!
  project(id: ID!): Project
}

type Mutation {
  createProject(input: AddProjectInput!): Project!
  
}

`;
