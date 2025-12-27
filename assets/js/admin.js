import { auth, db, storage } from "./firebase.js";
import { collection, getDocs, updateDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { ref, uploadBytes } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";
import { Chart } from "https://cdn.jsdelivr.net/npm/chart.js";

// ----------------------------
// Display logged-in admin email
// ----------------------------
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "admin-login.html";
    return;
  }
  document.getElementById("adminEmail").innerText = user.email;

  // Load sections
  await loadMessages();
  await renderMaintenanceChart();
  await renderRentChart();
});

// ----------------------------
// Logout function
// ----------------------------
window.logout = function () {
  auth.signOut().then(() => window.location.href = "admin-login.html");
};

// ----------------------------
// Upload Tenancy Agreement
// ----------------------------
window.uploadAgreement = async function () {
  const email = document.getElementById("tenantEmail").value;
  const file = document.getElementById("agreementFile").files[0];

  if (!email || !file) {
    alert("All fields required");
    return;
  }

  try {
    const fileRef = ref(storage, `agreements/${email}/${file.name}`);
    await uploadBytes(fileRef, file);
    alert("Agreement uploaded successfully");
  } catch (error) {
    console.error("Error uploading agreement:", error);
    alert("Error uploading agreement. Check console.");
  }
};

// ----------------------------
// Upload Rent Receipt
// ----------------------------
window.uploadReceipt = async function () {
  const email = document.getElementById("receiptTenantEmail").value;
  const month = document.getElementById("receiptMonth").value;
  const file = document.getElementById("receiptFile").files[0];

  if (!email || !month || !file) {
    alert("All fields required");
    return;
  }

  try {
    const fileRef = ref(storage, `receipts/${email}/${month}.pdf`);
    await uploadBytes(fileRef, file);
    alert("Receipt uploaded successfully");
  } catch (error) {
    console.error("Error uploading receipt:", error);
    alert("Error uploading receipt. Check console.");
  }
};

// ----------------------------
// Load Tenant Messages
// ----------------------------
async function loadMessages() {
  try {
    const snapshot = await getDocs(collection(db, "messages"));
    const table = document.getElementById("messageTable");
    table.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const docId = docSnap.id;

      table.innerHTML += `
        <tr>
          <td>${d.tenantEmail || "N/A"}</td>
          <td>${d.message || "N/A"}</td>
          <td>
            <textarea id="reply-${docId}" placeholder="Write reply">${d.reply ? d.reply : ""}</textarea>
            <button onclick="sendReply('${docId}')">Send</button>
          </td>
        </tr>`;
    });

    if (snapshot.empty) {
      table.innerHTML = `<tr><td colspan="3">No messages found</td></tr>`;
    }
  } catch (error) {
    console.error("Error loading messages:", error);
  }
}

// ----------------------------
// Send Reply
// ----------------------------
window.sendReply = async function (id) {
  try {
    const replyText = document.getElementById(`reply-${id}`).value;
    if (!replyText) return;

    await updateDoc(doc(db, "messages", id), {
      reply: replyText,
      repliedAt: new Date(),
    });

    alert("Reply sent successfully");
  } catch (error) {
    console.error("Error sending reply:", error);
    alert("Error sending reply. Check console.");
  }
};

// ----------------------------
// Maintenance Chart
// ----------------------------
async function renderMaintenanceChart() {
  try {
    const snapshot = await getDocs(collection(db, "maintenanceReports"));
    const stats = { Pending: 0, "In Progress": 0, Completed: 0 };

    snapshot.forEach((docSnap) => {
      const status = docSnap.data().status || "Pending";
      if (stats[status] !== undefined) stats[status]++;
    });

    const ctx = document.getElementById("maintenanceChartAdmin");
    if (ctx) {
      new Chart(ctx, {
        type: "pie",
        data: {
          labels: Object.keys(stats),
          datasets: [{ data: Object.values(stats), backgroundColor: ["#f39c12","#3498db","#2ecc71"] }],
        },
      });
    }
  } catch (error) {
    console.error("Error rendering maintenance chart:", error);
  }
}

// ----------------------------
// Rent Chart
// ----------------------------
async function renderRentChart() {
  try {
    const snapshot = await getDocs(collection(db, "rentPayments"));
    const months = [];
    const amounts = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === "Paid") {
        months.push(data.month || "N/A");
        amounts.push(data.amount || 0);
      }
    });

    const ctx = document.getElementById("rentChartAdmin");
    if (ctx) {
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: months,
          datasets: [{
            label: "Rent Paid (K)",
            data: amounts,
            backgroundColor: "#2ecc71",
          }],
        },
      });
    }
  } catch (error) {
    console.error("Error rendering rent chart:", error);
  }
}
