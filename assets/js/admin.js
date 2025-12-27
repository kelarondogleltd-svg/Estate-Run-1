import { collection, getDocs, updateDoc, doc } from
"https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* =========================
   LOAD TENANT MESSAGES
========================= */
async function loadMessages() {
  const snapshot = await getDocs(collection(db, "messages"));
  const table = document.getElementById("messageTable");
  table.innerHTML = "";

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    table.innerHTML += `
      <tr>
        <td>${d.tenantEmail}</td>
        <td>${d.message}</td>
        <td>
          <textarea id="reply-${docSnap.id}" placeholder="Write reply"></textarea>
          <button onclick="sendReply('${docSnap.id}')">Send</button>
        </td>
      </tr>
    `;
  });
}

window.sendReply = async function(id) {
  const replyText = document.getElementById(`reply-${id}`).value;
  if (!replyText) return;

  await updateDoc(doc(db, "messages", id), {
    reply: replyText,
    repliedAt: new Date()
  });

  alert("Reply sent");
};

loadMessages();

