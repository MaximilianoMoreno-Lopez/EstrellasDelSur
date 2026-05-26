import{s as l,i as g}from"./supabase.Cwf-B4Rc.js";let o=[];async function m(){const{data:{session:e}}=await l.auth.getSession();if(!e){window.location.replace("/portal/login/");return}if(!g(e.user.email)){window.location.replace("/portal/dashboard/");return}const{data:a,error:n}=await l.from("participantes").select("*").order("updated_at",{ascending:!1});if(n){document.getElementById("loadingState").innerHTML=`<p style="color:#dc2626">Error: ${n.message}</p>`;return}o=a||[],c(o),document.getElementById("participantCount").textContent=`${o.length} participante${o.length!==1?"s":""} registrado${o.length!==1?"s":""}`,document.getElementById("loadingState").style.display="none",document.getElementById("adminContent").style.display="block"}async function c(e){const a=document.getElementById("adminTableBody"),n=document.getElementById("noResults");if(e.length===0){a.innerHTML="",n.style.display="block";return}n.style.display="none";const d=await Promise.all(e.map(async t=>{let i='<span class="badge badge-missing">Sin PDF</span>';if(t.pdf_url){const{data:r}=await l.storage.from("travel-plans").createSignedUrl(t.pdf_url,3600);r&&(i=`<a href="${r.signedUrl}" target="_blank" rel="noopener" class="pdf-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              ${t.pdf_nombre||"Ver PDF"}
            </a>`)}const u=t.updated_at?new Date(t.updated_at).toLocaleDateString("es-ES"):"—";return`
          <tr>
            <td>${t.nombre||"—"}</td>
            <td>${t.apellidos||"—"}</td>
            <td><code>${t.dni||"—"}</code></td>
            <td>${t.siglas_proyecto?`<span class="badge-proyecto">${t.siglas_proyecto}</span>`:"—"}</td>
            <td>${s(t.fecha_nacimiento)}</td>
            <td>${s(t.dia_salida)}</td>
            <td>${t.hora_salida?t.hora_salida.slice(0,5):"—"}</td>
            <td>${t.ciudad_salida||"—"}</td>
            <td>${t.aeropuerto_salida_espana||"—"}</td>
            <td>${s(t.dia_llegada_espana)}</td>
            <td>${t.hora_llegada?t.hora_llegada.slice(0,5):"—"}</td>
            <td>${t.ciudad_llegada_espana||"—"}</td>
            <td>${t.aeropuerto_llegada||"—"}</td>
            <td>${t.precio_total!=null?t.precio_total.toFixed(2)+" €":"—"}</td>
            <td>${i}</td>
            <td class="muted">${u}</td>
          </tr>
        `}));a.innerHTML=d.join("")}function s(e){return e?new Date(e+"T00:00:00").toLocaleDateString("es-ES"):"—"}document.getElementById("searchInput").addEventListener("input",e=>{const a=e.target.value.toLowerCase(),n=o.filter(d=>(d.nombre||"").toLowerCase().includes(a)||(d.apellidos||"").toLowerCase().includes(a)||(d.dni||"").toLowerCase().includes(a)||(d.siglas_proyecto||"").toLowerCase().includes(a));c(n)});m();
