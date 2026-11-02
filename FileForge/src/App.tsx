import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, FileArchive, FileImage, FileText, Fingerprint, Github, Heart, LockKeyhole, Menu, Moon, Plus, Search, ShieldCheck, Sparkles, Sun, UploadCloud, X, Zap } from "lucide-react";
import { createZip, extractZip, extractPdf, makeQr, mergePdfs, picturesToPdf, processImage, rotatePdf, saveBlob, watermarkPdf } from "./services/fileTools";

type Category = "All tools" | "PDF tools" | "Picture tools" | "Security & utilities";
type Tool = { id:string; name:string; description:string; category:Exclude<Category,"All tools">; icon:string; ready:boolean; detail?:string };
const tools:Tool[] = [
 {id:"merge-pdf",name:"Merge PDF",description:"Combine multiple PDF files into one.",category:"PDF tools",icon:"merge",ready:true},
 {id:"extract-pdf",name:"Extract PDF pages",description:"Save selected pages into a new PDF.",category:"PDF tools",icon:"pages",ready:true},
 {id:"rotate-pdf",name:"Rotate PDF",description:"Turn every page in the right direction.",category:"PDF tools",icon:"rotate",ready:true},
 {id:"pictures-pdf",name:"Pictures to PDF",description:"Turn JPG and PNG pictures into a PDF.",category:"PDF tools",icon:"image",ready:true},
 {id:"watermark-pdf",name:"Add PDF watermark",description:"Place a light text mark on your pages.",category:"PDF tools",icon:"stamp",ready:true},
 {id:"compress-pdf",name:"Compress PDF",description:"Reduce PDF size while keeping it readable.",category:"PDF tools",icon:"compress",ready:false},
 {id:"split-pdf",name:"Split PDF",description:"Separate a PDF into smaller documents.",category:"PDF tools",icon:"split",ready:false},
 {id:"rearrange-pdf",name:"Rearrange pages",description:"Change the order of pages in a PDF.",category:"PDF tools",icon:"reorder",ready:false},
 {id:"protect-pdf",name:"Protect PDF",description:"Add password protection to a PDF.",category:"PDF tools",icon:"lock",ready:false},
 {id:"unlock-pdf",name:"Unlock PDF",description:"Remove supported restrictions from a file you own.",category:"PDF tools",icon:"unlock",ready:false},
 {id:"sign-pdf",name:"Sign PDF",description:"Add your signature to a document.",category:"PDF tools",icon:"sign",ready:false},
 {id:"pdf-word",name:"PDF to Word",description:"Convert PDF pages into editable text.",category:"PDF tools",icon:"word",ready:false},
 {id:"page-numbers",name:"Add page numbers",description:"Number pages in your PDF.",category:"PDF tools",icon:"numbers",ready:false},
 {id:"crop-pdf",name:"Crop PDF",description:"Trim unwanted page margins.",category:"PDF tools",icon:"crop",ready:false},
 {id:"compress-image",name:"Compress picture",description:"Make an image smaller for sharing.",category:"Picture tools",icon:"compress",ready:true},
 {id:"resize-image",name:"Resize picture",description:"Change the width and height of an image.",category:"Picture tools",icon:"resize",ready:true},
 {id:"convert-image",name:"Convert picture",description:"Save an image as JPG, PNG or WebP.",category:"Picture tools",icon:"convert",ready:true},
 {id:"rotate-image",name:"Rotate & flip",description:"Rotate an image before saving it.",category:"Picture tools",icon:"rotate",ready:true},
 {id:"crop-image",name:"Crop picture",description:"Trim an image to a centered square.",category:"Picture tools",icon:"crop",ready:false},
 {id:"watermark-image",name:"Picture watermark",description:"Add a simple text watermark to an image.",category:"Picture tools",icon:"stamp",ready:false},
 {id:"blur-image",name:"Blur sensitive areas",description:"Blur a selected area of a picture.",category:"Picture tools",icon:"blur",ready:false},
 {id:"remove-bg",name:"Remove background",description:"Prepare a cut-out image using an AI model.",category:"Picture tools",icon:"background",ready:false,detail:"An offline AI model is not bundled yet. No image is uploaded."},
 {id:"color-picker",name:"Color picker",description:"Find a color from an image.",category:"Picture tools",icon:"color",ready:false},
 {id:"ocr",name:"Image to text (OCR)",description:"Read text from a picture.",category:"Security & utilities",icon:"scan",ready:false},
 {id:"qr",name:"QR code generator",description:"Create a QR code from text or a link.",category:"Security & utilities",icon:"qr",ready:true},
 {id:"metadata",name:"Metadata viewer",description:"See basic details about a file.",category:"Security & utilities",icon:"info",ready:true},
 {id:"pdf-text",name:"PDF to text",description:"Extract selectable text from a PDF.",category:"Security & utilities",icon:"text",ready:false},
 {id:"zip-extract",name:"ZIP extractor",description:"Repackage the contents of a ZIP archive.",category:"Security & utilities",icon:"zip",ready:true},
 {id:"zip-create",name:"ZIP creator",description:"Bundle multiple files into one ZIP.",category:"Security & utilities",icon:"archive",ready:true},
 {id:"barcode-scan",name:"Barcode scanner",description:"Read a supported barcode from an image.",category:"Security & utilities",icon:"barcode",ready:false},
 {id:"unit-convert",name:"Unit converter",description:"Convert common length, weight and temperature units.",category:"Security & utilities",icon:"convert",ready:true},
 {id:"text-merge",name:"Text file merger",description:"Join multiple text files together.",category:"Security & utilities",icon:"merge",ready:true},
 {id:"password",name:"Password generator",description:"Create a strong random password.",category:"Security & utilities",icon:"key",ready:true},
 {id:"sha256",name:"SHA-256 file checker",description:"Create a fingerprint to verify a file.",category:"Security & utilities",icon:"hash",ready:true},
 {id:"text-diff",name:"Text comparison",description:"Compare two pieces of text side by side.",category:"Security & utilities",icon:"compare",ready:true}
];
const categories:Category[]=["All tools","PDF tools","Picture tools","Security & utilities"];
const iconFor=(id:string)=> id.includes("pdf")||id.includes("pages")||id.includes("word")||id.includes("numbers") ? <FileText/> : id.includes("image")||id.includes("picture") ? <FileImage/> : id.includes("zip")||id.includes("archive") ? <FileArchive/> : id==="sha256"||id==="password" ? <Fingerprint/> : id==="qr" ? <Sparkles/> : <Zap/>;

function App(){
 const [theme,setTheme]=useState(localStorage.getItem("ff-theme")||"ocean");
 const [category,setCategory]=useState<Category>("All tools");
 const [query,setQuery]=useState("");
 const [active,setActive]=useState<Tool|null>(null);
 const [favorites,setFavorites]=useState<string[]>(JSON.parse(localStorage.getItem("ff-favs")||"[]"));
 const [recent,setRecent]=useState<string[]>(JSON.parse(localStorage.getItem("ff-recent")||"[]"));
 const [mobileOpen,setMobileOpen]=useState(false);
 const [installPrompt,setInstallPrompt]=useState<any>(null);
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem("ff-theme",theme)},[theme]);
 useEffect(()=>{localStorage.setItem("ff-favs",JSON.stringify(favorites))},[favorites]);
 useEffect(()=>{localStorage.setItem("ff-recent",JSON.stringify(recent))},[recent]);
 useEffect(()=>{const h=(e:Event)=>{e.preventDefault();setInstallPrompt(e)};window.addEventListener("beforeinstallprompt",h);return()=>window.removeEventListener("beforeinstallprompt",h)},[]);
 const filtered=useMemo(()=>tools.filter(t=>(category==="All tools"||t.category===category)&&`${t.name} ${t.description}`.toLowerCase().includes(query.toLowerCase())),[category,query]);
 const openTool=(tool:Tool)=>{setActive(tool);setRecent(old=>[tool.id,...old.filter(x=>x!==tool.id)].slice(0,6));window.scrollTo({top:0,behavior:"smooth"})};
 const toggleFav=(id:string)=>setFavorites(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);
 return <div className="app-shell">
  <header className="topbar"><div className="nav-inner"><button className="brand" onClick={()=>setActive(null)}><span className="brand-mark"><FileText size={22}/></span><span>File<span>Forge</span></span></button>
   <div className="nav-status"><i/> All tools ready to explore</div>
   <div className="nav-actions"><div className="theme-select"><button onClick={()=>setTheme(theme==="ocean"?"violet":theme==="violet"?"light":"ocean")} title="Change theme">{theme==="light"?<Sun size={17}/>:<Moon size={17}/>}<span>{theme==="ocean"?"Ocean Blue":theme==="violet"?"Violet":"Light"}</span><ChevronDown size={14}/></button><div className="theme-menu"><button onClick={()=>setTheme("ocean")}>Ocean Blue</button><button onClick={()=>setTheme("violet")}>Violet</button><button onClick={()=>setTheme("light")}>Light</button></div></div>
   {installPrompt&&<button className="install-btn" onClick={async()=>{await installPrompt.prompt();setInstallPrompt(null)}}>Install app <ArrowDownToLine size={15}/></button>}
   <button className="mobile-menu" onClick={()=>setMobileOpen(!mobileOpen)}><Menu/></button></div></div>
   {mobileOpen&&<div className="mobile-nav"><button onClick={()=>{setCategory("All tools");setActive(null);setMobileOpen(false)}}>All tools</button>{categories.slice(1).map(c=><button key={c} onClick={()=>{setCategory(c);setActive(null);setMobileOpen(false)}}>{c}</button>)}</div>}
  </header>
  {active?<Workspace tool={active} onBack={()=>setActive(null)}/>:<>
   <main>
    <section className="hero"><div className="hero-glow glow-one"/><div className="hero-glow glow-two"/>
     <div className="hero-content"><div className="eyebrow"><span className="eyebrow-dot"/> YOUR FILES. YOUR DEVICE. YOUR CONTROL.</div>
      <h1>Easy tools for<br/><span>your files.</span></h1>
      <p className="hero-copy">Edit pictures, manage PDFs and use helpful file tools.<br className="desktop-break"/> Everything is simple, fast and private.</p>
      <div className="hero-ctas"><button className="primary-btn" onClick={()=>document.getElementById("tools")?.scrollIntoView({behavior:"smooth"})}>Explore all tools <ArrowRight size={17}/></button><div className="privacy-note"><ShieldCheck size={17}/> Files stay on your device for supported tools</div></div>
      <div className="hero-stats"><div><strong>35+</strong><span>Useful tools</span></div><div><strong>Local-first</strong><span>Private processing</span></div><div><strong>Free</strong><span>No account needed</span></div><div><strong>Any device</strong><span>Mobile & desktop</span></div></div>
     </div><div className="hero-art"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="floating-file file-a"><FileText/><span>document.pdf</span><small>PDF · 2.4 MB</small></div><div className="floating-file file-b"><FileImage/><span>summer-photo.webp</span><small>IMAGE · 1.2 MB</small></div><div className="core-card"><div className="core-icon"><ShieldCheck size={34}/></div><b>Your files, protected.</b><span>Processing happens in your browser.</span><div className="core-line"><i/></div></div><div className="spark spark-a">✦</div><div className="spark spark-b">✧</div></div>
    </section>
    <section className="trust-strip"><div><ShieldCheck/><span><b>Privacy first</b><small>No automatic file uploads</small></span></div><div><Zap/><span><b>Simple workflow</b><small>Choose, process, download</small></span></div><div><LockKeyhole/><span><b>No account</b><small>Start using tools right away</small></span></div></section>
    <section className="tools-section" id="tools"><div className="section-heading"><div><div className="eyebrow">THE TOOLBOX</div><h2>Everything you need.<br/><span>All in one place.</span></h2><p>Pick a tool and get things done in a few simple steps.</p></div><div className="tool-count"><strong>{tools.length}</strong><span>tools in the library</span></div></div>
     <div className="toolbar"><div className="tabs">{categories.map(c=><button key={c} className={category===c?"selected":""} onClick={()=>setCategory(c)}>{c}</button>)}</div><label className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tools..."/>{query&&<button onClick={()=>setQuery("")}><X size={14}/></button>}</label></div>
     {favorites.length>0&&category==="All tools"&&!query&&<div className="mini-section"><div className="mini-heading"><Heart size={15}/> Your favorites</div><div className="tool-grid compact">{tools.filter(t=>favorites.includes(t.id)).map(t=><ToolCard key={t.id} tool={t} favorite={true} onOpen={openTool} onFavorite={toggleFav}/>)}</div></div>}
     {recent.length>0&&category==="All tools"&&!query&&<div className="mini-section"><div className="mini-heading"><Clock3 size={15}/> Recently used</div><div className="recent-row">{recent.map(id=>tools.find(t=>t.id===id)).filter(Boolean).map(t=><button key={t!.id} onClick={()=>openTool(t!)}>{iconFor(t!.id)}{t!.name}<ArrowRight size={13}/></button>)}</div></div>}
     <div className="tool-grid">{filtered.map(t=><ToolCard key={t.id} tool={t} favorite={favorites.includes(t.id)} onOpen={openTool} onFavorite={toggleFav}/>)}</div>
     {filtered.length===0&&<div className="empty-state"><Search size={28}/><h3>No tools found</h3><p>Try another search or choose a different category.</p><button onClick={()=>{setQuery("");setCategory("All tools")}}>Show all tools</button></div>}
    </section>
    <section className="privacy-section"><div className="privacy-copy"><div className="eyebrow">BUILT AROUND YOUR PRIVACY</div><h2>Your files are<br/><span>yours. Always.</span></h2><p>FileForge is designed to process files directly in your browser whenever the tool supports it. Your files are not automatically sent to a server.</p><div className="privacy-points"><div><Check/> No automatic uploads</div><div><Check/> No account required</div><div><Check/> Clear your session whenever you like</div></div></div><div className="privacy-visual"><div className="shield-orb"><ShieldCheck size={66}/></div><div className="privacy-chip chip-one">LOCAL PROCESSING <span>●</span></div><div className="privacy-chip chip-two">YOUR DEVICE <span>✓</span></div><div className="privacy-ring"/></div></section>
   </main>
   <Footer/>
  </>}
 </div>
}

function ToolCard({tool,favorite,onOpen,onFavorite}:{tool:Tool;favorite:boolean;onOpen:(t:Tool)=>void;onFavorite:(id:string)=>void}){
 return <article className="tool-card"><button className="card-main" onClick={()=>onOpen(tool)}><span className="tool-icon">{iconFor(tool.id)}</span><span className="tool-copy"><b>{tool.name}</b><small>{tool.description}</small></span><ArrowRight className="card-arrow" size={17}/></button><div className="card-meta"><span className={tool.ready?"status-ready":"status-soon"}><i/>{tool.ready?"Ready to use":"Coming soon"}</span><button className={`favorite ${favorite?"active":""}`} onClick={()=>onFavorite(tool.id)} aria-label={favorite?"Remove favorite":"Add favorite"}><Heart size={15} fill={favorite?"currentColor":"none"}/></button></div></article>
}

function Workspace({tool,onBack}:{tool:Tool;onBack:()=>void}){
 const [files,setFiles]=useState<File[]>([]); const [status,setStatus]=useState(""); const [error,setError]=useState(""); const [result,setResult]=useState<{blob?:Blob;name?:string;url?:string;message?:string}|null>(null);
 const [pages,setPages]=useState("1"); const [text,setText]=useState("FileForge"); const [width,setWidth]=useState("1200"); const [height,setHeight]=useState("1200"); const [quality,setQuality]=useState("82"); const [format,setFormat]=useState("webp"); const [rotation,setRotation]=useState("90"); const [unitValue,setUnitValue]=useState("10"); const [unit,setUnit]=useState("km"); const [textA,setTextA]=useState(""); const [textB,setTextB]=useState(""); const [password,setPassword]=useState("");
 const inputRef=useRef<HTMLInputElement>(null);
 const ready=tool.ready;
 const accept=tool.category==="PDF tools"?".pdf,application/pdf":tool.category==="Picture tools"?"image/*":tool.id==="zip-extract"?".zip,application/zip":tool.id==="metadata"?"*/*":".txt,text/plain";
 const addFiles=(list:FileList|null)=>{if(!list)return;setFiles(Array.from(list));setResult(null);setError("");setStatus("");};
 const run=async()=>{
  setError("");setStatus("Working in your browser…");setResult(null);
  try{
   let blob:Blob|undefined,name="fileforge-result";
   if(tool.id==="merge-pdf"){if(files.length<2)throw Error("Choose at least two PDF files.");blob=await mergePdfs(files);name="merged.pdf"}
   else if(tool.id==="extract-pdf"){if(!files[0])throw Error("Choose a PDF first.");blob=await extractPdf(files[0],pages);name="extracted-pages.pdf"}
   else if(tool.id==="rotate-pdf"){if(!files[0])throw Error("Choose a PDF first.");blob=await rotatePdf(files[0],Number(rotation));name="rotated.pdf"}
   else if(tool.id==="watermark-pdf"){if(!files[0])throw Error("Choose a PDF first.");blob=await watermarkPdf(files[0],text);name="watermarked.pdf"}
   else if(tool.id==="pictures-pdf"){if(!files.length)throw Error("Choose one or more JPG or PNG pictures.");blob=await picturesToPdf(files);name="pictures.pdf"}
   else if(["compress-image","resize-image","convert-image","rotate-image"].includes(tool.id)){
    if(!files[0])throw Error("Choose a picture first.");
    const action=tool.id==="resize-image"?"resize":"export";
    const r=await processImage(files[0],action,Number(width),Number(height),Number(quality),tool.id==="convert-image"?format:(files[0].type==="image/png"?"png":"jpeg"),tool.id==="rotate-image"?Number(rotation):0);
    blob=r.blob;name=`${files[0].name.replace(/\.[^.]+$/,"")}-fileforge.${format==="jpg"?"jpg":format}`;
   }
   else if(tool.id==="zip-create"){if(!files.length)throw Error("Choose files to put in the ZIP.");blob=await createZip(files);name="fileforge-archive.zip"}
   else if(tool.id==="zip-extract"){if(!files[0])throw Error("Choose a ZIP file.");blob=await extractZip(files[0]);name="extracted-files.zip"}
   else if(tool.id==="sha256"){if(!files[0])throw Error("Choose a file first.");const digest=await crypto.subtle.digest("SHA-256",await files[0].arrayBuffer());const hex=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");setResult({message:hex});setStatus("Fingerprint created");return}
   else if(tool.id==="qr"){const data=await makeQr(text);setResult({url:data,message:"Your QR code is ready."});setStatus("QR code created");return}
   else if(tool.id==="password"){const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";const bytes=crypto.getRandomValues(new Uint8Array(24));const p=Array.from(bytes,b=>chars[b%chars.length]).join("");setPassword(p);setResult({message:p});setStatus("Password generated");return}
   else if(tool.id==="text-merge"){if(!files.length)throw Error("Choose one or more text files.");const content=await Promise.all(files.map(f=>f.text()));blob=new Blob([content.join("\\n\\n")],{type:"text/plain"});name="merged-text.txt"}
   else if(tool.id==="text-diff"){const a=textA.split("\\n"),b=textB.split("\\n");const out=["TEXT COMPARISON","",...a.map((line,i)=>line===b[i]?`  ${line}`:`- ${line}`),...b.slice(a.length).map(line=>`+ ${line}`)];blob=new Blob([out.join("\\n")],{type:"text/plain"});name="text-comparison.txt"}
   else if(tool.id==="metadata"){if(!files[0])throw Error("Choose a file first.");const f=files[0];setResult({message:`Name: ${f.name}\\nType: ${f.type||"Unknown"}\\nSize: ${(f.size/1024).toFixed(1)} KB\\nLast modified: ${new Date(f.lastModified).toLocaleString()}`});setStatus("File details ready");return}
   else if(tool.id==="unit-convert"){const n=Number(unitValue);const converted=unit==="km"?`${n} km = ${(n*1000).toLocaleString()} m`:`${n} kg = ${(n*1000).toLocaleString()} g`;setResult({message:converted});setStatus("Conversion complete");return}
   else throw Error(tool.detail||"This tool is not available in this version yet.");
   if(blob){const url=URL.createObjectURL(blob);setResult({blob,name,url});setStatus("Your result is ready to download.")}
  }catch(e){setError(e instanceof Error?e.message:"Something went wrong. Please try another file.");setStatus("")}
 };
 useEffect(()=>()=>{if(result?.url)URL.revokeObjectURL(result.url)},[result?.url]);
 return <main className="workspace"><button className="back-link" onClick={onBack}><ArrowLeft size={16}/> Back to all tools</button><div className="workspace-title"><div className="tool-icon large">{iconFor(tool.id)}</div><div><div className="eyebrow">FILEFORGE WORKSPACE</div><h1>{tool.name}</h1><p>{tool.description}</p></div></div>
  {!ready?<div className="not-ready"><div className="coming-icon"><Clock3/></div><h2>This tool is being prepared</h2><p>{tool.detail||"This feature is planned, but it is not implemented yet. We won't pretend to process your file."}</p><button className="secondary-btn" onClick={onBack}>Explore available tools</button></div>:
  <div className="workspace-grid"><section className="work-panel"><div className="panel-heading"><span className="step">01</span><div><h3>Choose your file</h3><p>Select a file from your device. Nothing is uploaded automatically.</p></div></div>
   <button className="dropzone" onClick={()=>inputRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files)}}><UploadCloud size={31}/><b>Drop files here or <u>browse files</u></b><span>{tool.id==="merge-pdf"||tool.id==="pictures-pdf"||tool.id==="zip-create"||tool.id==="text-merge"?"You can select multiple files":"Select a file to get started"}</span></button>
   <input ref={inputRef} type="file" hidden multiple={["merge-pdf","pictures-pdf","zip-create","text-merge"].includes(tool.id)} accept={accept} onChange={e=>addFiles(e.target.files)}/>
   {files.length>0&&<div className="selected-files">{files.map((f,i)=><div key={i}><FileText size={16}/><span>{f.name}<small>{(f.size/1024).toFixed(1)} KB</small></span><button onClick={()=>setFiles(old=>old.filter((_,j)=>j!==i))}><X size={15}/></button></div>)}</div>}
   <div className="panel-divider"/>
   <div className="panel-heading"><span className="step">02</span><div><h3>Adjust settings</h3><p>Choose how you want your result to look.</p></div></div>
   {tool.id==="extract-pdf"&&<label className="field-label">Page numbers <input value={pages} onChange={e=>setPages(e.target.value)} placeholder="Example: 1, 3-5"/></label>}
   {tool.id==="watermark-pdf"&&<label className="field-label">Watermark text <input value={text} onChange={e=>setText(e.target.value)}/></label>}
   {["rotate-pdf","rotate-image"].includes(tool.id)&&<label className="field-label">Rotation <select value={rotation} onChange={e=>setRotation(e.target.value)}><option value="90">90° clockwise</option><option value="180">180°</option><option value="270">270° clockwise</option></select></label>}
   {["compress-image","resize-image","convert-image"].includes(tool.id)&&<div className="settings-grid">{tool.id==="resize-image"&&<><label className="field-label">Width (px)<input type="number" min="1" max="8000" value={width} onChange={e=>setWidth(e.target.value)}/></label><label className="field-label">Height (px)<input type="number" min="1" max="8000" value={height} onChange={e=>setHeight(e.target.value)}/></label></>}<label className="field-label">Quality · {quality}%<input type="range" min="20" max="100" value={quality} onChange={e=>setQuality(e.target.value)}/></label><label className="field-label">Output format<select value={format} onChange={e=>setFormat(e.target.value)}><option value="webp">WebP</option><option value="jpeg">JPG</option><option value="png">PNG</option></select></label></div>}
   {tool.id==="qr"&&<label className="field-label">Text or website link<input value={text} onChange={e=>setText(e.target.value)} placeholder="https://example.com"/></label>}
   {tool.id==="unit-convert"&&<div className="settings-grid"><label className="field-label">Value<input type="number" value={unitValue} onChange={e=>setUnitValue(e.target.value)}/></label><label className="field-label">Convert from<select value={unit} onChange={e=>setUnit(e.target.value)}><option value="km">Kilometers to meters</option><option value="kg">Kilograms to grams</option></select></label></div>}
   {tool.id==="text-diff"&&<div className="settings-grid"><label className="field-label">Original text<textarea rows={5} value={textA} onChange={e=>setTextA(e.target.value)}/></label><label className="field-label">New text<textarea rows={5} value={textB} onChange={e=>setTextB(e.target.value)}/></label></div>}
   <button className="primary-btn process-btn" onClick={run}><Zap size={17}/> Start processing</button>
   {status&&<div className="status-message"><Check size={16}/>{status}</div>}{error&&<div className="error-message">{error}</div>}
   {result&&<div className="result-panel"><div className="result-heading"><Check size={18}/> Result ready</div>{result.url&&tool.id==="qr"&&<img className="qr-preview" src={result.url} />}{result.message&&<pre>{result.message}</pre>}{result.blob&&<div className="result-file"><FileText/><span>{result.name}<small>{(result.blob.size/1024).toFixed(1)} KB</small></span></div>}{result.url&&result.blob&&<a className="download-btn" href={result.url} download={result.name}><ArrowDownToLine size={16}/> Download result</a>}{result.url&&tool.id==="qr"&&<a className="download-btn" href={result.url} download="fileforge-qr.png"><ArrowDownToLine size={16}/> Download QR code</a>}<button className="reset-btn" onClick={()=>{setFiles([]);setResult(null);setStatus("");setError("")}}>Start again</button></div>}
  </section><aside className="side-panel"><div className="side-card"><ShieldCheck size={23}/><h3>Your privacy matters</h3><p>Supported tools process your files locally in this browser. FileForge does not automatically upload your files.</p></div><div className="side-card help-card"><Sparkles size={21}/><h3>How it works</h3><ol><li>Choose a file from your device.</li><li>Adjust the settings you need.</li><li>Start processing and save your result.</li></ol></div><div className="side-note"><LockKeyhole size={15}/> Your original file is never overwritten.</div></aside></div>}
 </main>
}
function Footer(){return <footer className="footer"><div className="footer-features"><div><ShieldCheck/><b>Private processing</b><p>Your files stay on your device when using supported local tools.</p></div><div><Sparkles/><b>Easy to use</b><p>Choose a tool, select a file and save your result.</p></div><div><Heart/><b>Free to use</b><p>Use the available tools without creating an account.</p></div></div><div className="footer-bottom"><button className="brand" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}><span className="brand-mark"><FileText size={19}/></span><span>File<span>Forge</span></span></button><span>© {new Date().getFullYear()} FileForge. Made for your files.</span><div><a href="mailto:hello@fileforge.local">Contact</a><a href="#tools">Explore tools</a><a href="#tools">Privacy-first</a></div></div></footer>}
export default App;
