const $ = id => document.getElementById(id);
const STORAGE_KEY = "cfd_franchise_v2";
const POSITION_CODES = ["QB","RB","HB","FB","WR","TE","LT","LG","C","RG","RT","DE","DT","OLB","MLB","CB","FS","SS","K","P"];
let schools = [], recruits = [], franchise = loadFranchise();

function loadFranchise(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY));}catch{return null;} }
function save(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(franchise)); renderFranchise(); }
function money(n){return "$"+Math.round(n).toLocaleString("en-US");}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

async function init(){
  try{
    const [s,r]=await Promise.all([fetch("/api/schools"),fetch("/api/recruits")]);
    if(!s.ok||!r.ok)throw new Error("API unavailable");
    schools=await s.json(); const data=await r.json(); recruits=data.players;
    $("connection").textContent="ONLINE";
    buildSchoolSelect(); buildFilters(); renderFranchise();
    $("createFranchise").addEventListener("click",createFranchise);
    $("changeSchool").addEventListener("click",()=>{$("setupPanel").classList.remove("hidden");$("franchisePanel").classList.add("hidden");$("recruitingSection").classList.add("hidden");});
    ["searchInput","unitFilter","positionFilter","typeFilter","yearFilter","sortFilter"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",renderRecruiting));
    $("opponentSelect").addEventListener("change",()=>{if(franchise && $("opponentSelect").value===franchise.schoolId){alert("You cannot play against your own school.");buildOpponentSelect();}});
    renderRecruiting();
  }catch(e){$("connection").textContent="API ERROR";console.error(e);}
}
function buildSchoolSelect(){
  $("schoolSelect").innerHTML=schools.map(s=>`<option value="${s.id}">${escapeHTML(s.name)}</option>`).join("");
  if(franchise?.schoolId && schools.some(s=>s.id===franchise.schoolId))$("schoolSelect").value=franchise.schoolId;
}
function createFranchise(){
  const school=schools.find(s=>s.id===$("schoolSelect").value);if(!school)return;
  franchise={schoolId:school.id,schoolName:school.name,budget:50000000,roster:[],createdAt:new Date().toISOString(),winCoins:0,wins:0,losses:0};
  save(); $("setupPanel").classList.add("hidden");$("franchisePanel").classList.remove("hidden");$("recruitingSection").classList.remove("hidden");
}
function buildOpponentSelect(){
  const choices=schools.filter(s=>s.id!==franchise?.schoolId);
  $("opponentSelect").innerHTML=choices.map(s=>`<option value="${s.id}">${escapeHTML(s.name)}</option>`).join("");
}
function renderFranchise(){
  if(!franchise){$("setupPanel").classList.remove("hidden");$("franchisePanel").classList.add("hidden");$("recruitingSection").classList.add("hidden");return;}
  $("setupPanel").classList.add("hidden");$("franchisePanel").classList.remove("hidden");$("recruitingSection").classList.remove("hidden");
  $("teamName").textContent=franchise.schoolName;$("budget").textContent=money(franchise.budget);
  $("rosterCount").textContent=franchise.roster.length;$("rosterBadge").textContent=franchise.roster.length;
  buildOpponentSelect();renderRoster();renderRecruiting();
}
function buildFilters(){
  $("positionFilter").innerHTML='<option value="ALL">All positions</option>'+POSITION_CODES.map(p=>`<option value="${p}">${p}</option>`).join("");
}
function filteredPlayers(){
  const search=$("searchInput").value.toLowerCase(),unit=$("unitFilter").value,pos=$("positionFilter").value,type=$("typeFilter").value,year=$("yearFilter").value,sort=$("sortFilter").value;
  let list=recruits.filter(p=>(unit==="ALL"||p.unit===unit)&&(pos==="ALL"||p.position===pos)&&(type==="ALL"||p.prospectType===type)&&(year==="ALL"||String(p.classYear)===year)&&(!search||`${p.name} ${p.position} ${p.positionName} ${p.classYear}`.toLowerCase().includes(search)));
  list.sort((a,b)=>sort==="salary-low"?a.salary-b.salary:sort==="salary-high"?b.salary-a.salary:b.overall-a.overall);
  return list;
}
function renderRecruiting(){
  if(!franchise)return;
  const list=filteredPlayers();
  $("recruitGrid").innerHTML=list.map(p=>{
    const attrs=Object.entries(p.attributes).slice(0,4).map(([name,val])=>`<div class="bar-row">${escapeHTML(name)} <b>${val}</b><div class="bar-track"><div class="bar-fill" style="width:${val}%"></div></div></div>`).join("");
    const already=franchise.roster.some(x=>x.id===p.id),canAfford=franchise.budget>=p.salary;
    return `<article class="player-card"><div class="player-card-top"><div><h3>${escapeHTML(p.name)}</h3><span class="player-meta">${p.prospectType} · Class ${p.classYear}</span></div><div class="overall">${p.overall}</div></div><span class="position-pill">${p.position} · ${escapeHTML(p.positionName)}</span><div class="bars">${attrs}</div><div class="player-card-bottom"><span class="price">${money(p.salary)}</span><button class="recruit-btn" data-recruit="${p.id}" ${already||!canAfford?"disabled":""}>${already?"RECRUITED":canAfford?"RECRUIT":"OVER BUDGET"}</button></div></article>`;
  }).join("")||'<p class="muted small">No prospects match those filters.</p>';
  $("recruitGrid").querySelectorAll("[data-recruit]").forEach(btn=>btn.addEventListener("click",()=>recruitPlayer(btn.dataset.recruit)));
}
function recruitPlayer(id){
  const p=recruits.find(x=>x.id===id);if(!p||!franchise)return;
  if(franchise.roster.some(x=>x.id===id))return;
  if(p.salary>franchise.budget){alert("Your recruiting budget is too low for this player.");return;}
  franchise.budget-=p.salary;franchise.roster.push({...p,recruitedAt:new Date().toISOString()});save();
}
function renderRoster(){
  $("rosterList").innerHTML=franchise.roster.length?franchise.roster.map(p=>`<div class="roster-item"><div><b>${escapeHTML(p.name)}</b><small>${p.position} · OVR ${p.overall} · ${money(p.salary)}</small></div><button class="remove-player" data-cut="${p.id}" title="Cut player">CUT</button></div>`).join(""):'<p class="muted small empty">No players recruited yet. Your roster starts empty.</p>';
  $("rosterList").querySelectorAll("[data-cut]").forEach(btn=>btn.addEventListener("click",()=>cutPlayer(btn.dataset.cut)));
}
function cutPlayer(id){
  const index=franchise.roster.findIndex(p=>p.id===id);if(index<0)return;
  const [p]=franchise.roster.splice(index,1);franchise.budget+=p.salary;save();
}
init();