import { auth, db, storage } from "./firebase.js";
import { collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { ref, uploadBytes } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

// Display admin email
auth.onAuthStateChanged(user => {
  if (!user) window.location.href = "admin-login.html";
  else document.getElementById("adminEmail").innerText = user.email;
  loadMessages();
});

window.logout = function() {
  auth.signOut().then(() => window.location.href="admin-login.html");
};

window.uploadAgreement = async function() {
  const email = document.getElementById("tenantEmail").value;
  const file = document.getElementById("agreementFile").files[0];
  if(!email || !file){ alert("All fields required"); return; }
  const fileRef = ref(storage, `agreements/${email}/${file.name}`);
  await uploadBytes(fileRef, file);
  alert("Agreement uploaded successfully");
};

window.uploadReceipt = async function() {
  const email = document.getElementById("receiptTenantEmail").value;
  const month = document.getElementById("receiptMonth").value;
  const file = document.getElementById("receiptFile").files[0];
  if(!email || !month || !file){ alert("All fields required"); return; }
  const fileRef = ref(storage, `receipts/${email}/${month}.pdf`);
  await uploadBytes(fileRef, file);
  alert("Receipt uploaded successfully");
};

async function loadMessages() {
  const snapshot = await getDocs(collection(db, "messages"));
  const table = document.getElementById("messageTable");
  table.innerHTML = "";
  snapshot.forEach(docSnap=>{
    const d=docSnap.data(); const id=docSnap.id;
    table.innerHTML+=`
      <tr>
        <td>${d.tenantEmail}</td>
        <td>${d.message}</td>
        <td>
          <textarea id="reply-${id}" placeholder="Write reply">${d.reply?d.reply:""}</textarea>
          <button onclick="sendReply('${id}')">Send</button>
        </td>
      </tr>`;
  });
}

window.sendReply = async function(id){
  const replyText=document.getElementById(`reply-${id}`).value;
  if(!replyText) return;
  await updateDoc(doc(db,"messages",id),{ reply: replyText, repliedAt: new Date() });
  alert("Reply sent successfully");
};
