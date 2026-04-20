const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const counter = document.getElementById('counter');
const clearBtn = document.getElementById('clearBtn');

let todos = JSON.parse(localStorage.getItem('todos')) || [];

function save() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function render() {
    todoList.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        if (todo.done) li.classList.add('done');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.done;
        checkbox.addEventListener('change', () => {
            todos[index].done = checkbox.checked;
            save();
            render();
        });

        const span = document.createElement('span');
        span.textContent = todo.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Sil';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', () => {
            todos.splice(index, 1);
            save();
            render();
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        todoList.appendChild(li);
    });
    counter.textContent = `${todos.length} görev`;
}

function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;
    todos.push({ text, done: false });
    todoInput.value = '';
    save();
    render();
}

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});
clearBtn.addEventListener('click', () => {
    if (todos.length && confirm('Tüm görevler silinsin mi?')) {
        todos = [];
        save();
        render();
    }
});

render();
