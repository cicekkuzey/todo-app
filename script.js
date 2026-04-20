const SUPABASE_URL = 'https://thxcjhvqlszjnedhfbpc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoeGNqaHZxbHN6am5lZGhmYnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NzQzMTMsImV4cCI6MjA5MjI1MDMxM30.PpUMy1IOh1qjgUaNH8ZEcG6ima8b5jFbbq8DHnHPCzY';

let accessToken = null;
let currentUser = null;

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation'
    };
}

// --- Auth ---
async function signUp(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || 'Kayıt başarısız');
    if (!data.access_token) throw new Error('E-posta doğrulaması gerekiyor. Lütfen e-postanı kontrol et.');
    return data;
}

async function signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || 'Giriş başarısız');
    return data;
}

async function refreshSession(refreshToken) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!res.ok) return null;
    return res.json();
}

async function signOut() {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${accessToken}` }
    });
    localStorage.removeItem('sb_session');
}

function saveSession(data) {
    localStorage.setItem('sb_session', JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user
    }));
}

// --- Todos ---
async function fetchTodos() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/todos?order=created_at.asc`, { headers: authHeaders() });
    return res.json();
}

async function insertTodo(text) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/todos`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ text, done: false, user_id: currentUser.id })
    });
    const data = await res.json();
    return data[0];
}

async function updateTodo(id, done) {
    await fetch(`${SUPABASE_URL}/rest/v1/todos?id=eq.${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ done })
    });
}

async function deleteTodo(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/todos?id=eq.${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
}

async function deleteAllTodos() {
    await fetch(`${SUPABASE_URL}/rest/v1/todos?user_id=eq.${currentUser.id}`, {
        method: 'DELETE',
        headers: authHeaders()
    });
}

// --- Render ---
function render(todos) {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';
    todos.forEach((todo) => {
        const li = document.createElement('li');
        if (todo.done) li.classList.add('done');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.done;
        checkbox.addEventListener('change', async () => {
            await updateTodo(todo.id, checkbox.checked);
            await loadAndRender();
        });

        const span = document.createElement('span');
        span.textContent = todo.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Sil';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', async () => {
            await deleteTodo(todo.id);
            await loadAndRender();
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        todoList.appendChild(li);
    });
    document.getElementById('counter').textContent = `${todos.length} görev`;
}

async function loadAndRender() {
    const todos = await fetchTodos();
    render(todos);
}

// --- UI helpers ---
function showApp(user) {
    currentUser = user;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.remove('hidden');
    loadAndRender();
}

function showAuth() {
    accessToken = null;
    currentUser = null;
    document.getElementById('appContainer').classList.add('hidden');
    document.getElementById('authContainer').classList.remove('hidden');
}

function setAuthError(msg) {
    const el = document.getElementById('authError');
    el.textContent = msg;
    el.classList.remove('hidden');
}

function clearAuthError() {
    const el = document.getElementById('authError');
    el.textContent = '';
    el.classList.add('hidden');
}

// --- Auth tabs ---
let isLogin = true;

document.getElementById('loginTab').addEventListener('click', () => {
    isLogin = true;
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
    document.getElementById('authSubmitBtn').textContent = 'Giriş Yap';
    clearAuthError();
});

document.getElementById('registerTab').addEventListener('click', () => {
    isLogin = false;
    document.getElementById('registerTab').classList.add('active');
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('authSubmitBtn').textContent = 'Kayıt Ol';
    clearAuthError();
});

document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthError();
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const btn = document.getElementById('authSubmitBtn');
    btn.disabled = true;
    try {
        const data = isLogin ? await signIn(email, password) : await signUp(email, password);
        accessToken = data.access_token;
        saveSession(data);
        showApp(data.user);
    } catch (err) {
        setAuthError(err.message);
    } finally {
        btn.disabled = false;
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut();
    showAuth();
});

// --- Todo events ---
async function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    await insertTodo(text);
    await loadAndRender();
}

document.getElementById('addBtn').addEventListener('click', addTodo);
document.getElementById('todoInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});
document.getElementById('clearBtn').addEventListener('click', async () => {
    const todos = await fetchTodos();
    if (todos.length && confirm('Tüm görevler silinsin mi?')) {
        await deleteAllTodos();
        await loadAndRender();
    }
});

// --- Init: oturumu geri yükle ---
(async () => {
    const saved = localStorage.getItem('sb_session');
    if (!saved) return;
    try {
        const session = JSON.parse(saved);
        const data = await refreshSession(session.refresh_token);
        if (!data || !data.access_token) {
            localStorage.removeItem('sb_session');
            return;
        }
        accessToken = data.access_token;
        saveSession(data);
        showApp(data.user);
    } catch {
        localStorage.removeItem('sb_session');
    }
})();
