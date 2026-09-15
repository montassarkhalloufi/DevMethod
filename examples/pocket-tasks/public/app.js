'use strict';
const $ = (selector) => document.querySelector(selector);
let tasks = [],
  filter = 'all',
  busy = false,
  editing = null;
const status = (message) => {
  $('#status').textContent = message;
};
function showError(message, canReload = true) {
  $('#error').textContent = message;
  $('#error').hidden = !message;
  $('#retry').hidden = !message || !canReload;
}
async function api(path = '', options = {}) {
  const response = await fetch(`/api/tasks${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
  });
  if (response.status === 204) return;
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || 'Request failed.');
    error.status = response.status;
    throw error;
  }
  return result;
}
function setBusy(value) {
  busy = value;
  document.querySelectorAll('button,input').forEach((element) => {
    element.disabled = value;
  });
  $('#tasks').setAttribute('aria-busy', String(value));
}
function button(label, action, className = '') {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.className = className;
  element.addEventListener('click', action);
  return element;
}
function cancelEdit(id) {
  editing = null;
  render();
  focusEdit(id);
}
function createEditForm(task) {
  const form = document.createElement('form');
  form.className = 'edit-form';
  const label = document.createElement('label');
  label.htmlFor = 'edit-title';
  label.textContent = 'Edit task title';
  const controls = document.createElement('div');
  controls.className = 'edit-row';
  const input = document.createElement('input');
  input.id = 'edit-title';
  input.value = task.title;
  input.maxLength = 120;
  input.required = true;
  const save = document.createElement('button');
  save.type = 'submit';
  save.textContent = 'Save';
  save.className = 'primary';
  const cancel = button('Cancel', () => cancelEdit(task.id));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    mutate(`/${task.id}`, 'PATCH', { title: input.value }, 'Task updated.', () =>
      focusEdit(task.id),
    );
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') cancelEdit(task.id);
  });
  controls.append(input, save, cancel);
  form.append(label, controls);
  return form;
}
function createTaskToggle(task) {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.done;
  checkbox.setAttribute('aria-label', `Mark ${task.title} ${task.done ? 'active' : 'completed'}`);
  checkbox.addEventListener('change', () =>
    mutate(
      `/${task.id}`,
      'PATCH',
      { done: checkbox.checked },
      task.done ? 'Task reopened.' : 'Task completed.',
      () => {
        const next = document.querySelector(`[data-toggle="${task.id}"]`);
        (next || $('#new-title')).focus();
      },
    ),
  );
  checkbox.dataset.toggle = task.id;
  return checkbox;
}
function createTaskActions(task) {
  const actions = document.createElement('div');
  actions.className = 'actions';
  const edit = button('Edit', () => {
    editing = task.id;
    render();
    $('#edit-title').focus();
  });
  edit.dataset.edit = task.id;
  edit.setAttribute('aria-label', `Edit ${task.title}`);
  const remove = button(
    'Delete',
    () =>
      mutate(`/${task.id}`, 'DELETE', undefined, 'Task deleted.', () => $('#new-title').focus()),
    'delete',
  );
  remove.setAttribute('aria-label', `Delete ${task.title}`);
  actions.append(edit, remove);
  return actions;
}
function createTaskRow(task) {
  const row = document.createElement('li');
  row.className = `task${task.done ? ' done' : ''}`;
  if (editing === task.id) {
    row.append(createEditForm(task));
    return row;
  }
  const checkbox = createTaskToggle(task);
  const title = document.createElement('span');
  title.className = 'task-title';
  title.textContent = task.title;
  const actions = createTaskActions(task);
  row.append(checkbox, title, actions);
  return row;
}
function render() {
  const list = $('#tasks');
  list.replaceChildren();
  const visible = tasks.filter(
    (task) => filter === 'all' || task.done === (filter === 'completed'),
  );
  $('#count').textContent =
    `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} · ${tasks.filter((task) => !task.done).length} active`;
  $('#empty').hidden = visible.length > 0;
  $('#empty').textContent =
    tasks.length === 0 ? 'No tasks yet. Add your first above.' : `No ${filter} tasks.`;
  for (const task of visible) list.append(createTaskRow(task));
  document
    .querySelectorAll('[data-filter]')
    .forEach((element) =>
      element.setAttribute('aria-pressed', String(element.dataset.filter === filter)),
    );
}
function focusEdit(id) {
  (document.querySelector(`[data-edit="${id}"]`) || $('#new-title')).focus();
}
async function mutate(path, method, body, message, focus) {
  if (busy) return;
  setBusy(true);
  showError('');
  status('Saving…');
  try {
    const result = await api(path, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (method === 'POST') {
      tasks.push(result.task);
      $('#new-title').value = '';
    } else if (method === 'PATCH')
      tasks = tasks.map((task) => (task.id === result.task.id ? result.task : task));
    else tasks = tasks.filter((task) => `/${task.id}` !== path);
    editing = null;
    render();
    status(message);
  } catch (error) {
    if (error.status === 404) {
      showError(`${error.message} Reload tasks to refresh the list.`);
      status('Task no longer exists. Reload tasks before making another change.');
      render();
    } else if (error.status >= 400 && error.status < 500) {
      showError(error.message, false);
      status('Change rejected. Correct the input and try again.');
      document.querySelectorAll('[data-toggle]').forEach((checkbox) => {
        checkbox.checked = tasks.find((task) => task.id === checkbox.dataset.toggle).done;
      });
      focus = () => ($('#edit-title') || $('#new-title')).focus();
    } else {
      showError(`${error.message} Reload to check saved state before retrying a change.`);
      status('Change could not be confirmed.');
      render();
    }
  } finally {
    setBusy(false);
    focus?.();
  }
}
async function load() {
  if (busy) return;
  setBusy(true);
  showError('');
  status('Loading tasks…');
  $('#empty').hidden = true;
  try {
    tasks = (await api()).tasks;
    editing = null;
    render();
    status('Tasks loaded.');
  } catch (error) {
    showError(error.message);
    status('Tasks could not be loaded.');
  } finally {
    setBusy(false);
  }
}
$('#add-form').addEventListener('submit', (event) => {
  event.preventDefault();
  mutate('', 'POST', { title: $('#new-title').value }, 'Task added.', () =>
    $('#new-title').focus(),
  );
});
document.querySelectorAll('[data-filter]').forEach((element) =>
  element.addEventListener('click', () => {
    filter = element.dataset.filter;
    editing = null;
    render();
    status(`Showing ${filter} tasks.`);
  }),
);
$('#retry').addEventListener('click', load);
load();
