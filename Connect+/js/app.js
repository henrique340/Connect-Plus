/* app.js — controlador principal */
(function(){
  // --- Helpers / Estado
  function getState(){
    try{ return JSON.parse(localStorage.getItem('cp_state')) || {xp:0, level:1, missions:{}}; }catch(e){ return {xp:0, level:1, missions:{}}; }
  }
  function saveState(s){ localStorage.setItem('cp_state', JSON.stringify(s)); }
  function getUser(){ return JSON.parse(localStorage.getItem('cp_user') || 'null'); }

  // Inicializa exemplo de cards (apenas se ainda não existir)
  const defaultMissions = [
    {id:'reception', title:'Conheça a Recepção', area:'Térreo', xp:50},
    {id:'refeitorio', title:'Descubra o Refeitório', area:'Térreo', xp:50},
    {id:'rest', title:'Área de Descanso', area:'Térreo', xp:30},
    {id:'finance', title:'Conheça o Financeiro', area:'1º Andar', xp:40},
    {id:'devlab', title:'Ambiente de Desenvolvimento', area:'Laboratório', xp:80},
    {id:'rh', title:'Conheça o RH', area:'2º Andar', xp:60},
    {id:'tour', title:'Tour pelo Escritório', area:'Todo o prédio', xp:30},
    {id:'policies', title:'Políticas da Empresa', area:'Documentação', xp:100},
    {id:'explore', title:'Explore o Prédio', area:'Térreo', xp:100},
    {id:'slack', title:'Slack - Tutorial', area:'Digital', xp:30},
    {id:'myoracle', title:'MyOracle - Tutorial', area:'Digital', xp:30},
    {id:'learn', title:'Learn - Trilha', area:'Digital', xp:60},
    {id:'welcome_video', title:'Vídeo de Boas-vindas', area:'Cultura', xp:50},
    {id:'quiz_cultura', title:'Quiz Cultural', area:'Cultura', xp:150},
    {id:'impact_latam', title:'Impacto LATAM', area:'Impacto', xp:100},
    {id:'impact_vol', title:'Oracle Volunteers', area:'Impacto', xp:100},
    {id:'coffee', title:'Coffee Connect', area:'Networking', xp:50},
    {id:'share', title:'Compartilhar História', area:'Networking', xp:50}
  ];
  if(!localStorage.getItem('cp_missions')) localStorage.setItem('cp_missions', JSON.stringify(defaultMissions));

  // --- Render Dashboard (se houver containers)
  const cardsGrid = document.getElementById('cards-grid');
  const xpText = document.getElementById('xp-text');
  const xpBar = document.getElementById('xp-bar');
  const missionsBar = document.getElementById('missions-bar');
  const completedText = document.getElementById('completed-text');
  const levelEl = document.getElementById('user-level');
  const rankingEl = document.getElementById('ranking-list');

  function renderDashboard(){
    if(!cardsGrid) return;
    const missions = JSON.parse(localStorage.getItem('cp_missions') || '[]');
    const state = getState();
    cardsGrid.innerHTML = '';
    let total = missions.length;
    let doneCount = 0;

    missions.forEach(m => {
      const done = (state.missions[m.id] && state.missions[m.id].done) || false;
      if(done) doneCount++;
      const status = done ? 'done' : (state.missions[m.id] && state.missions[m.id].started ? 'progress' : 'pending');

      const el = document.createElement('div');
      el.className = 'card';
      el.setAttribute('data-status', status);
      el.setAttribute('data-id', m.id);
      el.setAttribute('data-title', m.title);
      el.innerHTML = `
        <div class="card-row">
          <div>
            <h3>${m.title}</h3>
            <p class="muted">${m.area}</p>
          </div>
          <div class="badge muted">${m.xp} pts</div>
        </div>
        <p class="muted">${m.title} — descrição resumida.</p>
        <div style="margin-top:12px;display:flex;gap:8px">
          ${status==='done' ? `<button class="btn" data-action="view" data-id="${m.id}">Concluída</button>` :
            `<button class="btn primary" data-action="start" data-id="${m.id}">Iniciar</button>
             <button class="btn" data-action="finish" data-id="${m.id}">Concluir</button>`}
        </div>
      `;
      cardsGrid.appendChild(el);
    });

    // XP e progresso
    const xp = state.xp || 0;
    const level = state.level || 1;
    xpText.textContent = `${xp} / 1000 XP`;
    xpBar.style.width = `${Math.min(100, (xp / 1000) * 100)}%`;
    levelEl && (levelEl.textContent = level);
    completedText && (completedText.textContent = `${doneCount} / ${total}`);
    missionsBar && (missionsBar.style.width = `${Math.round((doneCount/Math.max(1,total))*100)}%`);

    // ranking demo
    if(rankingEl){
      const rank = [
        {name:getUser()?.name||'Você', xp: xp},
        {name:'Alice', xp: xp+120},
        {name:'Bruno', xp: xp+40},
        {name:'Carla', xp: xp+20}
      ];
      rankingEl.innerHTML = rank.map(r=>`<li>${r.name} — ${r.xp} XP</li>`).join('');
    }
    attachCardActions();
  }

  function attachCardActions(){
    document.querySelectorAll('[data-action]').forEach(btn=>{
      btn.removeEventListener('click', actionHandler);
      btn.addEventListener('click', actionHandler);
    });
  }

  function actionHandler(e){
    const btn = e.currentTarget;
    const act = btn.dataset.action;
    const id = btn.dataset.id;
    if(act === 'start'){
      const s = getState();
      s.missions[id] = s.missions[id] || {};
      s.missions[id].started = true;
      saveState(s);
      renderDashboard();
      return;
    }
    if(act === 'finish'){
      // completar missão (dá XP)
      const missions = JSON.parse(localStorage.getItem('cp_missions') || '[]');
      const m = missions.find(x=>x.id===id);
      const xp = m ? m.xp : 10;
      completeMission({id, xp, badge: null});
      renderDashboard();
      return;
    }
    if(act === 'view'){
      alert('Missão já concluída!');
    }
  }

  // --- evento global para completar missão vindo de outras páginas
  window.addEventListener('cp:completeMission', function(ev){
    completeMission(ev.detail);
  });

  function completeMission(detail){
    if(!detail || !detail.id) return;
    const s = getState();
    s.missions = s.missions || {};
    if(s.missions[detail.id] && s.missions[detail.id].done) return; // já concluída
    s.missions[detail.id] = s.missions[detail.id] || {};
    s.missions[detail.id].done = true;
    s.missions[detail.id].date = new Date().toISOString();
    s.xp = (s.xp || 0) + (detail.xp || 0);
    // level up simples: a cada 1000xp aumenta 1 level
    s.level = Math.floor((s.xp || 0) / 1000) + 1;
    // badges (simples)
    s.badges = s.badges || [];
    if(detail.badge) s.badges.push({badge:detail.badge, when:new Date().toISOString()});
    saveState(s);
    renderDashboard();
    // optional toast
    console.info(`Missão ${detail.id} concluída: +${detail.xp} XP`, detail.badge ? `Badge: ${detail.badge}` : '');
    // small visual feedback
    if(typeof toastr !== 'undefined') toastr.success(`+${detail.xp} XP`);
  }

  // --- Filtro buttons (dashboard)
  document.querySelectorAll('[data-filter]').forEach(b=>{
    b.addEventListener('click', function(){
      const f = this.dataset.filter;
      document.querySelectorAll('#cards-grid .card').forEach(card=>{
        const st = card.dataset.status;
        if(f === 'all' || f === st) card.style.display = 'block'; else card.style.display = 'none';
      });
      // active style
      document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('primary'));
      this.classList.add('primary');
    });
  });

  // Inicializa render
  renderDashboard();

  // expõe helper para console dev
  window.cp = {getState, saveState, completeMission, renderDashboard};
})();
