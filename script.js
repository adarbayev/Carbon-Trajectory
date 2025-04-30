// --- DOM Elements ---
const homeSection = document.getElementById('home-section');
const toolSection = document.getElementById('tool-section');
const tryToolBtn = document.getElementById('try-tool-btn');
const baselineDisplay = document.getElementById('baseline-display');
const baselineYearInput = document.getElementById('baseline-year');
const baselineModal = document.getElementById('baseline-modal');
const modalBaselineScope1 = document.getElementById('modal-baseline-scope1');
const modalBaselineScope2 = document.getElementById('modal-baseline-scope2');
const growthRateModal = document.getElementById('growth-rate-modal');
const modalGrowthP1Label = document.getElementById('modal-growth-p1-label');
const modalGrowthP1 = document.getElementById('modal-growth-p1');
const modalGrowthP2 = document.getElementById('modal-growth-p2');
const modalGrowthP3 = document.getElementById('modal-growth-p3');
const growthDisplayP1 = document.getElementById('growth-display-p1');
const growthDisplayP2 = document.getElementById('growth-display-p2');
const growthDisplayP3 = document.getElementById('growth-display-p3');
const targetReductionInput = document.getElementById('target-reduction');
const sbtiCheckbox = document.getElementById('sbti-checkbox');
const sbtiNote = document.getElementById('sbti-note');
const addScenarioBtn = document.getElementById('add-scenario-btn');
const scenariosListContainer = document.getElementById('scenarios-list');
const measuresModal = document.getElementById('measures-modal');
const measuresModalTitle = document.getElementById('measures-modal-title');
const modalMeasuresList = document.getElementById('modal-measures-list');
const modalAddMeasureBtn = document.getElementById('modal-add-measure-btn');
const trajectoryCtx = document.getElementById('trajectoryChart').getContext('2d');
const maccCtx = document.getElementById('maccChart').getContext('2d');
const wedgeCtx = document.getElementById('wedgeChart').getContext('2d');
const maccScenarioInfo = document.getElementById('macc-scenario-info');
const wedgeScenarioInfo = document.getElementById('wedge-scenario-info');
const maccYearSelect = document.getElementById('macc-year-select');
// Tab elements
const tabBtnDashboard = document.getElementById('tab-btn-dashboard');
const tabBtnMacc = document.getElementById('tab-btn-macc');
const tabBtnWedges = document.getElementById('tab-btn-wedges');
const tabBtnRisks = document.getElementById('tab-btn-risks'); // Risk Tab Button
const tabContentDashboard = document.getElementById('tab-content-dashboard');
const tabContentMacc = document.getElementById('tab-content-macc');
const tabContentWedges = document.getElementById('tab-content-wedges');
const tabContentRisks = document.getElementById('tab-content-risks'); // Risk Tab Content
// Risk Tab Elements
const riskMapContainer = document.getElementById('risk-map-container');
const addSiteBtn = document.getElementById('add-site-btn');
const siteInputForm = document.getElementById('site-input-form');
const siteListDiv = document.getElementById('site-list');


// --- Global State ---
let trajectoryChartInstance; let maccChartInstance; let wedgeChartInstance;
let isToolInitialized = false;
const scenarioColors = ['#14b8a6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#d946ef', '#84cc16'];
const wedgeColors = [ '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081', '#fec44f', '#fe9929', '#d95f0e', '#993404', '#bcbddc', '#efedf5', '#f7f7f7', '#cccccc', '#969696', '#636363', '#252525'];
let scenarioColorIndex = 0; let activeTab = 'dashboard';
let scenariosDataStore = [];
let currentEditingScenarioId = null;
let baselineData = { scope1: 6000, scope2: 4000 };
let growthRates = { p1: 2.0, p2: 1.5, p3: 1.0 };
// Risk Map State
let riskMapInstance = null;
let riskMapInitialized = false;
let sitesData = []; // To store added site info {id, name, code, type, lat, lon}
let siteMarkersLayer = null; // Leaflet LayerGroup


// --- Chart Configurations ---
const baseTrajectoryChartConfig = {
     type: 'line',
     data: {
         labels: [],
         datasets: [
             { label: 'Business As Usual (BAU)', data: [], borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', tension: 0.1, borderWidth: 2.5, pointBackgroundColor: '#ef4444', pointRadius: 3, pointHoverRadius: 6, fill: false, order: 1 },
             { label: 'Target Path', data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.1, borderDash: [6, 6], borderWidth: 2.5, pointBackgroundColor: '#3b82f6', pointRadius: 3, pointHoverRadius: 6, fill: false, order: 2 },
             { label: 'Near-Term Target Level (-42%)', data: [], borderColor: 'rgba(234, 179, 8, 0.6)', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, fill: false, hidden: true, order: 0 },
             { label: 'Long-Term Target Level (-90%)', data: [], borderColor: 'rgba(220, 38, 38, 0.6)', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, fill: false, hidden: true, order: 0 }
         ]
     },
     // Options updated in updateTrajectoryChart to handle legend filtering
     options: {
         responsive: true, maintainAspectRatio: false,
         scales: { /* ... scales ... */ },
         plugins: { /* ... plugins ... */ },
         interaction: { /* ... interaction ... */ }
     }
};

const baseMaccChartConfig = {
    type: 'line',
    data: { datasets: [] }, // Datasets generated dynamically
    options: { /* ... MACC options (Multi-Dataset Stepped Line) ... */
        responsive: true, maintainAspectRatio: false,
        scales: {
             x: { type: 'linear', title: { display: true, text: 'Cumulative Annual Abatement (tCO2eq/yr)', font: {size: 14, weight: '500'}, color: '#4b5563' }, beginAtZero: true, grid: { display: false } },
             y: { type: 'linear', title: { display: true, text: 'Marginal Abatement Cost ($/tCO2eq)', font: {size: 14, weight: '500'}, color: '#4b5563' }, grid: { color: '#e5e7eb' } }
        },
        plugins: {
            tooltip: { mode: 'dataset', intersect: false, callbacks: { label: function(context) { const m = context.dataset.measureData; return m ? `MAC: $${m.mac.toFixed(2)} / tCO2eq` : ''; }, footer: function(t) { const m=t[0]?.dataset.measureData; return m ? [`Abatement: ${m.annualAbatementForSelectedYear.toFixed(0)} tCO2eq/yr`,`Annualized Cost: $${m.annualizedCost.toFixed(0)} /yr`] : ''; }}},
            legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 12 }, boxWidth: 15 }}
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
};

const baseWedgeChartConfig = {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: { /* ... wedge options ... */
        responsive: true, maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: 'Year', font: { size: 14, weight: '500' }, color: '#4b5563' } },
            y: { stacked: true, title: { display: true, text: 'Cumulative Annual Abatement (tCO2eq/yr)', font: { size: 14, weight: '500' }, color: '#4b5563' }, beginAtZero: true }
        },
        plugins: {
            tooltip: { mode: 'index', intersect: false, callbacks: { label: function(c) { let l = c.dataset.label || ''; if(l) l+=': '; let cur=c.parsed.y||0; let prev=0; if(c.datasetIndex>0){const pds=c.chart.data.datasets[c.datasetIndex-1];if(pds.data.length>c.dataIndex)prev=pds.data[c.dataIndex]||0;} const iV=cur-prev;l+=`${iV.toFixed(0)} tCO2eq/yr`; return l; }}},
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 13 }, color: '#374151' } }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
};

// --- Modal Management ---
// (Functions open/close/saveBaselineModal, open/close/saveGrowthRateModal, open/close/saveAndCloseMeasuresModal remain unchanged)
window.openBaselineModal = function() { modalBaselineScope1.value = baselineData.scope1; modalBaselineScope2.value = baselineData.scope2; baselineModal.classList.add('active'); }
window.closeBaselineModal = function() { baselineModal.classList.remove('active'); }
window.saveBaselineModal = function() { baselineData.scope1 = parseFloat(modalBaselineScope1.value) || 0; baselineData.scope2 = parseFloat(modalBaselineScope2.value) || 0; baselineDisplay.textContent = `${(baselineData.scope1 + baselineData.scope2).toFixed(0)} tCO2eq`; closeBaselineModal(); if (isToolInitialized) debouncedCalculateAllData(); }
window.openGrowthRateModal = function() { const y = parseInt(baselineYearInput.value)||0; modalGrowthP1Label.textContent=`P1 (${y}-${y+6})`; modalGrowthP1.value=growthRates.p1.toFixed(1); modalGrowthP2.value=growthRates.p2.toFixed(1); modalGrowthP3.value=growthRates.p3.toFixed(1); growthRateModal.classList.add('active'); }
window.closeGrowthRateModal = function() { growthRateModal.classList.remove('active'); }
window.saveGrowthRateModal = function() { growthRates.p1=parseFloat(modalGrowthP1.value)||0; growthRates.p2=parseFloat(modalGrowthP2.value)||0; growthRates.p3=parseFloat(modalGrowthP3.value)||0; updateGrowthRateDisplay(); closeGrowthRateModal(); if(isToolInitialized) debouncedCalculateAllData(); }
function updateGrowthRateDisplay() { const y=parseInt(baselineYearInput.value)||0; growthDisplayP1.textContent=`P1 (${y}-2030): ${growthRates.p1.toFixed(1)}%`; growthDisplayP2.textContent=`P2 (2031-2040): ${growthRates.p2.toFixed(1)}%`; growthDisplayP3.textContent=`P3 (2041-2050): ${growthRates.p3.toFixed(1)}%`; }
window.openMeasuresModal = function(scenarioId) { currentEditingScenarioId = scenarioId; const scenario = scenariosDataStore.find(s => s.id === scenarioId); if (!scenario) return; measuresModalTitle.textContent = `Edit Measures for ${scenario.name}`; modalMeasuresList.innerHTML = ''; const measures = JSON.parse(JSON.stringify(scenario.measures)); if (measures.length > 0) measures.forEach(m => modalMeasuresList.appendChild(createMeasureBlockElement(m))); else modalMeasuresList.appendChild(createMeasureBlockElement()); measuresModal.classList.add('active'); }
window.closeMeasuresModal = function() { currentEditingScenarioId = null; measuresModal.classList.remove('active'); }
window.saveAndCloseMeasuresModal = function() { if (!currentEditingScenarioId) { closeMeasuresModal(); return; } const idx = scenariosDataStore.findIndex(s=>s.id===currentEditingScenarioId); if (idx === -1) { closeMeasuresModal(); return; } const updatedMeasures = []; const blocks = modalMeasuresList.querySelectorAll('.measure-block'); blocks.forEach((b, i) => { try { const name=b.querySelector('.measure-name-input')?.value.trim(); if(!name) return; const reduction=parseFloat(b.querySelector('.measure-reduction')?.value)||0; const isP=b.querySelector('.measure-permanent')?.value==='yes'; let life=isP?99:(parseInt(b.querySelector('.measure-lifecycle')?.value)||1); life=Math.max(1,life); const isI=b.querySelector('.measure-instant')?.value==='yes'; let ramp=isI?1:(parseInt(b.querySelector('.measure-ramp')?.value)||1); ramp=Math.max(1,ramp); const baseYr=parseInt(baselineYearInput.value)||1990; const startYr=parseInt(b.querySelector('.measure-start-year')?.value)||baseYr; const scope=b.querySelector('.measure-scope')?.value||'Scope 1'; const capex=parseFloat(b.querySelector('.measure-capex')?.value)||0; const opex=parseFloat(b.querySelector('.measure-opex')?.value)||0; const id=b.id||`m-${Date.now()}-${i}`; const data={id,name,reduction,isPermanent:isP,lifecycle:life,isInstant:isI,rampYears:ramp,startYear:startYr,scope,capex,opex}; if(reduction>0&&reduction<=100&&life>0&&startYr>=baseYr&&startYr<=2050&&ramp>0) updatedMeasures.push(data); else console.warn("Invalid measure:",data); } catch(e){console.error("Err reading measure",i,e);} }); scenariosDataStore[idx].measures=updatedMeasures; document.getElementById(currentEditingScenarioId)?.querySelector('.text-xs').textContent=`${updatedMeasures.length} measure(s)`; closeMeasuresModal(); if(isToolInitialized) debouncedCalculateAllData(); }


// --- Calculation & Data ---
function calculateAllData() {
    if (!isToolInitialized) return;
    console.log("[calculateAllData] Starting calculation...");

    const totalBaselineEmissions = (baselineData.scope1 || 0) + (baselineData.scope2 || 0);
    const baselineYear = parseInt(baselineYearInput.value) || new Date().getFullYear();
    const isSBTiAligned = sbtiCheckbox.checked;
    const manualTargetReduction = Math.max(0, Math.min(100, parseFloat(targetReductionInput.value))) / 100 || 0;
    const endYear = 2050;
    const years = Array.from({length: endYear - baselineYear + 1}, (_, i) => baselineYear + i);
    const bauEmissions = [];
    const targetEmissions = [];
    let sbtiNearTermLevel = null;
    let sbtiLongTermLevel = null;

    if (totalBaselineEmissions <= 0 || baselineYear > endYear || baselineYear < 2015) { /* ... error handling ... */ return; }

    let useSBTiLogic = isSBTiAligned;
    const nearTermTargetYear = baselineYear + 10;
    if (isSBTiAligned && nearTermTargetYear > 2050) { useSBTiLogic = false; /* ... revert UI ... */ }

    // Calculate BAU
    let currentBau = totalBaselineEmissions;
    years.forEach((year, i) => {
        if(i>0){ let rate=0; if(year<=2030)rate=growthRates.p1/100; else if(year<=2040)rate=growthRates.p2/100; else rate=growthRates.p3/100; currentBau+=totalBaselineEmissions*rate; }
        bauEmissions.push(Math.max(0, currentBau));
    });

    // Calculate Target Path
    if (useSBTiLogic) { /* ... SBTi logic ... */
        sbtiNearTermLevel = totalBaselineEmissions * (1 - 0.42); sbtiLongTermLevel = totalBaselineEmissions * (1 - 0.90);
        const nearTermYears=nearTermTargetYear-baselineYear; const postNearTermYears=endYear-nearTermTargetYear;
        years.forEach((year,i)=>{ if(i===0)targetEmissions.push(totalBaselineEmissions); else if(year<=nearTermTargetYear){const p=nearTermYears>0?i/nearTermYears:1; targetEmissions.push(Math.max(0,totalBaselineEmissions+(sbtiNearTermLevel-totalBaselineEmissions)*p));} else {const startL=targetEmissions[nearTermYears]??sbtiNearTermLevel; const p=postNearTermYears>0?(year-nearTermTargetYear)/postNearTermYears:1; targetEmissions.push(Math.max(0,startL+(sbtiLongTermLevel-startL)*p));}});
    } else { /* ... Manual Target logic ... */
        const finalTarget=Math.max(0,totalBaselineEmissions*(1-manualTargetReduction)); const totalYrs=endYear-baselineYear;
        years.forEach((year,i)=>{ if(i===0)targetEmissions.push(totalBaselineEmissions); else {const p=totalYrs>0?i/totalYrs:1; targetEmissions.push(Math.max(0,totalBaselineEmissions+(finalTarget-totalBaselineEmissions)*p));}});
    }

    // Calculate Scenario Trajectories & Wedge Data
    const scenariosData = getAllScenariosData();
    const scenarioTrajectories = []; const wedgeDatasets = [];
    if (scenariosData.length > 0) { /* ... scenario trajectory and wedge calc ... */
        scenariosData.forEach((sc) => { const vals = []; years.forEach((yr, i) => { let reduct = 0; sc.measures.forEach(m => { const life=m.isPermanent?99:m.lifecycle; if(yr>=m.startYear && yr<m.startYear+life){ const yIn=yr-m.startYear+1; const rF=m.isInstant?1:Math.min(1,yIn/Math.max(1,m.rampYears)); const b=(m.scope==='Scope 1'?baselineData.scope1:baselineData.scope2)||0; reduct+=b*(m.reduction/100)*rF; } }); vals.push(Math.max(0,bauEmissions[i]-reduct)); }); scenarioTrajectories.push({name:sc.name,color:sc.color,data:vals});});
        const firstSc=scenariosData[0]; wedgeScenarioInfo.textContent=`Abatement: "${firstSc.name}"`; firstSc.measures.forEach((m,idx)=>{wedgeDatasets.push({label:m.name,data:new Array(years.length).fill(0),backgroundColor:`${wedgeColors[idx%wedgeColors.length]}B3`,borderColor:wedgeColors[idx%wedgeColors.length],borderWidth:0.5,pointRadius:0,fill:true,order:idx});}); years.forEach((yr,i)=>{let stackH=0; firstSc.measures.forEach((m,idx)=>{const life=m.isPermanent?99:m.lifecycle; let ab=0; if(yr>=m.startYear&&yr<m.startYear+life){const yIn=yr-m.startYear+1; const rF=m.isInstant?1:Math.min(1,yIn/Math.max(1,m.rampYears)); const b=(m.scope==='Scope 1'?baselineData.scope1:baselineData.scope2)||0; ab=b*(m.reduction/100)*rF;} stackH+=ab; if(wedgeDatasets[idx])wedgeDatasets[idx].data[i]=stackH;});});
    } else { wedgeScenarioInfo.textContent = "Add scenario/measures for wedges."; }

    // Update Trajectory Chart FIRST
    updateTrajectoryChart(years, bauEmissions, targetEmissions, scenarioTrajectories, useSBTiLogic ? sbtiNearTermLevel : null, useSBTiLogic ? sbtiLongTermLevel : null);

    // MACC Calculation (Multi-Dataset)
    const selectedMaccYear = parseInt(maccYearSelect.value) || baselineYear + 1;
    let processedMaccData = []; let maccDatasets = [];
    if (scenariosDataStore.length > 0 && scenariosDataStore[0].measures.length > 0) { /* ... MACC calc ... */
        const firstSc=scenariosDataStore[0]; maccScenarioInfo.textContent=`MACC: "${firstSc.name}" (${selectedMaccYear})`;
        processedMaccData=firstSc.measures.map(m=>{ const life=m.isPermanent?99:Math.max(1,m.lifecycle||1); const pct=m.reduction/100; const base=(m.scope==='Scope 1'?baselineData.scope1:baselineData.scope2)||0; const vB=base>1e-9?base:1e-9; let ab=0; if(selectedMaccYear>=m.startYear&&selectedMaccYear<m.startYear+life){const yIn=selectedMaccYear-m.startYear+1; const rF=m.isInstant?1:Math.min(1,yIn/Math.max(1,m.rampYears)); ab=vB*pct*rF;} const annCapex=(life>0&&!m.isPermanent)?m.capex/life:(m.isPermanent?m.capex/25:m.capex); const annCost=annCapex+m.opex; const mac=(ab>1e-9)?annCost/ab:Infinity; if(ab<=1e-9||!isFinite(mac))return null; return{...m,annualAbatementForSelectedYear:ab,annualizedCost:annCost,mac,lifecycle:life};}).filter(m=>m!==null);
        processedMaccData.sort((a,b)=>a.mac-b.mac); let cumAb=0; processedMaccData.forEach((m,idx)=>{const ab=m.annualAbatementForSelectedYear; const mac=m.mac; const sX=cumAb; const eX=cumAb+ab; const clr=wedgeColors[idx%wedgeColors.length]; maccDatasets.push({label:m.name,data:[{x:sX,y:mac},{x:eX,y:mac}],borderColor:clr,backgroundColor:`${clr}4D`,borderWidth:2,stepped:true,pointRadius:0,pointHoverRadius:5,fill:true,measureData:m}); cumAb=eX;});
    } else { maccScenarioInfo.textContent = scenariosDataStore.length > 0 ? `Add measures to "${scenariosDataStore[0].name}" for MACC.` : "Add scenario/measures for MACC."; }

    updateMaccChart(maccDatasets, selectedMaccYear); // Update MACC
    updateWedgeChart(years, wedgeDatasets); // Update Wedges
}


function getAllScenariosData() { return JSON.parse(JSON.stringify(scenariosDataStore)); }

// --- Chart Update Functions ---
// Updated Trajectory Chart function with refined legend filter
function updateTrajectoryChart(years, bauData, targetData, scenarioTrajectories, nearTermTargetLevel, longTermTargetLevel) {
    if (!trajectoryCtx) { console.error("Trajectory ctx not found!"); return; }
    if (trajectoryChartInstance) { trajectoryChartInstance.destroy(); }

    // Base config is now just a template, full options defined here
    const newChartConfig = {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                { label: 'Business As Usual (BAU)', data: bauData, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', tension: 0.1, borderWidth: 2.5, pointBackgroundColor: '#ef4444', pointRadius: 3, pointHoverRadius: 6, fill: false, order: 1 },
                { label: 'Target Path', data: targetData, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.1, borderDash: [6, 6], borderWidth: 2.5, pointBackgroundColor: '#3b82f6', pointRadius: 3, pointHoverRadius: 6, fill: false, order: 2 },
                { label: 'Near-Term Target Level (-42%)', data: [], borderColor: 'rgba(234, 179, 8, 0.6)', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, fill: false, hidden: true, order: 0 }, // Configured below
                { label: 'Long-Term Target Level (-90%)', data: [], borderColor: 'rgba(220, 38, 38, 0.6)', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, fill: false, hidden: true, order: 0 } // Configured below
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                 x: { title: { display: true, text: 'Year', font: { size: 14, weight: '500' }, color: '#4b5563' }, grid: { display: false }, ticks: { color: '#6b7280' } },
                 y: { title: { display: true, text: 'Emissions (tCO2eq)', font: { size: 14, weight: '500' }, color: '#4b5563' }, beginAtZero: true, grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280' } }
            },
            plugins: {
                tooltip: {
                    mode: 'index', intersect: false, backgroundColor: 'rgba(0, 0, 0, 0.7)', titleFont: { size: 14, weight: '600' }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 4, boxPadding: 5,
                    filter: function(tooltipItem) { return tooltipItem.datasetIndex !== 2 && tooltipItem.datasetIndex !== 3; } // Exclude SBTi lines
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true, padding: 20, font: { size: 13 }, color: '#374151',
                        // ****** FINAL LEGEND FILTER LOGIC ******
                        filter: function(legendItem, chartData) {
                            const datasetIndex = legendItem.datasetIndex;
                            const dataset = chartData.datasets[datasetIndex];
                            const showSBTiLines = nearTermTargetLevel !== null; // Determine if SBTi is active based on passed level

                            if (!dataset) return false; // Should not happen

                            // Explicitly hide SBTi legend items if SBTi is not active OR dataset is hidden
                            if (datasetIndex === 2 || datasetIndex === 3) {
                                return showSBTiLines && !dataset.hidden;
                            }
                            // Otherwise, show based on the dataset's hidden property
                            return !dataset.hidden;
                        }
                        // ****** END FINAL LEGEND FILTER LOGIC ******
                    },
                     onHover: (event, legendItem, legend) => { const canvas = legend.chart.canvas; if (canvas && legendItem && legendItem.text) { canvas.style.cursor = 'pointer'; } },
                     onLeave: (event, legendItem, legend) => { const canvas = legend.chart.canvas; if (canvas) { canvas.style.cursor = 'default'; } }
                 } // End legend
             }, // End plugins
             interaction: { mode: 'nearest', axis: 'x', intersect: false }
        } // End options
    }; // End newChartConfig

    // Configure SBTi lines based on calculation results
    const showSBTiLinesActual = nearTermTargetLevel !== null && longTermTargetLevel !== null;
    newChartConfig.data.datasets[2].data = showSBTiLinesActual ? years.map(() => nearTermTargetLevel) : [];
    newChartConfig.data.datasets[2].hidden = !showSBTiLinesActual;
    newChartConfig.data.datasets[3].data = showSBTiLinesActual ? years.map(() => longTermTargetLevel) : [];
    newChartConfig.data.datasets[3].hidden = !showSBTiLinesActual;

    // Add scenario datasets
    scenarioTrajectories.forEach(sc => newChartConfig.data.datasets.push(sc));

    console.log(`[updateTrajectoryChart] showSBTiLines = ${showSBTiLinesActual}`);
    console.log("[updateTrajectoryChart] Final datasets config (Hidden):", JSON.stringify(newChartConfig.data.datasets.map(ds => ({label: ds.label, hidden: ds.hidden}))));

    try {
        trajectoryChartInstance = new Chart(trajectoryCtx, newChartConfig);
    } catch (error) { console.error("Error creating trajectory chart:", error); }
}

// FINAL updateMaccChart function
function updateMaccChart(maccDatasets, selectedYear) {
    if (!maccCtx) { console.error("MACC ctx not found!"); return; }
    if (maccChartInstance) { maccChartInstance.destroy(); }
    console.log(`[updateMaccChart] Updating MACC for ${selectedYear}, datasets:`, maccDatasets.length);

    const newChartConfig = JSON.parse(JSON.stringify(baseMaccChartConfig));
    newChartConfig.data.datasets = maccDatasets;
    newChartConfig.options.scales.x.title.text = `Cumulative Annual Abatement (tCO2eq/yr) - Year ${selectedYear}`;
    newChartConfig.options.plugins.legend.display = maccDatasets.length > 0;

    if (maccDatasets.length === 0) { /* ... update status text ... */ }

    try { maccChartInstance = new Chart(maccCtx, newChartConfig); }
    catch (error) { console.error("Error creating MACC chart:", error); }
}

// FINAL updateWedgeChart function
function updateWedgeChart(years, wedgeDatasets) {
     if (!wedgeCtx) { console.error("Wedge ctx not found!"); return; }
     if (wedgeChartInstance) { wedgeChartInstance.destroy(); }
     console.log("[updateWedgeChart] Datasets:", wedgeDatasets.length);

     const newChartConfig = JSON.parse(JSON.stringify(baseWedgeChartConfig));
     newChartConfig.data.labels = years;
     newChartConfig.data.datasets = wedgeDatasets;
     newChartConfig.options.plugins.legend.display = wedgeDatasets.length > 0;

     if (scenariosDataStore.length === 0 || wedgeDatasets.length === 0) { /* ... update status text ... */ }

     try { wedgeChartInstance = new Chart(wedgeCtx, newChartConfig); }
     catch (error) { console.error("Error creating Wedge chart:", error); }
 }


// --- Event Listeners & Debounce ---
function debounce(func, wait) { /* ... debounce utility ... */ let timeout; return function(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }
const debouncedCalculateAllData = debounce(calculateAllData, 350);

// --- Scenario & Measure Management ---
// (Functions addScenario, createScenarioBlockElement, updateScenarioName, deleteScenario, createMeasureBlockElement, addMeasureInModal, removeMeasureInModal, toggleLifecycleInput, toggleRampYearsInput remain unchanged)
function addScenario() { const id=`scn-${Date.now()}`; const cnt=scenariosDataStore.length+1; const name=`Scenario ${cnt}`; const clr=scenarioColors[scenarioColorIndex%scenarioColors.length]; scenarioColorIndex++; const data={id,name,color:clr,measures:[]}; scenariosDataStore.push(data); scenariosListContainer.appendChild(createScenarioBlockElement(data)); if(isToolInitialized) calculateAllData(); }
function createScenarioBlockElement(d) { const b=document.createElement('div'); b.className='scenario-block'; b.id=d.id; b.dataset.color=d.color; b.innerHTML=`<div class="flex justify-between items-center mb-3"><input type="text" value="${d.name}" placeholder="Scenario Name" class="scenario-name-input name-input flex-grow mr-3 text-lg" oninput="updateScenarioName('${d.id}', this.value)"><div class="flex items-center gap-2"><button type="button" class="edit-btn text-sm" onclick="openMeasuresModal('${d.id}')">Edit Measures</button><button type="button" class="remove-btn" onclick="deleteScenario('${d.id}')">Delete</button></div></div><p class="text-xs text-gray-500">${d.measures.length} measure(s)</p>`; return b; }
window.updateScenarioName = updateScenarioName; function updateScenarioName(id,name) { const idx=scenariosDataStore.findIndex(s=>s.id===id); if(idx!==-1){const sc=scenariosDataStore[idx]; sc.name=name.trim()||"Unnamed"; if(trajectoryChartInstance){const cIdx=idx+4; if(trajectoryChartInstance.data.datasets[cIdx]) {trajectoryChartInstance.data.datasets[cIdx].label=sc.name; trajectoryChartInstance.update('none');}} if(idx===0){const yr=parseInt(maccYearSelect.value)||baselineYear+1; const hasM=sc.measures.length>0; maccScenarioInfo.textContent=hasM?`MACC: "${sc.name}" (${yr})`:`Add measures to "${sc.name}" for MACC.`; wedgeScenarioInfo.textContent=hasM?`Abatement: "${sc.name}"`:`Add measures to "${sc.name}" for wedges.`;}}}
window.deleteScenario = deleteScenario; function deleteScenario(id) { const idx=scenariosDataStore.findIndex(s=>s.id===id); if(idx===-1)return; scenariosDataStore.splice(idx,1); document.getElementById(id)?.remove(); if(idx===0){/*...reset MACC/Wedge text...*/ const yr=parseInt(maccYearSelect.value)||baselineYear+1; if(scenariosDataStore.length>0){const sc=scenariosDataStore[0]; const hasM=sc.measures.length>0; maccScenarioInfo.textContent=hasM?`MACC: "${sc.name}" (${yr})`:`Add measures to "${sc.name}" for MACC.`; wedgeScenarioInfo.textContent=hasM?`Abatement: "${sc.name}"`:`Add measures to "${sc.name}" for wedges.`;} else {maccScenarioInfo.textContent="Add scenario/measures for MACC."; wedgeScenarioInfo.textContent="Add scenario/measures for wedges.";}} scenarioColorIndex=scenariosDataStore.length; if(isToolInitialized)calculateAllData(); }
window.removeMeasureInModal = removeMeasureInModal; function removeMeasureInModal(id){document.getElementById(id)?.remove();}
window.toggleLifecycleInput = toggleLifecycleInput; function toggleLifecycleInput(sel,id){const c=document.getElementById(id)?.querySelector('.lifecycle-input-container'); const i=document.getElementById(id)?.querySelector('.measure-lifecycle'); if(!c||!i)return; if(sel.value==='yes'){c.classList.add('hidden');i.value=99;}else{c.classList.remove('hidden');if(parseInt(i.value)===99)i.value=10;}}
window.toggleRampYearsInput = toggleRampYearsInput; function toggleRampYearsInput(sel,id){const c=document.getElementById(id)?.querySelector('.ramp-years-input-container'); const i=document.getElementById(id)?.querySelector('.measure-ramp'); if(!c||!i)return; if(sel.value==='yes'){c.classList.add('hidden');i.value=1;}else{c.classList.remove('hidden');if(parseInt(i.value)<=1)i.value=2;}}
window.addMeasureInModal = addMeasureInModal; function addMeasureInModal(){if(!currentEditingScenarioId)return; const blk=createMeasureBlockElement(); modalMeasuresList.appendChild(blk); modalMeasuresList.scrollTop=modalMeasuresList.scrollHeight; blk.querySelector('.measure-name-input')?.focus();}
modalAddMeasureBtn?.addEventListener('click', addMeasureInModal); // Moved listener here

function createMeasureBlockElement(measureData = {}) { /* ... (unchanged) ... */
    const measureId=measureData.id||`m-${Date.now()}-${Math.random().toString(16).slice(2)}`; const b=document.createElement('div'); b.className='measure-block'; b.id=measureId; const baseYr=parseInt(baselineYearInput.value)||new Date().getFullYear(); const name=measureData.name||''; const red=measureData.reduction||5; const isP=measureData.isPermanent||false; const life=measureData.lifecycle||10; const isI=measureData.isInstant===undefined?true:measureData.isInstant; const ramp=measureData.rampYears||1; const startYr=measureData.startYear||(baseYr+1); const scope=measureData.scope||'Scope 1'; const capex=measureData.capex||100000; const opex=measureData.opex||5000;
    b.innerHTML=`<div class="flex justify-between items-center mb-3"><input type="text" value="${name}" placeholder="Measure Name (Required)" class="measure-name-input name-input flex-grow mr-2 text-sm"><button type="button" class="remove-btn text-xs" onclick="removeMeasureInModal('${measureId}')">Remove</button></div><div class="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2"><div><label class="lbl">Reduction (%)</label><input type="number" value="${red}" min="0" max="100" step="0.1" class="measure-reduction w-full"></div><div><label class="lbl">Scope</label><select class="measure-scope w-full"><option value="Scope 1" ${scope==='Scope 1'?'selected':''}>Scope 1</option><option value="Scope 2" ${scope==='Scope 2'?'selected':''}>Scope 2</option></select></div><div><label class="lbl">Start Year</label><input type="number" value="${startYr}" min="${baseYr}" max="2050" class="measure-start-year w-full"></div><div><label class="lbl">Permanent?</label><select class="measure-permanent w-full" onchange="toggleLifecycleInput(this,'${measureId}')"><option value="no" ${!isP?'selected':''}>No</option><option value="yes" ${isP?'selected':''}>Yes</option></select></div><div class="lifecycle-input-container ${isP?'hidden':''}"><label class="lbl">Lifecycle (yrs)</label><input type="number" value="${life}" min="1" class="measure-lifecycle w-full"></div><div><label class="lbl">Instant Effect?</label><select class="measure-instant w-full" onchange="toggleRampYearsInput(this,'${measureId}')"><option value="yes" ${isI?'selected':''}>Yes</option><option value="no" ${!isI?'selected':''}>No</option></select></div><div class="ramp-years-input-container ${isI?'hidden':''}"><label class="lbl">Ramp-up (yrs)</label><input type="number" value="${ramp}" min="1" step="1" class="measure-ramp w-full"></div><div><label class="lbl">CAPEX ($)</label><input type="number" value="${capex}" min="0" step="1000" class="measure-capex w-full"></div><div><label class="lbl">OPEX ($/yr)</label><input type="number" value="${opex}" min="0" step="100" class="measure-opex w-full"></div></div>`.replaceAll('class="lbl"','class="block text-xs font-medium text-gray-600"'); // Fix label class injection
    return b;
}


// --- Tab Switching Logic ---
// (Updated to include 'risks' tab and map initialization)
function switchTab(tabId) {
    activeTab = tabId;
    [tabContentDashboard, tabContentMacc, tabContentWedges, tabContentRisks].forEach(el => el?.classList.add('hidden'));
    [tabBtnDashboard, tabBtnMacc, tabBtnWedges, tabBtnRisks].forEach(el => el?.classList.remove('active'));
    let tabToShow, btnToActivate;
    switch (tabId) { /* ... cases ... */
        case 'dashboard': tabToShow=tabContentDashboard; btnToActivate=tabBtnDashboard; break;
        case 'macc': tabToShow=tabContentMacc; btnToActivate=tabBtnMacc; if(isToolInitialized)debouncedCalculateAllData(); break;
        case 'wedges': tabToShow=tabContentWedges; btnToActivate=tabBtnWedges; if(isToolInitialized)debouncedCalculateAllData(); break;
        case 'risks': tabToShow=tabContentRisks; btnToActivate=tabBtnRisks; if(!riskMapInitialized&&isToolInitialized)initializeRiskMap(); if(riskMapInstance)setTimeout(()=>riskMapInstance.invalidateSize(),100); break;
        default: tabId='dashboard'; tabToShow=tabContentDashboard; btnToActivate=tabBtnDashboard; activeTab='dashboard';
    }
    if(tabToShow) tabToShow.classList.remove('hidden');
    if(btnToActivate) btnToActivate.classList.add('active');
}

// --- Page Navigation Logic ---
// (Unchanged from previous version with scroll fix)
function showPage(pageIdToShow) { const pageToHideId=(pageIdToShow==='tool-section')?'home-section':'tool-section'; const pageToHide=document.getElementById(pageToHideId); const pageToShow=document.getElementById(pageIdToShow); if(!pageToHide||!pageToShow)return; pageToHide.classList.remove('active'); pageToHide.classList.add('fade-out'); setTimeout(()=>{ pageToHide.classList.add('hidden'); pageToHide.classList.remove('fade-out'); pageToShow.classList.remove('hidden'); pageToShow.classList.remove('opacity-0'); if(pageIdToShow==='home-section'){window.scrollTo({top:0,behavior:'smooth'});} requestAnimationFrame(()=>{pageToShow.classList.add('active'); if(pageIdToShow==='tool-section'){pageToShow.scrollIntoView({behavior:'smooth',block:'start'});}}); console.log(`ShowPage: ${pageIdToShow}`);}, 500); }
function showHomePage() { showPage('home-section'); }

// --- Risk Map Functions ---
// (Unchanged - initializeRiskMap, handleAddSite, updateSiteListDisplay)
function initializeRiskMap() { if(riskMapInitialized||!riskMapContainer)return; console.log("[MapInit] Initializing..."); try { riskMapInstance=L.map(riskMapContainer).setView([20,15],3); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OSM</a> contributors'}).addTo(riskMapInstance); siteMarkersLayer=L.layerGroup().addTo(riskMapInstance); riskMapInitialized=true; console.log("[MapInit] Success."); addSiteBtn?.addEventListener('click',handleAddSite); updateSiteListDisplay(); const loadingTxt=riskMapContainer.querySelector('p'); if(loadingTxt)loadingTxt.remove();} catch(e){console.error("Map init error:",e); riskMapContainer.innerHTML='<p class="text-red-600 p-4">Error loading map.</p>';} }
function handleAddSite() { if(!riskMapInstance||!siteInputForm)return; const latIn=document.getElementById('site-lat'); const lonIn=document.getElementById('site-lon'); const nameIn=document.getElementById('site-name'); const codeIn=document.getElementById('site-code'); const typeIn=document.getElementById('site-type'); const lat=parseFloat(latIn?.value); const lon=parseFloat(lonIn?.value); const name=nameIn?.value.trim(); const code=codeIn?.value.trim(); const type=typeIn?.value; if(!name){alert("Site Name required.");nameIn?.focus();return;} if(isNaN(lat)||lat<-90||lat>90){alert("Invalid Latitude.");latIn?.focus();return;} if(isNaN(lon)||lon<-180||lon>180){alert("Invalid Longitude.");lonIn?.focus();return;} const site={id:`site-${Date.now()}`,name,code,type,lat,lon}; sitesData.push(site); const marker=L.marker([lat,lon],{title:name}); let pop=`<b>${site.name}</b><br>Code: ${site.code||'N/A'}<br>Type: ${site.type||'N/A'}`; marker.bindPopup(pop); siteMarkersLayer.addLayer(marker); riskMapInstance.flyTo([lat,lon],Math.max(riskMapInstance.getZoom(),8)); updateSiteListDisplay(); latIn.value='';lonIn.value='';nameIn.value='';codeInput.value='';typeIn.value=''; nameIn.focus(); console.log("Added site:",site); }
function updateSiteListDisplay() { if(!siteListDiv)return; siteListDiv.innerHTML='<strong>Added Sites:</strong>'; if(sitesData.length===0){siteListDiv.innerHTML+='<p class="text-slate-500">No sites added yet.</p>';return;} const list=document.createElement('ul'); list.className='list-disc list-inside mt-1 space-y-1'; sitesData.forEach(site=>{const item=document.createElement('li'); item.className='flex justify-between items-center'; const txt=document.createElement('span'); txt.textContent=`${site.name} (${site.lat.toFixed(4)}, ${site.lon.toFixed(4)})`; item.appendChild(txt); const btn=document.createElement('button'); btn.textContent='Zoom'; btn.className='ml-2 text-xs text-blue-600 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5'; btn.type='button'; btn.onclick=(e)=>{e.stopPropagation(); if(riskMapInstance){riskMapInstance.flyTo([site.lat,site.lon],12);}}; item.appendChild(btn); list.appendChild(item);}); siteListDiv.appendChild(list); }

// --- Tool Initialization Function ---
// (Unchanged)
function initializeTool() { if(isToolInitialized){console.log("Tool already initialized."); return;} console.log("Initializing tool..."); saveBaselineModal(); updateGrowthRateDisplay(); targetReductionInput.disabled=sbtiCheckbox.checked; sbtiNote.classList.toggle('hidden',!sbtiCheckbox.checked); populateMaccYearSelector(); if(scenariosDataStore.length===0)addScenario(); else {scenariosListContainer.innerHTML=''; scenariosDataStore.forEach(sc=>scenariosListContainer.appendChild(createScenarioBlockElement(sc)));} addScenarioBtn?.addEventListener('click',addScenario); baselineYearInput?.addEventListener('input',()=>{updateGrowthRateDisplay();populateMaccYearSelector();debouncedCalculateAllData();}); targetReductionInput?.addEventListener('input',debouncedCalculateAllData); sbtiCheckbox?.addEventListener('change',()=>{targetReductionInput.disabled=sbtiCheckbox.checked;sbtiNote.classList.toggle('hidden',!sbtiCheckbox.checked);debouncedCalculateAllData();}); maccYearSelect?.addEventListener('change',debouncedCalculateAllData); isToolInitialized=true; calculateAllData(); console.log("Initialization complete."); }

// --- MACC Year Selector Population ---
// (Unchanged)
function populateMaccYearSelector() { const startY=parseInt(baselineYearInput.value)||new Date().getFullYear(); const endY=2050; const curVal=maccYearSelect.value; let valExists=false; maccYearSelect.innerHTML=''; for(let y=startY;y<=endY;y++){const opt=document.createElement('option'); opt.value=y; opt.textContent=y; maccYearSelect.appendChild(opt); if(y==curVal)valExists=true;} if(valExists){maccYearSelect.value=curVal;}else{maccYearSelect.value=Math.min(endY,Math.max(startY+1,2030));} }


// --- Home Page Interaction & Initial Setup ---
// (Unchanged)
document.addEventListener('DOMContentLoaded', () => { console.log("Page loaded."); homeSection?.classList.remove('hidden'); homeSection?.classList.add('active'); toolSection?.classList.add('hidden','opacity-0'); toolSection?.classList.remove('active'); baselineDisplay.textContent=`${(baselineData.scope1+baselineData.scope2).toFixed(0)} tCO2eq`; updateGrowthRateDisplay(); targetReductionInput.disabled=sbtiCheckbox.checked; sbtiNote.classList.toggle('hidden',!sbtiCheckbox.checked); populateMaccYearSelector(); tryToolBtn?.addEventListener('click',()=>{console.log("[TryToolBtn]");showPage('tool-section');setTimeout(()=>{initializeTool();},500);}); baselineYearInput?.addEventListener('input',()=>{updateGrowthRateDisplay();populateMaccYearSelector();if(isToolInitialized)debouncedCalculateAllData();}); targetReductionInput?.addEventListener('input',()=>{if(isToolInitialized)debouncedCalculateAllData();}); sbtiCheckbox?.addEventListener('change',()=>{targetReductionInput.disabled=sbtiCheckbox.checked;sbtiNote.classList.toggle('hidden',!sbtiCheckbox.checked);if(isToolInitialized)debouncedCalculateAllData();}); maccYearSelect?.addEventListener('change',()=>{if(isToolInitialized)debouncedCalculateAllData();}); });

// --- Background Animation on Home Section ---
// (Unchanged)
 homeSection?.addEventListener('mousemove', (e) => { if(homeSection.classList.contains('active')){const rect=homeSection.getBoundingClientRect(); const x=e.clientX-rect.left; const y=e.clientY-rect.top; const xPct=(x/rect.width)*100; const yPct=(y/rect.height)*100; homeSection.style.setProperty('--x',`${xPct}%`); homeSection.style.setProperty('--y',`${yPct}%`);}});
