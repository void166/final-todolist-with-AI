<template>
  <div class="container">
    <!-- User Header with Logout -->
    <div class="user-header">
      <h1>7-Day Todo List</h1>
      <div class="user-info">
        <span>{{ userEmail }}</span>
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </div>
    </div>

    <!-- Projects Section -->
    <div class="projects-section">
      <div class="projects-header">
        <h3>📁 Projects</h3>
        <button @click="showProjectInput = !showProjectInput" class="add-project-btn">
          {{ showProjectInput ? '✕' : '+ Project' }}
        </button>
      </div>

      <div v-if="showProjectInput" class="add-project-form">
        <input
          v-model="newProjectName"
          @keyup.enter="createProject"
          placeholder="Шинэ project нэр..."
          class="project-input"
        />
        <button @click="createProject" class="ok-button">Үүсгэх</button>
      </div>

      <div class="projects-list">
        <button
          @click="selectedProjectId = null"
          :class="['project-chip', { active: selectedProjectId === null }]"
        >
          🏠 Бүх Todo
        </button>
        <button
          v-for="project in projects"
          :key="project.id"
          @click="selectedProjectId = project.id"
          :class="['project-chip', { active: selectedProjectId === project.id }]"
        >
          📁 {{ project.name }}
        </button>
      </div>
    </div>

    <!-- Week Navigation -->
    <div class="week-navigation">
      <button @click="previousWeek" class="nav-button">← Previous Week</button>
      <span class="week-label">{{ weekLabel }}</span>
      <button @click="nextWeek" class="nav-button">Next Week →</button>
    </div>

    <!-- Days Tabs -->
    <div class="days-tabs">
      <button
        v-for="(day, index) in days"
        :key="index"
        :class="['day-tab', { active: selectedDayIndex === index }]"
        @click="selectDay(index)"
      >
        <div class="day-name">{{ getDayName(day) }}</div>
        <div class="day-date">{{ formatDate(day) }}</div>
        <div class="todo-count">{{ getTodosForDay(day).length }}</div>
      </button>
    </div>

    <!-- Action Buttons -->
    <div class="header">
      <button class="nemehBt" @click="showInput = !showInput">Нэмэх</button>
      <button class="hasahBt" @click="showDel = !showDel">Хасах</button>
      <button class="updateBt" @click="showUpdate = !showUpdate">Шинэчлэх</button>
      <button class="descBt" @click="showDescription = !showDescription">Тайлбар</button>
      <button class="recurringBt" @click="showRecurring = !showRecurring">Давтах</button>
    </div>

    <!-- Add Todo Input -->
    <div v-if="showInput && !showDel && !showUpdate && !showDescription && !showRecurring" class="add-input">
      <input
        v-model="newTitle"
        @keyup.enter="addTodo"
        placeholder="шинэ todo бичнэ үү"
        class="todo-input"
      />
      <select v-model="newPriority" class="priority-select">
        <option value="">Priority</option>
        <option value="HIGH">🔴 High</option>
        <option value="MEDIUM">🟡 Medium</option>
        <option value="LOW">🟢 Low</option>
      </select>
      <button @click="addTodo" class="ok-button">Ok</button>
    </div>

    <!-- Recurring Todo Form -->
    <div v-if="showRecurring" class="recurring-form">
      <h3>⏰ Давтагдах Todo үүсгэх</h3>
      <div class="form-group">
        <input
          v-model="recurringTodo.title"
          placeholder="Todo нэр..."
          class="todo-input"
        />
      </div>
      <div class="form-group">
        <select v-model="recurringTodo.recurrence" class="todo-select">
          <option value="DAILY">📅 Өдөр бүр</option>
          <option value="WEEKLY">📆 7 хоног бүр</option>
          <option value="MONTHLY">📊 Сар бүр</option>
          <option value="YEARLY">🗓️ Жил бүр</option>
        </select>
        <input
          v-model.number="recurringTodo.occurrences"
          type="number"
          min="1"
          max="365"
          placeholder="Хэдэн удаа?"
          class="occurrences-input"
        />
      </div>
      <div class="form-actions">
        <button @click="createRecurringTodos" class="ok-button">Үүсгэх</button>
        <button @click="showRecurring = false" class="cancel-button">Болих</button>
      </div>
    </div>

    <!-- Todo List for Selected Day -->
    <div class="selected-day-header">
      <h2>{{ getDayName(selectedDay) }} - {{ formatDate(selectedDay) }}</h2>
      <span v-if="selectedProjectId" class="filter-badge">
        Filter: {{ projects.find(p => p.id === selectedProjectId)?.name }}
      </span>
    </div>

    <draggable
      v-model="currentDayTodos"
      item-key="id"
      class="ul-s"
      animation="200"
      @end="saveOrder"
    >
      <template #item="{ element }">
        <li class="kk">
          <div class="todo-main">
            <span v-if="editingId !== element.id" class="todo-title">
              {{ element.title }}
              <span v-if="element.priority" :class="['priority-badge', element.priority.toLowerCase()]">
                {{ element.priority }}
              </span>
              <span v-if="element.project" class="project-badge">
                📁 {{ element.project.name }}
              </span>
            </span>
            <input
              v-else
              v-model="editingTitle"
              @keyup.enter="saveEdit(element.id)"
              placeholder="шинэ todo бичнэ үү"
              class="todo-input"
            />

            <!-- Description Display -->
            <div v-if="element.description && !editingDescId" class="todo-description">
              📝 {{ element.description }}
            </div>

            <!-- Description Edit -->
            <div v-if="editingDescId === element.id && showDescription" class="description-edit">
              <textarea
                v-model="editingDescription"
                @keyup.ctrl.enter="saveDescription(element.id)"
                placeholder="Тайлбар бичнэ үү..."
                class="description-textarea"
              ></textarea>
              <button @click="saveDescription(element.id)" class="ok-button">Хадгалах</button>
            </div>

            <!-- Subtasks Display -->
            <div v-if="expandedTodoId === element.id" class="subtasks-section">
              <div class="subtasks-header">
                <h4>Subtasks ({{ element.subtasks?.length || 0 }})</h4>
                <button @click="showSubtaskInput(element.id)" class="add-subtask-btn">+ Subtask</button>
              </div>

              <!-- Add Subtask Input -->
              <div v-if="addingSubtaskTo === element.id" class="add-subtask-input">
                <input
                  v-model="newSubtaskTitle"
                  @keyup.enter="addSubtask(element.id)"
                  placeholder="Subtask нэр..."
                  class="todo-input"
                />
                <button @click="addSubtask(element.id)" class="ok-button">Ok</button>
              </div>

              <!-- Subtasks List -->
              <ul v-if="element.subtasks && element.subtasks.length > 0" class="subtasks-list">
                <li v-for="subtask in element.subtasks" :key="subtask.id" class="subtask-item">
                  <span>{{ subtask.title }}</span>
                  <button
                    :class="subtask.status === 'DONE' ? 'done-button' : 'notdone-button'"
                    @click="toggleSubtaskDone(element.id, subtask.id)"
                  >
                    {{ subtask.status === 'DONE' ? "Done" : "Not Done" }}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div class="button-group">
            <!-- Regular Buttons -->
            <button
              v-if="editingId !== element.id && !showDel && !showUpdate && !showDescription"
              :class="element.status === 'DONE' ? 'done-button' : 'notdone-button'"
              @click="toggleDone(element.id)"
            >
              {{ element.status === 'DONE' ? "Done" : "Not Done" }}
            </button>

            <!-- Subtasks Toggle -->
            <button
              v-if="!showDel && !showUpdate && !showDescription"
              @click="toggleSubtasks(element.id)"
              class="subtask-toggle-btn"
            >
              {{ expandedTodoId === element.id ? '▼' : '▶' }} Subtasks
            </button>

            <!-- Delete Button -->
            <button
              v-if="showDel && editingId !== element.id"
              @click="delTodo(element.id)"
              class="del-button"
            >
              Del
            </button>

            <!-- Update Button -->
            <button
              v-if="showUpdate && editingId !== element.id"
              @click="startEdit(element)"
              class="up-button"
            >
              Update
            </button>

            <!-- Description Button -->
            <button
              v-if="showDescription && editingId !== element.id"
              @click="startEditDescription(element)"
              class="desc-button"
            >
              {{ element.description ? 'Edit Desc' : 'Add Desc' }}
            </button>

            <!-- Save Button -->
            <button
              v-if="editingId === element.id"
              @click="saveEdit(element.id)"
              class="ok-button"
            >
              Save
            </button>
          </div>
        </li>
      </template>
    </draggable>

    <div v-if="currentDayTodos.length === 0" class="empty-state">
      No todos for this day. Click "Нэмэх" to add one!
    </div>

    <!-- Embedded AI Chat -->
    <div class="ai-chat-container">
      <button
        @click="toggleChat"
        class="ai-toggle-btn"
        :class="{ active: showChat }"
      >
        🤖 AI Assistant
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
      </button>

      <transition name="slide">
        <div v-if="showChat" class="chat-window">
          <div class="chat-header">
            <h3>🤖 AI Todo Assistant</h3>
            <button @click="toggleChat" class="close-btn">✕</button>
          </div>

          <div class="chat-messages" ref="messagesContainer">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              :class="['message', msg.role]"
            >
              <div class="message-content">
                <div class="message-text">
                  {{ msg.content }}
                  <span
                    v-if="isLoading && index === messages.length - 1 && msg.content.length > 0"
                    class="streaming-cursor"
                  >▊</span>
                </div>

                <div v-if="msg.todos && msg.todos.length > 0" class="created-todos">
                  <div class="todos-header">✓ Todo үүслээ:</div>
                  <div v-for="todo in msg.todos" :key="todo.id" class="todo-item">
                    • {{ todo.title }} ({{ formatDateShort(todo.startDate) }})
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content.length === 0"
              class="message assistant"
            >
              <div class="message-content">
                <div class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>

          <div class="chat-input">
            <input
              v-model="userInput"
              @keyup.enter="sendMessage"
              placeholder="'10-22нд ус уух' эсвэл 'миний todo юу байна?'"
              :disabled="isLoading"
              class="chat-input-field"
            />
            <button
              @click="sendMessage"
              :disabled="isLoading || !userInput.trim()"
              class="send-btn"
            >
              ↑
            </button>
          </div>

          <div class="quick-actions">
            <button @click="quickPrompt('Миний todo-нууд юу байна?')" class="quick-btn">
              📋 Todo харах
            </button>
            <button @click="quickPrompt('Өнөөдөр юу хийх вэ?')" class="quick-btn">
              💡 Зөвлөгөө
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import draggable from "vuedraggable";
import { createClient } from "graphql-ws";

const router = useRouter();
const token = ref("");
const userEmail = ref("");
let wsClient = null;
let unsubscribe = null;

// State
const todos = ref([]);
const showInput = ref(false);
const showDel = ref(false);
const showUpdate = ref(false);
const showDescription = ref(false);
const newTitle = ref("");
const editingId = ref(null);
const editingTitle = ref("");
const editingDescId = ref(null);
const editingDescription = ref("");
const selectedDayIndex = ref(0);
const weekStartDate = ref(new Date());
const projects = ref([]);
const selectedProjectId = ref(null);
const showProjectInput = ref(false);
const newProjectName = ref("");
const newPriority = ref("");
const showRecurring = ref(false);
const recurringTodo = ref({
  title: "",
  recurrence: "WEEKLY",
  occurrences: 4
});

// Subtask state
const expandedTodoId = ref(null);
const addingSubtaskTo = ref(null);
const newSubtaskTitle = ref("");

// Authentication check
onMounted(() => {
  const storedToken = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  userEmail.value = user.email || "";

  if (!storedToken) {
    router.push("/login");
    return;
  }

  token.value = storedToken;
  fetchTodos();
  fetchProjects();
  
  setTimeout(() => {
    initializeWebSocket();
  }, 500);
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
  if (wsClient) wsClient.dispose();
});

const handleLogout = () => {
  if (unsubscribe) unsubscribe();
  if (wsClient) wsClient.dispose();
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.push("/login");
};

// GraphQL helper
const graphqlRequest = async (query, variables = {}) => {
  const res = await fetch("http://localhost:5000/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.value}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
};

/* -------------------- TODOS -------------------- */

const formatDateISO = (d) => d.toISOString().split("T")[0];
const formatDate = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
const formatDateShort = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
const getDayName = (d) =>
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];

const weekLabel = computed(() => {
  const start = days.value[0];
  const end = days.value[6];
  return `${formatDate(start)} - ${formatDate(end)}`;
});

const days = computed(() => {
  const arr = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate.value);
    date.setDate(date.getDate() + i);
    arr.push(date);
  }
  return arr;
});

const selectedDay = computed(() => days.value[selectedDayIndex.value]);

const selectDay = (index) => {
  selectedDayIndex.value = index;
};

const getTodosForDay = (date) => {
  const targetDateStr = date.toISOString().split("T")[0];

  return todos.value.filter((t) => {
    if (!t.startDate) return false;
    const todoDateStr = t.startDate.split("T")[0]; // ignore time
    return todoDateStr === targetDateStr;
  });
  if (selectedProjectId.value) {
    filtered = filtered.filter(t => t.projectId === selectedProjectId.value);
  }

  return filtered;
};



const currentDayTodos = computed({
  get: () => getTodosForDay(selectedDay.value),
  set: (newValue) => {
    const dateStr = formatDateISO(selectedDay.value);
    todos.value = todos.value.filter((t) => {
      if (!t.startDate) return true;
      return new Date(t.startDate).toISOString().split("T")[0] !== dateStr;
    });
    todos.value.push(...newValue);
  },
});
/* -------------------- PROJECTS -------------------- */
const fetchProjects = async () => {
  try {
    const query = `
      query GetProjects {
        projects {
          id
          name
        }
      }
    `;
    const data = await graphqlRequest(query);
    projects.value = data.projects;
  } catch (e) {
    console.error("Fetch projects error:", e.message);
  }
};

const createProject = async () => {
  if (!newProjectName.value.trim()) {
    alert("Project нэр шаардлагатай");
    return;
  }

  try {
    const query = `
      mutation CreateProject($input: AddProjectInput!) {
        createProject(input: $input) {
          id
          name
        }
      }
    `;
    const variables = {
      input: { name: newProjectName.value }
    };
    const data = await graphqlRequest(query, variables);
    projects.value.push(data.createProject);
    newProjectName.value = "";
    showProjectInput.value = false;
  } catch (e) {
    alert(e.message);
  }
};


const saveOrder = () => {
  console.log("Order saved");
};

// Fetch todos with subtasks
const fetchTodos = async () => {
  try {
    const query = `
      query GetTodos {
        todos {
          id
          title
          description
          status
          startDate
          priority
          projectId         
          project {         
            id
            name
          }
          subtasks {
            id
            title
            status
            priority
          }
        }
      }
    `;
    const data = await graphqlRequest(query);
    todos.value = data.todos;
  } catch (e) {
    console.error("Fetch todos error:", e.message);
  }
};

// CRUD operations
const addTodo = async () => {
  if (!newTitle.value.trim()) {
    alert("Title required");
    return;
  }

  const dateStr = selectedDay.value.toISOString().split("T")[0];

  try {
    const query = `
      mutation CreateTodo($input: AddTodoInput!) {
        createTodo(input: $input) {
          id
          title
          description
          status
          startDate
          priority
          projectId     
          project {     
          id
          name
        }
        }
      }
    `;
    const variables = {
      input: { 
        title: newTitle.value, 
        status: "TODO",
        startDate: dateStr,
        priority: newPriority.value || null,      
        projectId: selectedProjectId.value || null 
      },
    };
    const data = await graphqlRequest(query, variables);

    // Push to local list
    todos.value.push(data.createTodo);


    newTitle.value = "";
    newPriority.value = "";
    showInput.value = false;


    await fetchTodos();
  } catch (e) {
    alert(e.message);
  }
};
const createRecurringTodos = async () => {
  if (!recurringTodo.value.title.trim()) {
    alert("Title required");
    return;
  }

  const dateStr = selectedDay.value.toISOString().split("T")[0];

  try {
    const query = `
      mutation CreateRecurringTodos($input: CreateRecurringTodosInput!) {
        createRecurringTodos(input: $input) {
          id
          title
          status
          startDate
          priority
          parentId
        }
      }
    `;
    const variables = {
      input: {
        title: recurringTodo.value.title,
        status: "TODO",
        startDate: dateStr,
        recurrence: recurringTodo.value.recurrence,
        occurrences: recurringTodo.value.occurrences,
        projectId: selectedProjectId.value || null
      }
    };
    const data = await graphqlRequest(query, variables);
    todos.value.push(...data.createRecurringTodos);
    
    recurringTodo.value = {
      title: "",
      recurrence: "WEEKLY",
      occurrences: 4
    };
    showRecurring.value = false;
    alert(`${data.createRecurringTodos.length} todo амжилттай үүслээ!`);
  } catch (e) {
    alert(e.message);
  }
};

const delTodo = async (id) => {
  try {
    const query = `
      mutation DeleteTodo($id: ID!) {
        deleteTodo(id: $id)
      }
    `;
    await graphqlRequest(query, { id });
    todos.value = todos.value.filter((t) => t.id !== id);
    showDel.value = false;
  } catch (e) {
    alert(e.message);
  }
};

const toggleDone = async (id) => {
  const todo = todos.value.find((t) => t.id === id);
  const newStatus = todo.status === "DONE" ? "TODO" : "DONE";
  
  const query = `
    mutation UpdateTodo($input: UpdateTodoInput!) {
      updateTodo(input: $input) {
        id
        title
        description
        status
        startDate
        priority
      }
    }
  `;
  const variables = { 
    input: { 
      id, 
      status: newStatus
    } 
  };
  const data = await graphqlRequest(query, variables);

  const idx = todos.value.findIndex((t) => t.id === id);
  if (idx !== -1) {
    todos.value[idx] = { ...todos.value[idx], ...data.updateTodo };
  }
};

const startEdit = (todo) => {
  editingId.value = todo.id;
  editingTitle.value = todo.title;
};

const saveEdit = async (id) => {
  try {
    const query = `
      mutation UpdateTodo($input: UpdateTodoInput!) {
        updateTodo(input: $input) {
          id
          title
          description
          status
          startDate
          priority
        }
      }
    `;
    const variables = { 
      input: { 
        id, 
        title: editingTitle.value
      } 
    };
    const data = await graphqlRequest(query, variables);
    const idx = todos.value.findIndex((t) => t.id === id);
    if (idx !== -1) {
      todos.value[idx] = { ...todos.value[idx], ...data.updateTodo };
    }
    editingId.value = null;
    showUpdate.value = false;
  } catch (e) {
    alert(e.message);
  }
};

// Description functions
const startEditDescription = (todo) => {
  editingDescId.value = todo.id;
  editingDescription.value = todo.description || "";
};

const saveDescription = async (todoId) => {
  try {
    const query = `
      mutation AddDescription($input: AddDescriptionInput!) {
        addDescription(input: $input) {
          id
          title
          description
          status
          startDate
          priority
        }
      }
    `;
    const variables = {
      input: {
        todoId,
        description: editingDescription.value
      }
    };
    const data = await graphqlRequest(query, variables);
    const idx = todos.value.findIndex((t) => t.id === todoId);
    if (idx !== -1) {
      todos.value[idx] = { ...todos.value[idx], ...data.addDescription };
    }
    editingDescId.value = null;
    editingDescription.value = "";
    showDescription.value = false;
  } catch (e) {
    alert(e.message);
  }
};

// Subtask functions
const toggleSubtasks = async (todoId) => {
  if (expandedTodoId.value === todoId) {
    expandedTodoId.value = null;
  } else {
    expandedTodoId.value = todoId;
    // Fetch subtasks
    await fetchSubtasks(todoId);
  }
};

const fetchSubtasks = async (parentId) => {
  try {
    const query = `
      query GetSubtasks($parentId: ID!) {
        subtasks(parentId: $parentId) {
          id
          title
          status
          priority
          startDate
        }
      }
    `;
    const data = await graphqlRequest(query, { parentId });
    const idx = todos.value.findIndex((t) => t.id === parentId);
    if (idx !== -1) {
      todos.value[idx].subtasks = data.subtasks;
    }
  } catch (e) {
    console.error("Fetch subtasks error:", e.message);
  }
};

const showSubtaskInput = (todoId) => {
  addingSubtaskTo.value = todoId;
  newSubtaskTitle.value = "";
};

const addSubtask = async (parentId) => {
  if (!newSubtaskTitle.value.trim()) {
    alert("Subtask title required");
    return;
  }

  try {
    const query = `
      mutation CreateSubTask($input: CreateSubTaskInput!) {
        createSubTask(input: $input) {
          id
          title
          status
          priority
          startDate
          parentId
        }
      }
    `;
    const variables = {
      input: {
        parentId,
        title: newSubtaskTitle.value,
        status: "TODO"
      }
    };
    const data = await graphqlRequest(query, variables);
    
    // Add subtask to parent
    const idx = todos.value.findIndex((t)=> t.id=== parentId);
    if(!idx !== -1){
      todos.value[idx].subtask= [
        ...(todos.value[idx].subtask || []),
        data.createSubTask
      ]
    }
    
    newSubtaskTitle.value = "";
    addingSubtaskTo.value = null;
  } catch (e) {
    alert(e.message);
  }
};

const toggleSubtaskDone = async (parentId, subtaskId) => {
  const parent = todos.value.find((t) => t.id === parentId);
  const subtask = parent?.subtasks?.find((s) => s.id === subtaskId);
  if (!subtask) return;

  const newStatus = subtask.status === "DONE" ? "TODO" : "DONE";
  
  try {
    const query = `
      mutation UpdateTodo($input: UpdateTodoInput!) {
        updateTodo(input: $input) {
          id
          title
          status
          priority
        }
      }
    `;
    const variables = {
      input: {
        id: subtaskId,
        status: newStatus
      }
    };
    const data = await graphqlRequest(query, variables);
    
    // Update subtask in parent
    const parentIdx = todos.value.findIndex((t) => t.id === parentId);
    if (parentIdx !== -1) {
      const subtaskIdx = todos.value[parentIdx].subtasks.findIndex((s) => s.id === subtaskId);
      if (subtaskIdx !== -1) {
        todos.value[parentIdx].subtasks[subtaskIdx] = {
          ...todos.value[parentIdx].subtasks[subtaskIdx],
          ...data.updateTodo
        };
      }
    }
  } catch (e) {
    alert(e.message);
  }
};

// Week navigation
const previousWeek = () => {
  const d = new Date(weekStartDate.value);
  d.setDate(d.getDate() - 7);
  weekStartDate.value = d;
  fetchTodos();
};

const nextWeek = () => {
  const d = new Date(weekStartDate.value);
  d.setDate(d.getDate() + 7);
  weekStartDate.value = d;
  fetchTodos();
};

/* -------------------- AI CHAT -------------------- */

const showChat = ref(false);
const messages = ref([
  {
    role: "assistant",
    content: "Сайн байна уу! Би таны todo туслах AI. '10-22нд ус уух' гэх мэт бичээрэй, би todo үүсгэж өгнө.",
  },
]);
const userInput = ref("");
const isLoading = ref(false);
const unreadCount = ref(0);
const messagesContainer = ref(null);
const conversationHistory = ref([]);

const initializeWebSocket = () => {
  if (!token.value) {
    console.error("❌ No token available for WebSocket connection");
    return;
  }
  
  try {
    wsClient = createClient({
      url: "ws://localhost:5000/graphql",
      connectionParams: () => {
        const authToken = token.value || localStorage.getItem("token");
        return {
          authorization: `Bearer ${authToken}`,
        };
      },
      shouldRetry: () => true,
      retryAttempts: 3,
    });
    
    subscribeToAIMessages();
  } catch (error) {
    console.error("❌ Failed to create WebSocket client:", error);
  }
};

const subscribeToAIMessages = () => {
  if (!wsClient) return;
  
  try {
    unsubscribe = wsClient.subscribe(
      {
        query: `
          subscription {
            aiMessage {
              type
              text
              action
              todos {
                id
                title
                startDate
                status
                priority
              }
              deletedIds
              deletedCount
              updatedTodos {
                id
                title
                startDate
                status
                priority
              }
              message
            }
          }
        `,
      },
      {
        next: (response) => {
          if (response?.errors) {
            console.error("❌ GraphQL Errors:", response.errors);
            return;
          }
          if (response?.data?.aiMessage) {
            handleAIMessage(response.data.aiMessage);
          }
        },
        error: (err) => {
          console.error("❌ Subscription error:", err);
          isLoading.value = false;
        },
        complete: () => console.log("✅ Subscription complete"),
      }
    );
  } catch (error) {
    console.error("❌ Failed to subscribe:", error);
  }
};

const handleAIMessage = (payload) => {
  const lastMsg = messages.value[messages.value.length - 1];

  if (payload.type === "TEXT" && payload.text) {
    if (lastMsg && lastMsg.role === "assistant") {
      lastMsg.content += payload.text;
      scrollToBottom();
    }
  } else if (payload.type === "DONE") {
    isLoading.value = false;

    if (payload.action === "create_todo" && payload.todos) {
      todos.value.push(...payload.todos);
      if (lastMsg && lastMsg.role === "assistant") {
        lastMsg.todos = payload.todos;
      }
    } else if (payload.action === "delete_todo" && payload.deletedIds) {
      todos.value = todos.value.filter((t) => !payload.deletedIds.includes(t.id));
    } else if (payload.action === "update_todo" && payload.updatedTodos) {
      payload.updatedTodos.forEach((updated) => {
        const idx = todos.value.findIndex((t) => t.id === updated.id);
        if (idx !== -1) {
          todos.value[idx] = { ...todos.value[idx], ...updated };
        }
      });
    }

    conversationHistory.value.push({
      role: "assistant",
      content: lastMsg.content || payload.message || "",
    });

    scrollToBottom();
  } else if (payload.type === "ERROR") {
    console.error("❌ AI Error:", payload.message);
    isLoading.value = false;
    alert("Error: " + payload.message);
  }
};

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return;

  const userMsg = { role: "user", content: userInput.value };
  messages.value.push(userMsg);

  conversationHistory.value.push({
    role: "user",
    content: userInput.value,
  });

  messages.value.push({ role: "assistant", content: "" });

  const messageToSend = userInput.value;
  userInput.value = "";
  isLoading.value = true;

  try {
    const mutation = `
      mutation SendAIMessage($message: String!, $conversationHistory: [ConversationMessage]) {
        sendAIMessage(message: $message, conversationHistory: $conversationHistory)
      }
    `;

    await graphqlRequest(mutation, {
      message: messageToSend,
      conversationHistory: conversationHistory.value,
    });
  } catch (e) {
    console.error("❌ Send message error:", e);
    isLoading.value = false;
    alert("Failed to send message: " + e.message);
    
    if (messages.value[messages.value.length - 1]?.content === "") {
      messages.value.pop();
    }
  }

  scrollToBottom();
};

const quickPrompt = (prompt) => {
  userInput.value = prompt;
  sendMessage();
};

const toggleChat = () => {
  showChat.value = !showChat.value;
  if (showChat.value) {
    unreadCount.value = 0;
    nextTick(() => scrollToBottom());
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

watch(
  () => messages.value.length,
  () => {
    if (!showChat.value) {
      unreadCount.value++;
    }
  }
);
</script>
<style scoped>
/* ---------- Main app styles ---------- */
body {
  background-color: #f54927;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

/* User Header */
.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-header h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info span {
  color: #666;
  font-size: 14px;
}

.logout-btn {
  background-color: #dc3545;
  color: white;
  padding: 8px 16px;
  border-radius: 5px;
  font-size: 14px;
}

.logout-btn:hover {
  background-color: #c82333;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.streaming-cursor {
  display: inline-block;
  animation: blink 1s step-end infinite;
  color: #007bff;
  font-weight: bold;
  margin-left: 2px;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.week-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-button {
  background-color: #007bff;
  color: white;
  padding: 8px 15px;
  border-radius: 5px;
  font-size: 14px;
}

.nav-button:hover {
  background-color: #0056b3;
}

.week-label {
  font-weight: bold;
  color: #333;
  font-size: 16px;
}

.days-tabs {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.day-tab {
  background: white;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.day-tab:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

.day-tab.active {
  background-color: #007bff;
  color: white;
  border-color: #0056b3;
}

.day-name {
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 4px;
}

.day-date {
  font-size: 14px;
  margin-bottom: 4px;
}

.todo-count {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: inline-block;
  margin-top: 4px;
}

.day-tab.active .todo-count {
  background: rgba(255, 255, 255, 0.3);
}

.selected-day-header {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.selected-day-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
  text-align: center;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 10px;
}

button {
  background-color: #6c757d;
  color: white;
  cursor: pointer;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  transition: background-color 0.3s;
}

button:hover {
  opacity: 0.9;
}
/* Projects Section */
.projects-section {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.projects-header h3 {
  margin: 0;
  color: #333;
}

.add-project-btn {
  background: #007bff;
  color: white;
  padding: 8px 15px;
  border-radius: 5px;
  font-size: 14px;
}

.add-project-form {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.project-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.projects-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.project-chip {
  background: #f0f0f0;
  padding: 8px 15px;
  border-radius: 20px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s;
}

.project-chip:hover {
  background: #e0e0e0;
}

.project-chip.active {
  background: #007bff;
  color: white;
  border-color: #0056b3;
}

/* Priority */
.priority-select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-left: 10px;
}

.priority-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  margin-left: 8px;
}

.priority-badge.high {
  background: #ff4444;
  color: white;
}

.priority-badge.medium {
  background: #ffaa00;
  color: white;
}

.priority-badge.low {
  background: #44ff44;
  color: white;
}

.project-badge {
  background: #e7f3ff;
  color: #0066cc;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  margin-left: 8px;
}

/* Recurring Form */
.recurring-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.recurring-form h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.form-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.todo-select {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.occurrences-input {
  width: 120px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.cancel-button {
  background: #6c757d;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
}

.recurringBt {
  background-color: #17a2b8;
}

.filter-badge {
  background: #e7f3ff;
  color: #0066cc;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  margin-left: 10px;
}

.nemehBt {
  background-color: #28a745;
}

.hasahBt {
  background-color: #dc3545;
}

.updateBt {
  background-color: #ffc107;
}

.todo-input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.ok-button {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  cursor: pointer;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.add-input {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.ul-s {
  list-style-type: none;
  padding: 0;
  min-height: 100px;
}

.kk {
  background: white;
  margin: 10px 0;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: grab;
}

.kk:active {
  cursor: grabbing;
}

.button-group {
  display: flex;
  gap: 8px;
}

.del-button {
  background-color: #dc3545;
  color: white;
  padding: 8px 12px;
  font-size: 14px;
}

.up-button {
  background-color: #ffc107;
  color: white;
  padding: 8px 12px;
  font-size: 14px;
}

.done-button {
  background-color: #28a745;
  color: white;
  padding: 8px 12px;
  font-size: 14px;
}

.notdone-button {
  background-color: #dc3545;
  color: white;
  padding: 8px 12px;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  background: white;
  border-radius: 8px;
  font-style: italic;
}

.ul-s li.dragging {
  opacity: 0.5;
}

/* ---------- AI chat styles ---------- */
.ai-chat-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.ai-toggle-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 25px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  position: relative;
}

.ai-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.ai-toggle-btn.active {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.chat-window {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 400px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;
  scroll-behavior: smooth;
}

.message {
  margin-bottom: 15px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 16px;
  word-wrap: break-word;
}

.message.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-content {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.message-text {
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.created-todos {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.todos-header {
  font-weight: bold;
  margin-bottom: 8px;
  color: #28a745;
}

.todo-item {
  padding: 4px 0;
  font-size: 14px;
  color: #555;
}

.chat-input {
  display: flex;
  padding: 15px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.chat-input-field {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 14px;
  outline: none;
}

.chat-input-field:focus {
  border-color: #667eea;
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  margin-left: 10px;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-actions {
  display: flex;
  gap: 10px;
  padding: 10px 15px;
  background: #f9f9f9;
  border-top: 1px solid #e0e0e0;
}

.quick-btn {
  flex: 1;
  padding: 8px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* Animations */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .chat-window {
    width: calc(100vw - 40px);
    height: calc(100vh - 120px);
    right: 20px;
  }

  .days-tabs {
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .day-tab {
    padding: 8px 4px;
  }

  .day-name {
    font-size: 10px;
  }

  .day-date {
    font-size: 12px;
  }
}
</style>