import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

/* =========================
   FIREBASE CONFIG
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyCqWIGZcZK-eSBYADas0HcK-vP6M7stROE",
  authDomain: "kelarondogleweb.firebaseapp.com",
  projectId: "kelarondogleweb",
  storageBucket: "kelarondogleweb.firebasestorage.app",
  messagingSenderId: "53900919628",
  appId: "1:53900919628:web:5ebb7dcf15d20cbef885e9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* =========================
   AUTH CHECK
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "tenant-login.html";
    return;
  }

  document.getElementById("tenantEmail").innerText = user.email;

  loadMaintenanceHistory(user.email);
  loadAgreement(user.email);
});

/* =========================
   SUBMIT MAINTENANCE
========================= */
window.submitMaintenance = async function () {
  const issue = document.getElementById("issue").value;
  const file = document.getElementById("photo").files[0];
  const user = auth.currentUser;

  if (!issue) {
    alert("Please describe the issue");
    return;
  }

  let photoURL = "";

  if (file) {
    const photoRef = ref(storage, `maintenance/${user.email}/${Date.now()}`);
    await uploadBytes(photoRef, file);
    photoURL = await getDownloadURL(photoRef);
  }

  await addDoc(collection(db, "maintenanceReports"), {
    tenantEmail: user.email,
    issue: issue,
    photo: photoURL,
    status: "Pending",
    createdAt: new Date()
  });

  alert("Maintenance report submitted");
  document.getElementById("issue").value = "";
  document.getElementById("photo").value = "";
};

/* =========================
   LOAD MAINTENANCE HISTORY
========================= */
async function loadMaintenanceHistory(email) {
  const q = query(
    collection(db, "maintenanceReports"),
    where("tenantEmail", "==", email)
  );

  const snapshot = await getDocs(q);
  const list = document.getElementById("maintenanceHistory");
  list.innerHTML = "";

  snapshot.forEach(doc => {
    const d = doc.data();
    list.innerHTML += `
      <li>
        <strong>${d.issue}</strong><br>
        Status: ${d.status}
      </li>
    `;
  });
}

/* =========================
   LOAD TENANCY AGREEMENT
========================= */
async function loadAgreement(email) {
  try {
    const fileRef = ref(storage, `agreements/${email}.pdf`);
    const url = await getDownloadURL(fileRef);
    document.getElementById("agreementLink").href = url;
  } catch {
    document.getElementById("agreementLink").innerText = "Agreement not uploaded yet";
  }
}

/* =========================
   SEND MESSAGE TO ADMIN
========================= */
window.sendMessage = async function () {
  const message = document.getElementById("messageText").value;
  const user = auth.currentUser;

  if (!message) return;

  await addDoc(collection(db, "messages"), {
    tenantEmail: user.email,
    message: message,
    createdAt: new Date(),
    read: false
  });

  alert("Message sent to admin");
  document.getElementById("messageText").value = "";
};

/* =========================
   LOGOUT
========================= */
window.logout = async function () {
  await signOut(auth);
  window.location.href = "tenant-login.html";
};
import { Chart } from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.esm.js";

/* =========================
   LOAD RENT HISTORY
========================= */
async function loadRentHistory(email) {
  const q = query(
    collection(db, "rentPayments"),
    where("tenantEmail", "==", email)
  );

  const snapshot = await getDocs(q);
  const table = document.getElementById("rentHistory");
  table.innerHTML = "";

  let paidMonths = [];
  let paidAmounts = [];

  snapshot.forEach(docSnap => {
    const d = docSnap.data();

    table.innerHTML += `
      <tr>
        <td>${d.month}</td>
        <td>K ${d.amount}</td>
        <td>${d.status}</td>
      </tr>
    `;

    if (d.status === "Paid") {
      paidMonths.push(d.month);
      paidAmounts.push(d.amount);
    }
  });

  renderRentChart(paidMonths, paidAmounts);
}

/* =========================
   LOAD ADMIN REPLIES
========================= */
async function loadAdminReplies(email) {
  const q = query(
    collection(db, "messages"),
    where("tenantEmail", "==", email)
  );

  const snapshot = await getDocs(q);
  const list = document.getElementById("adminReplies");
  list.innerHTML = "";

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    if (d.reply) {
      list.innerHTML += `
        <li>
          <strong>Admin:</strong> ${d.reply}
        </li>
      `;
    }
  });
}

/* =========================
   DASHBOARD CHARTS
========================= */
function renderRentChart(months, amounts) {
  const ctx = document.getElementById("rentChart");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: months,
      datasets: [{
        label: "Rent Paid (K)",
        data: amounts
      }]
    }
  });
}

async function renderMaintenanceChart(email) {
  const q = query(
    collection(db, "maintenanceReports"),
    where("tenantEmail", "==", email)
  );

  const snapshot = await getDocs(q);
  const stats = { Pending: 0, "In Progress": 0, Completed: 0 };

  snapshot.forEach(docSnap => {
    stats[docSnap.data().status]++;
  });

  new Chart(document.getElementById("maintenanceChart"), {
    type: "pie",
    data: {
      labels: Object.keys(stats),
      datasets: [{
        data: Object.values(stats)
      }]
    }
  });
}

/* =========================
   EXTEND AUTH CALLBACK
========================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  loadRentHistory(user.email);
  loadAdminReplies(user.email);
  renderMaintenanceChart(user.email);
});
