const SUPABASE_URL = 'https://thxcjhvqlszjnedhfbpc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoeGNqaHZxbHN6am5lZGhmYnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NzQzMTMsImV4cCI6MjA5MjI1MDMxM30.PpUMy1IOh1qjgUaNH8ZEcG6ima8b5jFbbq8DHnHPCzY';

const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=representation'
};

const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const counter = document.getElementById('counter');
const clearBtn = document.getElementById('clearBtn');

async function fetchTodos() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/todos?order=created_at.asc`, { headers });
    return res.json();
}

async function insertTodo(text) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/todos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, done: false })
    });
    const data = await res.json();
    return data[0];
}

async function updateTodo(id, done) {
    await fetch(`${SUPABASE_URL}/rest/v1/todos?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ done })
    });
}

async function deleteTodo(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/todos?id=eq.${id}`, {
        method: 'DELETE',
        headers
    });
}

async function deleteAllTodos() {
    await fetch(`${SUPABASE_URL}/rest/v1/todos?id=neq.0`, {
        method: 'DELETE',
        headers
    });
}

function render(todos) {
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
    counter.textContent = `${todos.length} görev`;
}

async function loadAndRender() {
    const todos = await fetchTodos();
    render(todos);
}

async function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;
    todoInput.value = '';
    await insertTodo(text);
    await loadAndRender();
}

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});
clearBtn.addEventListener('click', async () => {
    const todos = await fetchTodos();
    if (todos.length && confirm('Tüm görevler silinsin mi?')) {
        await deleteAllTodos();
        await loadAndRender();
    }
});

loadAndRender();
