export const buildTodoInput = (input: any, userId: string, startDate?: Date) => {
    return {
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "TODO",
      priority: input.priority ?? "LOW",
      startDate: startDate ?? input.startDate ?? new Date(),
      dueDate: input.dueDate ?? (startDate ?? input.startDate ?? new Date()),
      reminderDate: input.reminderDate ?? null,
      recurrence: input.recurrence ?? "NONE",
      recurrenceRule: input.recurrenceRule ?? null,
      projectId: input.projectId ?? null,
      parentId: input.parentId ?? null,
      userId,
    };
  };
  