// Project name - editable and persistent
let projectName = localStorage.getItem('projectName') || 'Knitting Counter';

function updateProjectName() {
  const nameEl = document.getElementById('project-name');
  nameEl.textContent = projectName;
  document.title = projectName;
}

function editProjectName() {
  const nameEl = document.getElementById('project-name');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'project-name-input';
  input.value = projectName;
  
  const saveName = () => {
    projectName = input.value.trim() || 'Knitting Counter';
    localStorage.setItem('projectName', projectName);
    const span = document.createElement('span');
    span.id = 'project-name';
    span.className = 'project-name';
    span.title = 'Double-click to rename';
    span.textContent = projectName;
    span.ondblclick = editProjectName;
    input.replaceWith(span);
    document.title = projectName;
  };
  
  input.onblur = saveName;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      saveName();
    } else if (e.key === 'Escape') {
      const span = document.createElement('span');
      span.id = 'project-name';
      span.className = 'project-name';
      span.title = 'Double-click to rename';
      span.textContent = projectName;
      span.ondblclick = editProjectName;
      input.replaceWith(span);
    }
  };
  
  nameEl.replaceWith(input);
  input.focus();
  input.select();
}

// Stopwatch - persistent, only goes up
let stopwatchElapsed = parseInt(localStorage.getItem('stopwatchElapsed') || '0');
let stopwatchRunning = localStorage.getItem('stopwatchRunning') === 'true';
let stopwatchStartTime = parseInt(localStorage.getItem('stopwatchStartTime') || '0');
let stopwatchInterval = null;

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
}

function updateStopwatchDisplay() {
  let currentElapsed = stopwatchElapsed;
  if (stopwatchRunning) {
    currentElapsed += Date.now() - stopwatchStartTime;
  }
  document.getElementById('stopwatch-display').textContent = formatTime(currentElapsed);
  document.getElementById('stopwatch-btn').textContent = stopwatchRunning ? 'Stop' : 'Start';
}

function toggleStopwatch() {
  if (stopwatchRunning) {
    // Stop
    stopwatchElapsed += Date.now() - stopwatchStartTime;
    stopwatchRunning = false;
    clearInterval(stopwatchInterval);
    localStorage.setItem('stopwatchElapsed', stopwatchElapsed);
    localStorage.setItem('stopwatchRunning', 'false');
  } else {
    // Start
    stopwatchStartTime = Date.now();
    stopwatchRunning = true;
    localStorage.setItem('stopwatchStartTime', stopwatchStartTime);
    localStorage.setItem('stopwatchRunning', 'true');
    stopwatchInterval = setInterval(updateStopwatchDisplay, 1000);
  }
  updateStopwatchDisplay();
}

// Load saved progress - migrate old format if needed
let rows = JSON.parse(localStorage.getItem('rows') || 'null');
if (!rows) {
  rows = [{ name: 'Row 1', count: 0 }];
} else if (typeof rows[0] === 'number') {
  // Migrate old format (array of numbers) to new format (array of objects)
  rows = rows.map((count, i) => ({ name: `Row ${i + 1}`, count }));
}

let draggedIndex = null;

function updateDisplay() {
  const container = document.getElementById('rows-container');
  container.innerHTML = '';
  
  rows.forEach((row, index) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row-container';
    rowDiv.draggable = true;
    rowDiv.dataset.index = index;
    
    // Drag events
    rowDiv.ondragstart = (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index);
      rowDiv.classList.add('dragging');
      draggedIndex = index;
    };
    rowDiv.ondragend = () => {
      rowDiv.classList.remove('dragging');
      draggedIndex = null;
      document.querySelectorAll('.row-container').forEach(el => el.classList.remove('drag-over'));
    };
    rowDiv.ondragover = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const target = e.currentTarget;
      document.querySelectorAll('.row-container').forEach(el => el.classList.remove('drag-over'));
      if (draggedIndex !== index) {
        target.classList.add('drag-over');
      }
    };
    rowDiv.ondragleave = () => {
      rowDiv.classList.remove('drag-over');
    };
    rowDiv.ondrop = (e) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const toIndex = index;
      if (fromIndex !== toIndex) {
        moveRow(fromIndex, toIndex);
      }
      document.querySelectorAll('.row-container').forEach(el => el.classList.remove('drag-over'));
    };
    
    // Drag handle
    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '☰';
    dragHandle.title = 'Drag to reorder';
    
    const label = document.createElement('span');
    label.className = 'row-label';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'row-name';
    nameSpan.textContent = row.name;
    nameSpan.title = 'Double-click to rename';
    nameSpan.ondblclick = () => editRowName(index, nameSpan);
    
    const countSpan = document.createElement('span');
    countSpan.className = 'row-count';
    countSpan.textContent = `: ${row.count}`;
    countSpan.title = 'Double-click to edit';
    countSpan.ondblclick = () => editRowCount(index, countSpan);
    
    label.appendChild(nameSpan);
    label.appendChild(countSpan);
    
    const countControls = document.createElement('div');
    countControls.className = 'row-controls';
    
    const plusBtn = document.createElement('button');
    plusBtn.textContent = '+1';
    plusBtn.onclick = () => changeCount(index, 1);
    
    const minusBtn = document.createElement('button');
    minusBtn.textContent = '-1';
    minusBtn.onclick = () => changeCount(index, -1);
    
    countControls.appendChild(plusBtn);
    countControls.appendChild(minusBtn);
    
    const rowControls = document.createElement('div');
    rowControls.className = 'row-controls';
    
    const addRowBtn = document.createElement('button');
    addRowBtn.textContent = '+ Row';
    addRowBtn.onclick = () => addRow(index);
    
    const removeRowBtn = document.createElement('button');
    removeRowBtn.textContent = '- Row';
    removeRowBtn.onclick = () => removeRow(index);
    removeRowBtn.disabled = rows.length <= 1;
    
    rowControls.appendChild(addRowBtn);
    rowControls.appendChild(removeRowBtn);
    
    rowDiv.appendChild(dragHandle);
    rowDiv.appendChild(label);
    rowDiv.appendChild(countControls);
    rowDiv.appendChild(rowControls);
    container.appendChild(rowDiv);
  });
}

function moveRow(fromIndex, toIndex) {
  const [movedRow] = rows.splice(fromIndex, 1);
  rows.splice(toIndex, 0, movedRow);
  saveAndUpdate();
}

function editRowName(index, nameSpan) {
  const currentName = rows[index].name;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'row-name-input';
  input.value = currentName;
  
  const saveName = () => {
    const newName = input.value.trim() || `Row ${index + 1}`;
    rows[index].name = newName;
    saveAndUpdate();
  };
  
  input.onblur = saveName;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      saveName();
    } else if (e.key === 'Escape') {
      updateDisplay();
    }
  };
  
  nameSpan.replaceWith(input);
  input.focus();
  input.select();
}

function editRowCount(index, countSpan) {
  const currentCount = rows[index].count;
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'row-count-input';
  input.value = currentCount;
  input.min = '0';
  
  const saveCount = () => {
    const newCount = parseInt(input.value) || 0;
    rows[index].count = Math.max(0, newCount);
    saveAndUpdate();
  };
  
  input.onblur = saveCount;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      saveCount();
    } else if (e.key === 'Escape') {
      updateDisplay();
    }
  };
  
  countSpan.replaceWith(input);
  input.focus();
  input.select();
}

function changeCount(index, delta) {
  rows[index].count += delta;
  if (rows[index].count < 0) rows[index].count = 0;
  saveAndUpdate();
}

function addRow(index) {
  const newRowNum = rows.length + 1;
  rows.splice(index + 1, 0, { name: `Row ${newRowNum}`, count: 0 });
  saveAndUpdate();
}

function removeRow(index) {
  if (rows.length > 1) {
    rows.splice(index, 1);
    saveAndUpdate();
  }
}

function saveAndUpdate() {
  localStorage.setItem('rows', JSON.stringify(rows));
  updateDisplay();
}

// Initialize app
function init() {
  // Initialize project name
  updateProjectName();
  document.getElementById('project-name').ondblclick = editProjectName;

  // Initialize stopwatch
  if (stopwatchRunning) {
    stopwatchInterval = setInterval(updateStopwatchDisplay, 1000);
  }
  updateStopwatchDisplay();

  // Initialize rows display
  updateDisplay();

  // Register service worker for offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
}

// Run init when DOM is ready
document.addEventListener('DOMContentLoaded', init);
