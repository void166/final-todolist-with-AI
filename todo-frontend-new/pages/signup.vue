<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Sign Up</h1>
      <form @submit.prevent="handleSignup">
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="Enter your email" required />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="Create a password" required />
        </div>

        <div class="form-group">
          <label>Confirm Password</label>
          <input v-model="confirmPassword" type="password" placeholder="Confirm your password" required />
        </div>

        <button type="submit" class="submit-btn">Sign Up</button>
        <p class="toggle-text">
          Already have an account? <NuxtLink to="/login">Login</NuxtLink>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const router = useRouter()

const handleSignup = async () => {
  if (password.value !== confirmPassword.value) {
    return alert('Passwords do not match!')
  }

  if (password.value.length < 6) {
    return alert('Password must be at least 6 characters')
  }

  try {
    const query = `
      mutation CreateUser($input: AddUserInput!) {
        createUser(input: $input) {
          token
          user {
            id
            email
          }
        }
      }
    `

    const variables = {
      input: {
        email: email.value,
        password: password.value,
      },
    }

    const res = await $fetch('http://localhost:5000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { query, variables },
    })

    if (res.errors) {
      throw new Error(res.errors[0].message)
    }

    alert('Signup successful! Please login.')
    router.push('/login')
  } catch (err) {
    alert(err.message || 'Signup failed')
  }
}
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