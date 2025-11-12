// app.js - parse CSV, render leaderboard and charts, player details modal

const csvPath = 'data/final_standings.csv';
const promptDir = 'data/prompt_collection/';

let players = [];
let playersWithYaml = []; // enriched with YAML data
let pinnedPlayer = null;
let currentSort = 'rank'; // 'rank', 'winRate', 'mu'
let winRateChart, ratingChart, gamesChart;

function fetchCSV(path){
  return fetch(path).then(r => r.text());
}

function parseCSV(text){
  return Papa.parse(text, {header:true, skipEmptyLines:true, dynamicTyping:true}).data;
}

function buildLeaderboard(data){
  const tbody = document.querySelector('#leaderboard tbody');
  tbody.innerHTML = '';
  
  // sort based on currentSort
  let sorted = [...data];
  if(currentSort === 'rank') sorted.sort((a,b) => a.Rank - b.Rank);
  else if(currentSort === 'winRate') sorted.sort((a,b) => b.Win_Rate - a.Win_Rate);
  else if(currentSort === 'mu') sorted.sort((a,b) => b.Rating_Mu - a.Rating_Mu);
  
  // pinned player goes first
  if(pinnedPlayer){
    const pinIdx = sorted.findIndex(p => p.Player === pinnedPlayer);
    if(pinIdx > -1){
      const [pinned] = sorted.splice(pinIdx, 1);
      sorted.unshift(pinned);
    }
  }
  
  sorted.forEach((p, idx) => {
    const tr = document.createElement('tr');
    const isPinned = (pinnedPlayer === p.Player);
    const isTop3 = (p.Rank <= 3);
    const isHighWinRate = (p.Win_Rate > 0.8);
    
    if(isPinned) tr.classList.add('pinned');
    if(isTop3) tr.classList.add(`rank-${p.Rank}`);
    if(isHighWinRate) tr.classList.add('high-winrate');
    
    const modelName = p.model || 'N/A';
    
    tr.innerHTML = `
      <td>${p.Rank}</td>
      <td class="player-name">${p.Player}</td>
      <td>${modelName}</td>
      <td>${p.Rating_Mu} ± ${p.Rating_Sigma}</td>
      <td>${p.Wins}</td>
      <td>${p.Draws}</td>
      <td>${p.Losses}</td>
      <td class="win-rate-cell">${(p.Win_Rate*100).toFixed(1)}%</td>
      <td><button class="pin-btn ${isPinned?'pinned':''}" data-player="${p.Player}">${isPinned?'Unpin':'Pin'}</button></td>
    `;
    
    // click row for details (except button)
    tr.addEventListener('click', (e) => {
      if(!e.target.classList.contains('pin-btn')) showPlayerDetails(p);
    });
    
    tbody.appendChild(tr);
  });
  
  // wire pin buttons
  document.querySelectorAll('.pin-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const player = e.target.dataset.player;
      if(pinnedPlayer === player) pinnedPlayer = null;
      else pinnedPlayer = player;
      buildLeaderboard(playersWithYaml);
    });
  });
}

function computeStats(data){
  // arrays for charts
  const names = data.map(d => d.Player);
  const winRates = data.map(d => Number(d.Win_Rate));
  const mus = data.map(d => Number(d.Rating_Mu));
  const wins = data.map(d => Number(d.Wins));
  const draws = data.map(d => Number(d.Draws));
  const losses = data.map(d => Number(d.Losses));
  return {names, winRates, mus, wins, draws, losses};
}

function renderWinRateChart(names, winRates){
  const ctx = document.getElementById('winRateChart');
  if(winRateChart) winRateChart.destroy();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#e6eef8' : '#111827';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
  winRateChart = new Chart(ctx, {
    type:'bar',
    data:{labels:names, datasets:[{label:'Win Rate',data:winRates.map(v=>v*100),backgroundColor:'rgba(54,162,235,0.7)'}]},
    options:{
      indexAxis:'y',
      scales:{
        x:{beginAtZero:true,max:100,ticks:{color:textColor},grid:{color:gridColor}},
        y:{ticks:{color:textColor},grid:{color:gridColor}}
      },
      maintainAspectRatio:false,
      plugins:{
        legend:{display:false},
        tooltip:{backgroundColor:isDark?'#1a2332':'#fff',titleColor:textColor,bodyColor:textColor,borderColor:gridColor,borderWidth:1}
      }
    }
  });
}

function renderRatingChart(names, mus){
  const ctx = document.getElementById('ratingChart');
  if(ratingChart) ratingChart.destroy();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#e6eef8' : '#111827';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
  ratingChart = new Chart(ctx, {
    type:'bar',
    data:{labels:names,datasets:[{label:'Mu',data:mus,backgroundColor:'rgba(255,159,64,0.75)'}]},
    options:{
      scales:{
        y:{beginAtZero:false,ticks:{color:textColor},grid:{color:gridColor}},
        x:{ticks:{color:textColor},grid:{color:gridColor}}
      },
      maintainAspectRatio:false,
      plugins:{
        legend:{display:false},
        tooltip:{backgroundColor:isDark?'#1a2332':'#fff',titleColor:textColor,bodyColor:textColor,borderColor:gridColor,borderWidth:1}
      }
    }
  });
}

function renderGamesChart(names,wins,draws,losses){
  const ctx = document.getElementById('gamesChart');
  if(gamesChart) gamesChart.destroy();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#e6eef8' : '#111827';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
  gamesChart = new Chart(ctx, {
    type:'bar',
    data:{labels:names,datasets:[
      {label:'Wins',data:wins,backgroundColor:'rgba(75,192,192,0.8)'},
      {label:'Draws',data:draws,backgroundColor:'rgba(201,203,207,0.9)'},
      {label:'Losses',data:losses,backgroundColor:'rgba(255,99,132,0.8)'}
    ]},
    options:{
      scales:{
        x:{stacked:true,ticks:{color:textColor},grid:{color:gridColor}},
        y:{stacked:true,beginAtZero:true,ticks:{color:textColor},grid:{color:gridColor}}
      },
      maintainAspectRatio:false,
      plugins:{
        legend:{labels:{color:textColor}},
        tooltip:{backgroundColor:isDark?'#1a2332':'#fff',titleColor:textColor,bodyColor:textColor,borderColor:gridColor,borderWidth:1}
      }
    }
  });
}

function showPlayerDetails(player){
  const modal = document.getElementById('playerModal');
  const container = document.getElementById('playerDetails');
  
  const modelInfo = player.model && player.model !== 'N/A' ? `<p><strong>Model:</strong> ${player.model}</p>` : '';
  const strategyInfo = player.strategy ? `<p><strong>Strategy:</strong> ${player.strategy}</p>` : '';
  
  // For nested YAML structure, extract more details
  let additionalInfo = '';
  if(player.yamlData && player.yamlData.agent0){
    const agent = player.yamlData.agent0;
    if(agent.model && agent.model.params){
      const params = agent.model.params;
      additionalInfo += '<div style="margin-top:1rem"><strong>Model Parameters:</strong><ul style="margin:0.5rem 0">';
      for(const [key, value] of Object.entries(params)){
        additionalInfo += `<li><strong>${key}:</strong> ${value}</li>`;
      }
      additionalInfo += '</ul></div>';
    }
  }
  
  const promptInfo = player.prompt ? `<p><strong>System Prompt:</strong></p><pre style="background:var(--hover);padding:0.75rem;border-radius:8px;overflow:auto;max-height:300px;font-size:0.85rem;border:2px solid var(--border)">${player.prompt.trim()}</pre>` : '';
  
  container.innerHTML = `<h2>${player.Player} — Rank #${player.Rank}</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1rem 0">
      <div>
        <p><strong>Rating:</strong> ${player.Rating_Mu} ± ${player.Rating_Sigma}</p>
        <p><strong>Win Rate:</strong> ${(player.Win_Rate*100).toFixed(1)}%</p>
      </div>
      <div>
        <p><strong>Record:</strong> ${player.Wins}W / ${player.Draws}D / ${player.Losses}L</p>
        <p><strong>Total Games:</strong> ${player.Games}</p>
      </div>
    </div>
    ${modelInfo}
    ${additionalInfo}
    ${strategyInfo}
    ${promptInfo}
    <div id="playerYaml" style="margin-top:0.6rem"></div>
  `;
  modal.setAttribute('aria-hidden','false');
}

function closeModal(){
  document.getElementById('playerModal').setAttribute('aria-hidden','true');
}

function initTheme(){
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  btn.addEventListener('click', ()=>{
    const isDark = root.getAttribute('data-theme') === 'dark';
    root.setAttribute('data-theme', isDark ? 'light' : 'dark');
    // Re-render charts with new theme colors
    if(playersWithYaml.length > 0){
      const s = computeStats(playersWithYaml);
      renderWinRateChart(s.names, s.winRates);
      renderRatingChart(s.names, s.mus);
      renderGamesChart(s.names, s.wins, s.draws, s.losses);
    }
  });
}

function initSearch(){
  const input = document.getElementById('searchInput');
  input.addEventListener('input', (e)=>{
    const q = e.target.value.toLowerCase().trim();
    const rows = document.querySelectorAll('#leaderboard tbody tr');
    rows.forEach(r=>{
      const name = r.querySelector('.player-name').textContent.toLowerCase();
      r.style.display = name.includes(q) ? '' : 'none';
    });
  });
}

function initSortControls(){
  document.getElementById('sortRank').addEventListener('click', ()=>{
    currentSort = 'rank';
    updateSortButtons();
    buildLeaderboard(playersWithYaml);
  });
  document.getElementById('sortWinRate').addEventListener('click', ()=>{
    currentSort = 'winRate';
    updateSortButtons();
    buildLeaderboard(playersWithYaml);
  });
  document.getElementById('sortMu').addEventListener('click', ()=>{
    currentSort = 'mu';
    updateSortButtons();
    buildLeaderboard(playersWithYaml);
  });
}

function updateSortButtons(){
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  if(currentSort === 'rank') document.getElementById('sortRank').classList.add('active');
  else if(currentSort === 'winRate') document.getElementById('sortWinRate').classList.add('active');
  else if(currentSort === 'mu') document.getElementById('sortMu').classList.add('active');
}

async function enrichPlayersWithYaml(players){
  const enriched = [];
  
  // Try to load all YAML files first to build a mapping
  const yamlFiles = [];
  for(const p of players){
    // Try multiple filename patterns
    const patterns = [
      p.Player.replace(/\s+/g,'_'),  // spaces to underscores
      p.Player.replace(/\s+/g,''),   // no spaces
      p.Player.toLowerCase().replace(/\s+/g,'_'),  // lowercase with underscores
      p.Player.toLowerCase().replace(/\s+/g,''),   // lowercase no spaces
      p.Player.toLowerCase().replace(/\s+/g,'-'),  // lowercase with dashes
    ];
    
    let foundYaml = null;
    for(const pattern of patterns){
      try{
        const resp = await fetch(promptDir + pattern + '.yaml');
        if(resp.ok){
          const txt = await resp.text();
          foundYaml = jsyaml.load(txt);
          break;
        }
      } catch(e){}
      
      // Try .yml extension too
      try{
        const resp = await fetch(promptDir + pattern + '.yml');
        if(resp.ok){
          const txt = await resp.text();
          foundYaml = jsyaml.load(txt);
          break;
        }
      } catch(e){}
    }
    
    if(foundYaml){
      // Try multiple fields to extract model name
      let model = 'Unknown Model';
      let strategy = null;
      let prompt = null;
      
      // Check for agent0 structure (chess game format)
      if(foundYaml.agent0 && foundYaml.agent0.model){
        if(foundYaml.agent0.model.name){
          model = foundYaml.agent0.model.name;
          if(foundYaml.agent0.model.provider){
            model = `${foundYaml.agent0.model.provider} ${model}`;
          }
        }
        if(foundYaml.agent0.prompts && foundYaml.agent0.prompts.system_prompt){
          prompt = foundYaml.agent0.prompts.system_prompt;
        }
      } 
      // Fallback to direct fields
      else {
        model = foundYaml.model || foundYaml.Model || foundYaml.MODEL || 
               foundYaml.llm || foundYaml.LLM || 
               foundYaml.model_name || foundYaml.modelName ||
               foundYaml.agent || foundYaml.Agent ||
               foundYaml.name || 'Unknown Model';
        
        strategy = foundYaml.strategy || foundYaml.Strategy || foundYaml.approach || foundYaml.description || null;
        prompt = foundYaml.prompt || foundYaml.Prompt || foundYaml.system_prompt || foundYaml.systemPrompt || foundYaml.instruction || null;
      }
      
      enriched.push({...p, model, strategy, prompt, yamlData: foundYaml});
    } else {
      enriched.push({...p, model: 'N/A', strategy: null, prompt: null, yamlData: null});
    }
  }
  return enriched;
}

// boot
fetchCSV(csvPath).then(txt => {
  players = parseCSV(txt);
  // ensure numeric types and rank sort
  players = players.map(p=>({
    Rank: Number(p.Rank),
    Player: p.Player,
    Rating_Mu: Number(p.Rating_Mu),
    Rating_Sigma: Number(p.Rating_Sigma),
    Wins: Number(p.Wins),
    Draws: Number(p.Draws),
    Losses: Number(p.Losses),
    Games: Number(p.Games),
    Win_Rate: Number(p.Win_Rate)
  })).sort((a,b)=>a.Rank - b.Rank);

  // enrich with YAML data
  enrichPlayersWithYaml(players).then(enriched => {
    playersWithYaml = enriched;
    
    buildLeaderboard(playersWithYaml);
    const s = computeStats(playersWithYaml);
    renderWinRateChart(s.names, s.winRates);
    renderRatingChart(s.names, s.mus);
    renderGamesChart(s.names, s.wins, s.draws, s.losses);

    initTheme();
    initSearch();
    initSortControls();
  });
});

// modal close wiring
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('playerModal').addEventListener('click', (e)=>{ if(e.target.id==='playerModal') closeModal(); });
