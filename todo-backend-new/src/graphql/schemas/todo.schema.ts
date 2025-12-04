export const todoTypedefs = `#graphql
scalar Date

type Todo {
  id: ID!
  title: String!
  description: String
  status: Status!
  priority: Priority!
  startDate: Date
  dueDate: Date
  reminderDate: Date
  recurrence: Recurrence!
  recurrenceRule: String
  projectId: ID
  parentId: ID
  userId: ID!
  createdAt: Date
  updatedAt: Date
  user: User
  project: Project
  subtasks: [Todo!]
}

enum Status {
  TODO
  IN_PROGRESS
  BLOCKED
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum Recurrence {
  NONE
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

input AddTodoInput {
  title: String!
  description: String
  status: Status
  priority: Priority
  startDate: Date
  dueDate: Date
  reminderDate: Date
  recurrence: Recurrence
  recurrenceRule: String
  projectId: ID
  parentId: ID
}

input UpdateTodoInput {
  id: ID!
  title: String
  description: String
  status: Status
  priority: Priority
  startDate: Date
  dueDate: Date
  reminderDate: Date
  recurrence: Recurrence
  recurrenceRule: String
  projectId: ID
  parentId: ID
}

input AddDescriptionInput {
  todoId: ID!
  description: String!
}

input CreateSubTaskInput {
  parentId: ID!
  title: String!
  description: String
  status: Status
  priority: Priority
  startDate: Date
  dueDate: Date
  reminderDate: Date
  recurrence: Recurrence
  recurrenceRule: String
  projectId: ID
}

input CreateRecurringTodosInput {
  title: String!
  description: String
  status: Status
  priority: Priority
  startDate: Date
  dueDate: Date
  reminderDate: Date
  recurrence: Recurrence!
  recurrenceRule: String
  projectId: ID
  occurrences: Int # optional, how many occurrences to generate
}

input SetReminderInput {
  todoId: ID!
  date: Date!
}

input FilterTodosInput {
  status: Status
  priority: Priority
  projectId: ID
  startDateFrom: Date
  startDateTo: Date
  dueDateFrom: Date
  dueDateTo: Date
}

type Query {
  todos: [Todo!]!
  todo(id: ID!): Todo
  subtasks(parentId: ID!): [Todo!]!
  projectTodos(projectId: ID!): [Todo!]!
  filterTodos(query: FilterTodosInput): [Todo!]!
}

type Mutation {
  createTodo(input: AddTodoInput!): Todo!
  updateTodo(input: UpdateTodoInput!): Todo!
  deleteTodo(id: ID!): Boolean!
  addSevenDayTodo(input: AddTodoInput!): [Todo!]!
  addDescription(input: AddDescriptionInput!): Todo!
  createSubTask(input: CreateSubTaskInput!): Todo!
  createRecurringTodos(input: CreateRecurringTodosInput!): [Todo!]!
  setReminder(input: SetReminderInput!): Todo!
}
`;
