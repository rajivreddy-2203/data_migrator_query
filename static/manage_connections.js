function escapeHTML(s) {
  return (''+s).replace(/[&<>"'`]/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'
  }[c]));
}
function escapeAttr(s) { return escapeHTML(s).replace(/"/g,'&quot;'); }

function fetchConnections() {
  fetch('/api/connections')
    .then(resp => resp.json())
    .then(cons => {
      let tbody = document.querySelector('#connTable tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      let empty = true;
      Object.entries(cons).forEach(([type, dbs]) => {
        Object.entries(dbs).forEach(([name, details]) => {
          empty = false;
          let tr = document.createElement('tr');
          // Render details as a tidy table, not raw JSON
          let detailRows = "";
          Object.entries(details).forEach(([k, v]) =>
            detailRows += `<tr><td style="font-weight:600;padding-right:4px;color:#357cf9;">${escapeHTML(k)}:</td><td>${escapeHTML(v)}</td></tr>`
          );
          tr.innerHTML = `
            <td>${escapeHTML(name)}</td>
            <td>${escapeHTML(type)}</td>
            <td><table class="details-table">${detailRows}</table></td>
            <td class="action-btns">
              <button class="btn edit-btn" type="button" onclick="editConn('${escapeAttr(type)}', '${escapeAttr(name)}')">Edit</button>
              <button class="btn delete-btn" type="button" onclick="delConn('${escapeAttr(name)}')">Delete</button>
            </td>`;
          tbody.appendChild(tr);
        });
      });
      if (empty) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#8b92ad;">No connections found.</td></tr>`;
      }
    });
}

// Show fields dynamically after db_type selection
function showFields() {
  let db_type = document.getElementById('db_type').value;
  let fieldsDiv = document.getElementById('fields');
  let html = '';
  if (db_type === "oracle") {
    html = `
      <label>User id:</label><input id="user" required autocomplete="new-password"><br>
      <label>Password:</label><input id="password" type="password" required autocomplete="new-password"><br>
      <label>DSN: </label><input id="dsn" required><br>
      <small>(e.g., "localhost:port/sid or service name")</small>
    `;
  } else if (["postgresql", "mysql", "sqlserver"].includes(db_type)) {
    html = `
      <label>User id:</label><input id="user" required autocomplete="new-password"><br>
      <label>Password:</label><input id="password" type="password" required autocomplete="new-password"><br>
      <label>Host:</label><input id="host" required><br>
      <label>Port:</label><input id="port" required><br>
      <label>Database:</label><input id="database" required><br>
    `;
  } else {
    html = '';
  }
  fieldsDiv.innerHTML = html;
}

// Delete
function delConn(name) {
  if (confirm('Delete connection ' + name + '?')) {
    fetch('/api/connections?name=' + encodeURIComponent(name), { method: 'DELETE' })
      .then(() => fetchConnections());
  }
}

// Edit
function editConn(db_type, name) {
  fetch('/api/connections')
    .then(r => r.json())
    .then(cons => {
      const details = cons[db_type][name];
      document.getElementById('name').value = name;
      document.getElementById('db_type').value = db_type;
      showFields();
      setTimeout(() => {
        Object.entries(details).forEach(([k,v]) => {
          if (document.getElementById(k)) document.getElementById(k).value = v;
        });
        document.getElementById('name').readOnly = true;
        document.getElementById('db_type').disabled = true;
      }, 10);
    });
}

// Reset
function resetForm() {
  document.getElementById('connForm').reset();
  document.getElementById('fields').innerHTML = '';
  document.getElementById('name').readOnly = false;
  document.getElementById('db_type').disabled = false;
}

// Add event for type selection (fix: ensures changing type shows fields)
document.getElementById('db_type').addEventListener('change', showFields);

// Reset button handler
document.getElementById('resetConnBtn').onclick = resetForm;

// Save (Add/Edit)
document.getElementById('connForm').onsubmit = function(e) {
  e.preventDefault();
  let db_type = document.getElementById('db_type').value;
  let name = document.getElementById('name').value;
  let details = {};
  if (db_type === "oracle") {
    details.user = document.getElementById('user').value;
    details.password = document.getElementById('password').value;
    details.dsn = document.getElementById('dsn').value;
  } else {
    details.user = document.getElementById('user').value;
    details.password = document.getElementById('password').value;
    details.host = document.getElementById('host').value;
    details.port = document.getElementById('port').value;
    details.database = document.getElementById('database').value;
  }
  fetch('/api/connections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, db_type, details })
  }).then(() => { resetForm(); fetchConnections(); });
};

// Load connections on page load
window.onload = fetchConnections;
