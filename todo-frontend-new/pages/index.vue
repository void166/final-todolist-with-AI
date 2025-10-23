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
    </div>

    <!-- Add Todo Input -->
    <div v-if="showInput && !showDel && !showUpdate" class="add-input">
      <input
        v-model="newTitle"
        @keyup.enter="addTodo"
        placeholder="шинэ todo бичнэ үү"
        class="todo-input"
      />
      <button @click="addTodo" class="ok-button">Ok</button>
    </div>

    <!-- Todo List for Selected Day -->
    <div class="selected-day-header">
      <h2>{{ getDayName(selectedDay) }} - {{ formatDate(selectedDay) }}</h2>
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
          <span v-if="editingId !== element.id">{{ element.title }}</span>
          <input
            v-else
            v-model="editingTitle"
            @keyup.enter="saveEdit(element.id)"
            placeholder="шинэ todo бичнэ үү"
            class="todo-input"
          />

          <div class="button-group">
            <button
              v-if="editingId !== element.id && !showDel && !showUpdate"
              :class="element.done ? 'done-button' : 'notdone-button'"
              @click="toggleDone(element.id)"
            >
              {{ element.done ? "Done" : "Not Done" }}
            </button>
            <button
              v-if="showDel && editingId !== element.id"
              @click="delTodo(element.id)"
              class="del-button"
            >
              Del
            </button>
            <button
              v-if="showUpdate && editingId !== element.id"
              @click="startEdit(element)"
              class="up-button"
            >
              Update
            </button>
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

    <!-- Embedded AI Chat (bottom-right) -->
    <div class="ai-chat-container">
      <!-- AI Toggle Button -->
      <button @click="toggleChat" class="ai-toggle-btn" :class="{ active: showChat }">
        🤖 AI Assistant
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
      </button>

      <!-- Chat Window -->
      <transition name="slide">
        <div v-if="showChat" class="chat-window">
          <div class="chat-header">
            <h3>🤖 AI Todo Assistant</h3>
            <button @click="toggleChat" class="close-btn">✕</button>
          </div>

          <!-- ✅ MESSAGES WITH STREAMING CURSOR -->
          <div class="chat-messages" ref="messagesContainer">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              :class="['message', msg.role]"
            >
              <div class="message-content">
                <!-- ✅ Text with cursor -->
                <div class="message-text">
                  {{ msg.content }}
                  <!-- ✅ Show cursor while streaming -->
                  <span 
                    v-if="isLoading && index === messages.length - 1 && msg.content" 
                    class="streaming-cursor"
                  >▊</span>
                </div>
                
                <!-- Created todos -->
                <div v-if="msg.todos && msg.todos.length > 0" class="created-todos">
                  <div class="todos-header">✓ Todo үүслээ:</div>
                  <div v-for="todo in msg.todos" :key="todo.id" class="todo-item">
                    • {{ todo.title }} ({{ formatDateShort(todo.todoDate) }})
                  </div>
                </div>
              </div>
            </div>

            <!-- ✅ Loading indicator (before text starts) -->
            <div 
              v-if="isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content" 
              class="message assistant"
            >
              <div class="message-content">
                <div class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Input -->
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

          <!-- Quick Actions -->
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
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import draggable from "vuedraggable";

/* -----------------------------
   Auth, Todos (main app)
   ----------------------------- */
const router = useRouter();
const token = ref('');
const userEmail = ref('');

// Check authentication on mount
onMounted(() => {
  token.value = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  userEmail.value = user.email || '';

  if (!token.value) {
    router.push('/login');
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  weekStartDate.value = today;

  fetchTodos();
});

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};

// Add auth headers helper
const getAuthHeaders = () => ({
  Authorization: `Bearer ${token.value}`
});

const showInput = ref(false);
const showDel = ref(false);
const showUpdate = ref(false);

const newTitle = ref("");
const todos = ref([]);
const editingTitle = ref("");
const editingId = ref(null);

// Week management
const weekStartDate = ref(new Date());
const selectedDayIndex = ref(0);

const days = computed(() => {
  const daysArray = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate.value);
    date.setDate(date.getDate() + i);
    daysArray.push(date);
  }
  return daysArray;
});

const selectedDay = computed(() => days.value[selectedDayIndex.value]);

const weekLabel = computed(() => {
  const start = formatDate(days.value[0]);
  const end = formatDate(days.value[6]);
  return `${start} - ${end}`;
});

const currentDayTodos = computed({
  get: () => getTodosForDay(selectedDay.value),
  set: (newValue) => {
    const dateStr = formatDateISO(selectedDay.value);
    todos.value = todos.value.filter((t) => t.todoDate !== dateStr);
    todos.value.push(...newValue);
  },
});

// Helper functions
const formatDate = (date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
};

const formatDateISO = (date) => {
  return date.toISOString().split("T")[0];
};

const getDayName = (date) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
};

const getTodosForDay = (date) => {
  const dateStr = formatDateISO(date);
  return todos.value.filter((todo) => todo.todoDate === dateStr);
};

// Navigation
const selectDay = (index) => {
  selectedDayIndex.value = index;
  showInput.value = false;
  showDel.value = false;
  showUpdate.value = false;
};

const previousWeek = () => {
  const newDate = new Date(weekStartDate.value);
  newDate.setDate(newDate.getDate() - 7);
  weekStartDate.value = newDate;
  fetchTodos();
};

const nextWeek = () => {
  const newDate = new Date(weekStartDate.value);
  newDate.setDate(newDate.getDate() + 7);
  weekStartDate.value = newDate;
  fetchTodos();
};

// CRUD operations with auth
const startEdit = (todo) => {
  editingId.value = todo.id;
  editingTitle.value = todo.title;
};

const saveEdit = async (id) => {
  try {
    const updatedTodo = await $fetch(`http://localhost:5000/api/todos/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: { title: editingTitle.value },
    });

    const index = todos.value.findIndex((t) => t.id === id);
    if (index !== -1) todos.value[index] = updatedTodo;

    editingId.value = null;
    editingTitle.value = "";
  } catch (error) {
    if (error?.statusCode === 401) {
      alert('Session expired. Please login again.');
      handleLogout();
    } else {
      console.error(error);
      alert('Update failed.');
    }
  }
};

const toggleDone = async (todoId) => {
  const todoItem = todos.value.find((t) => t.id === todoId);
  if (!todoItem) return;

  try {
    const updatedTodo = await $fetch(`http://localhost:5000/api/todos/${todoId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: { ...todoItem, done: !todoItem.done },
    });

    const index = todos.value.findIndex((t) => t.id === todoId);
    if (index !== -1) todos.value[index] = updatedTodo;
  } catch (error) {
    if (error?.statusCode === 401) {
      alert('Session expired. Please login again.');
      handleLogout();
    } else {
      console.error(error);
      alert('Toggle failed.');
    }
  }
};

const fetchTodos = async () => {
  try {
    const data = await $fetch("http://localhost:5000/api/todos/week", {
      headers: getAuthHeaders(),
    });
    todos.value = data;
  } catch (error) {
    if (error?.statusCode === 401) {
      alert('Session expired. Please login again.');
      handleLogout();
    } else {
      console.error('Fetch todos error:', error);
    }
  }
};

const addTodo = async () => {
  if (!newTitle.value) return alert("Title required");

  const dateStr = formatDateISO(selectedDay.value);

  try {
    const newTodo = await $fetch("http://localhost:5000/api/todos", {
      method: "POST",
      headers: getAuthHeaders(),
      body: {
        title: newTitle.value,
        done: false,
        todoDate: dateStr
      },
    });

    todos.value.push(newTodo);
    newTitle.value = "";
    showInput.value = false;
  } catch (error) {
    if (error?.statusCode === 401) {
      alert('Session expired. Please login again.');
      handleLogout();
    } else {
      console.error(error);
      alert('Add todo failed.');
    }
  }
};

const delTodo = async (id) => {
  try {
    await $fetch(`http://localhost:5000/api/todos/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    todos.value = todos.value.filter((todo) => todo.id !== id);
    showDel.value = false;
  } catch (error) {
    if (error?.statusCode === 401) {
      alert('Session expired. Please login again.');
      handleLogout();
    } else {
      console.error(error);
      alert('Delete failed.');
    }
  }
};

const saveOrder = async () => {
  console.log("Order saved");
};

/* -----------------------------
   AI Chat (embedded)
   ----------------------------- */

const showChat = ref(false);
const messages = ref([
  {
    role: 'assistant',
    content: 'Сайн байна уу! Би таны todo туслах AI. "10-22нд ус уух" гэх мэт бичээрэй, би todo үүсгэж өгнө. Эсвэл асуулт асуугаарай!'
  }
]);
const userInput = ref('');
const isLoading = ref(false);
const unreadCount = ref(0);
const messagesContainer = ref(null);

const toggleChat = () => {
  showChat.value = !showChat.value;
  if (showChat.value) {
    unreadCount.value = 0;
    nextTick(() => scrollToBottom());
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const formatDateShort = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// ===== STREAMING SEND MESSAGE =====
// ===== STREAMING SEND MESSAGE (FIXED) =====
const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return;

  const userMessage = userInput.value;
  
  // Add user message
  messages.value.push({
    role: 'user',
    content: userMessage
  });

  // Create AI message placeholder
  const aiMessageIndex = messages.value.length;
  messages.value.push({
    role: 'assistant',
    content: '',  // Will be filled word-by-word
    todos: []
  });

  userInput.value = '';
  isLoading.value = true;
  nextTick(() => scrollToBottom());

  try {
    // ===== FETCH WITH STREAMING =====
    const response = await fetch('http://localhost:5000/api/todos/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify({
        message: userMessage,
        conversationHistory: messages.value.slice(1, -1).map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // ===== READ STREAM =====
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('✅ Stream complete');
        break;
      }

      // Decode chunk
      buffer += decoder.decode(value, { stream: true });
      
      // Split by lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            // ===== WORD BY WORD =====
            if (data.type === 'text') {
              messages.value[aiMessageIndex].content += data.content;
              
              // Auto-scroll as text appears
              nextTick(() => scrollToBottom());
            }

            // ===== DONE - EXECUTE ACTION =====
            else if (data.type === 'done') {
              console.log('✅ Action:', data.action);
              console.log('✅ Data:', data);

              // CREATE TODO
              if (data.action === 'create_todo' && data.todos?.length > 0) {
                // ✅ Clear JSON text and show clean message
                messages.value[aiMessageIndex].content = data.message || `${data.todos.length} todo үүслээ!`;
                messages.value[aiMessageIndex].todos = data.todos;
                
                // Add to main list
                todos.value = [...todos.value, ...data.todos];

                // Navigate to todo date
                const firstTodo = data.todos[0];
                const todoDate = new Date(firstTodo.todoDate);
                
                const currentWeekDates = days.value.map(day => formatDateISO(day));
                const isInCurrentWeek = currentWeekDates.includes(firstTodo.todoDate);

                if (!isInCurrentWeek) {
                  const newWeekStart = new Date(todoDate);
                  newWeekStart.setDate(todoDate.getDate() - todoDate.getDay());
                  weekStartDate.value = newWeekStart;
                  await fetchTodos();
                }

                nextTick(() => {
                  const dayIndex = days.value.findIndex(day => 
                    formatDateISO(day) === firstTodo.todoDate
                  );
                  if (dayIndex !== -1) {
                    selectedDayIndex.value = dayIndex;
                  }
                });
              }

              // DELETE TODO
              else if (data.action === 'delete_todo' && data.deletedIds?.length > 0) {
                // ✅ Clear JSON and show clean message
                messages.value[aiMessageIndex].content = data.message || `${data.deletedIds.length} todo устгагдлаа`;
                
                todos.value = todos.value.filter(t => 
                  !data.deletedIds.includes(t.id)
                );
              }

              // UPDATE TODO
              else if (data.action === 'update_todo' && data.updatedTodos?.length > 0) {
                // ✅ Clear JSON and show clean message
                messages.value[aiMessageIndex].content = data.message || `${data.updatedTodos.length} todo шинэчлэгдлээ`;
                
                todos.value = todos.value.map(t => {
                  const updated = data.updatedTodos.find(u => u.id === t.id);
                  return updated ? updated : t;
                });
              }

              // REPLY
              else if (data.action === 'reply') {
                // ✅ Replace JSON with actual message
                if (data.message) {
                  messages.value[aiMessageIndex].content = data.message;
                }
              }
            }

            // ===== ERROR =====
            else if (data.type === 'error') {
              messages.value[aiMessageIndex].content = 
                `❌ Алдаа: ${data.message}`;
            }

          } catch (parseError) {
            console.error('Parse error:', parseError, 'Line:', line);
          }
        }
      }
    }

    // Unread notification
    if (!showChat.value) {
      unreadCount.value++;
    }

  } catch (error) {
    console.error('❌ Streaming error:', error);
    
    if (messages.value[aiMessageIndex]) {
      messages.value[aiMessageIndex].content = 
        'Уучлаарай, холболт тасарлаа. Дахин оролдоно уу.';
    }
  } finally {
    isLoading.value = false;
    nextTick(() => scrollToBottom());
  }
};

// ===== QUICK PROMPT HELPER =====
const quickPrompt = (prompt) => {
  userInput.value = prompt;
  sendMessage();
};

watch(showChat, (newVal) => {
  if (newVal) {
    nextTick(() => scrollToBottom());
  }
});
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

/* ===== STREAMING CURSOR ANIMATION ===== */
.message-text {
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.streaming-cursor {
  display: inline-block;
  animation: blink 0.8s infinite;
  margin-left: 2px;
  color: #667eea;
  font-weight: bold;
}

@keyframes blink {
  0%, 49% { 
    opacity: 1; 
  }
  50%, 100% { 
    opacity: 0; 
  }
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

/* ===== TYPING INDICATOR ===== */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
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
.slide-enter-active, .slide-leave-active {
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
}

</style>