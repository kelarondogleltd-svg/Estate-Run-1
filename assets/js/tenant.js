import { auth, db, storage } from "./firebase.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { listAll, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";
import { Chart } from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.esm.js";

auth.onAuthStateChanged(async user=>{
  if(!user) window.location.href="tenant-login.html";

  loadRentHistory(user.email);
  loadAdminReplies(user.email);
  renderMaintenanceChart(user.email);
  loadReceipts(user.email);
});

async function loadRentHistory(email){
  const q=query(collection(db,"rentPayments"),where("tenantEmail","==",email));
  const snapshot=await getDocs(q);
  const table=document.getElementById("rentHistory"); table.innerHTML="";
  let months=[], amounts=[];
  snapshot.forEach(docSnap=>{
    const d=docSnap.data();
    table.innerHTML+=`<tr><td>${d.month}</td><td>K ${d.amount}</td><td>${d.status}</td></tr>`;
    if(d.status==="Paid"){ months.push(d.month); amounts.push(d.amount); }
  });
  renderRentChart(months,amounts);
}

async function loadAdminReplies(email){
  const q=query(collection(db,"messages"),where("tenantEmail","==",email));
  const snapshot=await getDocs(q);
  const list=document.getElementById("adminReplies"); list.innerHTML="";
  snapshot.forEach(docSnap=>{
    const d=docSnap.data();
    if(d.reply){ list.innerHTML+=`<li><strong>Admin:</strong> ${d.reply}</li>`; }
  });
}

function renderRentChart(months,amounts){
  const ctx=document.getElementById("rentChart");
  new Chart(ctx,{ type:"bar", data:{ labels:months, datasets:[{label:"Rent Paid (K)", data:amounts}] } });
}

async function renderMaintenanceChart(email){
  const q=query(collection(db,"maintenanceReports"),where("tenantEmail","==",email));
  const snapshot=await getDocs(q);
  const stats={ Pending:0, "In Progress":0, Completed:0 };
  snapshot.forEach(docSnap=>{ stats[docSnap.data().status]++; });
  new Chart(document.getElementById("maintenanceChart"),{ type:"pie", data:{ labels:Object.keys(stats), datasets:[{ data:Object.values(stats) }] } });
}

async function loadReceipts(email){
  const receiptsRef=ref(storage, `receipts/${email}`);
  const list=document.getElementById("receiptList"); list.innerHTML="";
  try{
    const res=await listAll(receiptsRef);
    for(const item of res.items){
      const url=await getDownloadURL(item);
      list.innerHTML+=`<li><a href="${url}" target="_blank">${item.name}</a></li>`;
    }
  } catch { list.innerHTML="<li>No receipts uploaded yet</li>"; }
}
