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
             { label: 'Near-Term Target Level (-42%)', data: [], borderColor: 'rgba(234, 179, 8, 0.6)', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, fill: false, hidden: true, order: 0 }, // Initially hidden
             { label: 'Long-Term Target Level (-90%)', data: [], borderColor: 'rgba(220, 38, 38, 0.6)', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, fill: false, hidden: true, order: 0 } // Initially hidden
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
                 // Filter out the static target level lines from the main tooltip display
                 filter: function(tooltipItem) {
                     const label = tooltipItem.dataset.label || '';
                     return !label.includes('Target Level');
                 }
             },
             legend: {
                 position: 'bottom',
                 labels: {
                     usePointStyle: true, padding: 20, font: { size: 13 }, color: '#374151',
                     // Filter hidden datasets from the legend itself
                     filter: function(legendItem, chartData) {
                         return !legendItem.hidden && legendItem.text !== "";
                     }
                 },
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
    options: {
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
                mode: 'dataset', // Show tooltip for the whole step (dataset)
                intersect: false,
                callbacks: {
                    // Title: Show measure name
                    title: function(tooltipItems) {
                        return tooltipItems[0]?.dataset.label || '';
                    },
                     // Body: Show MAC, Abatement, Annualized Cost
                     label: function(context) { return ''; }, // Hide default label line
                     footer: function(tooltipItems) {
                         const measure = tooltipItems[0]?.dataset.measureData;
                         if (!measure) return '';
                         return [
                             `MAC: $${measure.mac.toFixed(2)} / tCO2eq`,
                             `Abatement: ${measure.annualAbatementForSelectedYear.toFixed(0)} tCO2eq/yr`,
                             `Annualized Cost: $${measure.annualizedCost.toFixed(0)} /yr`
                         ];
                    }
                },
                backgroundColor: 'rgba(0, 0, 0, 0.7)', titleFont: { size: 13, weight: '600' }, bodyFont: { size: 12 }, footerFont: { size: 12 }, padding: 10, cornerRadius: 4, boxPadding: 5
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
    options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: 'Year', font: { size: 14, weight: '500' }, color: '#4b5563' } },
            y: { stacked: true, title: { display: true, text: 'Cumulative Annual Abatement (tCO2eq/yr)', font: { size: 14, weight: '500' }, color: '#4b5563' }, beginAtZero: true }
        },
        plugins: {
            tooltip: {
                mode: 'index', // Show tooltip for all datasets at a given year
                intersect: false,
                callbacks: {
                     // Calculate and show the individual contribution of each layer (wedge)
                     label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) { label += ': '; }

                        let currentValue = context.parsed.y || 0;
                        let previousValue = 0;

                        // Find the value of the dataset below the current one at the same index
                        if (context.datasetIndex > 0) {
                           const prevDataset = context.chart.data.datasets[context.datasetIndex - 1];
                           // Ensure the previous dataset has data at this index
                           if (prevDataset && prevDataset.data.length > context.dataIndex) {
                               previousValue = prevDataset.data[context.dataIndex] || 0;
                           }
                        }

                        const individualValue = currentValue - previousValue;
                        label += `${individualValue.toFixed(0)} tCO2eq/yr`;
                        return label;
                    },
                    // Optional: Add a footer showing the total cumulative abatement at that year
                    footer: function(tooltipItems) {
                        let total = 0;
                        // Get the value of the topmost dataset
                        if (tooltipItems.length > 0) {
                            const lastItem = tooltipItems[tooltipItems.length - 1];
                            total = lastItem.parsed.y || 0;
                        }
                        return `Total: ${total.toFixed(0)} tCO2eq/yr`;
                    }
                },
                 backgroundColor: 'rgba(0, 0, 0, 0.7)', titleFont: { size: 13, weight: '600' }, bodyFont: { size: 12 }, footerFont: { size: 12, weight: 'bold' }, padding: 10, cornerRadius: 4, boxPadding: 5
            },
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 13 }, color: '#374151' } }
        },
        interaction: { mode: 'index', axis: 'x', intersect: false } // Use mode: 'index' for stacked charts
    }
};

// --- Modal Management ---
window.openBaselineModal = function() {
    modalBaselineScope1.value = baselineData.scope1;
    modalBaselineScope2.value = baselineData.scope2;
    baselineModal.classList.add('active');
 }
window.closeBaselineModal = function() {
    baselineModal.classList.remove('active');
 }
window.saveBaselineModal = function() {
    baselineData.scope1 = parseFloat(modalBaselineScope1.value) || 0;
    baselineData.scope2 = parseFloat(modalBaselineScope2.value) || 0;
    const totalBaseline = baselineData.scope1 + baselineData.scope2;
    baselineDisplay.textContent = `${totalBaseline.toFixed(0)} tCO2eq`;
    closeBaselineModal();
    if (isToolInitialized) debouncedCalculateAllData();
 }
window.openGrowthRateModal = function() {
    const baselineYear = parseInt(baselineYearInput.value) || new Date().getFullYear();
    modalGrowthP1Label.textContent = `Period 1 (${baselineYear} - 2030)`;
    modalGrowthP1.value = growthRates.p1.toFixed(1);
    modalGrowthP2.value = growthRates.p2.toFixed(1);
    modalGrowthP3.value = growthRates.p3.toFixed(1);
    growthRateModal.classList.add('active');
 }
window.closeGrowthRateModal = function() {
    growthRateModal.classList.remove('active');
 }
window.saveGrowthRateModal = function() {
    growthRates.p1 = parseFloat(modalGrowthP1.value) || 0;
    growthRates.p2 = parseFloat(modalGrowthP2.value) || 0;
    growthRates.p3 = parseFloat(modalGrowthP3.value) || 0;
    updateGrowthRateDisplay();
    closeGrowthRateModal();
    if (isToolInitialized) debouncedCalculateAllData();
 }
function updateGrowthRateDisplay() {
    const baselineYear = parseInt(baselineYearInput.value) || new Date().getFullYear();
    growthDisplayP1.textContent = `P1 (${baselineYear}-2030): ${growthRates.p1.toFixed(1)}%`;
    growthDisplayP2.textContent = `P2 (2031-2040): ${growthRates.p2.toFixed(1)}%`;
    growthDisplayP3.textContent = `P3 (2041-2050): ${growthRates.p3.toFixed(1)}%`;
 }
window.openMeasuresModal = function(scenarioId) {
    currentEditingScenarioId = scenarioId;
    const scenario = scenariosDataStore.find(s => s.id === scenarioId);
    if (!scenario) { console.error("Scenario not found:", scenarioId); return; }
    measuresModalTitle.textContent = `Edit Measures for ${scenario.name}`;
    modalMeasuresList.innerHTML = '';
    // Deep copy measures for editing without affecting main store until save
    const measuresToEdit = JSON.parse(JSON.stringify(scenario.measures || []));
    if (measuresToEdit.length > 0) {
        measuresToEdit.forEach(measure => { modalMeasuresList.appendChild(createMeasureBlockElement(measure)); });
    } else {
        // Add one empty block if no measures exist
        modalMeasuresList.appendChild(createMeasureBlockElement());
    }
    measuresModal.classList.add('active');
 }
window.closeMeasuresModal = function() {
    currentEditingScenarioId = null; // Clear editing state
    measuresModal.classList.remove('active');
 }
window.saveAndCloseMeasuresModal = function() {
    if (!currentEditingScenarioId) { closeMeasuresModal(); return; }
    const scenarioIndex = scenariosDataStore.findIndex(s => s.id === currentEditingScenarioId);
    if (scenarioIndex === -1) { console.error("Scenario not found for saving:", currentEditingScenarioId); closeMeasuresModal(); return; }

    const updatedMeasures = [];
    const measureBlocksInModal = modalMeasuresList.querySelectorAll('.measure-block');

    measureBlocksInModal.forEach((block, index) => {
        try {
            const nameInput = block.querySelector('.measure-name-input');
            const name = nameInput ? nameInput.value.trim() : `Measure ${index + 1}`; // Provide default name if empty
            if (!nameInput.value.trim()) { console.warn(`Measure block ${index+1} has no name, assigning default.`); }

            const reductionInput = block.querySelector('.measure-reduction');
            const reduction = parseFloat(reductionInput?.value) || 0;

            const isPermanentSelect = block.querySelector('.measure-permanent');
            const isPermanent = isPermanentSelect?.value === 'yes';

            const lifecycleInput = block.querySelector('.measure-lifecycle');
            let lifecycle = 1; // Default lifecycle
            if (isPermanent) {
                lifecycle = 99; // Use 99 or a large number to signify permanence
            } else if (lifecycleInput) {
                 lifecycle = parseInt(lifecycleInput.value) || 1; // Read from input if not permanent
            }
            lifecycle = Math.max(1, lifecycle); // Ensure lifecycle is at least 1

            const isInstantSelect = block.querySelector('.measure-instant');
            const isInstant = isInstantSelect?.value === 'yes';

            const rampInput = block.querySelector('.measure-ramp');
            let rampYears = 1; // Default ramp years
             if (!isInstant && rampInput) {
                 rampYears = parseInt(rampInput.value) || 1; // Read from input if not instant
             }
            rampYears = Math.max(1, rampYears); // Ensure ramp years is at least 1

            const currentBaselineYear = parseInt(baselineYearInput.value) || new Date().getFullYear();
            const startYearInput = block.querySelector('.measure-start-year');
            const startYear = parseInt(startYearInput?.value) || currentBaselineYear; // Default to baseline

            const scopeSelect = block.querySelector('.measure-scope');
            const scope = scopeSelect?.value || 'Scope 1';

            const capexInput = block.querySelector('.measure-capex');
            const capex = parseFloat(capexInput?.value) || 0;

            const opexInput = block.querySelector('.measure-opex');
            const opex = parseFloat(opexInput?.value) || 0;

            const id = block.id || `measure-${Date.now()}-${index}`; // Ensure ID exists

            const measureData = { id, name, reduction, isPermanent, lifecycle, isInstant, rampYears, startYear, scope, capex, opex };

            // Basic Validation: Ensure reduction is within range and start year is reasonable
            if (reduction > 0 && reduction <= 100 && startYear >= currentBaselineYear && startYear <= 2050) {
                updatedMeasures.push(measureData);
            } else if (nameInput.value.trim()) { // Only warn if user actually entered a name
                 console.warn("Skipping potentially invalid or incomplete measure:", measureData);
                 // Optionally provide user feedback here (e.g., highlight the block)
            }
        } catch (error) {
            console.error(`Error processing measure block ${index}:`, error);
        }
    });

    // Update the main data store
    scenariosDataStore[scenarioIndex].measures = updatedMeasures;
    console.log("Updated Scenario Measures:", currentEditingScenarioId, JSON.stringify(updatedMeasures));

    // Update the measure count display on the scenario block
    const scenarioBlockOnPage = document.getElementById(currentEditingScenarioId);
    if (scenarioBlockOnPage) {
        const measureCountElement = scenarioBlockOnPage.querySelector('.measure-count-text');
        if (measureCountElement) {
            measureCountElement.textContent = `${updatedMeasures.length} measure(s)`;
        }
    }

    closeMeasuresModal(); // Close modal after saving
    if (isToolInitialized) {
        debouncedCalculateAllData(); // Recalculate everything with updated measures
    }
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
        console.error("[calculateAllData] Invalid baseline or year range. Aborting calculation.");
        // Clear charts if inputs are invalid
        updateTrajectoryChart(years, [], [], [], null, null); // Pass nulls for SBTi levels
        updateMaccChart([], 0); // Empty MACC data
        updateWedgeChart(years, []); // Empty Wedge data
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
            const previousYearBau = bauEmissions[bauEmissions.length - 1]; // Use previous year's BAU for growth calc
            if (year <= 2030) rate = growthRates.p1 / 100;
            else if (year <= 2040) rate = growthRates.p2 / 100;
            else rate = growthRates.p3 / 100;
            // Apply growth rate to the *previous* year's emissions, not the initial baseline
            currentBau = previousYearBau * (1 + rate);
            bauEmissions.push(Math.max(0, currentBau)); // Ensure emissions don't go negative
        }
    }

    // --- Target Path Calculation ---
    let useSBTiLogic = isSBTiAligned;
    // Calculate near-term target year (Baseline + 10 years, capped at 2050)
    const nearTermTargetYear = Math.min(baselineYear + 10, endYear);

    // If SBTi is checked but near-term year is beyond 2050, disable SBTi logic (edge case)
    if (isSBTiAligned && nearTermTargetYear === baselineYear) { // This implies baseline >= 2041
        console.warn("SBTi selected, but near-term target year is not applicable within timeframe. Reverting to manual target.");
        // Optionally uncheck the box and enable manual input, or just proceed with manual logic:
        // sbtiCheckbox.checked = false; targetReductionInput.disabled = false; sbtiNote.classList.add('hidden');
        useSBTiLogic = false;
    }

    if (useSBTiLogic) {
        // SBTi requires -4.2% linear annual reduction, resulting in -42% over 10 years
        // Target levels are relative to the baseline year emissions
        sbtiNearTermLevel = totalBaselineEmissions * (1 - 0.42);
        sbtiLongTermLevel = totalBaselineEmissions * (1 - 0.90);
        console.log(`[Calc] SBTi Targets: NearTerm=${sbtiNearTermLevel.toFixed(0)} @ ${nearTermTargetYear}, LongTerm=${sbtiLongTermLevel.toFixed(0)} @ 2050`);

        const nearTermYearsDuration = nearTermTargetYear - baselineYear;
        const postNearTermYearsDuration = endYear - nearTermTargetYear;

        for (let i = 0; i < years.length; i++) {
            const year = years[i];
            if (year === baselineYear) {
                targetEmissions.push(totalBaselineEmissions);
            } else if (year <= nearTermTargetYear) {
                // Linear interpolation between baseline and near-term target level
                const progress = nearTermYearsDuration > 0 ? (year - baselineYear) / nearTermYearsDuration : 1;
                targetEmissions.push(Math.max(0, totalBaselineEmissions + (sbtiNearTermLevel - totalBaselineEmissions) * progress));
            } else {
                // Linear interpolation between near-term level and long-term target level
                // Ensure we start interpolating *from* the calculated near-term emission level
                const startLevel = targetEmissions[nearTermYearsDuration] ?? sbtiNearTermLevel; // Get emission level at nearTermTargetYear
                const progress = postNearTermYearsDuration > 0 ? (year - nearTermTargetYear) / postNearTermYearsDuration : 1;
                targetEmissions.push(Math.max(0, startLevel + (sbtiLongTermLevel - startLevel) * progress));
            }
        }
    } else { // Manual Target Calculation
        console.log(`[Calc] Manual Target Reduction: ${manualTargetReduction * 100}% by ${endYear}`);
        const finalTargetLevel = Math.max(0, totalBaselineEmissions * (1 - manualTargetReduction));
        const totalYearsDuration = endYear - baselineYear;

        for (let i = 0; i < years.length; i++) {
            if (i === 0) {
                targetEmissions.push(totalBaselineEmissions);
            } else {
                // Linear interpolation between baseline and final target level
                const progress = totalYearsDuration > 0 ? i / totalYearsDuration : 1;
                targetEmissions.push(Math.max(0, totalBaselineEmissions + (finalTargetLevel - totalBaselineEmissions) * progress));
            }
        }
        // Ensure SBTi levels are null when manual target is used
        sbtiNearTermLevel = null;
        sbtiLongTermLevel = null;
    }

    // --- Scenario Trajectories & Wedge Data ---
    const scenariosData = getAllScenariosData(); // Get current scenario data
    const scenarioTrajectories = [];
    let wedgeDatasets = []; // Initialize wedge data

    if (scenariosData.length > 0) {
        // Calculate trajectories for ALL scenarios
        scenariosData.forEach((scenario, scenarioIndex) => {
            const scenarioValues = [];
            const currentScenarioMeasures = scenario.measures || []; // Ensure measures array exists

            for (let i = 0; i < years.length; i++) { // Iterate through each year
                let yearlyReduction = 0;
                const currentYear = years[i];
                const currentBauEmission = bauEmissions[i]; // BAU for the current year

                currentScenarioMeasures.forEach(measure => {
                    // Determine effective lifecycle (permanent measures last till endYear)
                    const lifecycle = measure.isPermanent ? (endYear - measure.startYear + 1) : measure.lifecycle;
                    const measureEndYr = measure.startYear + lifecycle;

                    // Check if measure is active in the current year
                    if (currentYear >= measure.startYear && currentYear < measureEndYr) {
                        // Calculate years since measure started for ramp-up
                        const yearsSinceStart = currentYear - measure.startYear + 1;
                        // Calculate ramp-up factor (1 if instant, otherwise linear ramp over rampYears)
                        const rampFactor = measure.isInstant ? 1 : Math.min(1, yearsSinceStart / Math.max(1, measure.rampYears));
                        // Get the appropriate baseline scope value
                        const baselineScopeValue = (measure.scope === 'Scope 1' ? baselineData.scope1 : baselineData.scope2) || 0;
                        // Calculate reduction for this measure in this year
                        // Reduction is % of BASELINE scope value, scaled by ramp factor
                        yearlyReduction += baselineScopeValue * (measure.reduction / 100) * rampFactor;
                    }
                });
                // Calculate scenario emission: BAU minus total yearly reduction from all measures
                scenarioValues.push(Math.max(0, currentBauEmission - yearlyReduction));
            }

            // Add the calculated trajectory for this scenario to the list
             // ** CORRECTED PUSH CALL **
             scenarioTrajectories.push({
                 label: scenario.name, // Use 'label' for Chart.js legend
                 borderColor: scenario.color,
                 backgroundColor: `${scenario.color}1A`, // Use scenario color with transparency
                 data: scenarioValues,
                 fill: false,
                 tension: 0.1,
                 borderWidth: 2,
                 pointRadius: 3,
                 pointHoverRadius: 6,
                 order: 3 + scenarioIndex // Ensure scenarios plot above base lines, maintain order
             });
        });

        // Wedge calculations (only for the FIRST scenario's measures)
        const firstScenario = scenariosData[0];
        wedgeScenarioInfo.textContent = `Abatement breakdown for scenario: "${firstScenario.name}"`;
        const firstScenarioMeasures = firstScenario.measures || [];

        // Initialize wedge datasets based on measures in the first scenario
        firstScenarioMeasures.forEach((measure, index) => {
             wedgeDatasets.push({
                 label: measure.name,
                 data: new Array(years.length).fill(0), // Initialize data array with zeros
                 backgroundColor: `${wedgeColors[index % wedgeColors.length]}B3`, // Use wedge colors with transparency
                 borderColor: wedgeColors[index % wedgeColors.length],
                 borderWidth: 0.5,
                 pointRadius: 0, // No points on area chart lines
                 fill: true, // Enable area fill
                 order: index // Control stacking order
             });
        });

        // Calculate cumulative abatement for each year for wedge chart
        for (let i = 0; i < years.length; i++) { // Iterate through years
            let stackHeight = 0; // Cumulative abatement for the year
            const currentYear = years[i];

            firstScenarioMeasures.forEach((measure, index) => {
                const lifecycle = measure.isPermanent ? (endYear - measure.startYear + 1) : measure.lifecycle;
                const measureEndYr = measure.startYear + lifecycle;
                let abatementThisYear = 0;

                // Check if measure is active
                if (currentYear >= measure.startYear && currentYear < measureEndYr) {
                     const yearsSinceStart = currentYear - measure.startYear + 1;
                     const rampFactor = measure.isInstant ? 1 : Math.min(1, yearsSinceStart / Math.max(1, measure.rampYears));
                     const baselineScopeValue = (measure.scope === 'Scope 1' ? baselineData.scope1 : baselineData.scope2) || 0;
                     abatementThisYear = baselineScopeValue * (measure.reduction / 100) * rampFactor;
                }
                stackHeight += abatementThisYear; // Add this measure's abatement to the stack
                // Assign the cumulative stack height to the measure's dataset for this year
                if(wedgeDatasets[index]) { wedgeDatasets[index].data[i] = stackHeight; }
            });
        }

    } else { // Handle case where no scenarios exist
        wedgeScenarioInfo.textContent = "Add a scenario and measures to see abatement wedges.";
    }

    // Update Trajectory Chart with all calculated data
    updateTrajectoryChart(years, bauEmissions, targetEmissions, scenarioTrajectories, sbtiNearTermLevel, sbtiLongTermLevel);

    // --- MACC Calculation (based on FIRST scenario for the SELECTED year) ---
    const selectedMaccYear = parseInt(maccYearSelect.value) || baselineYear + 1;
    let processedMaccData = [];
    let maccDatasets = []; // Array of dataset objects for MACC chart

    // Proceed only if there is at least one scenario with measures
    if (scenariosDataStore.length > 0 && scenariosDataStore[0].measures && scenariosDataStore[0].measures.length > 0) {
        const firstScenario = scenariosDataStore[0];
        maccScenarioInfo.textContent = `Analysis based on measures in scenario: "${firstScenario.name}" for year ${selectedMaccYear}`;

        processedMaccData = firstScenario.measures.map(measure => {
            // Recalculate lifecycle for MACC context
            const lifecycle = measure.isPermanent ? (endYear - measure.startYear + 1) : Math.max(1, measure.lifecycle || 1);
            const reductionPercent = measure.reduction / 100;
            const baselineScopeValue = (measure.scope === 'Scope 1' ? baselineData.scope1 : baselineData.scope2) || 0;
             // Avoid division by zero if baseline scope is zero
            const validBase = baselineScopeValue > 1e-9 ? baselineScopeValue : 1e-9;

            let abatementThisYear = 0;
            const measureEndYr = measure.startYear + lifecycle;
            // Check if measure is active in the selected MACC year
            if (selectedMaccYear >= measure.startYear && selectedMaccYear < measureEndYr) {
                const yearsSinceStart = selectedMaccYear - measure.startYear + 1;
                const rampFactor = measure.isInstant ? 1 : Math.min(1, yearsSinceStart / Math.max(1, measure.rampYears));
                abatementThisYear = validBase * reductionPercent * rampFactor;
            }

             // Calculate annualized cost (simple straight-line amortization for CAPEX)
             // Use a standard lifetime (e.g., 25 years) for amortization of permanent measures' CAPEX
             const amortizationYears = measure.isPermanent ? 25 : lifecycle;
             const annualizedCapex = (amortizationYears > 0) ? (measure.capex || 0) / amortizationYears : (measure.capex || 0);
             const annualizedCost = annualizedCapex + (measure.opex || 0);

             // Calculate MAC ($/tCO2eq)
             // Avoid division by zero if abatement is negligible
             const mac = (abatementThisYear > 1e-9) ? annualizedCost / abatementThisYear : Infinity; // Assign Infinity if no abatement

             // Skip measures with no abatement or infinite/invalid MAC
             if (abatementThisYear <= 1e-9 || !isFinite(mac)) return null;

            // Return processed data for valid measures
            return { ...measure, annualAbatementForSelectedYear: abatementThisYear, annualizedCost, mac, lifecycle: amortizationYears }; // Return calculated MAC data
        }).filter(m => m !== null); // Filter out null (invalid/skipped) measures

        // Sort measures by Marginal Abatement Cost (lowest to highest)
        processedMaccData.sort((a, b) => a.mac - b.mac);

        // Create datasets for the MACC chart (stepped line)
        let cumulativeAbatement = 0;
        processedMaccData.forEach((measure, index) => {
            const abatement = measure.annualAbatementForSelectedYear;
            const mac = measure.mac;
            const startX = cumulativeAbatement; // Start X at previous cumulative abatement
            const endX = cumulativeAbatement + abatement; // End X after adding this measure's abatement
            const color = wedgeColors[index % wedgeColors.length]; // Use wedge colors for consistency

            // Create a dataset for each measure (representing one step)
            maccDatasets.push({
                label: measure.name, // Measure name for legend/tooltip title
                data: [
                    { x: startX, y: mac }, // Point at start of step
                    { x: endX, y: mac }    // Point at end of step
                ],
                borderColor: color,
                backgroundColor: `${color}4D`, // Semi-transparent fill
                borderWidth: 2,
                stepped: true, // Crucial for MACC chart style
                pointRadius: 0, // No points on the line itself
                pointHoverRadius: 5, // Point appears on hover
                fill: true, // Fill area under the step
                measureData: measure // Attach full processed data for detailed tooltips
            });
            cumulativeAbatement = endX; // Update cumulative abatement for next step
        });
    } else { // Handle cases where MACC cannot be calculated
        if (scenariosDataStore.length > 0) {
             maccScenarioInfo.textContent = `Add measures to scenario "${scenariosDataStore[0].name}" to see MACC analysis for year ${selectedMaccYear}.`;
        } else {
             maccScenarioInfo.textContent = "Add a scenario and measures to see MACC analysis.";
        }
    }

    // Update MACC Chart with the generated datasets
    updateMaccChart(maccDatasets, selectedMaccYear);

    // Update Wedge Chart with the generated datasets
    updateWedgeChart(years, wedgeDatasets);

    console.log("[calculateAllData] Calculation finished.");
}


function getAllScenariosData() {
    // Return a deep copy to prevent accidental modification of the store
    return JSON.parse(JSON.stringify(scenariosDataStore));
}

// --- Chart Update Functions ---
function updateTrajectoryChart(years, bauData, targetData, scenarioTrajectories, nearTermTargetLevel, longTermTargetLevel) {
    if (!trajectoryCtx) { console.error("Trajectory chart canvas context not found!"); return; }
    if (trajectoryChartInstance) {
        trajectoryChartInstance.destroy(); // Destroy previous instance before creating new one
    }

    // Deep copy base config to avoid modification issues
    const newChartConfig = JSON.parse(JSON.stringify(baseTrajectoryChartConfig));
    newChartConfig.data.labels = years;

    // Update base datasets (BAU, Target Path)
    newChartConfig.data.datasets[0].data = bauData; // BAU
    newChartConfig.data.datasets[1].data = targetData; // Target Path

    // Update SBTi Target Level Lines
    const showSBTi = nearTermTargetLevel !== null && longTermTargetLevel !== null;
    // Near-Term Line (Dataset Index 2)
    newChartConfig.data.datasets[2].data = showSBTi ? years.map(() => nearTermTargetLevel) : []; // Assign data only if SBTi active
    newChartConfig.data.datasets[2].hidden = !showSBTi; // Set visibility based on SBTi status
    newChartConfig.data.datasets[2].label = showSBTi ? "SBTi Near-term" : "";

    // Long-Term Line (Dataset Index 3)
    newChartConfig.data.datasets[3].data = showSBTi ? years.map(() => longTermTargetLevel) : []; // Assign data only if SBTi active
    newChartConfig.data.datasets[3].hidden = !showSBTi; // Set visibility based on SBTi status
    newChartConfig.data.datasets[3].label = showSBTi ? "SBTi Long-term" : "";

    // Clear any previous scenario datasets beyond the base 4
    newChartConfig.data.datasets = newChartConfig.data.datasets.slice(0, 4);

    // Add current scenario trajectories
    scenarioTrajectories.forEach(sc => newChartConfig.data.datasets.push(sc));

    // Create the new chart instance
    try {
        trajectoryChartInstance = new Chart(trajectoryCtx, newChartConfig);
        console.log("[updateTrajectoryChart] Trajectory chart updated.");
    } catch (error) {
        console.error("Error creating/updating trajectory chart:", error);
    }
}

// Update MACC Chart Function
function updateMaccChart(maccDatasets, selectedYear) {
    if (!maccCtx) { console.error("MACC chart canvas context not found!"); return; }
    if (maccChartInstance) {
        maccChartInstance.destroy(); // Destroy previous instance
    }
    console.log(`[updateMaccChart] Updating MACC for ${selectedYear}, datasets:`, maccDatasets.length);

    const newChartConfig = JSON.parse(JSON.stringify(baseMaccChartConfig));
    newChartConfig.data.datasets = maccDatasets; // Assign the generated datasets
    // Update X-axis title to include the selected year
    newChartConfig.options.scales.x.title.text = `Cumulative Annual Abatement (tCO2eq/yr) - Year ${selectedYear}`;
    // Show legend only if there are measures to display
    newChartConfig.options.plugins.legend.display = maccDatasets.length > 0;

    // Update status text (handled within calculateAllData now)

    try {
        maccChartInstance = new Chart(maccCtx, newChartConfig);
        console.log("[updateMaccChart] MACC chart updated.");
    } catch (error) {
        console.error("Error creating/updating MACC chart:", error);
    }
}

// Update Wedge Chart Function
function updateWedgeChart(years, wedgeDatasets) {
     if (!wedgeCtx) { console.error("Wedge chart canvas context not found!"); return; }
     if (wedgeChartInstance) {
         wedgeChartInstance.destroy(); // Destroy previous instance
     }
     console.log("[updateWedgeChart] Updating Wedges, datasets:", wedgeDatasets.length);

     const newChartConfig = JSON.parse(JSON.stringify(baseWedgeChartConfig));
     newChartConfig.data.labels = years;
     newChartConfig.data.datasets = wedgeDatasets; // Assign the generated datasets
     // Show legend only if there are measures
     newChartConfig.options.plugins.legend.display = wedgeDatasets.length > 0;

     // Update status text (handled within calculateAllData now)

     try {
         wedgeChartInstance = new Chart(wedgeCtx, newChartConfig);
         console.log("[updateWedgeChart] Wedge chart updated.");
     } catch (error) {
         console.error("Error creating/updating Wedge chart:", error);
     }
 }


// --- Event Listeners & Debounce ---
// Debounce function to limit recalculation frequency on input changes
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
// Create a debounced version of the main calculation function
const debouncedCalculateAllData = debounce(calculateAllData, 350); // Recalculate ~350ms after last input change

// --- Scenario & Measure Management ---
function addScenario() {
    const scenarioId = `scenario-${Date.now()}`;
    const scenarioCount = scenariosDataStore.length + 1;
    const defaultScenarioName = `Scenario ${scenarioCount}`;
    const color = scenarioColors[scenarioColorIndex % scenarioColors.length];
    scenarioColorIndex++; // Increment for next scenario
    const newScenarioData = { id: scenarioId, name: defaultScenarioName, color: color, measures: [] };
    scenariosDataStore.push(newScenarioData); // Add to internal store
    const scenarioBlock = createScenarioBlockElement(newScenarioData); // Create UI element
    scenariosListContainer.appendChild(scenarioBlock); // Add to page
    if(isToolInitialized) {
        calculateAllData(); // Recalculate immediately after adding
    }
    console.log("Added Scenario:", newScenarioData.id);
}

function createScenarioBlockElement(scenarioData) {
     const scenarioBlock = document.createElement('div');
     scenarioBlock.classList.add('scenario-block');
     scenarioBlock.id = scenarioData.id;
     scenarioBlock.dataset.color = scenarioData.color; // Store color if needed later

     // Use text input for name, buttons for actions, paragraph for measure count
     scenarioBlock.innerHTML = `
         <div class="flex justify-between items-center mb-3">
             <input type="text" value="${scenarioData.name}" placeholder="Scenario Name"
                    class="scenario-name-input name-input flex-grow mr-3 text-lg"
                    oninput="updateScenarioName('${scenarioData.id}', this.value)"
                    aria-label="Scenario Name for ${scenarioData.id}">
             <div class="flex items-center gap-2 flex-shrink-0">
                 <button type="button" class="edit-btn text-sm" onclick="openMeasuresModal('${scenarioData.id}')">Edit Measures</button>
                 <button type="button" class="remove-btn" onclick="deleteScenario('${scenarioData.id}')">Delete</button>
             </div>
         </div>
         <p class="measure-count-text text-xs text-gray-500">${(scenarioData.measures || []).length} measure(s)</p>
     `;
     return scenarioBlock;
}

// Make functions globally accessible if called directly from HTML (onclick attributes)
window.updateScenarioName = function(scenarioId, newName) {
    console.log(`Updating name for ${scenarioId} to ${newName}`);
    const scenarioIndex = scenariosDataStore.findIndex(s => s.id === scenarioId);
    if (scenarioIndex !== -1) {
        const scenario = scenariosDataStore[scenarioIndex];
        scenario.name = newName.trim() || "Unnamed Scenario"; // Use default if name is empty

        // Update chart label if chart exists and it's the dataset corresponding to this scenario
        if (trajectoryChartInstance) {
            // Find the dataset index (Base datasets: 0=BAU, 1=Target, 2=SBTi-NT, 3=SBTi-LT)
             const chartDatasetIndex = scenariosDataStore.findIndex(s => s.id === scenarioId) + 4; // Find index within the store + offset for base datasets
             if (trajectoryChartInstance.data.datasets[chartDatasetIndex]) {
                 trajectoryChartInstance.data.datasets[chartDatasetIndex].label = scenario.name;
                 trajectoryChartInstance.update('none'); // Update chart without animation
             } else {
                 console.warn(`Dataset index ${chartDatasetIndex} not found for scenario ${scenarioId}. Chart might need full recalculation.`);
                 // Trigger full recalc if dataset wasn't found (might happen if deleted/added quickly)
                 debouncedCalculateAllData();
             }
        } else {
            // If chart doesn't exist yet, the name will be picked up on next full calculation
             debouncedCalculateAllData();
        }

         // Update MACC/Wedge info text only if the name of the FIRST scenario changed
         if (scenarioIndex === 0) {
             const selectedMaccYear = parseInt(maccYearSelect.value) || (parseInt(baselineYearInput.value) || new Date().getFullYear()) + 1;
             const hasMeasures = scenario.measures && scenario.measures.length > 0;
             maccScenarioInfo.textContent = hasMeasures ? `Analysis based on measures in scenario: "${scenario.name}" for year ${selectedMaccYear}` : `Add measures to scenario "${scenario.name}" to see MACC analysis.`;
             wedgeScenarioInfo.textContent = hasMeasures ? `Abatement breakdown for scenario: "${scenario.name}"` : `Add measures to scenario "${scenario.name}" to see abatement wedges.`;
         }
    } else {
        console.warn(`Scenario ${scenarioId} not found during name update.`);
    }
};

window.deleteScenario = function(scenarioId) {
    console.log(`Deleting scenario ${scenarioId}`);
    const scenarioIndex = scenariosDataStore.findIndex(s => s.id === scenarioId);
    if (scenarioIndex === -1) { console.warn("Scenario not found for deletion."); return; }

    const wasFirstScenario = scenarioIndex === 0;
    // Remove scenario from the data store
    scenariosDataStore.splice(scenarioIndex, 1);
    // Remove scenario block from the UI
    document.getElementById(scenarioId)?.remove();

    // Reset MACC/Wedge info text if the *first* scenario was deleted and others remain
    if (wasFirstScenario) {
         const selectedMaccYear = parseInt(maccYearSelect.value) || (parseInt(baselineYearInput.value) || new Date().getFullYear()) + 1;
         if (scenariosDataStore.length > 0) {
             const newFirstScenario = scenariosDataStore[0];
             const hasMeasures = newFirstScenario.measures && newFirstScenario.measures.length > 0;
             maccScenarioInfo.textContent = hasMeasures ? `Analysis based on measures in scenario: "${newFirstScenario.name}" for year ${selectedMaccYear}` : `Add measures to scenario "${newFirstScenario.name}" to see MACC analysis.`;
             wedgeScenarioInfo.textContent = hasMeasures ? `Abatement breakdown for scenario: "${newFirstScenario.name}"` : `Add measures to scenario "${newFirstScenario.name}" to see abatement wedges.`;
         } else { // No scenarios left
             maccScenarioInfo.textContent = "Add a scenario and measures to see MACC analysis.";
             wedgeScenarioInfo.textContent = "Add a scenario and measures to see abatement wedges.";
         }
    }

    // Reset color index based on remaining scenarios (simple approach)
    scenarioColorIndex = scenariosDataStore.length;

    // Recalculate all data and update charts
    if(isToolInitialized) calculateAllData();
};

function createMeasureBlockElement(measureData = {}) {
    const measureId = measureData.id || `measure-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const measureBlock = document.createElement('div');
    measureBlock.classList.add('measure-block');
    measureBlock.id = measureId;

    const currentBaselineYear = parseInt(baselineYearInput.value) || new Date().getFullYear();

    // Provide default values if measureData is empty or properties are missing
    const name = measureData.name || '';
    const reduction = measureData.reduction || 5;
    const isPermanent = measureData.isPermanent || false;
    const lifecycle = measureData.lifecycle || 10;
    // Default isInstant to true if undefined
    const isInstant = measureData.isInstant === undefined ? true : measureData.isInstant;
    const rampYears = measureData.rampYears || 1;
    // Default start year to baseline + 1
    const startYear = measureData.startYear || (currentBaselineYear + 1);
    const scope = measureData.scope || 'Scope 1';
    const capex = measureData.capex || 100000;
    const opex = measureData.opex || 5000;

    // Generate HTML structure for the measure block
    measureBlock.innerHTML = `
        <div class="flex justify-between items-center mb-3">
             <input type="text" value="${name}" placeholder="Measure Name (Required)" class="measure-name-input name-input flex-grow mr-2 text-sm" aria-label="Measure Name for ${measureId}">
             <button type="button" class="remove-btn text-xs" onclick="removeMeasureInModal('${measureId}')" aria-label="Remove Measure ${measureId}">Remove</button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2 text-sm">
            <div>
                <label for="measure-reduction-${measureId}" class="block text-xs font-medium text-gray-600">Reduction (%)</label>
                <input type="number" id="measure-reduction-${measureId}" value="${reduction}" min="0" max="100" step="0.1" class="measure-reduction w-full">
            </div>
            <div>
                <label for="measure-scope-${measureId}" class="block text-xs font-medium text-gray-600">Scope</label>
                <select id="measure-scope-${measureId}" class="measure-scope w-full">
                    <option value="Scope 1" ${scope === 'Scope 1' ? 'selected' : ''}>Scope 1</option>
                    <option value="Scope 2" ${scope === 'Scope 2' ? 'selected' : ''}>Scope 2</option>
                </select>
            </div>
            <div>
                <label for="measure-start-${measureId}" class="block text-xs font-medium text-gray-600">Start Year</label>
                <input type="number" id="measure-start-${measureId}" value="${startYear}" min="${currentBaselineYear}" max="2050" class="measure-start-year w-full">
            </div>
            <div>
                <label for="measure-permanent-${measureId}" class="block text-xs font-medium text-gray-600">Permanent?</label>
                <select id="measure-permanent-${measureId}" class="measure-permanent w-full" onchange="toggleLifecycleInput(this, '${measureId}')">
                    <option value="no" ${!isPermanent ? 'selected' : ''}>No</option>
                    <option value="yes" ${isPermanent ? 'selected' : ''}>Yes</option>
                </select>
            </div>
            <div class="lifecycle-input-container ${isPermanent ? 'hidden' : ''}">
                <label for="measure-lifecycle-${measureId}" class="block text-xs font-medium text-gray-600">Lifecycle (yrs)</label>
                <input type="number" id="measure-lifecycle-${measureId}" value="${lifecycle}" min="1" class="measure-lifecycle w-full" ${isPermanent ? 'disabled' : ''}>
            </div>
             <div>
                 <label for="measure-instant-${measureId}" class="block text-xs font-medium text-gray-600">Instant Effect?</label>
                 <select id="measure-instant-${measureId}" class="measure-instant w-full" onchange="toggleRampYearsInput(this, '${measureId}')">
                     <option value="yes" ${isInstant ? 'selected' : ''}>Yes</option>
                     <option value="no" ${!isInstant ? 'selected' : ''}>No</option>
                 </select>
             </div>
             <div class="ramp-years-input-container ${isInstant ? 'hidden' : ''}">
                 <label for="measure-ramp-${measureId}" class="block text-xs font-medium text-gray-600">Ramp-up (yrs)</label>
                 <input type="number" id="measure-ramp-${measureId}" value="${rampYears}" min="1" step="1" class="measure-ramp w-full" ${isInstant ? 'disabled' : ''}>
             </div>
             <div>
                 <label for="measure-capex-${measureId}" class="block text-xs font-medium text-gray-600">CAPEX ($)</label>
                 <input type="number" id="measure-capex-${measureId}" value="${capex}" min="0" step="1000" class="measure-capex w-full">
             </div>
             <div>
                 <label for="measure-opex-${measureId}" class="block text-xs font-medium text-gray-600">OPEX ($/yr)</label>
                 <input type="number" id="measure-opex-${measureId}" value="${opex}" min="0" step="100" class="measure-opex w-full">
             </div>
        </div>
    `;
    return measureBlock;
}

function addMeasureInModal() {
    if (!currentEditingScenarioId) { console.warn("Cannot add measure, no scenario selected for editing."); return; }
    const newMeasureBlock = createMeasureBlockElement(); // Create block with defaults
    modalMeasuresList.appendChild(newMeasureBlock); // Add to modal UI
    modalMeasuresList.scrollTop = modalMeasuresList.scrollHeight; // Scroll to the new block
    newMeasureBlock.querySelector('.measure-name-input')?.focus(); // Focus the name input
}
// Attach listener to the "Add New Measure" button within the modal
modalAddMeasureBtn?.addEventListener('click', addMeasureInModal);

window.removeMeasureInModal = function(measureId) {
    // Directly remove the element from the DOM within the modal
    document.getElementById(measureId)?.remove();
    console.log(`Removed measure block ${measureId} from modal DOM.`);
    // Note: Actual data removal happens on "Save and Close"
};

window.toggleLifecycleInput = function(selectElement, measureId) {
    const measureBlock = document.getElementById(measureId);
    if (!measureBlock) return;
    const container = measureBlock.querySelector('.lifecycle-input-container');
    const input = measureBlock.querySelector('.measure-lifecycle');
    if(!container || !input) return;

    if (selectElement.value === 'yes') { // If permanent is 'Yes'
        container.classList.add('hidden'); // Hide lifecycle input container
        input.disabled = true; // Disable input
        input.value = 99; // Set a high value (or could leave blank)
    } else { // If permanent is 'No'
        container.classList.remove('hidden'); // Show container
        input.disabled = false; // Enable input
        // Optionally reset to a default value if it was the 'permanent' value
        if (parseInt(input.value) === 99) {
            input.value = 10; // Reset to default e.g., 10 years
        }
    }
};

window.toggleRampYearsInput = function(selectElement, measureId) {
     const measureBlock = document.getElementById(measureId);
     if (!measureBlock) return;
     const container = measureBlock.querySelector('.ramp-years-input-container');
     const input = measureBlock.querySelector('.measure-ramp');
     if(!container || !input) return;

     if (selectElement.value === 'yes') { // If effect is 'Instant'
         container.classList.add('hidden'); // Hide ramp years input
         input.disabled = true;
         input.value = 1; // Set ramp years to 1
     } else { // If effect is 'Not Instant'
         container.classList.remove('hidden'); // Show ramp years input
         input.disabled = false;
         // Optionally reset to a default if it was 1
         if (parseInt(input.value) <= 1) {
             input.value = 2; // Set default ramp e.g., 2 years
         }
     }
 };

// --- Tab Switching Logic ---
window.switchTab = function(tabId) {
    if (activeTab === tabId) return; // Do nothing if already active
    activeTab = tabId;
    console.log("Switching tab to:", tabId);

    // Hide all content panes first
    [tabContentDashboard, tabContentMacc, tabContentWedges, tabContentRisks].forEach(el => { if(el) el.classList.add('hidden'); });
    // Deactivate all tab buttons
    [tabBtnDashboard, tabBtnMacc, tabBtnWedges, tabBtnRisks].forEach(el => { if(el) el.classList.remove('active'); });

    // Activate the selected tab button and content pane
    let tabToShow, btnToActivate;
    switch (tabId) {
        case 'dashboard': tabToShow = tabContentDashboard; btnToActivate = tabBtnDashboard; break;
        case 'macc':      tabToShow = tabContentMacc; btnToActivate = tabBtnMacc; break;
        case 'wedges':    tabToShow = tabContentWedges; btnToActivate = tabBtnWedges; break;
        case 'risks':     tabToShow = tabContentRisks; btnToActivate = tabBtnRisks; break;
        default:          tabToShow = tabContentDashboard; btnToActivate = tabBtnDashboard; activeTab='dashboard'; // Default safety
    }

    if(tabToShow) tabToShow.classList.remove('hidden');
    if(btnToActivate) btnToActivate.classList.add('active');

    // Special actions when specific tabs become active
    if (tabId === 'macc' || tabId === 'wedges') {
        // Ensure MACC/Wedge charts reflect the latest data when tab is viewed
        // Calculation is debounced, so triggering it here ensures it runs if needed
        if (isToolInitialized) {
             console.log(`${tabId} tab activated, ensuring calculations are up-to-date...`);
             debouncedCalculateAllData(); // Might trigger recalc if pending changes
             // Optional: force immediate recalc if needed, but debounce is usually sufficient
             // calculateAllData();
        }
    } else if (tabId === 'risks') {
        // Initialize map only ONCE when the 'risks' tab is first opened
        if (!riskMapInitialized && isToolInitialized) {
            initializeRiskMap(); // Defined below
        }
        // Ensure map resizes correctly if its container size changed while hidden
        if (riskMapInstance) {
            // Delay slightly to ensure the container is fully visible and sized
            setTimeout(() => {
                try {
                    riskMapInstance.invalidateSize();
                    console.log("Map invalidated size on tab switch.");
                } catch (e) {
                    console.error("Error invalidating map size:", e);
                }
            }, 100);
        }
    }
}

// --- Page Navigation Logic ---
function showPage(pageIdToShow) {
    console.log(`[showPage] Attempting to show: ${pageIdToShow}`);
    const pageToHideId = (pageIdToShow === 'tool-section') ? 'home-section' : 'tool-section';
    const pageToHide = document.getElementById(pageToHideId);
    const pageToShow = document.getElementById(pageIdToShow);

    if (!pageToHide || !pageToShow) { console.error("Page elements not found for navigation."); return; }

    // Start fade out on the current page
    pageToHide.classList.remove('active');
    pageToHide.classList.add('fade-out'); // CSS class for fade-out transition

    // After fade out duration, hide old page and show+fade in new page
    setTimeout(() => {
        pageToHide.style.display = 'none'; // Use display none instead of adding 'hidden' class to prevent layout shifts
        pageToHide.classList.remove('fade-out'); // Reset class

        pageToShow.style.display = ''; // Remove display none (or set to 'flex'/'block' if needed)
        pageToShow.classList.remove('opacity-0'); // Ensure opacity is ready for transition

        // Scroll window to top smoothly *before* fade-in animation for home page
        if (pageIdToShow === 'home-section') {
            console.log("[showPage] Scrolling window to top.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Use requestAnimationFrame to ensure layout is stable before triggering fade-in
        requestAnimationFrame(() => {
            pageToShow.classList.add('active'); // Trigger fade-in (opacity: 1)
            // Scroll tool section into view *after* it starts fading in
            if (pageIdToShow === 'tool-section') {
                 console.log("[showPage] Scrolling tool-section into view.");
                 // Use block: 'start' to align top of tool section with top of viewport
                 pageToShow.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        console.log(`[showPage] Now showing: ${pageIdToShow}`);
    }, 500); // Match CSS transition duration (0.5s)
}

function showHomePage() {
    // Set tool section display to none immediately if needed to prevent scroll jump
    if(toolSection) toolSection.style.display = 'none';
    showPage('home-section');
}

// --- Risk Map Functions --- (Leaflet Integration) ---
function initializeRiskMap() {
    if (riskMapInitialized || !riskMapContainer) {
         console.log("Risk map already initialized or container not found.");
         return;
    }
    console.log("[initializeRiskMap] Initializing Leaflet map...");

    try {
        // Create map instance centered roughly (adjust lat, lon, zoom as needed)
        riskMapInstance = L.map(riskMapContainer, {
             // Optional: Add map options here if needed
        }).setView([20, 15], 3);

        // Add a base map tile layer (OpenStreetMap is free)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19, // Max zoom level for OpenStreetMap
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        }).addTo(riskMapInstance);

        // Initialize a LayerGroup to hold all site markers - easier to manage
        siteMarkersLayer = L.layerGroup().addTo(riskMapInstance);

        riskMapInitialized = true;
        console.log("[initializeRiskMap] Map initialized successfully.");

        // Add event listener for the "Add Site" button *after* map is initialized
        if (addSiteBtn) {
             addSiteBtn.addEventListener('click', handleAddSite);
        } else { console.error("Add Site button not found!"); }

        // Initial update of the site list display (will show "No sites added yet")
        updateSiteListDisplay();

        // Remove the "Map loading..." placeholder text
        const loadingText = riskMapContainer.querySelector('p');
        if (loadingText) loadingText.remove();

    } catch (error) {
        console.error("Error initializing Leaflet map:", error);
        // Display error message to the user in the map container
        riskMapContainer.innerHTML = '<p class="text-red-600 p-4 text-center">Error loading map. Please check your internet connection and ensure Leaflet resources are loaded correctly.</p>';
        riskMapInitialized = false; // Ensure we know initialization failed
    }
}

function handleAddSite() {
    // Ensure map and form exist
    if (!riskMapInstance || !siteInputForm) {
        console.error("Map instance or site form not found.");
        return;
    }

    // Get input elements
    const latInput = document.getElementById('site-lat');
    const lonInput = document.getElementById('site-lon');
    const nameInput = document.getElementById('site-name');
    const codeInput = document.getElementById('site-code');
    const typeInput = document.getElementById('site-type');

    // Read and validate input values
    const lat = parseFloat(latInput?.value);
    const lon = parseFloat(lonInput?.value);
    const name = nameInput?.value.trim(); // Trim whitespace
    const code = codeInput?.value.trim();
    const type = typeInput?.value;

    // Basic Validation
    if (!name) { alert("Site Name is required."); nameInput?.focus(); return; }
    if (isNaN(lat) || lat < -90 || lat > 90) { alert("Invalid Latitude. Please enter a number between -90 and 90."); latInput?.focus(); return; }
    if (isNaN(lon) || lon < -180 || lon > 180) { alert("Invalid Longitude. Please enter a number between -180 and 180."); lonInput?.focus(); return; }

    // Store site data locally
    const site = { id: `site-${Date.now()}`, name, code, type, lat, lon };
    sitesData.push(site);

    // --- Create Leaflet Marker ---
    const marker = L.marker([lat, lon], {
        title: name, // Text tooltip on hover
        riseOnHover: true // Make marker rise above others on hover
    });

    // --- Create Popup Content ---
    // Basic info from the form
    let popupContent = `<b>${site.name}</b><br>Coordinates: ${site.lat.toFixed(4)}, ${site.lon.toFixed(4)}`;
    if (site.code) popupContent += `<br>Code: ${site.code}`;
    if (site.type) popupContent += `<br>Type: ${site.type}`;

    // --- Placeholder for Risk Data Integration ---
    // This is where you would fetch or calculate risk data based on lat/lon
    // and potentially the selected RCP scenario (though that's not fully implemented here)
    // Example:
    // const risks = getRiskData(lat, lon, selectedRcp); // Hypothetical function
    // if (risks) {
    //    popupContent += `<br><hr><b>Risks (${selectedRcp}):</b>`;
    //    popupContent += `<br>- Fluvial Flooding: <span style="color: blue;">${risks.fluvial}</span>`;
    //    popupContent += `<br>- Extreme Heat: <span style="color: red;">${risks.heat}</span>`;
    //    // ... add other risks
    // } else {
         popupContent += `<br><hr><i>Risk data integration pending.</i>`;
    // }
    // ----------------------------------------------
    marker.bindPopup(popupContent);

    // Add the marker to the dedicated layer group
    if (siteMarkersLayer) {
         siteMarkersLayer.addLayer(marker);
    } else {
         console.error("Site markers layer group not initialized.");
         // Fallback: add directly to map (less manageable)
         // marker.addTo(riskMapInstance);
    }

    // Optional: Fly map view to the newly added marker
    // Use a reasonable zoom level, e.g., 10 or higher
    riskMapInstance.flyTo([lat, lon], Math.max(riskMapInstance.getZoom(), 10));

    // Update the list display below the form
    updateSiteListDisplay();

    // Clear form fields for the next entry
    if(latInput) latInput.value = '';
    if(lonInput) lonInput.value = '';
    if(nameInput) nameInput.value = '';
    if(codeInput) codeInput.value = '';
    if(typeInput) typeInput.value = ''; // Reset dropdown
    if(nameInput) nameInput.focus(); // Set focus back to the name input

    console.log("Added site:", site);
}

function updateSiteListDisplay() {
    if (!siteListDiv) return; // Ensure the list container exists

    siteListDiv.innerHTML = '<strong>Added Sites:</strong>'; // Reset header

    if (sitesData.length === 0) {
         siteListDiv.innerHTML += '<p class="text-slate-500 text-xs mt-1">No sites added yet.</p>';
         return; // Stop if no sites
    }

    // Create a list element to hold the sites
    const list = document.createElement('ul');
    // Add some basic list styling (adjust Tailwind classes as needed)
    list.className = 'list-none mt-1 space-y-1';

    sitesData.forEach(site => {
        const item = document.createElement('li');
        // Use flexbox for layout: site name on left, zoom button on right
        item.className = 'flex justify-between items-center text-xs py-0.5';

        // Display site name and coordinates
        const textSpan = document.createElement('span');
        textSpan.textContent = `${site.name} (${site.lat.toFixed(4)}, ${site.lon.toFixed(4)})`;
        item.appendChild(textSpan);

        // Add button to zoom to the site on the map
        const zoomBtn = document.createElement('button');
        zoomBtn.textContent = 'Zoom';
        // Add styling for the button (Tailwind example)
        zoomBtn.className = 'ml-2 text-xs text-emerald-600 hover:text-emerald-800 hover:underline focus:outline-none focus:ring-1 focus:ring-emerald-300 rounded px-1 py-0.5 transition-colors';
        zoomBtn.type = 'button'; // Important: prevent form submission if inside a form
        zoomBtn.onclick = (e) => {
            e.stopPropagation(); // Prevent event bubbling if needed
            if (riskMapInstance) {
                // Fly to the site with a specific zoom level (e.g., 12)
                riskMapInstance.flyTo([site.lat, site.lon], 12);
            }
        };
        item.appendChild(zoomBtn); // Add button to the list item
        list.appendChild(item); // Add list item to the list
    });
    siteListDiv.appendChild(list); // Add the generated list to the container
}

// Make modal and utility functions globally available if called via onclick
window.openBaselineModal = openBaselineModal;
window.closeBaselineModal = closeBaselineModal;
window.saveBaselineModal = saveBaselineModal;
window.openGrowthRateModal = openGrowthRateModal;
window.closeGrowthRateModal = closeGrowthRateModal;
window.saveGrowthRateModal = saveGrowthRateModal;
window.openMeasuresModal = openMeasuresModal;
window.closeMeasuresModal = closeMeasuresModal;
window.saveAndCloseMeasuresModal = saveAndCloseMeasuresModal;
window.showHomePage = showHomePage;
// Note: updateScenarioName, deleteScenario, removeMeasureInModal, toggleLifecycleInput, toggleRampYearsInput are already assigned to window within their function definitions


// --- Tool Initialization Function ---
function initializeTool() {
     if (isToolInitialized) { console.log("Tool already initialized."); return; }
     console.log("Initializing tool...");

     // Ensure initial data is set correctly
     saveBaselineModal(); // Sets initial baseline display from defaults
     updateGrowthRateDisplay(); // Sets initial growth rate display
     // Set initial state of target input based on checkbox
     targetReductionInput.disabled = sbtiCheckbox.checked;
     sbtiNote.classList.toggle('hidden', !sbtiCheckbox.checked);
     populateMaccYearSelector(); // Populate MACC year dropdown

     // Add a default scenario if none exist when tool initializes
     if (scenariosDataStore.length === 0) {
          addScenario(); // This will also trigger calculateAllData
     } else {
          // If scenarios already exist (e.g., loaded from storage later), render them
          scenariosListContainer.innerHTML = ''; // Clear existing blocks first
          scenariosDataStore.forEach(sc => scenariosListContainer.appendChild(createScenarioBlockElement(sc)));
          // Trigger initial calculation if scenarios were loaded
          calculateAllData();
     }

     // --- Attach Event Listeners for Tool Elements ---
     addScenarioBtn?.addEventListener('click', addScenario);
     // Use debounced calculation for inputs that affect trajectories/targets
     baselineYearInput?.addEventListener('input', () => { updateGrowthRateDisplay(); populateMaccYearSelector(); debouncedCalculateAllData(); });
     targetReductionInput?.addEventListener('input', debouncedCalculateAllData);
     sbtiCheckbox?.addEventListener('change', () => {
          targetReductionInput.disabled = sbtiCheckbox.checked; // Enable/disable manual input
          sbtiNote.classList.toggle('hidden', !sbtiCheckbox.checked); // Show/hide SBTi note
          debouncedCalculateAllData(); // Recalculate on change
     });
     // MACC year selection should trigger recalculation (specifically for MACC/Wedge charts)
     maccYearSelect?.addEventListener('change', debouncedCalculateAllData);
     // Note: Risk map "Add Site" button listener is added dynamically in initializeRiskMap

     isToolInitialized = true; // Mark tool as initialized
     // calculateAllData(); // Initial calculation is triggered by addScenario or directly if scenarios exist
     console.log("Tool initialization complete.");
}

// --- MACC Year Selector Population ---
function populateMaccYearSelector() {
    if (!maccYearSelect) return; // Skip if element doesn't exist

    const startYear = parseInt(baselineYearInput.value) || new Date().getFullYear();
    const endYear = 2050;
    const currentSelectedValue = maccYearSelect.value; // Remember currently selected year
    let valueExists = false; // Flag to check if current value will still be valid

    maccYearSelect.innerHTML = ''; // Clear existing options

    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        maccYearSelect.appendChild(option);
        // Check if the previously selected value exists in the new range
        if (year == currentSelectedValue) {
             valueExists = true;
        }
    }

    // Set the selected value after populating
    if (valueExists) {
        maccYearSelect.value = currentSelectedValue; // Restore previous selection if still valid
    } else {
        // Set a default value if previous selection is no longer valid
        // Default to 2030 or the start year + 1, whichever is later, capped by endYear
        maccYearSelect.value = Math.min(endYear, Math.max(startYear + 1, 2030));
    }
}

// --- Home Page Interaction & Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Setting up initial state.");

    // Ensure home section is visible and tool section is hidden initially
    if (homeSection) {
         homeSection.style.display = ''; // Ensure it's not display:none
         homeSection.classList.remove('hidden', 'opacity-0', 'fade-out');
         homeSection.classList.add('active'); // Show home section
    }
    if (toolSection) {
         toolSection.style.display = 'none'; // Start hidden with display:none
         toolSection.classList.remove('active');
         toolSection.classList.add('opacity-0'); // Keep opacity 0 until transition
    }

    // Set initial display values based on default global state
    baselineDisplay.textContent = `${(baselineData.scope1 + baselineData.scope2).toFixed(0)} tCO2eq`;
    updateGrowthRateDisplay();
    targetReductionInput.disabled = sbtiCheckbox.checked;
    sbtiNote.classList.toggle('hidden', !sbtiCheckbox.checked);
    populateMaccYearSelector(); // Initial population

    // Listener for the "Try Tool" button
     tryToolBtn?.addEventListener('click', () => {
         console.log("[tryToolBtn] Clicked! Showing tool section.");
         showPage('tool-section'); // Start transition to tool page
         // Initialize the tool *after* the transition starts/completes
         // Delay matches the transition time
         setTimeout(() => {
              if (!isToolInitialized) {
                   initializeTool();
              }
         }, 500);
     });

    // Attach global input listeners that should work even before full tool initialization
    // These ensure display values update correctly if changed before clicking "Try Tool"
    baselineYearInput?.addEventListener('input', () => {
        updateGrowthRateDisplay();
        populateMaccYearSelector();
        if (isToolInitialized) debouncedCalculateAllData(); // Only calculate if tool is active
    });
    targetReductionInput?.addEventListener('input', () => {
        if (isToolInitialized) debouncedCalculateAllData();
    });
    sbtiCheckbox?.addEventListener('change', () => {
        targetReductionInput.disabled = sbtiCheckbox.checked;
        sbtiNote.classList.toggle('hidden', !sbtiCheckbox.checked);
        if (isToolInitialized) debouncedCalculateAllData();
    });
    maccYearSelect?.addEventListener('change', () => {
        if (isToolInitialized) debouncedCalculateAllData();
    });

    console.log("Initial setup complete. Waiting for user interaction.");

}); // End DOMContentLoaded


// --- Background Animation on Home Section ---
 homeSection?.addEventListener('mousemove', (e) => {
    // Only run animation if home section is currently active/visible
    if (homeSection.classList.contains('active')) {
        const rect = homeSection.getBoundingClientRect();
        // Calculate mouse position relative to the element
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Convert position to percentage for CSS variable
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;
        // Update CSS variables for the gradient center
        homeSection.style.setProperty('--x', `${xPercent}%`);
        homeSection.style.setProperty('--y', `${yPercent}%`);
    }
});

// --- Make sure all necessary functions are callable from HTML ---
// Already done for most using window.funcName = funcName;
// Double check if any are missing that rely on onclick="functionName(...)"
// AddScenarioBtn uses addEventListener, so it's fine.
// Modals use onclick, assigned to window.
// Scenario buttons use onclick, assigned to window.
// Tab buttons use onclick, assigned to window.
// Home button uses onclick, assigned to window.
