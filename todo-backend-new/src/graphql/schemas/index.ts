import { aiTypeDefs } from "./ai.schema"
import { projectTypedefs } from "./project.schema";
import { todoTypedefs } from "./todo.schema"
import { userTypedefs } from "./user.schema"

export const typeDefs = `#graphql
    ${aiTypeDefs}
    ${todoTypedefs}
    ${userTypedefs}
    ${projectTypedefs}
`;