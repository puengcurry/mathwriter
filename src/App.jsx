import { useState, useMemo, useEffect } from "react";
/* ===== transform logic 그대로 ===== */
const greekMap={alpha:"α",beta:"β",gamma:"γ",delta:"δ",pi:"π",sigma:"σ",theta:"θ",lambda:"λ",epsilon:"ε",mu:"μ",rho:"ρ",tau:"τ",phi:"φ",omega:"ω"};
const operatorMap={"<->":"↔","<=":"≤",">=":"≥","!=":"≠","->":"→","<-":"←"};
const fnSet=new Set(["sin","cos","tan","log","ln","exp"]);
const superMap={"0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹"};
const subMap={"0":"₀","1":"₁","2":"₂","3":"₃","4":"₄","5":"₅","6":"₆","7":"₇","8":"₈","9":"₉"};
const toItalic=c=>{
 if(c==="h") return "ℎ";
 if(c>="a"&&c<="z")return String.fromCodePoint(0x1D44E+c.charCodeAt(0)-97);
 if(c>="A"&&c<="Z")return String.fromCodePoint(0x1D434+c.charCodeAt(0)-65);
 return c;
};
const tokenize=t=>t.match(/\*\*.*?\*\*|__.*?__|<->|<=|>=|!=|->|<-|[A-Za-z]+|\d+|\^|_|\n|\s|./g)||[];
function transform(text){
 if(text.includes("$")){
  return text.replace(/\$\$([\s\S]*?)\$\$/g,(_,m)=>
   "\n\n"+transform(m)+"\n\n"
  );
 }
 const t=tokenize(text);let o=[];
 function frac(a,b){
  return a+"⁄"+b;
 }
 for(let i=0;i<t.length;i++){
  const k=t[i];
  if(k.startsWith("**")){
   o.push("𝗯"+k.slice(2,-2)+"𝗯");
   continue;
  }
  if(k.startsWith("__")){
   o.push("▣ "+k.slice(2,-2)+" ▣");
   continue;
  }
  if(k==="/"&&o.length&&t[i+1]){
   const a=o.pop();
   const b=t[++i];
   o.push(frac(a,b));
   continue;
  }
  if(greekMap[k]){o.push(greekMap[k]);continue;}
  if(operatorMap[k]){o.push(operatorMap[k]);continue;}
  if(fnSet.has(k)){o.push(k);continue;}
  if(k==="^"&&t[i+1]){o.push(superMap[t[++i]]||t[i]);continue;}
  if(k==="_"&&t[i+1]){o.push(subMap[t[++i]]||t[i]);continue;}
  if(/^[A-Za-z]+$/.test(k)){o.push([...k].map(toItalic).join(""));continue;}
  o.push(k);
 }
 return o.join("");
}
/* ===== UI ===== */
export default function App(){
 const[notes,setNotes]=useState([]);
 const[current,setCurrent]=useState(null);
 const[input,setInput]=useState("");
 const[title,setTitle]=useState("");
 const[folders,setFolders]=useState([{id:"default",name:"기본"}]);
 const[currentFolder,setCurrentFolder]=useState("default");
 const[search,setSearch]=useState("");
 const[blockMode,setBlockMode]=useState(false);
 useEffect(()=>{
  const s=localStorage.getItem("math-notes");
  if(s){
   const n=JSON.parse(s);
   setNotes(n);
   if(n[0]){
    setCurrent(n[0].id);
    setInput(n[0].body);
    setTitle(n[0].title);
   }
  }
 },[]);
 useEffect(()=>localStorage.setItem("math-notes",JSON.stringify(notes)),[notes]);
 useEffect(()=>{
  if(current)setNotes(n=>n.map(x=>x.id===current?{...x,body:input}:x));
 },[input]);
 useEffect(()=>{
  if(current)setNotes(n=>n.map(x=>x.id===current?{...x,title}:x));
 },[title]);
 function newNote(){
  const n={id:crypto.randomUUID(),title:"Untitled",body:"",folder:currentFolder,star:false};
  setNotes([n,...notes]);
  setCurrent(n.id);
  setInput("");
  setTitle("Untitled");
 }
 const output=useMemo(()=>{
  if(!blockMode) return transform(input);
  return input.replace(/\$\$([\s\S]*?)\$\$/g,(_,m)=>"$"+transform(m)+"$");
 },[input,blockMode]);
 const visibleNotes=notes.filter(n=>
  n.folder===currentFolder &&
  (n.title.toLowerCase().includes(search.toLowerCase()) ||
   n.body.toLowerCase().includes(search.toLowerCase()))
 );
 return(
 <div style={{display:"flex",height:"100vh",fontFamily:"STIX Two Math,system-ui,-apple-system"}}>
 {/* sidebar */}
 <div style={{width:260,background:"#fafafa",borderRight:"1px solid #eee",padding:12}}>
  <button onClick={()=>setBlockMode(m=>!m)} style={{
   width:"100%",padding:8,marginBottom:8,borderRadius:4,border:"1px solid #007bff",
   background:blockMode?"white":"#007bff",color:blockMode?"#007bff":"white",
   fontWeight:600,cursor:"pointer"
  }}>
   {blockMode?"$ 모드":"자동 모드"}
  </button>
  <button onClick={newNote} style={{
   width:"100%",padding:10,borderRadius:8,border:"none",
   background:"#111",color:"#fff",fontWeight:600,cursor:"pointer"
  }}>＋ 새 노트</button>
  <button onClick={()=>{
   const name=prompt("폴더 이름");
   if(!name)return;
   setFolders(f=>[...f,{id:crypto.randomUUID(),name}]);
  }} style={{
   width:"100%",padding:10,marginTop:8,borderRadius:8,border:"1px solid #ddd",
   background:"#fff",fontWeight:600,cursor:"pointer"
  }}>+ 폴더</button>
  <select
   value={currentFolder}
   onChange={e=>setCurrentFolder(e.target.value)}
   style={{width:"100%",margin:"8px 0",padding:6,borderRadius:4,border:"1px solid #ddd"}}
  >
   {folders.map(f=>(
    <option key={f.id} value={f.id}>{f.name}</option>
   ))}
  </select>
  <input
   placeholder="검색"
   value={search}
   onChange={e=>setSearch(e.target.value)}
   style={{width:"100%",margin:"8px 0",padding:6,borderRadius:4,border:"1px solid #ddd",boxSizing:"border-box"}}
  />
  {visibleNotes.map(n=>(
   <div key={n.id}
    onClick={()=>{setCurrent(n.id);setInput(n.body);setTitle(n.title);}}
    style={{
     marginTop:10,padding:10,borderRadius:8,
     background:n.id===current?"#e8f0ff":"transparent",
     cursor:"pointer",
     display:"flex",justifyContent:"space-between",alignItems:"center"
    }}>
    <div style={{flex:1}}>
     <div style={{fontWeight:600,fontSize:13}}>{n.title}</div>
     <div style={{fontSize:11,color:"#888",whiteSpace:"nowrap",overflow:"hidden"}}>
      {n.body.slice(0,30)}
     </div>
    </div>
    <span onClick={e=>{
     e.stopPropagation();
     setNotes(x=>x.map(v=>v.id===n.id?{...v,star:!v.star}:v));
    }} style={{cursor:"pointer",fontSize:16,color:n.star?"#FFD700":"#ccc"}}>
     ★
    </span>
   </div>
  ))}
 </div>
 {/* editor */}
 <div style={{flex:1,display:"flex",flexDirection:"column"}}>
  <input value={title} onChange={e=>setTitle(e.target.value)}
   style={{
    border:"none",outline:"none",
    padding:"18px 24px",
    fontSize:28,fontWeight:700
   }}/>
  <button onClick={()=>window.print()} style={{
   padding:"8px 16px",marginTop:4,marginRight:12,
   background:"#111",color:"#fff",border:"none",borderRadius:4,
   cursor:"pointer",fontSize:12,fontWeight:600
  }}>PDF</button>
  <div style={{flex:1,display:"flex"}}>
   <textarea value={input} onChange={e=>setInput(e.target.value)}
    placeholder="Write math here…"
    style={{
     flex:1,border:"none",outline:"none",
     padding:24,fontSize:17,resize:"none",
     fontFamily:"system-ui,-apple-system"
    }}/>
   <div style={{
    flex:1,
    padding:24,
    background:"#f6f7fb",
    borderLeft:"1px solid #eee",
    whiteSpace:"pre-wrap",
    fontSize:20,
    fontFamily:"STIX Two Math,system-ui,-apple-system",
    overflow:"auto",
    lineHeight:"1.6"
   }}>
    {output}
   </div>
  </div>
 </div>
 </div>
 );
}
