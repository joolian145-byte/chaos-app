import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, collection, getDocs, deleteDoc } from "firebase/firestore";

// ─── Firebase config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBhgT_HAsqJPrPriP-vZvPvG-XYXMCAG9c",
  authDomain: "chaos-app-45a69.firebaseapp.com",
  projectId: "chaos-app-45a69",
  storageBucket: "chaos-app-45a69.firebasestorage.app",
  messagingSenderId: "1052374980905",
  appId: "1:1052374980905:web:32e663f4a5ecdf40d4ff38"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg:"#FFF8F0", ink:"#1A1A2E", pink:"#FF6B9D", yellow:"#FFD93D",
  mint:"#6BCB77", blue:"#4D96FF", orange:"#FF9A3C", purple:"#C77DFF",
  card:"#FFFFFF", muted:"#8A8AA0",
};

const FRIENDS = [
  { id:"faithy", name:"Faithy", avatar:"🌻", color:C.pink },
  { id:"kat",    name:"Kat",    avatar:"🌸", color:C.purple },
  { id:"kimmy",  name:"Kimmy",  avatar:"🍉", color:C.yellow },
  { id:"jules",  name:"Jules",  avatar:"🐼", color:C.mint },
];

const ADMIN_PIN = "1029";

const DEFAULT_QUESTIONS = [
  { id:"high",         emoji:"✨", label:"High Point of the Month",     prompt:"What was a highlight or win from your month?",                    placeholder:"The thing that made you do a little happy dance..." },
  { id:"low",          emoji:"😩", label:"Low Point of the Month",      prompt:"What was tough or annoying this month?",                         placeholder:"We all had one. What was yours?" },
  { id:"joy",          emoji:"🌱", label:"Tiny Joy / Gratitude",        prompt:"Something small that made you smile or feel thankful?",           placeholder:"A good coffee, a sunset, a meme..." },
  { id:"rec",          emoji:"📺", label:"Recommendation of the Month", prompt:"Drop a rec — song, show, café, book, anything!",                 placeholder:"Currently obsessed with..." },
  { id:"lookingAhead", emoji:"🔮", label:"Looking Ahead",               prompt:"What's one thing you're looking forward to next month?",         placeholder:"Something to keep you going..." },
  { id:"activities",   emoji:"🗳️", label:"Group Activities",            prompt:"What are some activities you'd love to do more as a group?",     placeholder:"Picnic? Movie night? Road trip?" },
  { id:"yeeting",      emoji:"🚀", label:"What are we yeeting out?",    prompt:"What are we finally getting rid of in 2026? Objects, habits...", placeholder:"Objects, habits, bad vibes..." },
  { id:"dates",        emoji:"📅", label:"Important Calendar Dates",    prompt:"Any upcoming dates the group should know about next month?",     placeholder:"e.g. Feb 15th: Group Pilates with Kat" },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const nowDate = new Date();
const CURRENT_MONTH = MONTHS[nowDate.getMonth()] + " " + nowDate.getFullYear();

// ─── Firebase helpers ─────────────────────────────────────────────────────────
async function saveState(patch) {
  try { await setDoc(doc(db,"state","current"), patch, { merge:true }); }
  catch(e) { console.error("Save error:",e); }
}
async function saveArchive(entry) {
  try { await setDoc(doc(db,"archive",entry.month.replace(/\s/g,"_")), entry); }
  catch(e) { console.error("Archive error:",e); }
}
async function deleteArchiveEntry(month) {
  try { await deleteDoc(doc(db,"archive",month.replace(/\s/g,"_"))); }
  catch(e) { console.error("Delete error:",e); }
}
async function loadArchive() {
  try {
    const snap = await getDocs(collection(db,"archive"));
    const items = [];
    snap.forEach(d => items.push(d.data()));
    return items.sort((a,b)=>b.month>a.month?1:-1);
  } catch(e) { return []; }
}

// ─── Firebase store ───────────────────────────────────────────────────────────
function useStore() {
  const defaults = {
    friends: FRIENDS.map(f=>({...f,submitted:false})),
    questions: DEFAULT_QUESTIONS,
    submissions: {},
    editorNote: "",
    heroImage: null,
  };
  const [state, setState] = useState(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db,"state","current"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setState({ ...defaults, ...d, friends:d.friends||defaults.friends, questions:d.questions||defaults.questions, submissions:d.submissions||{} });
      } else {
        saveState(defaults);
      }
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    return () => unsub();
  }, []);

  const update = async (patch) => {
    setState(s => ({ ...s, ...patch }));
    await saveState(patch);
  };
  return [state, update, loading];
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;overflow-x:hidden;width:100%;max-width:100%;}
body{background:${C.bg};font-family:'DM Sans',sans-serif;color:${C.ink};-webkit-font-smoothing:antialiased;overscroll-behavior-y:none;overflow-x:hidden;width:100%;max-width:100%;position:relative;}
::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-thumb{background:${C.pink};border-radius:99px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes confetti{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
.fade-up{animation:fadeUp .5s ease both}
.pop-in{animation:popIn .4s cubic-bezier(.34,1.56,.64,1) both}
.float{animation:float 3s ease-in-out infinite}
.btn{font-family:'DM Sans',sans-serif;font-weight:700;border:none;cursor:pointer;border-radius:99px;transition:transform .15s,box-shadow .15s,opacity .15s;display:inline-flex;align-items:center;justify-content:center;gap:7px;-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;-webkit-user-select:none;}
.btn:active{transform:scale(0.97);opacity:0.9}
.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
input,textarea,select{font-family:'DM Sans',sans-serif;font-size:16px;width:100%;border:2px solid #EEE;border-radius:14px;padding:14px 16px;background:white;color:${C.ink};outline:none;transition:border-color .2s;resize:vertical;-webkit-appearance:none;appearance:none;}
input:focus,textarea:focus,select:focus{border-color:${C.pink}}
label{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:${C.muted};display:block;margin-bottom:6px;}
button,a{-webkit-tap-highlight-color:transparent;}
`;

// ─── Small components ─────────────────────────────────────────────────────────
const Avatar = ({ emoji, color, size=40 }) => (
  <div style={{ width:size,height:size,borderRadius:"50%",background:color+"22",border:`2px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.44,flexShrink:0 }}>{emoji}</div>
);
const Tag = ({ color, children }) => (
  <span style={{ background:color+"22",color,border:`1.5px solid ${color}55`,borderRadius:99,padding:"2px 10px",fontSize:12,fontWeight:700 }}>{children}</span>
);
const Spinner = () => (
  <div style={{ width:20,height:20,border:"3px solid #eee",borderTopColor:C.pink,borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0 }} />
);
const Confetti = ({ active }) => {
  if (!active) return null;
  const pieces = Array.from({length:24},(_,i)=>({ left:Math.random()*100, color:Object.values(C).filter(v=>v.startsWith("#"))[i%6], delay:Math.random()*.8, size:7+Math.random()*9 }));
  return (
    <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:9999,overflow:"hidden" }}>
      {pieces.map((p,i)=><div key={i} style={{ position:"absolute",top:"5%",left:`${p.left}%`,width:p.size,height:p.size,borderRadius:2,background:p.color,opacity:0,animation:"confetti 2s ease forwards",animationDelay:`${p.delay}s` }} />)}
    </div>
  );
};
const LoadingScreen = () => (
  <div style={{ minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:C.bg,gap:16 }}>
    <div style={{ fontSize:52 }} className="float">💌</div>
    <div style={{ fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:20 }}>Monthly Inbox of Chaos</div>
    <Spinner />
    <div style={{ color:C.muted,fontSize:14 }}>Loading your newsletter...</div>
  </div>
);

// ─── Image uploader ───────────────────────────────────────────────────────────
function ImageUploader({ value, onChange, multiple=false, label="Upload photo" }) {
  const ref = useRef();
  const handleFiles = (files) => {
    const arr = Array.from(files).slice(0,multiple?5:1);
    Promise.all(arr.map(f=>new Promise(res=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.readAsDataURL(f); }))).then(results=>onChange(multiple?results:results[0]));
  };
  const imgs = multiple?(value||[]):(value?[value]:[]);
  return (
    <div>
      <div onClick={()=>ref.current.click()} style={{ border:`2px dashed ${C.pink}66`,borderRadius:16,padding:"28px 20px",textAlign:"center",cursor:"pointer",background:`${C.pink}08`,minHeight:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent" }}>
        <div style={{ fontSize:32,marginBottom:8 }}>📸</div>
        <div style={{ fontWeight:700,color:C.pink,fontSize:15 }}>{label}</div>
        <div style={{ fontSize:13,color:C.muted,marginTop:4 }}>{multiple?"Up to 5 photos":"1 photo"} • Tap to browse</div>
        <input ref={ref} type="file" accept="image/*" multiple={multiple} style={{ display:"none" }} onChange={e=>handleFiles(e.target.files)} />
      </div>
      {imgs.length>0&&<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(80px,1fr))",gap:8,marginTop:10 }}>
        {imgs.map((src,i)=>(
          <div key={i} style={{ position:"relative",aspectRatio:"1",borderRadius:10,overflow:"hidden" }}>
            <img src={src} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
            <button onClick={()=>onChange(multiple?imgs.filter((_,j)=>j!==i):null)} style={{ position:"absolute",top:4,right:4,background:"rgba(0,0,0,.6)",color:"white",border:"none",borderRadius:"50%",width:20,height:20,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
          </div>
        ))}
      </div>}
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({ state, onNavigate }) {
  const { friends } = state;
  const submitted = friends.filter(f=>f.submitted).length;
  const total = friends.length;
  const allDone = submitted===total&&total>0;
  const pct = total?(submitted/total)*100:0;
  return (
    <div style={{ maxWidth:480,margin:"0 auto",paddingBottom:40,width:"100%",overflowX:"hidden" }}>
      <div style={{ background:C.ink,padding:"max(40px,env(safe-area-inset-top)) 24px 32px",position:"relative",overflow:"hidden",width:"100%" }}>
        <div style={{ position:"absolute",top:-50,right:-50,width:180,height:180,borderRadius:"50%",background:C.pink,opacity:.12,overflow:"hidden" }} />
        <div style={{ position:"absolute",bottom:-30,left:20,width:100,height:100,borderRadius:"50%",background:C.yellow,opacity:.15,overflow:"hidden" }} />
        <span style={{ fontSize:36 }} className="float">💌</span>
        <p style={{ color:C.yellow,fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:13,letterSpacing:".08em",marginTop:8 }}>Monthly Inbox of Chaos</p>
        <h1 style={{ color:"white",fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,lineHeight:1.1,marginTop:4 }}>{CURRENT_MONTH}</h1>
        <p style={{ color:"rgba(255,255,255,.6)",fontSize:14,marginTop:6 }}>{allDone?"🎉 Everyone's in! Newsletter is ready.":`Waiting for ${total-submitted} more submission${total-submitted!==1?"s":""}...`}</p>
        <div style={{ marginTop:20,display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ textAlign:"center",minWidth:52 }}>
            <div style={{ color:"white",fontSize:28,fontWeight:900,lineHeight:1 }}>{submitted}</div>
            <div style={{ color:"rgba(255,255,255,.4)",fontSize:11 }}>of {total}</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ height:8,background:"rgba(255,255,255,.15)",borderRadius:99,overflow:"hidden" }}>
              <div style={{ height:"100%",borderRadius:99,background:`linear-gradient(90deg,${C.pink},${C.orange})`,width:`${pct}%`,transition:"width .6s ease" }} />
            </div>
            <p style={{ color:"rgba(255,255,255,.45)",fontSize:11,marginTop:5 }}>{allDone?"All submitted ✨":`${submitted} of ${total} submitted`}</p>
          </div>
        </div>
      </div>
      <div style={{ padding:"24px 16px 0" }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:14 }}>Who's in? 👀</h2>
        <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:24 }}>
          {friends.map((f,i)=>(
            <div key={f.id} className="pop-in" style={{ animationDelay:`${i*.07}s`,background:C.card,borderRadius:18,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 12px rgba(0,0,0,.06)",border:`2px solid ${f.submitted?f.color+"50":"#EEE"}` }}>
              <Avatar emoji={f.avatar} color={f.color} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:16 }}>{f.name}</div>
                <div style={{ fontSize:13,color:C.muted }}>{f.submitted?"Submitted ✓":"Not yet submitted"}</div>
              </div>
              <Tag color={f.submitted?f.color:C.muted}>{f.submitted?"Done ✓":"Pending"}</Tag>
            </div>
          ))}
        </div>
        <button className="btn" onClick={()=>onNavigate("submit")} style={{ width:"100%",padding:"17px",fontSize:16,background:`linear-gradient(135deg,${C.pink},${C.orange})`,color:"white",boxShadow:`0 8px 24px ${C.pink}44`,marginBottom:12,minHeight:56 }}>
          ✏️ Submit My Responses
        </button>
        {allDone&&<button className="btn" onClick={()=>onNavigate("newsletter")} style={{ width:"100%",padding:"17px",fontSize:16,background:`linear-gradient(135deg,${C.blue},${C.purple})`,color:"white",boxShadow:`0 8px 24px ${C.blue}44`,marginBottom:12,minHeight:56 }}>
          🗞️ Read This Month's Newsletter
        </button>}
        <div style={{ display:"flex",gap:10 }}>
          <button className="btn" onClick={()=>onNavigate("archive")} style={{ flex:1,padding:"16px 10px",fontSize:15,background:C.yellow,color:C.ink,minHeight:52 }}>📚 Archive</button>
          <button className="btn" onClick={()=>onNavigate("adminPin")} style={{ flex:1,padding:"16px 10px",fontSize:15,background:C.ink,color:"white",minHeight:52 }}>⚙️ Admin</button>
        </div>
      </div>
    </div>
  );
}

// ─── SUBMIT ───────────────────────────────────────────────────────────────────
function SubmitScreen({ state, update, onBack }) {
  const { friends, questions, submissions } = state;
  const [step, setStep] = useState("pick");
  const [who, setWho] = useState(null);
  const [answers, setAnswers] = useState({});
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setAnswers(a=>({...a,[k]:v}));
  const filled = questions.filter(q=>answers[q.id]?.trim()).length;

  const handleSubmit = async () => {
    setSaving(true);
    await update({ submissions:{...submissions,[who.id]:{answers,photos}}, friends:friends.map(f=>f.id===who.id?{...f,submitted:true}:f) });
    setSaving(false);
    setStep("done");
  };

  if (step==="done") return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"max(80px,env(safe-area-inset-top)) 24px max(40px,env(safe-area-inset-bottom))",textAlign:"center",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center" }}>
      <div style={{ fontSize:80 }} className="float">🎉</div>
      <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:32,margin:"16px 0 10px" }}>You're in, {who.name}!</h2>
      <p style={{ color:C.muted,lineHeight:1.7,marginBottom:32 }}>Your responses are saved for {CURRENT_MONTH}.<br/>The newsletter drops when everyone submits!</p>
      <button className="btn" onClick={onBack} style={{ padding:"16px 40px",fontSize:16,background:`linear-gradient(135deg,${C.pink},${C.orange})`,color:"white" }}>Back to Home</button>
    </div>
  );

  if (step==="pick") return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"max(24px,env(safe-area-inset-top)) 16px max(80px,env(safe-area-inset-bottom))" }}>
      <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,marginBottom:20,padding:"8px 0",minHeight:44,display:"flex",alignItems:"center",gap:6 }}>← Back</button>
      <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:28,marginBottom:6 }}>Who are you? 👋</h2>
      <p style={{ color:C.muted,marginBottom:24 }}>Pick your name to fill in this month's form</p>
      {friends.map(f=>(
        <button key={f.id} onClick={()=>{ if(!f.submitted){setWho(f);setStep("form");} }} disabled={f.submitted}
          style={{ width:"100%",background:C.card,border:`2px solid ${f.submitted?"#EEE":f.color+"60"}`,borderRadius:20,padding:"18px",display:"flex",alignItems:"center",gap:14,marginBottom:12,cursor:f.submitted?"not-allowed":"pointer",opacity:f.submitted?.6:1,textAlign:"left",boxShadow:"0 2px 10px rgba(0,0,0,.05)",minHeight:80,WebkitTapHighlightColor:"transparent" }}>
          <Avatar emoji={f.avatar} color={f.submitted?C.muted:f.color} size={52} />
          <div>
            <div style={{ fontWeight:700,fontSize:17 }}>{f.name}</div>
            <div style={{ fontSize:13,color:C.muted }}>{f.submitted?"Already submitted this month":"Tap to fill in your responses"}</div>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"max(24px,env(safe-area-inset-top)) 16px 120px" }}>
      <button onClick={()=>setStep("pick")} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,marginBottom:20,padding:"8px 0",minHeight:44,display:"flex",alignItems:"center",gap:6 }}>← Back</button>
      <div style={{ background:who.color+"18",borderRadius:20,padding:"16px",display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
        <Avatar emoji={who.avatar} color={who.color} size={52} />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:".05em" }}>Submitting as</div>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900 }}>{who.name}</div>
        </div>
        <div style={{ color:who.color,fontWeight:800,fontSize:15 }}>{filled}/{questions.length}</div>
      </div>
      <div style={{ height:6,background:"#EEE",borderRadius:99,marginBottom:28,overflow:"hidden" }}>
        <div style={{ height:"100%",background:who.color,borderRadius:99,width:`${(filled/questions.length)*100}%`,transition:"width .4s" }} />
      </div>
      {questions.map((q,i)=>(
        <div key={q.id} style={{ marginBottom:22,animation:`fadeUp .4s ease ${i*.05}s both` }}>
          <label>{q.emoji} {q.label}</label>
          <p style={{ fontSize:14,fontWeight:500,marginBottom:8,color:C.ink }}>{q.prompt}</p>
          <textarea rows={q.id==="dates"?3:4} placeholder={q.placeholder} value={answers[q.id]||""} onChange={e=>set(q.id,e.target.value)} />
        </div>
      ))}
      <div style={{ marginBottom:28 }}>
        <label>📸 Photo Drop</label>
        <p style={{ fontSize:14,fontWeight:500,marginBottom:8,color:C.ink }}>Upload 1–5 photos from your month</p>
        <ImageUploader value={photos} onChange={setPhotos} multiple label="Drop your photos here" />
      </div>
      <div style={{ position:"sticky",bottom:0,background:`linear-gradient(transparent,${C.bg} 30%)`,paddingTop:20,paddingBottom:"max(24px,env(safe-area-inset-bottom))",marginTop:8 }}>
        <button className="btn" onClick={handleSubmit} disabled={saving} style={{ width:"100%",padding:"20px",fontSize:17,background:`linear-gradient(135deg,${who.color},${C.pink})`,color:"white",boxShadow:`0 8px 24px ${who.color}44` }}>
          {saving?<><Spinner/> Saving...</>:"Submit My Responses 🚀"}
        </button>
      </div>
    </div>
  );
}

// ─── NEWSLETTER ───────────────────────────────────────────────────────────────
function NewsletterScreen({ state, update, onBack, isArchive=false, archiveData=null }) {
  const data = isArchive?archiveData:state;
  const { friends, questions, submissions, editorNote, heroImage } = data;
  const month = isArchive?archiveData.month:CURRENT_MONTH;
  const [summaries, setSummaries] = useState({});
  const [loadingQ, setLoadingQ] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [allGenerated, setAllGenerated] = useState(false);

  const generateSummary = async (q) => {
    setLoadingQ(q.id);
    const entries = friends.map(f=>{ const t=submissions[f.id]?.answers?.[q.id]; return t?`${f.name}: ${t}`:null; }).filter(Boolean).join("\n");
    if (!entries) { setLoadingQ(null); return; }
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:200, messages:[{ role:"user", content:`Write a fun, warm, witty 1-2 sentence italic theme summary (under 40 words) for this section of a friends newsletter "Monthly Inbox of Chaos". Capture the overall vibe. No bullet points or names.\n\nSection: "${q.label}"\nAnswers:\n${entries}` }] })
      });
      const d = await res.json();
      setSummaries(s=>({...s,[q.id]:d.content?.find(c=>c.type==="text")?.text?.trim()||""}));
    } catch { setSummaries(s=>({...s,[q.id]:""})); }
    setLoadingQ(null);
  };

  const generateAll = async () => {
    setGenerating(true);
    for (const q of questions) await generateSummary(q);
    setAllGenerated(true); setGenerating(false);
  };

  const allPhotos = friends.flatMap(f=>(submissions[f.id]?.photos||[]).map(p=>({src:p,friend:f})));

  return (
    <div style={{ maxWidth:680,margin:"0 auto",background:C.bg }}>
      <div style={{ padding:"16px 24px 0" }}>
        <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,padding:"8px 0",minHeight:44,display:"inline-flex",alignItems:"center",gap:6 }}>← Back</button>
      </div>
      <div style={{ margin:"16px 16px 0",borderRadius:24,overflow:"hidden",background:"linear-gradient(135deg,#6A0DAD,#4D96FF,#00C9C8)",position:"relative",minHeight:220 }}>
        {heroImage&&<img src={heroImage} style={{ position:"absolute",right:0,top:0,height:"100%",width:"45%",objectFit:"cover",opacity:.7 }} />}
        <div style={{ position:"relative",zIndex:1,padding:"36px 32px" }}>
          <div style={{ fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:42,color:"white",lineHeight:1 }}>Welcome to</div>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:900,color:"white",lineHeight:1.1 }}>Monthly Inbox<br/>of Chaos</div>
          <div style={{ background:C.yellow,color:C.ink,borderRadius:6,display:"inline-block",padding:"5px 14px",marginTop:14,fontSize:13,fontWeight:700 }}>The gang's highlights, fails &amp; fun — all in one drop.</div>
        </div>
      </div>
      <div style={{ padding:"28px 24px" }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,marginBottom:20 }}>Friends Newsletter — {month}</h1>
        {editorNote&&<div style={{ marginBottom:32,paddingBottom:28,borderBottom:"1px solid #EEE" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}><span style={{ fontSize:18 }}>🌿</span><span style={{ fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontWeight:700,fontSize:16 }}>Editor's Note</span></div>
          <p style={{ fontFamily:"'Playfair Display',serif",fontStyle:"italic",lineHeight:1.8,fontSize:15,whiteSpace:"pre-wrap" }}>{editorNote}</p>
        </div>}
        {!isArchive&&!allGenerated&&<div style={{ background:`${C.purple}18`,border:`2px solid ${C.purple}40`,borderRadius:16,padding:"16px 20px",marginBottom:28,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12 }}>
          <div><div style={{ fontWeight:700,fontSize:15 }}>✨ AI Section Summaries</div><div style={{ fontSize:13,color:C.muted }}>Auto-generate the fun italic intros</div></div>
          <button className="btn" onClick={generateAll} disabled={generating} style={{ padding:"10px 20px",fontSize:14,background:C.purple,color:"white" }}>{generating?<><Spinner/> Generating…</>:"Generate All ✨"}</button>
        </div>}
        {questions.map(q=>{
          const entries = friends.map(f=>({friend:f,text:submissions[f.id]?.answers?.[q.id]})).filter(e=>e.text);
          if (!entries.length) return null;
          return (
            <div key={q.id} style={{ marginBottom:36,paddingBottom:32,borderBottom:"1px solid #EEE" }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,marginBottom:8 }}>{q.label}</h2>
              <div style={{ display:"flex",alignItems:"flex-start",gap:10,marginBottom:14,minHeight:30 }}>
                {loadingQ===q.id?<div style={{ display:"flex",alignItems:"center",gap:8,color:C.muted,fontSize:14 }}><Spinner/><span>Writing summary…</span></div>
                  :summaries[q.id]?<p style={{ fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"#5A3E8A",fontSize:15,lineHeight:1.7,flex:1 }}>{summaries[q.id]}</p>
                  :!isArchive?<button onClick={()=>generateSummary(q)} style={{ background:"none",border:`1.5px dashed ${C.purple}60`,color:C.purple,borderRadius:99,padding:"4px 14px",fontSize:12,fontWeight:700,cursor:"pointer" }}>+ Generate summary</button>
                  :null}
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {entries.map(({friend,text})=>(
                  <div key={friend.id} style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
                    <span style={{ fontWeight:800,color:friend.color,fontSize:15,minWidth:60,paddingTop:1 }}>- {friend.name}:</span>
                    <span style={{ fontSize:15,lineHeight:1.65 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {allPhotos.length>0&&<div style={{ marginBottom:32 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,marginBottom:6 }}>📸 Photo Gallery</h2>
          <p style={{ fontFamily:"'Playfair Display',serif",fontStyle:"italic",color:"#5A3E8A",fontSize:14,marginBottom:16 }}>Visual evidence of our adventures 👀</p>
          <div style={{ columns:"3 120px",gap:8 }}>
            {allPhotos.map((p,i)=>(
              <div key={i} style={{ marginBottom:8,borderRadius:12,overflow:"hidden",breakInside:"avoid",position:"relative" }}>
                <img src={p.src} style={{ width:"100%",display:"block" }} />
                <div style={{ position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.5))",padding:"8px 8px 5px",fontSize:11,color:"white",fontWeight:600 }}>{p.friend.avatar} {p.friend.name}</div>
              </div>
            ))}
          </div>
        </div>}
        <div style={{ marginTop:16,padding:"24px",background:"linear-gradient(135deg,#6A0DAD,#4D96FF)",borderRadius:20,textAlign:"center",color:"white" }}>
          <div style={{ fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:28,marginBottom:4 }}>Until next time</div>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700 }}>Newsletter compiled with</div>
          <div style={{ background:C.yellow,color:C.ink,display:"inline-block",borderRadius:6,padding:"4px 14px",marginTop:10,fontSize:13,fontWeight:700 }}>friendship, matcha, and just a tiny bit of automation 💻☕</div>
        </div>
        {!isArchive&&<button className="btn" onClick={async()=>{
          const entry = { month:CURRENT_MONTH,friends:[...state.friends],questions:[...state.questions],submissions:{...state.submissions},editorNote:state.editorNote,heroImage:state.heroImage };
          await saveArchive(entry);
          await update({ submissions:{},friends:state.friends.map(f=>({...f,submitted:false})),editorNote:"",heroImage:null });
          onBack();
        }} style={{ width:"100%",marginTop:24,padding:"16px",fontSize:15,background:C.mint,color:C.ink }}>
          ✅ Archive This Month & Start Fresh
        </button>}
      </div>
    </div>
  );
}

// ─── ARCHIVE ──────────────────────────────────────────────────────────────────
function ArchiveScreen({ onBack, onView }) {
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(true);
  const colors = [C.pink,C.blue,C.mint,C.orange,C.purple,C.yellow];
  useEffect(()=>{ loadArchive().then(items=>{setArchive(items);setLoading(false);}); },[]);
  return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"24px 16px 60px" }}>
      <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,marginBottom:20,padding:"8px 0",minHeight:44,display:"flex",alignItems:"center",gap:6 }}>← Back</button>
      <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:28,marginBottom:6 }}>📚 The Archive</h2>
      <p style={{ color:C.muted,marginBottom:24 }}>Every month, preserved forever</p>
      {loading?<div style={{ textAlign:"center",padding:"40px 0" }}><Spinner/></div>
        :archive.length===0?<div style={{ textAlign:"center",padding:"60px 0",color:C.muted }}>
          <div style={{ fontSize:52,marginBottom:12 }}>🌚</div>
          <p style={{ lineHeight:1.7 }}>No archived newsletters yet.<br/>They'll appear here after each month!</p>
        </div>
        :archive.map((entry,i)=>(
          <button key={i} onClick={()=>onView(entry)} style={{ width:"100%",background:C.card,border:`2px solid ${colors[i%colors.length]}40`,borderRadius:20,padding:"20px",display:"flex",alignItems:"center",gap:14,marginBottom:12,cursor:"pointer",boxShadow:"0 2px 10px rgba(0,0,0,.05)",textAlign:"left" }}>
            <div style={{ width:52,height:52,borderRadius:16,background:colors[i%colors.length]+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0 }}>🗞️</div>
            <div><div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:18 }}>{entry.month}</div><div style={{ fontSize:13,color:C.muted }}>{entry.friends?.length} contributors</div></div>
            <div style={{ marginLeft:"auto",color:colors[i%colors.length],fontWeight:700,fontSize:22 }}>→</div>
          </button>
        ))
      }
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function AdminScreen({ state, update, onBack }) {
  const { friends, questions, editorNote, heroImage } = state;
  const [newQ, setNewQ] = useState({ emoji:"💬",label:"",prompt:"",placeholder:"" });
  const [tab, setTab] = useState("editor");
  const [saving, setSaving] = useState(false);
  const [archive, setArchive] = useState([]);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const loadAdminArchive = async () => {
    setArchiveLoading(true);
    const items = await loadArchive();
    setArchive(items);
    setArchiveLoading(false);
  };

  useEffect(() => { if (tab==="archive") loadAdminArchive(); }, [tab]);

  const tabStyle = (t) => ({ flex:1,padding:"10px",border:"none",cursor:"pointer",borderRadius:10,fontWeight:700,fontSize:12,background:tab===t?C.ink:"transparent",color:tab===t?"white":C.muted,transition:"all .2s",minHeight:44 });
  const save = async (patch) => { setSaving(true); await update(patch); setSaving(false); };
  return (
    <div style={{ maxWidth:480,margin:"0 auto",padding:"24px 16px 80px" }}>
      <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,marginBottom:20,padding:"8px 0",minHeight:44,display:"flex",alignItems:"center",gap:6 }}>← Back</button>
      <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:28,marginBottom:4 }}>⚙️ Admin Panel</h2>
      <p style={{ color:C.muted,marginBottom:20 }}>Jules only 🐼</p>
      <div style={{ display:"flex",gap:4,background:"#F0F0F0",borderRadius:14,padding:4,marginBottom:24 }}>
        <button style={tabStyle("editor")} onClick={()=>setTab("editor")}>✏️ Editor</button>
        <button style={tabStyle("questions")} onClick={()=>setTab("questions")}>❓ Q's</button>
        <button style={tabStyle("members")} onClick={()=>setTab("members")}>👥 Members</button>
        <button style={tabStyle("archive")} onClick={()=>setTab("archive")}>📚 Archive</button>
      </div>
      {tab==="editor"&&<div>
        <div style={{ marginBottom:20 }}>
          <label>Editor's Note</label>
          <p style={{ fontSize:13,color:C.muted,marginBottom:8 }}>Appears at the top of the newsletter in italic</p>
          <textarea rows={6} placeholder="Welcome back, friends!..." value={editorNote||""} onChange={e=>update({editorNote:e.target.value})} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label>Hero / Header Photo</label>
          <p style={{ fontSize:13,color:C.muted,marginBottom:8 }}>Group photo in the newsletter header</p>
          <ImageUploader value={heroImage} onChange={v=>update({heroImage:v})} label="Upload hero photo" />
        </div>
      </div>}
      {tab==="questions"&&<div>
        {questions.map((q,i)=>(
          <div key={q.id} style={{ background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 8px rgba(0,0,0,.05)",border:"2px solid #EEE" }}>
            <span style={{ fontSize:22 }}>{q.emoji}</span>
            <div style={{ flex:1 }}><div style={{ fontWeight:700,fontSize:15 }}>{q.label}</div><div style={{ fontSize:12,color:C.muted }}>{q.prompt}</div></div>
            <button onClick={()=>save({questions:questions.filter((_,j)=>j!==i)})} style={{ background:"#FF444422",color:"#FF4444",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontWeight:700,fontSize:12 }}>Remove</button>
          </div>
        ))}
        <div style={{ background:`${C.mint}18`,border:`2px solid ${C.mint}40`,borderRadius:18,padding:"18px",marginTop:16 }}>
          <div style={{ fontWeight:700,marginBottom:12,fontSize:15 }}>➕ Add a Question</div>
          <div style={{ marginBottom:10 }}><label>Emoji</label><input value={newQ.emoji} onChange={e=>setNewQ(q=>({...q,emoji:e.target.value}))} style={{ width:70 }} /></div>
          <div style={{ marginBottom:10 }}><label>Section Label</label><input placeholder="e.g. Best Meal of the Month" value={newQ.label} onChange={e=>setNewQ(q=>({...q,label:e.target.value}))} /></div>
          <div style={{ marginBottom:10 }}><label>Question Prompt</label><input placeholder="e.g. What did you eat this month?" value={newQ.prompt} onChange={e=>setNewQ(q=>({...q,prompt:e.target.value}))} /></div>
          <div style={{ marginBottom:14 }}><label>Placeholder Text</label><input placeholder="e.g. Don't say cereal..." value={newQ.placeholder} onChange={e=>setNewQ(q=>({...q,placeholder:e.target.value}))} /></div>
          <button className="btn" onClick={()=>{ if(!newQ.label.trim())return; save({questions:[...questions,{...newQ,id:"q_"+Date.now()}]}); setNewQ({emoji:"💬",label:"",prompt:"",placeholder:""}); }} style={{ width:"100%",padding:"13px",fontSize:14,background:C.mint,color:C.ink }}>Add Question</button>
        </div>
      </div>}
      {tab==="archive"&&<div>
        <p style={{ color:C.muted,fontSize:14,marginBottom:16 }}>Delete old newsletters from the archive.</p>
        {archiveLoading?<div style={{ textAlign:"center",padding:"40px 0" }}><Spinner/></div>
          :archive.length===0?<div style={{ textAlign:"center",padding:"40px 0",color:C.muted }}>
            <div style={{ fontSize:40,marginBottom:10 }}>🌚</div>
            <p>No archived newsletters yet.</p>
          </div>
          :archive.map((entry,i)=>(
            <div key={i} style={{ background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 8px rgba(0,0,0,.05)",border:"2px solid #EEE" }}>
              <div style={{ fontSize:24 }}>🗞️</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16 }}>{entry.month}</div>
                <div style={{ fontSize:12,color:C.muted }}>{entry.friends?.length} contributors</div>
              </div>
              <button onClick={async()=>{
                if (window.confirm(`Delete "${entry.month}" from archive? This cannot be undone.`)) {
                  await deleteArchiveEntry(entry.month);
                  setArchive(a=>a.filter(e=>e.month!==entry.month));
                }
              }} style={{ background:"#FF444422",color:"#FF4444",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontWeight:700,fontSize:12 }}>🗑️ Delete</button>
            </div>
          ))
        }
      </div>}
      {tab==="members"&&<div>
        {friends.map(f=>(
          <div key={f.id} style={{ background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
            <Avatar emoji={f.avatar} color={f.color} />
            <div style={{ flex:1 }}><div style={{ fontWeight:700 }}>{f.name}</div><div style={{ fontSize:13,color:C.muted }}>{f.submitted?"✓ Submitted this month":"Pending"}</div></div>
          </div>
        ))}
        <div style={{ background:"#FFF0F0",border:"2px solid #FFD0D0",borderRadius:18,padding:"18px",marginTop:20 }}>
          <div style={{ fontWeight:700,color:"#CC3333",marginBottom:6 }}>⚠️ Reset Submissions</div>
          <p style={{ fontSize:14,color:C.muted,marginBottom:14 }}>Use at the start of each new month.</p>
          <button className="btn" onClick={()=>save({friends:friends.map(f=>({...f,submitted:false})),submissions:{}})} style={{ padding:"12px 24px",fontSize:14,background:"#FF4444",color:"white" }}>Reset All Submissions</button>
        </div>
      </div>}
    </div>
  );
}

// ─── ADMIN PIN ────────────────────────────────────────────────────────────────
function AdminPinScreen({ onSuccess, onBack }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const handleDigit = (d) => {
    if (pin.length>=4) return;
    const next = pin+d; setPin(next); setError(false);
    if (next.length===4) {
      if (next===ADMIN_PIN) { setTimeout(onSuccess,180); }
      else { setShake(true); setError(true); setTimeout(()=>{setPin("");setShake(false);},700); }
    }
  };
  const handleDelete = () => { setPin(p=>p.slice(0,-1)); setError(false); };
  const digits = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <div style={{ maxWidth:340,margin:"0 auto",padding:"60px 24px",textAlign:"center" }}>
      <button onClick={onBack} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,marginBottom:32,display:"flex",alignItems:"center",gap:6,minHeight:44,padding:"8px 0" }}>← Back</button>
      <div style={{ fontSize:52,marginBottom:12 }}>🐼</div>
      <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:6 }}>Admin Access</h2>
      <p style={{ color:C.muted,fontSize:14,marginBottom:32 }}>Jules only! Enter your PIN.</p>
      <div style={{ display:"flex",justifyContent:"center",gap:14,marginBottom:36,animation:shake?"shake .4s ease":"none" }}>
        {[0,1,2,3].map(i=><div key={i} style={{ width:18,height:18,borderRadius:"50%",border:`2.5px solid ${error?"#FF4444":C.pink}`,background:pin.length>i?(error?"#FF4444":C.pink):"transparent",transition:"background .15s,border-color .15s" }} />)}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,maxWidth:260,margin:"0 auto" }}>
        {digits.map((d,i)=>d===""?<div key={i}/>:
          <button key={i} onClick={()=>d==="⌫"?handleDelete():handleDigit(d)}
            style={{ background:d==="⌫"?"#F0F0F0":C.card,border:`2px solid ${d==="⌫"?"#E0E0E0":"#EEE"}`,borderRadius:16,padding:"22px 0",fontSize:d==="⌫"?22:26,fontWeight:700,cursor:"pointer",color:C.ink,fontFamily:"'DM Sans',sans-serif",minHeight:64,WebkitTapHighlightColor:"transparent" }}
            onMouseEnter={e=>e.currentTarget.style.background=C.pink+"22"}
            onMouseLeave={e=>e.currentTarget.style.background=d==="⌫"?"#F0F0F0":C.card}>
            {d}
          </button>
        )}
      </div>
      {error&&<p style={{ color:"#FF4444",fontSize:13,fontWeight:700,marginTop:20 }}>Incorrect PIN — try again 🙅</p>}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [state, update, loading] = useStore();
  const [screen, setScreen] = useState("home");
  const [archiveEntry, setArchiveEntry] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const prevSubmitted = useRef(0);

  useEffect(()=>{
    const n = state.friends.filter(f=>f.submitted).length;
    if (n===state.friends.length&&state.friends.length>0&&n>prevSubmitted.current) { setConfetti(true); setTimeout(()=>setConfetti(false),2800); }
    prevSubmitted.current = n;
  },[state.friends]);

  useEffect(()=>{
    let vp=document.querySelector('meta[name="viewport"]');
    if (!vp){vp=document.createElement('meta');vp.name="viewport";document.head.appendChild(vp);}
    vp.content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover";
    let tc=document.querySelector('meta[name="theme-color"]');
    if (!tc){tc=document.createElement('meta');tc.name="theme-color";document.head.appendChild(tc);}
    tc.content="#1A1A2E";
  },[]);

  const nav=(s)=>{setArchiveEntry(null);setScreen(s);window.scrollTo(0,0);};

  if (loading) return <><style>{GLOBAL_CSS}</style><LoadingScreen/></>;

  return (
    <div style={{ minHeight:"100vh",background:C.bg,overflowX:"hidden",width:"100%",maxWidth:"100%",position:"relative" }}>
      <style>{GLOBAL_CSS}</style>
      <Confetti active={confetti}/>
      {screen==="home"       &&<HomeScreen state={state} onNavigate={nav}/>}
      {screen==="submit"     &&<SubmitScreen state={state} update={update} onBack={()=>nav("home")}/>}
      {screen==="newsletter" &&<NewsletterScreen state={state} update={update} onBack={()=>nav(archiveEntry?"archive":"home")} isArchive={!!archiveEntry} archiveData={archiveEntry}/>}
      {screen==="archive"    &&<ArchiveScreen onBack={()=>nav("home")} onView={e=>{setArchiveEntry(e);setScreen("newsletter");window.scrollTo(0,0);}}/>}
      {screen==="adminPin"   &&<AdminPinScreen onSuccess={()=>nav("admin")} onBack={()=>nav("home")}/>}
      {screen==="admin"      &&<AdminScreen state={state} update={update} onBack={()=>nav("home")}/>}
    </div>
  );
}
