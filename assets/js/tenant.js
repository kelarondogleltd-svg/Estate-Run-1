import { auth, db, storage } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import {
  listAll,
  ref,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";
import { Chart } from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.esm.js";

// ------------------
// GLOBAL STATE
// ------------------
let rentChartInstance = null;
let maintenanceChartInstance = null;
let initialized = false;

// ------------------
// DOM READY
// ------------------
document.addEventListener("DOMContentLoaded", () => {

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "tenant-login.html";
      return;
    }

    // Prevent re-initialization
    if (initialized) return;
    initialized = true;

    const email = user.email;

    await loadRentHistory(email);
    await loadAdminReplies(email);
    await loadReceipts(email);
    await renderMaintenanceChart(email);
  });

});

// ------------------
// RENT HISTORY
// ------------------
async function loadRentHistory(email) {
  const table = document.getElementById("rentHistory");
  if (!table) return;

  const q = query(
    collection(db, "rentPayments"),
    where("tenantEmail", "==", email)
  );

  const snap = await getDocs(q);
  table.innerHTML = "";

  const months = [];
  const amounts = [];

  snap.forEach(d => {
    const r = d.data();

    table.innerHTML += `
      <tr>
        <td>${r.month || "-"}</td>
        <td>K ${r.amount || 0}</td>
        <td>${r.status || "Pending"}</td>
      </tr>
    `;

    if (r.status === "Paid") {
      months.push(r.month);
      amounts.push(r.amount);
    }
  });

  if (months.length) drawRentChart(months, amounts);
}

// ------------------
// RENT CHART
// ------------------
function drawRentChart(months, amounts) {
  const canvas = document.getElementById("rentChart");
  if (!canvas) return;

  if (rentChartInstance) {
    rentChartInstance.data.labels = months;
    rentChartInstance.data.datasets[0].data = amounts;
    rentChartInstance.update();
    return;
  }

  rentChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: months,
      datasets: [{
        label: "Rent Paid (K)",
        data: amounts
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// ------------------
// ADMIN REPLIES
// ------------------
async function loadAdminReplies(email) {
  const list = document.getElementById("adminReplies");
  if (!list) return;

  const q = query(
    collection(db, "messages"),
    where("tenantEmail", "==", email)
  );

  const snap = await getDocs(q);
  list.innerHTML = "";

  snap.forEach(d => {
    const m = d.data();
    if (m.reply) {
      list.innerHTML += `<li><strong>Admin:</strong> ${m.reply}</li>`;
    }
  });

  if (!list.innerHTML) {
    list.innerHTML = "<li>No replies yet</li>";
  }
}

// ------------------
// MAINTENANCE CHART
// ------------------
async function renderMaintenanceChart(email) {
  const canvas = document.getElementById("maintenanceChart");
  if (!canvas) return;

  const q = query(
    collection(db, "maintenanceReports"),
    where("tenantEmail", "==", email)
  );

  const snap = await getDocs(q);

  const stats = {
    Pending: 0,
    "In Progress": 0,
    Completed: 0
  };

  snap.forEach(d => {
    const s = d.data().status || "Pending";
    if (stats[s] !== undefined) stats[s]++;
  });

  if (maintenanceChartInstance) {
    maintenanceChartInstance.data.datasets[0].data = Object.values(stats);
    maintenanceChartInstance.update();
    return;
  }

  maintenanceChartInstance = new Chart(canvas, {
    type: "pie",
    data: {
      labels: Object.keys(stats),
      datasets: [{
        data: Object.values(stats)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// ------------------
// RECEIPTS
// ------------------
async function loadReceipts(email) {
  const list = document.getElementById("receiptList");
  if (!list) return;

  list.innerHTML = "<li>Loading receipts...</li>";

  try {
    const folder = ref(storage, `receipts/${email}`);
    const res = await listAll(folder);

    list.innerHTML = "";

    for (const item of res.items) {
      const url = await getDownloadURL(item);
      list.innerHTML += `
        <li>
          <a href="${url}" target="_blank">${item.name}</a>
        </li>
      `;
    }

    if (!res.items.length) {
      list.innerHTML = "<li>No receipts uploaded</li>";
    }

  } catch {
    list.innerHTML = "<li>No receipts uploaded</li>";
  }
}


