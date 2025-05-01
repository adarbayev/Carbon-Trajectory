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
const wedgeCtx = document.getElementById('wedgeChart').getContext('2d'); // Wedge chart canvas
const maccScenarioInfo = document.getElementById('macc-scenario-info');
const wedgeScenarioInfo = document.getElementById('wedge-scenario-info'); // Wedge chart info
const maccYearSelect = document.getElementById('macc-year-select'); // MACC Year Selector
// Tab elements
const tabBtnDashboard = document.getElementById('tab-btn-dashboard');
const tabBtnMacc = document.getElementById('tab-btn-macc');
const tabBtnWedges = document.getElementById('tab-btn-wedges');
const tabBtnRisks = document.getElementById('tab-btn-risks'); // <-- NEW
const tabContentDashboard = document.getElementById('tab-content-dashboard');
const tabContentMacc = document.getElementById('tab-content-macc');
const tabContentWedges = document.getElementById('tab-content-wedges');
const tabContentRisks = document.getElementById('tab-content-risks'); // <-- NEW
// Risk Tab Elements <-- NEW
const riskMapContainer = document.getElementById('risk-map-container');
const addSiteBtn = document.getElementById('add-site-btn');
const siteInputForm = document.getElementById('site-input-form');
const siteListDiv = document.getElementById('site-list');


// --- Global State ---
let trajectoryChartInstance; let maccChartInstance; let wedgeChartInstance;
let isToolInitialized = false;
const scenarioColors = ['#14b8a6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#d946ef', '#84cc16'];
// Using wedgeColors also for MACC steps for consistency, can be changed
const wedgeColors = [ '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081', '#fec44f', '#fe9929', '#d95f0e', '#993404', '#bcbddc', '#efedf5', '#f7f7f7', '#cccccc', '#969696', '#636363', '#252525']; // Added more colors
let scenarioColorIndex = 0; let activeTab = 'dashboard';
let scenariosDataStore = [];
let currentEditingScenarioId = null;
let baselineData = { scope1: 6000, scope2: 4000 };
let growthRates = { p1: 2.0, p2: 1.5, p3: 1.0 };
// Risk Map State <-- NEW
let riskMapInstance = null;
let riskMapInitialized = false;
let sitesData = []; // To store added site info {id, name, code, type, lat, lon}
let siteMarkersLayer = null; // Leaflet LayerGroup to manage site markers


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
     options: { /* ... trajectory options (unchanged) ... */
         responsive: true, maintainAspectRatio: false,
         scales: {
             x: { title: { display: true, text: 'Year', font: { size: 14, weight: '500' }, color: '#4b5563' }, grid: { display: false }, ticks: { color: '#6b7280' } },
             y: { title: { display: true, text: 'Emissions (tCO2eq)', font: { size: 14, weight: '500' }, color: '#4b5563' }, beginAtZero: true, grid: { color: '#e5e7eb' }, ticks: { color: '#6b7280' } }
         },
         plugins: {
             tooltip: {
                 mode: 'index', intersect: false, backgroundColor: 'rgba(0, 0, 0, 0.7)', titleFont: { size: 14, weight: '600' }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 4, boxPadding: 5,
                 filter: function(tooltipItem) { return tooltipItem.datasetIndex !== 2 && tooltipItem.datasetIndex !== 3; }
             },
             legend: {
                 position: 'bottom',
                 labels: { usePointStyle: true, padding: 20, font: { size: 13 }, color: '#374151', filter: function(legendItem, chartData) { return !legendItem.hidden; } },
                 onHover: (event, legendItem, legend) => { const canvas = legend.chart.canvas; if (canvas && legendItem && legendItem.text) { canvas.style.cursor = 'pointer'; } },
                 onLeave: (event, legendItem, legend) => { const canvas = legend.chart.canvas; if (canvas) { canvas.style.cursor = 'default'; } }
             }
         },
         interaction: { mode: 'nearest', axis: 'x', intersect: false }
     }
};

// MACC Chart Config (Multi-Dataset Stepped Line)
const baseMaccChartConfig = {
    type: 'line',
    data: {
        datasets: [] // Datasets generated dynamically
    },
    options: { /* ... MACC options (from previous update) ... */
        responsive: true, maintainAspectRatio: false,
        scales: {
             x: {
                 type: 'linear', title: { display: true, text: 'Cumulative Annual Abatement (tCO2eq/yr)', font: {size: 14, weight: '500'}, color: '#4b5563' },
                 beginAtZero: true, grid: { display: false }
             },
             y: {
                 type: 'linear', title: { display: true, text: 'Marginal Abatement Cost ($/tCO2eq)', font: {size: 14, weight: '500'}, color: '#4b5563' },
                 grid: { color: '#e5e7eb' }
             }
        },
        plugins: {
            tooltip: {
                mode: 'dataset', intersect: false,
                callbacks: {
                    label: function(context) { const measure = context.dataset.measureData; return measure ? `MAC: $${measure.mac.toFixed(2)} / tCO2eq` : ''; },
                    footer: function(tooltipItems) { const measure = tooltipItems[0]?.dataset.measureData; return measure ? [`Abatement: ${measure.annualAbatementForSelectedYear.toFixed(0)} tCO2eq/yr`, `Annualized Cost: $${measure.annualizedCost.toFixed(0)} /yr`] : '';}
                }
            },
            legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 12 }, boxWidth: 15 } }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
};

// Wedge Chart Config
const baseWedgeChartConfig = {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: { /* ... wedge options (unchanged) ... */
        responsive: true, maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: 'Year', font: { size: 14, weight: '500' }, color: '#4b5563' } },
            y: { stacked: true, title: { display: true, text: 'Cumulative Annual Abatement (tCO2eq/yr)', font: { size: 14, weight: '500' }, color: '#4b5563' }, beginAtZero: true }
        },
        plugins: {
            tooltip: {
                mode: 'index', intersect: false,
                callbacks: {
                     label: function(context) {
                        let label = context.dataset.label || ''; if (label) { label += ': '; }
                        let currentValue = context.parsed.y || 0; let previousValue = 0;
                        if (context.datasetIndex > 0) { const prevDataset = context.chart.data.datasets[context.datasetIndex - 1]; if (prevDataset.data.length > context.dataIndex) { previousValue = prevDataset.data[context.dataIndex] || 0; }}
                        const individualValue = currentValue - previousValue; label += `${individualValue.toFixed(0)} tCO2eq/yr`; return label;
                    }
                }
            },
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 13 }, color: '#374151' } }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
};

// --- Modal Management ---
// (Functions open/close/saveBaselineModal, open/close/saveGrowthRateModal, open/close/saveAndCloseMeasuresModal remain unchanged from previous complete code)
window.openBaselineModal = function() { /* ... */
    modalBaselineScope1.value = baselineData.scope1;
    modalBaselineScope2.value = baselineData.scope2;
    baselineModal.classList.add('active');
 }
window.closeBaselineModal = function() { /* ... */
    baselineModal.classList.remove('active');
 }
window.saveBaselineModal = function() { /* ... */
    baselineData.scope1 = parseFloat(modalBaselineScope1.value) || 0;
    baselineData.scope2 = parseFloat(modalBaselineScope2.value) || 0;
    const totalBaseline = baselineData.scope1 + baselineData.scope2;
    baselineDisplay.textContent = `${totalBaseline.toFixed(0)} tCO2eq`;
    closeBaselineModal();
    if (isToolInitialized) debouncedCalculateAllData();
 }
window.openGrowthRateModal = function() { /* ... */
    const baselineYear = parseInt(baselineYearInput.value) || new Date().getFullYear();
    modalGrowthP1Label.textContent = `Period 1 (${baselineYear} - 2030)`;
    modalGrowthP1.value = growthRates.p1.toFixed(1);
    modalGrowthP2.value = growthRates.p2.toFixed(1);
    modalGrowthP3.value = growthRates.p3.toFixed(1);
    growthRateModal.classList.add('active');
 }
window.closeGrowthRateModal = function() { /* ... */
    growthRateModal.classList.remove('active');
 }
window.saveGrowthRateModal = function() { /* ... */
    growthRates.p1 = parseFloat(modalGrowthP1.value) || 0;
    growthRates.p2 = parseFloat(modalGrowthP2.value) || 0;
    growthRates.p3 = parseFloat(modalGrowthP3.value) || 0;
    updateGrowthRateDisplay();
    closeGrowthRateModal();
    if (isToolInitialized) debouncedCalculateAllData();
 }
function updateGrowthRateDisplay() { /* ... */
    const baselineYear = parseInt(baselineYearInput.value) || new Date().getFullYear();
    growthDisplayP1.textContent = `P1 (${baselineYear}-2030): ${growthRates.p1.toFixed(1)}%`;
    growthDisplayP2.textContent = `P2 (2031-2040): ${growthRates.p2.toFixed(1)}%`;
    growthDisplayP3.textContent = `P3 (2041-2050): ${growthRates.p3.toFixed(1)}%`;
 }
window.openMeasuresModal = function(scenarioId) { /* ... */
    currentEditingScenarioId = scenarioId;
    const scenario = scenariosDataStore.find(s => s.id === scenarioId);
    if (!scenario) { console.error("Scenario not found:", scenarioId); return; }
    measuresModalTitle.textContent = `Edit Measures for ${scenario.name}`;
    modalMeasuresList.innerHTML = '';
    const measuresToEdit = JSON.parse(JSON.stringify(scenario.measures));
    if (measuresToEdit.length > 0) {
        measuresToEdit.forEach(measure => { modalMeasuresList.appendChild(createMeasureBlockElement(measure)); });
    } else {
        // Add one empty block if no measures exist
        modalMeasuresList.appendChild(createMeasureBlockElement());
    }
    measuresModal.classList.add('active');
 }
window.closeMeasuresModal = function() { /* ... */
    currentEditingScenarioId = null;
    measuresModal.classList.remove('active');
 }
window.saveAndCloseMeasuresModal = function() { /* ... */
    if (!currentEditingScenarioId) { closeMeasuresModal(); return; }
    const scenarioIndex = scenariosDataStore.findIndex(s => s.id === currentEditingScenarioId);
    if (scenarioIndex === -1) { console.error("Scenario not found:", currentEditingScenarioId); closeMeasuresModal(); return; }

    const updatedMeasures = [];
    const measureBlocksInModal = modalMeasuresList.querySelectorAll('.measure-block');
    measureBlocksInModal.forEach((block, index) => {
        try {
            const nameInput = block.querySelector('.measure-name-input');
            const name = nameInput ? nameInput.value.trim() : '';
            if (!name) { console.log(`Skipping block ${index+1}: empty name.`); return; } // Skip empty names

            const reduction = parseFloat(block.querySelector('.measure-reduction')?.value) || 0;
            const isPermanent = block.querySelector('.measure-permanent')?.value === 'yes';
            let lifecycle = 1;
            if (isPermanent) { lifecycle = 99; } else { lifecycle = parseInt(block.querySelector('.measure-lifecycle')?.value) || 1;}
            lifecycle = Math.max(1, lifecycle);
            const isInstant = block.querySelector('.measure-instant')?.value === 'yes';
            let rampYears = 1;
            if (!isInstant) { rampYears = parseInt(block.querySelector('.measure-ramp')?.value) || 1; }
            rampYears = Math.max(1, rampYears);
            const currentBaselineYear = parseInt(baselineYearInput.value) || 1990;
            const startYear = parseInt(block.querySelector('.measure-start-year')?.value) || currentBaselineYear;
            const scope = block.querySelector('.measure-scope')?.value || 'Scope 1';
            const capex = parseFloat(block.querySelector('.measure-capex')?.value) || 0;
            const opex = parseFloat(block.querySelector('.measure-opex')?.value) || 0;
            const id = block.id || `measure-${Date.now()}-${index}`;

            const measureData = { id, name, reduction, isPermanent, lifecycle, isInstant, rampYears, startYear, scope, capex, opex };

            if (reduction > 0 && reduction <= 100 && lifecycle > 0 && startYear >= currentBaselineYear && startYear <= 2050 && rampYears > 0) {
                updatedMeasures.push(measureData);
            } else { console.warn("Skipping invalid measure:", measureData); }
        } catch (error) { console.error(`Error reading measure block ${index}:`, error); }
    });

    scenariosDataStore[scenarioIndex].measures = updatedMeasures;
    console.log("Updated Store:", JSON.stringify(scenariosDataStore));
    const scenarioBlockOnPage = document.getElementById(currentEditingScenarioId);
    if (scenarioBlockOnPage) { scenarioBlockOnPage.querySelector('.text-xs').textContent = `${updatedMeasures.length} measure(s)`; }
    closeMeasuresModal();
    if (isToolInitialized) { debouncedCalculateAllData(); }
 }


// --- Calculation & Data ---
function calculateAllData() {
    if (!isToolInitialized) return;
    console.log("[calculateAllData] Starting calculation...");

    // --- Input Reading and Validation ---
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

    if (totalBaselineEmissions <= 0 || baselineYear > endYear || baselineYear < 2015) {
        console.error("[calculateAllData] Invalid baseline. Clearing charts.");
        updateTrajectoryChart(years, [], [], [], null, null);
        updateMaccChart([], 0);
        updateWedgeChart(years, []);
        return;
    }

    // --- BAU Calculation ---
    let currentBau = totalBaselineEmissions;
    for (let i = 0; i < years.length; i++) {
        const year = years[i];
        if (year === baselineYear) {
            bauEmissions.push(currentBau);
        } else {
            let rate = 0;
            if (year <= 2030) rate = growthRates.p1 / 100;
            else if (year <= 2040) rate = growthRates.p2 / 100;
            else rate = growthRates.p3 / 100;
            currentBau += totalBaselineEmissions * rate;
            bauEmissions.push(Math.max(0, currentBau));
        }
    }

    // --- Target Path Calculation ---
    let useSBTiLogic = isSBTiAligned;
    const nearTermTargetYear = baselineYear + 10;
    if (isSBTiAligned && nearTermTargetYear > 2050) {
        console.warn("SBTi near-term year > 2050, reverting to manual.");
        sbtiCheckbox.checked = false; targetReductionInput.disabled = false; sbtiNote.classList.add('hidden');
        useSBTiLogic = false;
    }

    if (useSBTiLogic) {
        sbtiNearTermLevel = totalBaselineEmissions * (1 - 0.42);
        sbtiLongTermLevel = totalBaselineEmissions * (1 - 0.90);
        console.log(`[Calc] SBTi Targets: NearTerm=${sbtiNearTermLevel} @ ${nearTermTargetYear}, LongTerm=${sbtiLongTermLevel}`);
        const nearTermYears = nearTermTargetYear - baselineYear;
        const postNearTermYears = endYear - nearTermTargetYear;

        for (let i = 0; i < years.length; i++) {
            const year = years[i];
            if (year === baselineYear) targetEmissions.push(totalBaselineEmissions);
            else if (year <= nearTermTargetYear) {
                const progress = nearTermYears > 0 ? (year - baselineYear) / nearTermYears : 1;
                targetEmissions.push(Math.max(0, totalBaselineEmissions + (sbtiNearTermLevel - totalBaselineEmissions) * progress));
            } else {
                const startLevel = targetEmissions[nearTermYears] ?? sbtiNearTermLevel; // Use value at near term year
                const progress = postNearTermYears > 0 ? (year - nearTermTargetYear) / postNearTermYears : 1;
                targetEmissions.push(Math.max(0, startLevel + (sbtiLongTermLevel - startLevel) * progress));
            }
        }
    } else { // Manual Target
        console.log(`[Calc] Manual Target Reduction: ${manualTargetReduction * 100}%`);
        const finalTarget = Math.max(0, totalBaselineEmissions * (1 - manualTargetReduction));
        const totalYears = endYear - baselineYear;
        for (let i = 0; i < years.length; i++) {
            if (i === 0) targetEmissions.push(totalBaselineEmissions);
            else {
                const progress = totalYears > 0 ? i / totalYears : 1;
                targetEmissions.push(Math.max(0, totalBaselineEmissions + (finalTarget - totalBaselineEmissions) * progress));
            }
        }
    }

    // --- Scenario Trajectories & Wedge Data ---
    const scenariosData = getAllScenariosData();
    const scenarioTrajectories = [];
    const wedgeDatasets = [];

    if (scenariosData.length > 0) {
        scenariosData.forEach((scenario) => { // Calculate trajectory for ALL scenarios
            const scenarioValues = [];
            for (let i = 0; i < years.length; i++) {
                let yearlyReduction = 0;
                scenario.measures.forEach(measure => {
                    const lifecycle = measure.isPermanent ? 99 : measure.lifecycle;
                    if (years[i] >= measure.startYear && years[i] < measure.startYear + lifecycle) {
                        const yrsIn = years[i] - measure.startYear + 1;
                        const rampFactor = measure.isInstant ? 1 : Math.min(1, yrsIn / Math.max(1, measure.rampYears));
                        const base = (measure.scope === 'Scope 1' ? baselineData.scope1 : baselineData.scope2) || 0;
                        yearlyReduction += base * (measure.reduction / 100) * rampFactor;
                    }
                });
                scenarioValues.push(Math.max(0, bauEmissions[i] - yearlyReduction));
            }
           // --- CHANGE THIS ---
// scenarioTrajectories.push({ name: scenario.name, color: scenario.color, data: scenarioValues });
// --- TO THIS ---
scenarioTrajectories.push({
    label: scenario.name, // Use 'label' instead of 'name' for Chart.js legend
    borderColor: scenario.color,
    backgroundColor: `${scenario.color}1A`, // Add transparency for background fill
    data: scenarioValues,
    fill: false, // Standard styling similar to other lines
    tension: 0.1,
    borderWidth: 2,
    pointRadius: 3,
    pointHoverRadius: 6,
    order: 3 // Ensure scenarios plot above target/BAU lines if needed
});

        // Wedge calculations (only for the FIRST scenario)
        const firstScenario = scenariosData[0];
        wedgeScenarioInfo.textContent = `Abatement breakdown for scenario: "${firstScenario.name}"`;
        firstScenario.measures.forEach((measure, index) => {
             wedgeDatasets.push({
                 label: measure.name, data: new Array(years.length).fill(0), // Init with zeros
                 backgroundColor: `${wedgeColors[index % wedgeColors.length]}B3`,
                 borderColor: wedgeColors[index % wedgeColors.length],
                 borderWidth: 0.5, pointRadius: 0, fill: true, order: index
             });
        });
        for (let i = 0; i < years.length; i++) {
            let stackHeight = 0;
            firstScenario.measures.forEach((measure, index) => {
                const lifecycle = measure.isPermanent ? 99 : measure.lifecycle;
                let abatement = 0;
                if (years[i] >= measure.startYear && years[i] < measure.startYear + lifecycle) {
                     const yrsIn = years[i] - measure.startYear + 1;
                     const rampFactor = measure.isInstant ? 1 : Math.min(1, yrsIn / Math.max(1, measure.rampYears));
                     const base = (measure.scope === 'Scope 1' ? baselineData.scope1 : baselineData.scope2) || 0;
                     abatement = base * (measure.reduction / 100) * rampFactor;
                }
                stackHeight += abatement;
                if(wedgeDatasets[index]) wedgeDatasets[index].data[i] = stackHeight;
            });
        }

    } else {
        wedgeScenarioInfo.textContent = "Add a scenario and measures to see abatement wedges.";
    }

    // Update Trajectory Chart
    updateTrajectoryChart(years, bauEmissions, targetEmissions, scenarioTrajectories, useSBTiLogic ? sbtiNearTermLevel : null, useSBTiLogic ? sbtiLongTermLevel : null);

    // --- MACC Calculation (Multi-Dataset) ---
    const selectedMaccYear = parseInt(maccYearSelect.value) || baselineYear + 1;
    let processedMaccData = [];
    let maccDatasets = []; // Array of dataset objects for MACC chart

    if (scenariosDataStore.length > 0 && scenariosDataStore[0].measures.length > 0) {
        const firstScenario = scenariosDataStore[0];
        maccScenarioInfo.textContent = `Analysis based on measures in scenario: "${firstScenario.name}" for year ${selectedMaccYear}`;

        processedMaccData = firstScenario.measures.map(measure => {
            const lifecycle = measure.isPermanent ? 99 : Math.max(1, measure.lifecycle || 1);
            const reductionPercent = measure.reduction / 100;
            const base = (measure.scope === 'Scope 1' ? baselineData.scope1 : baselineData.scope2) || 0;
            const validBase = base > 1e-9 ? base : 1e-9;
            let abatementThisYear = 0;
            if (selectedMaccYear >= measure.startYear && selectedMaccYear < measure.startYear + lifecycle) {
                const yrsIn = selectedMaccYear - measure.startYear + 1;
                const rampFactor = measure.isInstant ? 1 : Math.min(1, yrsIn / Math.max(1, measure.rampYears));
                abatementThisYear = validBase * reductionPercent * rampFactor;
            }
            const annualizedCapex = (lifecycle > 0 && !measure.isPermanent) ? measure.capex / lifecycle : (measure.isPermanent ? measure.capex / 25 : measure.capex); // Simple amortization for permanent
            const annualizedCost = annualizedCapex + measure.opex;
            const mac = (abatementThisYear > 1e-9) ? annualizedCost / abatementThisYear : Infinity;

            if (abatementThisYear <= 1e-9 || !isFinite(mac)) return null;
            return { ...measure, annualAbatementForSelectedYear: abatementThisYear, annualizedCost, mac, lifecycle };
        }).filter(m => m !== null);

        processedMaccData.sort((a, b) => a.mac - b.mac); // Sort by MAC

        let cumulativeAbatement = 0;
        processedMaccData.forEach((measure, index) => {
            const abatement = measure.annualAbatementForSelectedYear;
            const mac = measure.mac;
            const startX = cumulativeAbatement;
            const endX = cumulativeAbatement + abatement;
            const color = wedgeColors[index % wedgeColors.length];
            maccDatasets.push({
                label: measure.name,
                data: [{ x: startX, y: mac }, { x: endX, y: mac }],
                borderColor: color, backgroundColor: `${color}4D`,
                borderWidth: 2, stepped: true, pointRadius: 0, pointHoverRadius: 5, fill: true,
                measureData: measure // Attach full data for tooltips
            });
            cumulativeAbatement = endX;
        });
    } else {
        maccScenarioInfo.textContent = scenariosDataStore.length > 0 ? `Add measures to scenario "${scenariosDataStore[0].name}" to see MACC analysis.` : "Add a scenario and measures to see MACC analysis.";
    }

    // Update MACC Chart
    updateMaccChart(maccDatasets, selectedMaccYear);

    // Update Wedge Chart
    updateWedgeChart(years, wedgeDatasets);
}


function getAllScenariosData() {
    // console.log("[getAllScenariosData] Reading from store:", JSON.stringify(scenariosDataStore));
    return JSON.parse(JSON.stringify(scenariosDataStore)); // Deep copy
}

// --- Chart Update Functions ---
function updateTrajectoryChart(years, bauData, targetData, scenarioTrajectories, nearTermTargetLevel, longTermTargetLevel) {
    if (!trajectoryCtx) { console.error("Trajectory ctx not found!"); return; }
    if (trajectoryChartInstance) { trajectoryChartInstance.destroy(); }

    const newChartConfig = JSON.parse(JSON.stringify(baseTrajectoryChartConfig));
    newChartConfig.data.labels = years;
    newChartConfig.data.datasets[0].data = bauData;
    newChartConfig.data.datasets[1].data = targetData;
    const showSBTi = nearTermTargetLevel !== null;
    newChartConfig.data.datasets[2].data = showSBTi ? years.map(() => nearTermTargetLevel) : [];
    newChartConfig.data.datasets[2].hidden = !showSBTi;
    newChartConfig.data.datasets[3].data = showSBTi ? years.map(() => longTermTargetLevel) : [];
    newChartConfig.data.datasets[3].hidden = !showSBTi;
    newChartConfig.data.datasets = newChartConfig.data.datasets.slice(0, 4); // Keep base datasets
    scenarioTrajectories.forEach(sc => newChartConfig.data.datasets.push(sc)); // Add scenarios

    try {
        trajectoryChartInstance = new Chart(trajectoryCtx, newChartConfig);
    } catch (error) { console.error("Error creating trajectory chart:", error); }
}

// FINAL updateMaccChart function (Multi-Dataset)
function updateMaccChart(maccDatasets, selectedYear) {
    if (!maccCtx) { console.error("MACC ctx not found!"); return; }
    if (maccChartInstance) { maccChartInstance.destroy(); }
    console.log(`[updateMaccChart] Updating MACC for ${selectedYear}, datasets:`, maccDatasets.length);

    const newChartConfig = JSON.parse(JSON.stringify(baseMaccChartConfig));
    newChartConfig.data.datasets = maccDatasets; // Assign the array of datasets
    newChartConfig.options.scales.x.title.text = `Cumulative Annual Abatement (tCO2eq/yr) - Year ${selectedYear}`;
    newChartConfig.options.plugins.legend.display = maccDatasets.length > 0; // Show legend only if data exists

    // Update status text based on data presence
    if (maccDatasets.length === 0) {
        if (!maccScenarioInfo.textContent.toLowerCase().includes("add measures")) {
             maccScenarioInfo.textContent = scenariosDataStore.length > 0 ? `Add measures to scenario "${scenariosDataStore[0].name}" for year ${selectedYear} MACC.` : "Add scenario/measures for MACC.";
        }
    } else {
         // Text should be set correctly in calculateAllData
    }

    try {
        maccChartInstance = new Chart(maccCtx, newChartConfig);
    } catch (error) { console.error("Error creating MACC chart:", error); }
}

// FINAL updateWedgeChart function
function updateWedgeChart(years, wedgeDatasets) {
     if (!wedgeCtx) { console.error("Wedge ctx not found!"); return; }
     if (wedgeChartInstance) { wedgeChartInstance.destroy(); }
     console.log("[updateWedgeChart] Datasets:", wedgeDatasets.length);

     const newChartConfig = JSON.parse(JSON.stringify(baseWedgeChartConfig));
     newChartConfig.data.labels = years;
     newChartConfig.data.datasets = wedgeDatasets;
     newChartConfig.options.plugins.legend.display = wedgeDatasets.length > 0; // Show legend only if data exists

      // Update status text based on data presence
     if (scenariosDataStore.length === 0) {
          wedgeScenarioInfo.textContent = "Add a scenario to see abatement wedges.";
     } else if (wedgeDatasets.length === 0) {
         wedgeScenarioInfo.textContent = `Add measures to scenario "${scenariosDataStore[0].name}" to see abatement wedges.`;
     } else {
         // Text should be set correctly in calculateAllData
     }

     try {
         wedgeChartInstance = new Chart(wedgeCtx, newChartConfig);
     } catch (error) { console.error("Error creating Wedge chart:", error); }
 }


// --- Event Listeners & Debounce ---
function debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }
const debouncedCalculateAllData = debounce(calculateAllData, 350);

// --- Scenario & Measure Management ---
function addScenario() { /* ... (unchanged from previous complete code) ... */
    const scenarioId = `scenario-${Date.now()}`;
    const scenarioCount = scenariosDataStore.length + 1;
    const defaultScenarioName = `Scenario ${scenarioCount}`;
    const color = scenarioColors[scenarioColorIndex % scenarioColors.length];
    scenarioColorIndex++;
    const newScenarioData = { id: scenarioId, name: defaultScenarioName, color: color, measures: [] };
    scenariosDataStore.push(newScenarioData);
    const scenarioBlock = createScenarioBlockElement(newScenarioData);
    scenariosListContainer.appendChild(scenarioBlock);
    if(isToolInitialized) { calculateAllData(); }
}
function createScenarioBlockElement(scenarioData) { /* ... (unchanged from previous complete code) ... */
     const scenarioBlock = document.createElement('div'); scenarioBlock.classList.add('scenario-block'); scenarioBlock.id = scenarioData.id; scenarioBlock.dataset.color = scenarioData.color;
     scenarioBlock.innerHTML = `<div class="flex justify-between items-center mb-3"><input type="text" value="${scenarioData.name}" placeholder="Scenario Name" class="scenario-name-input name-input flex-grow mr-3 text-lg" oninput="updateScenarioName('${scenarioData.id}', this.value)"><div class="flex items-center gap-2"><button type="button" class="edit-btn text-sm" onclick="openMeasuresModal('${scenarioData.id}')">Edit Measures</button><button type="button" class="remove-btn" onclick="deleteScenario('${scenarioData.id}')">Delete</button></div></div><p class="text-xs text-gray-500">${scenarioData.measures.length} measure(s)</p>`;
     return scenarioBlock;
}
window.updateScenarioName = updateScenarioName; // Defined below
window.deleteScenario = deleteScenario; // Defined below
window.openMeasuresModal = openMeasuresModal; // Defined above
window.removeMeasureInModal = removeMeasureInModal; // Defined below
window.toggleLifecycleInput = toggleLifecycleInput; // Defined below
window.toggleRampYearsInput = toggleRampYearsInput; // Defined below
window.switchTab = switchTab; // Defined below
window.showHomePage = showHomePage; // Defined below
window.openBaselineModal = openBaselineModal; // Defined above
window.closeBaselineModal = closeBaselineModal; // Defined above
window.saveBaselineModal = saveBaselineModal; // Defined above
window.openGrowthRateModal = openGrowthRateModal; // Defined above
window.closeGrowthRateModal = closeGrowthRateModal; // Defined above
window.saveGrowthRateModal = saveGrowthRateModal; // Defined above
window.closeMeasuresModal = closeMeasuresModal; // Defined above
window.saveAndCloseMeasuresModal = saveAndCloseMeasuresModal; // Defined above


function updateScenarioName(scenarioId, newName) { /* ... (unchanged from previous complete code) ... */
    console.log(`Updating name for ${scenarioId} to ${newName}`);
    const scenarioIndex = scenariosDataStore.findIndex(s => s.id === scenarioId);
    if (scenarioIndex !== -1) {
        const scenario = scenariosDataStore[scenarioIndex];
        scenario.name = newName.trim() || "Unnamed Scenario";
        if (trajectoryChartInstance) {
            const chartDatasetIndex = scenarioIndex + 4;
            if (trajectoryChartInstance.data.datasets[chartDatasetIndex]) {
                trajectoryChartInstance.data.datasets[chartDatasetIndex].label = scenario.name;
                trajectoryChartInstance.update('none');
            }
        }
         if (scenarioIndex === 0) { // Update MACC/Wedge info only if it's the first scenario
             const selectedMaccYear = parseInt(maccYearSelect.value) || baselineYear + 1;
             const hasMeasures = scenario.measures.length > 0;
             maccScenarioInfo.textContent = hasMeasures ? `Analysis based on measures in scenario: "${scenario.name}" for year ${selectedMaccYear}` : `Add measures to scenario "${scenario.name}" to see MACC analysis.`;
             wedgeScenarioInfo.textContent = hasMeasures ? `Abatement breakdown for scenario: "${scenario.name}"` : `Add measures to scenario "${scenario.name}" to see abatement wedges.`;
         }
    } else { console.warn(`Scenario ${scenarioId} not found.`); }
}
function deleteScenario(scenarioId) { /* ... (unchanged from previous complete code) ... */
    console.log(`Deleting scenario ${scenarioId}`);
    const scenarioIndex = scenariosDataStore.findIndex(s => s.id === scenarioId);
    if (scenarioIndex === -1) return;
    scenariosDataStore.splice(scenarioIndex, 1);
    document.getElementById(scenarioId)?.remove();
    if(scenarioIndex === 0) { // Reset MACC/Wedge text if the first scenario was deleted
         const selectedMaccYear = parseInt(maccYearSelect.value) || baselineYear + 1;
         if (scenariosDataStore.length > 0) {
             const firstScenario = scenariosDataStore[0];
             const hasMeasures = firstScenario.measures.length > 0;
             maccScenarioInfo.textContent = hasMeasures ? `Analysis based on measures in scenario: "${firstScenario.name}" for year ${selectedMaccYear}` : `Add measures to scenario "${firstScenario.name}" to see MACC analysis.`;
             wedgeScenarioInfo.textContent = hasMeasures ? `Abatement breakdown for scenario: "${firstScenario.name}"` : `Add measures to scenario "${firstScenario.name}" to see abatement wedges.`;
         } else {
             maccScenarioInfo.textContent = "Add a scenario and measures to see MACC analysis.";
             wedgeScenarioInfo.textContent = "Add a scenario and measures to see abatement wedges.";
         }
    }
    scenarioColorIndex = scenariosDataStore.length;
    if(isToolInitialized) calculateAllData();
}
function createMeasureBlockElement(measureData = {}) { /* ... (unchanged from previous complete code) ... */
    const measureId = measureData.id || `measure-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const measureBlock = document.createElement('div');
    measureBlock.classList.add('measure-block');
    measureBlock.id = measureId;
    const currentBaselineYear = parseInt(baselineYearInput.value) || new Date().getFullYear();
    const name = measureData.name || '';
    const reduction = measureData.reduction || 5;
    const isPermanent = measureData.isPermanent || false;
    const lifecycle = measureData.lifecycle || 10;
    const isInstant = measureData.isInstant === undefined ? true : measureData.isInstant;
    const rampYears = measureData.rampYears || 1;
    const startYear = measureData.startYear || (currentBaselineYear + 1);
    const scope = measureData.scope || 'Scope 1';
    const capex = measureData.capex || 100000;
    const opex = measureData.opex || 5000;
    measureBlock.innerHTML = `
        <div class="flex justify-between items-center mb-3">
             <input type="text" value="${name}" placeholder="Measure Name (Required)" class="measure-name-input name-input flex-grow mr-2 text-sm">
             <button type="button" class="remove-btn text-xs" onclick="removeMeasureInModal('${measureId}')">Remove</button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2"><div><label class="block text-xs font-medium text-gray-600">Reduction (%)</label><input type="number" value="${reduction}" min="0" max="100" step="0.1" class="measure-reduction w-full"></div><div><label class="block text-xs font-medium text-gray-600">Scope</label><select class="measure-scope w-full"><option value="Scope 1" ${scope === 'Scope 1' ? 'selected' : ''}>Scope 1</option><option value="Scope 2" ${scope === 'Scope 2' ? 'selected' : ''}>Scope 2</option></select></div><div><label class="block text-xs font-medium text-gray-600">Start Year</label><input type="number" value="${startYear}" min="${currentBaselineYear}" max="2050" class="measure-start-year w-full"></div><div><label class="block text-xs font-medium text-gray-600">Permanent?</label><select class="measure-permanent w-full" onchange="toggleLifecycleInput(this, '${measureId}')"><option value="no" ${!isPermanent ? 'selected' : ''}>No</option><option value="yes" ${isPermanent ? 'selected' : ''}>Yes</option></select></div><div class="lifecycle-input-container ${isPermanent ? 'hidden' : ''}"><label class="block text-xs font-medium text-gray-600">Lifecycle (yrs)</label><input type="number" value="${lifecycle}" min="1" class="measure-lifecycle w-full"></div><div><label class="block text-xs font-medium text-gray-600">Instant Effect?</label><select class="measure-instant w-full" onchange="toggleRampYearsInput(this, '${measureId}')"><option value="yes" ${isInstant ? 'selected' : ''}>Yes</option><option value="no" ${!isInstant ? 'selected' : ''}>No</option></select></div><div class="ramp-years-input-container ${isInstant ? 'hidden' : ''}"><label class="block text-xs font-medium text-gray-600">Ramp-up (yrs)</label><input type="number" value="${rampYears}" min="1" step="1" class="measure-ramp w-full"></div><div><label class="block text-xs font-medium text-gray-600">CAPEX ($)</label><input type="number" value="${capex}" min="0" step="1000" class="measure-capex w-full"></div><div><label class="block text-xs font-medium text-gray-600">OPEX ($/yr)</label><input type="number" value="${opex}" min="0" step="100" class="measure-opex w-full"></div></div>`;
    return measureBlock;
}
function addMeasureInModal() { /* ... (unchanged from previous complete code) ... */
    if (!currentEditingScenarioId) return;
    const newMeasureBlock = createMeasureBlockElement();
    modalMeasuresList.appendChild(newMeasureBlock);
    modalMeasuresList.scrollTop = modalMeasuresList.scrollHeight;
    newMeasureBlock.querySelector('.measure-name-input')?.focus();
}
modalAddMeasureBtn.addEventListener('click', addMeasureInModal);
function removeMeasureInModal(measureId) { /* ... (unchanged from previous complete code) ... */
    document.getElementById(measureId)?.remove();
    console.log(`Removed measure block ${measureId} from modal DOM.`);
}
function toggleLifecycleInput(selectElement, measureId) { /* ... (unchanged from previous complete code) ... */
    const container = document.getElementById(measureId)?.querySelector('.lifecycle-input-container');
    const input = document.getElementById(measureId)?.querySelector('.measure-lifecycle');
    if(!container || !input) return;
    if (selectElement.value === 'yes') { container.classList.add('hidden'); input.value = 99; }
    else { container.classList.remove('hidden'); if (parseInt(input.value) === 99) input.value = 10; } // Restore default if it was 99
}
function toggleRampYearsInput(selectElement, measureId) { /* ... (unchanged from previous complete code) ... */
     const container = document.getElementById(measureId)?.querySelector('.ramp-years-input-container');
     const input = document.getElementById(measureId)?.querySelector('.measure-ramp');
     if(!container || !input) return;
     if (selectElement.value === 'yes') { container.classList.add('hidden'); input.value = 1; }
     else { container.classList.remove('hidden'); if (parseInt(input.value) <= 1) input.value = 2; }
 }


// --- Tab Switching Logic ---
// Updated to include 'risks' tab and map initialization logic
function switchTab(tabId) {
    activeTab = tabId;
    // Hide all content panes
    [tabContentDashboard, tabContentMacc, tabContentWedges, tabContentRisks].forEach(el => el?.classList.add('hidden'));
    // Deactivate all tab buttons
    [tabBtnDashboard, tabBtnMacc, tabBtnWedges, tabBtnRisks].forEach(el => el?.classList.remove('active'));

    // Activate the selected tab button and content pane
    let tabToShow, btnToActivate;
    switch (tabId) {
        case 'dashboard': tabToShow = tabContentDashboard; btnToActivate = tabBtnDashboard; break;
        case 'macc':      tabToShow = tabContentMacc; btnToActivate = tabBtnMacc; break;
        case 'wedges':    tabToShow = tabContentWedges; btnToActivate = tabBtnWedges; break;
        case 'risks':     tabToShow = tabContentRisks; btnToActivate = tabBtnRisks; break; // <-- NEW
        default:          tabToShow = tabContentDashboard; btnToActivate = tabBtnDashboard; activeTab='dashboard'; // Default to dashboard
    }

    if(tabToShow) tabToShow.classList.remove('hidden');
    if(btnToActivate) btnToActivate.classList.add('active');

    // Special actions for specific tabs
    if (tabId === 'macc' || tabId === 'wedges') {
        // Recalculate if MACC or Wedges tab is activated
        if (isToolInitialized) {
             console.log(`${tabId} tab activated, recalculating...`);
             debouncedCalculateAllData();
        }
    } else if (tabId === 'risks') { // <-- NEW
        // Initialize map only once when the 'risks' tab is first opened
        if (!riskMapInitialized && isToolInitialized) {
            initializeRiskMap(); // Function defined below
        }
        // Optional: Ensure map resizes correctly if container size changes while hidden
        if (riskMapInstance) {
            setTimeout(() => riskMapInstance.invalidateSize(), 100); // Delay ensures container is visible
        }
    }
}

// --- Page Navigation Logic ---
// Updated to handle scrolling correctly
function showPage(pageIdToShow) {
    console.log(`[showPage] Attempting to show: ${pageIdToShow}`);
    const pageToHideId = (pageIdToShow === 'tool-section') ? 'home-section' : 'tool-section';
    const pageToHide = document.getElementById(pageToHideId);
    const pageToShow = document.getElementById(pageIdToShow);

    if (!pageToHide || !pageToShow) { console.error("Page elements not found."); return; }

    pageToHide.classList.remove('active'); // Start fade out
    pageToHide.classList.add('fade-out');

    setTimeout(() => {
        pageToHide.classList.add('hidden'); // Hide after fade
        pageToHide.classList.remove('fade-out');

        pageToShow.classList.remove('hidden'); // Show in layout
        pageToShow.classList.remove('opacity-0'); // Ensure ready for fade-in

        // Scroll window *before* animation frame if going home
        if (pageIdToShow === 'home-section') {
            console.log("[showPage] Scrolling window to top.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        requestAnimationFrame(() => {
            pageToShow.classList.add('active'); // Trigger fade-in
            // Scroll tool section *into view* if showing tool section
            if (pageIdToShow === 'tool-section') {
                console.log("[showPage] Scrolling tool-section into view.");
                pageToShow.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        console.log(`[showPage] Now showing: ${pageIdToShow}`);
    }, 500); // Match CSS transition
}

function showHomePage() {
    showPage('home-section');
}

// --- Risk Map Functions --- <-- NEW SECTION
function initializeRiskMap() {
    if (riskMapInitialized || !riskMapContainer) return;
    console.log("[initializeRiskMap] Initializing Leaflet map...");

    try {
        // Create map instance centered roughly on Europe/Africa
        riskMapInstance = L.map(riskMapContainer).setView([20, 15], 3); // Adjust lat, lon, zoom

        // Add a tile layer (base map) from OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        }).addTo(riskMapInstance);

        // Initialize layer group to hold site markers
        siteMarkersLayer = L.layerGroup().addTo(riskMapInstance);

        riskMapInitialized = true;
        console.log("[initializeRiskMap] Map initialized successfully.");

        // Add event listener for the site form button AFTER map init
        if (addSiteBtn) {
             addSiteBtn.addEventListener('click', handleAddSite);
        } else { console.error("Add Site button not found!"); }

        // Initial update of the site list display
        updateSiteListDisplay();

        // Remove the "Map loading..." text
        const loadingText = riskMapContainer.querySelector('p');
        if (loadingText) loadingText.remove();

    } catch (error) {
        console.error("Error initializing Leaflet map:", error);
        riskMapContainer.innerHTML = '<p class="text-red-600 p-4">Error loading map. Please ensure Leaflet resources are linked correctly in HTML and you have internet access.</p>';
    }
}

function handleAddSite() {
    if (!riskMapInstance || !siteInputForm) return;

    const latInput = document.getElementById('site-lat');
    const lonInput = document.getElementById('site-lon');
    const nameInput = document.getElementById('site-name');
    const codeInput = document.getElementById('site-code');
    const typeInput = document.getElementById('site-type');

    const lat = parseFloat(latInput?.value);
    const lon = parseFloat(lonInput?.value);
    const name = nameInput?.value.trim();
    const code = codeInput?.value.trim();
    const type = typeInput?.value;

    // Validation
    if (!name) { alert("Site Name is required."); nameInput?.focus(); return; }
    if (isNaN(lat) || lat < -90 || lat > 90) { alert("Invalid Latitude (-90 to 90)."); latInput?.focus(); return; }
    if (isNaN(lon) || lon < -180 || lon > 180) { alert("Invalid Longitude (-180 to 180)."); lonInput?.focus(); return; }

    // Store site data
    const site = { id: `site-${Date.now()}`, name, code, type, lat, lon };
    sitesData.push(site);

    // Create Leaflet marker
    const marker = L.marker([lat, lon], {
        title: name // Tooltip on hover
    });

    // Create popup content
    let popupContent = `<b>${site.name}</b><br>Code: ${site.code || 'N/A'}<br>Type: ${site.type || 'N/A'}`;
    // --- Placeholder for Risk Data Integration ---
    // Example: You would fetch/calculate risks and add them here
    // popupContent += `<br><hr><span style="color: red;">Risk: High Heat</span>`;
    // ----------------------------------------------
    marker.bindPopup(popupContent);

    // Add marker to the dedicated layer group
    siteMarkersLayer.addLayer(marker);

    // Optional: Fly map view to the new marker
    riskMapInstance.flyTo([lat, lon], Math.max(riskMapInstance.getZoom(), 8));

    // Update the list display under the form
    updateSiteListDisplay();

    // Clear form fields for next entry
    latInput.value = ''; lonInput.value = ''; nameInput.value = '';
    codeInput.value = ''; typeInput.value = '';
    nameInput.focus(); // Set focus back to name input

    console.log("Added site:", site);
}

function updateSiteListDisplay() {
    if (!siteListDiv) return;
    siteListDiv.innerHTML = '<strong>Added Sites:</strong>'; // Reset header
    if (sitesData.length === 0) {
         siteListDiv.innerHTML += '<p class="text-slate-500">No sites added yet.</p>';
         return;
    }
    const list = document.createElement('ul');
    list.className = 'list-disc list-inside mt-1 space-y-1'; // Add spacing
    sitesData.forEach(site => {
        const item = document.createElement('li');
        item.className = 'flex justify-between items-center'; // Use flex for layout

        const textSpan = document.createElement('span');
        textSpan.textContent = `${site.name} (${site.lat.toFixed(4)}, ${site.lon.toFixed(4)})`;
        item.appendChild(textSpan);

        // Add button to zoom to site on map
        const zoomBtn = document.createElement('button');
        zoomBtn.textContent = 'Zoom';
        zoomBtn.className = 'ml-2 text-xs text-blue-600 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 py-0.5'; // Added focus style and padding
        zoomBtn.type = 'button'; // Important for forms
        zoomBtn.onclick = (e) => {
            e.stopPropagation(); // Prevent potential form submission if inside one
            if (riskMapInstance) {
                riskMapInstance.flyTo([site.lat, site.lon], 12); // Zoom level 12
            }
        };
        item.appendChild(zoomBtn);
        list.appendChild(item);
    });
    siteListDiv.appendChild(list);
}


// --- Tool Initialization Function ---
function initializeTool() {
     if (isToolInitialized) { console.log("Tool already initialized."); return; }
     console.log("Initializing tool...");

     saveBaselineModal();
     updateGrowthRateDisplay();
     targetReductionInput.disabled = sbtiCheckbox.checked;
     sbtiNote.classList.toggle('hidden', !sbtiCheckbox.checked);
     populateMaccYearSelector();

     if (scenariosDataStore.length === 0) { addScenario(); }
     else { scenariosListContainer.innerHTML = ''; scenariosDataStore.forEach(sc => scenariosListContainer.appendChild(createScenarioBlockElement(sc))); }

     // Event Listeners for tool elements
     addScenarioBtn?.addEventListener('click', addScenario);
     baselineYearInput?.addEventListener('input', () => { updateGrowthRateDisplay(); populateMaccYearSelector(); debouncedCalculateAllData(); });
     targetReductionInput?.addEventListener('input', debouncedCalculateAllData);
     sbtiCheckbox?.addEventListener('change', () => { targetReductionInput.disabled = sbtiCheckbox.checked; sbtiNote.classList.toggle('hidden', !sbtiCheckbox.checked); debouncedCalculateAllData(); });
     maccYearSelect?.addEventListener('change', debouncedCalculateAllData);
     // Note: Risk map button listener is added in initializeRiskMap

     isToolInitialized = true;
     calculateAllData(); // Initial calculation
     console.log("Initialization complete.");
}

// --- MACC Year Selector Population ---
function populateMaccYearSelector() { /* ... (unchanged from previous complete code) ... */
    const startYear = parseInt(baselineYearInput.value) || new Date().getFullYear();
    const endYear = 2050;
    const currentSelectedValue = maccYearSelect.value;
    let valueExists = false;
    maccYearSelect.innerHTML = '';
    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year; option.textContent = year;
        maccYearSelect.appendChild(option);
        if (year == currentSelectedValue) valueExists = true;
    }
    if (valueExists) { maccYearSelect.value = currentSelectedValue; }
    else { maccYearSelect.value = Math.min(endYear, Math.max(startYear + 1, 2030)); }
}


// --- Home Page Interaction & Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Page loaded. Tool inactive.");
    homeSection?.classList.remove('hidden');
    homeSection?.classList.add('active');
    toolSection?.classList.add('hidden', 'opacity-0');
    toolSection?.classList.remove('active');

    baselineDisplay.textContent = `${(baselineData.scope1 + baselineData.scope2).toFixed(0)} tCO2eq`;
    updateGrowthRateDisplay();
    targetReductionInput.disabled = sbtiCheckbox.checked;
    sbtiNote.classList.toggle('hidden', !sbtiCheckbox.checked);
    populateMaccYearSelector();

     tryToolBtn?.addEventListener('click', () => {
         console.log("[tryToolBtn] Clicked!");
         showPage('tool-section');
         setTimeout(() => { initializeTool(); }, 500); // Initialize after transition
     });

    // Attach global input listeners here too for safety
    baselineYearInput?.addEventListener('input', () => { updateGrowthRateDisplay(); populateMaccYearSelector(); if (isToolInitialized) debouncedCalculateAllData(); });
    targetReductionInput?.addEventListener('input', () => { if (isToolInitialized) debouncedCalculateAllData(); });
    sbtiCheckbox?.addEventListener('change', () => { targetReductionInput.disabled = sbtiCheckbox.checked; sbtiNote.classList.toggle('hidden', !sbtiCheckbox.checked); if (isToolInitialized) debouncedCalculateAllData(); });
    maccYearSelect?.addEventListener('change', () => { if (isToolInitialized) debouncedCalculateAllData(); });

}); // End DOMContentLoaded


// --- Background Animation on Home Section ---
 homeSection?.addEventListener('mousemove', (e) => {
    if (homeSection.classList.contains('active')) {
        const rect = homeSection.getBoundingClientRect();
        const x = e.clientX - rect.left; const y = e.clientY - rect.top;
        const xPercent = (x / rect.width) * 100; const yPercent = (y / rect.height) * 100;
        homeSection.style.setProperty('--x', `${xPercent}%`);
        homeSection.style.setProperty('--y', `${yPercent}%`);
    }
});
