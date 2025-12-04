<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6 text-center">Login</h1>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-blue-300"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-blue-300"
          />
        </div>

        <button
          type="submit"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition"
        >
          Login
        </button>

        <p class="text-sm text-center mt-3">
          Don’t have an account?
          <NuxtLink to="/signup" class="text-blue-500 hover:underline">Sign up</NuxtLink>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const email = ref('');
const password = ref('');
const router = useRouter();

const handleLogin = async () => {
  const query = `
    mutation LoginUser($input: LoginUserInput!) {
      loginUser(input: $input) {
        token
        user {
          id
          email
        }
      }
    }
  `;

  const variables = {
    input: {
      email: email.value,
      password: password.value,
    },
  };

  try {
    const response = await $fetch('http://localhost:5000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = response.data?.loginUser || response.loginUser;

    if (!data?.token) throw new Error('Invalid credentials');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    alert('✅ Login successful!');
    router.push('/');
  } catch (error) {
    console.error(error);
    alert(error.data?.message || '❌ Login failed');
  }
};
</script>

  
  <style scoped>
  .auth-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
  }
  
  .auth-card {
    background: white;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 400px;
  }
  
  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 30px;
    font-size: 28px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  label {
    display: block;
    margin-bottom: 8px;
    color: #555;
    font-weight: 500;
  }
  
  input {
    width: 100%;
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    font-size: 16px;
    transition: border-color 0.3s;
    box-sizing: border-box;
  }
  
  input:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .submit-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .submit-btn:hover {
    transform: translateY(-2px);
  }
  
  .toggle-text {
    text-align: center;
    margin-top: 20px;
    color: #666;
  }
  
  .toggle-text a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
  }
  
  .toggle-text a:hover {
    text-decoration: underline;
  }
  </style>