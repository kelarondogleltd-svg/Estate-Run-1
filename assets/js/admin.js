// =====================
// IMPORT FIREBASE
// =====================
import { auth, db } from "./firebase.js";
import { 
  collection, getDocs, updateDoc, doc 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

const storage = getStorage();

// =====================
// LOGGED IN ADMIN EMAIL
// =====================
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "admin-login.html"; // redirect if not logged in
  } else {
    document.getElementById("adminEmail").innerText = user.email;
    loadMessages();
  }
});

// =====================
// LOGOUT FUNCTION
// =====================
window.logout = function() {
  auth.signOut().then(() => {
    window.location.href = "admin-login.html";
  });
};

// =====================
// UPLOAD TENANCY AGREEMENT
// =====================
window.uploadAgreement = async function() {
  const email = document.getElementById("tenantEmail").value;
  const file = document.getElementById("agreementFile").files[0];

  if (!email || !file) {
    alert("Please fill all fields");
    return;
  }

  const fileRef = ref(storage, `agreements/${email}/${file.name}`);
  await uploadBytes(fileRef, file);

  alert("Agreement uploaded successfully");
};

// =====================
// UPLOAD RENT RECEIPT
// =====================
window.uploadReceipt = async function() {
  const email = document.getElementById("receiptTenantEmail").value;
  const month = document.getElementById("receiptMonth").value;
  const file = document.getElementById("receiptFile").files[0];

  if (!email || !month || !file) {
    alert("All fields are required");
    return;
  }

  const fileRef = ref(storage, `receipts/${email}/${month}.pdf`);
  await uploadBytes(fileRef, file);

  alert("Receipt uploaded successfully");
};

// =====================
// LOAD TENANT MESSAGES
// =====================
async function loadMessages() {
  const snapshot = await getDocs(collection(db, "messages"));
  const table = document.getElementById("messageTable");
  table.innerHTML = "";

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    const docId = docSnap.id;

    table.innerHTML += `
      <tr>
        <td>${d.tenantEmail}</td>
        <td>${d.message}</td>
        <td>
          <textarea id="reply-${docId}" placeholder="Write reply">${d.reply ? d.reply : ""}</textarea>
          <button onclick="sendReply('${docId}')">Send</button>
        </td>
      </tr>
    `;
  });
}

// =====================
// SEND REPLY TO TENANT
// =====================
window.sendReply = async function(id) {
  const replyText = document.getElementById(`reply-${id}`).value;
  if (!replyText) return;

  await updateDoc(doc(db, "messages", id), {
    reply: replyText,
    repliedAt: new Date()
  });

  alert("Reply sent successfully");
};
