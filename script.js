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
const tabBtnWedges = document.getElementById('tab-btn-wedges'); // Wedge tab button
const tabContentDashboard = document.getElementById('tab-content-dashboard');
const tabContentMacc = document.getElementById('tab-content-macc');
const tabContentWedges = document.getElementById('tab-content-wedges'); // Wedge tab content

// --- Global State ---
let trajectoryChartInstance; let maccChartInstance; let wedgeChartInstance; // Added wedge chart instance
let isToolInitialized = false;
const scenarioColors = ['#14b8a6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#d946ef', '#84cc16'];
const wedgeColors = [ '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081', '#fec44f', '#fec44f', '#fe9929', '#d95f0e', '#993404', '#bcbddc', '#efedf5'];
let scenarioColorIndex = 0; let activeTab = 'dashboard';
let scenariosDataStore = [];
let currentEditingScenarioId = null;
let baselineData = { scope1: 6000, scope2: 4000 };
let growthRates = { p1: 2.0, p2: 1.5, p3: 1.0 };

// --- Chart Configurations ---
const baseTrajectoryChartConfig = {
     type: 'line',
     data: {
         labels: [],
         datasets: [
             // Index 0: BAU
             { label: 'Business As Usual (BAU)', data: [], borderColor: '#ef4444', /* red-500 */ backgroundColor: 'rgba(239, 68, 68, 0.1)', tension: 0.1, borderWidth: 2.5, pointBackgroundColor: '#ef4444', pointRadius: 3, pointHoverRadius: 6, fill: false, order: 1 },
             // Index 1: Target Path
             { label: 'Target Path', data: [], borderColor: '#3b82f6', /* blue-500 */ backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.1, borderDash: [6, 6], borderWidth: 2.5, pointBackgroundColor: '#3b82f6', pointRadius: 3, pointHoverRadius: 6, fill: false, order: 2 },
             // Index 2: Near-Term Target Level Line (SBTi) - Hidden initially
             { label: 'Near-Term Target Level (-42%)', data: [], borderColor: 'rgba(234, 179, 8, 0.6)', /* yellow-500 */ borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, fill: false, hidden: true, order: 0 }, // Draw behind others
             // Index 3: Long-Term Target Level Line (SBTi) - Hidden initially
             { label: 'Long-Term Target Level (-90%)', data: [], borderColor: 'rgba(220, 38, 38, 0.6)', /* red-600 */ borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, fill: false, hidden: true, order: 0 } // Draw behind others
             // Scenario datasets will be added starting at index 4
         ]
     },
     options: {
         responsive: true, maintainAspectRatio: false,
         scales: {
             x: { title: { display: true, text: 'Year', font: { size: 14, weight: '500' }, color: '#4b5563' /* gray-600 */ }, grid: { display: false }, ticks: { color: '#6b7280' } },
             y: { title: { display: true, text: 'Emissions (tCO2eq)', font: { size: 14, weight: '500' }, color: '#4b5563' }, beginAtZero: true, grid: { color: '#e5e7eb' /* gray-200 */ }, ticks: { color: '#6b7280' } }
         },
         plugins: {
             tooltip: {
                 mode: 'index', intersect: false, backgroundColor: 'rgba(0, 0, 0, 0.7)', titleFont: { size: 14, weight: '600' }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 4, boxPadding: 5,
                 filter: function(tooltipItem) { return tooltipItem.datasetIndex !== 2 && tooltipItem.datasetIndex !== 3; }
             },
             legend: {
                 position: 'bottom',
                 labels: { usePointStyle: true, padding: 20, font: { size: 13 }, color: '#374151' /* gray-700 */, filter: function(legendItem, chartData) { return !legendItem.hidden; } },
                 onHover: (event, legendItem, legend) => { const canvas = legend.chart.canvas; if (canvas && legendItem && legendItem.text) { canvas.style.cursor = 'pointer'; } },
                 onLeave: (event, legendItem, legend) => { const canvas = legend.chart.canvas; if (canvas) { canvas.style.cursor = 'default'; } }
             }
         },
         interaction: { mode: 'nearest', axis: 'x', intersect: false }
     }
};

// ****** NEW baseMaccChartConfig ******
const baseMaccChartConfig = {
    type: 'line', // CHANGED from 'bar'
    data: {
        datasets: [{
            label: 'MAC ($/tCO2eq)',
            data: [], // Will contain {x, y, measureData} points
            borderColor: '#3b82f6', // blue-500
            backgroundColor: 'rgba(59, 130, 246, 0.3)', // Lighter blue fill
            stepped: true, // ADDED - Creates the stepped look
            pointRadius: 0, // Hide points on the line
            pointHoverRadius: 5, // Show points on hover for tooltip
            borderWidth: 2,
            fill: true // Optional: fill under the steps
        }]
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
             // CHANGED X-axis to linear for cumulative abatement
             x: {
                 type: 'linear',
                 title: {
                     display: true,
                     text: 'Cumulative Annual Abatement (tCO2eq/yr)', // CHANGED Label
                     font: {size: 14, weight: '500'},
                     color: '#4b5563'
                 },
                 beginAtZero: true,
                 grid: { display: false } // Optional: hide vertical grid lines
             },
             // Y-axis remains linear for MAC
             y: {
                 type: 'linear',
                 title: {
                    display: true,
                    text: 'Marginal Abatement Cost ($/tCO2eq)',
                    font: {size: 14, weight: '500'},
                    color: '#4b5563'
                 },
                 grid: { color: '#e5e7eb' } // Keep horizontal grid lines
             }
        },
        plugins: {
            tooltip: {
                mode: 'index', // Find items in the same index
                intersect: false, // Tooltip activates even if not exactly hovering point
                callbacks: {
                    // Custom tooltip logic
                    title: function(tooltipItems) {
                        // Get the measure data associated with the hovered point
                        const pointData = tooltipItems[0]?.dataset.data[tooltipItems[0].dataIndex];
                        return pointData?.measureData?.name || 'Abatement Step';
                    },
                    label: function(context) {
                        const pointData = context.dataset.data[context.dataIndex];
                        const measure = pointData?.measureData;
                        if (measure) {
                             // Display MAC (the Y value)
                            let label = `MAC: $${measure.mac.toFixed(2)} / tCO2eq`;
                            return label;
                        }
                        return '';
                    },
                    footer: function(tooltipItems) {
                         const pointData = tooltipItems[0]?.dataset.data[tooltipItems[0].dataIndex];
                         const measure = pointData?.measureData;
                         if (measure) {
                            // Show individual abatement and cost for this measure step
                            return [
                                `Abatement: ${measure.annualAbatementForSelectedYear.toFixed(0)} tCO2eq/yr`,
                                `Annualized Cost: $${measure.annualizedCost.toFixed(0)} /yr`
                            ];
                         }
                         return '';
                    }
                }
            },
            legend: { display: false } // Keep legend hidden for single dataset
        },
        interaction: {
            mode: 'nearest', // Find the nearest item
            axis: 'x',      // Prioritize x-axis proximity
            intersect: false
        }
    }
};
// ****** END NEW baseMaccChartConfig ******

const baseWedgeChartConfig = {
    type: 'line', // Use line chart for stacked areas
    data: {
        labels: [], // Years
        datasets: [] // Measure datasets will be added here
    },
    options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: 'Year', font: { size: 14, weight: '500' }, color: '#4b5563' } },
            y: {
                stacked: true, // ** Enable stacking **
                title: { display: true, text: 'Cumulative Annual Abatement (tCO2eq/yr)', font: { size: 14, weight: '500' }, color: '#4b5563' },
                beginAtZero: true
            }
        },
        plugins: {
            tooltip: {
                mode: 'index', // Show tooltip for all stacked items at that year
                intersect: false,
                callbacks: {
                     // Modify label to show individual contribution
                     label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) { label += ': '; }
                        // Calculate individual contribution by subtracting the value below it
                        let currentValue = context.parsed.y || 0;
                        let previousValue = 0;
                        if (context.datasetIndex > 0) {
                            // Ensure the previous dataset has data at this index
                            const prevDataset = context.chart.data.datasets[context.datasetIndex - 1];
                            if (prevDataset.data.length > context.dataIndex) {
                                previousValue = prevDataset.data[context.dataIndex] || 0;
                            }
                        }
                        const individualValue = currentValue - previousValue;
                        label += `${individualValue.toFixed(0)} tCO2eq/yr`;
                        return label;
                    }
                }
            },
            legend: {
                position: 'bottom',
                labels: { usePointStyle: true, padding: 20, font: { size: 13 }, color: '#374151' }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    }
};

// --- Modal Management ---
// *** Assign functions to window object to make them globally accessible ***
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
    if (!scenario) { console.error("Scenario not found for editing:", scenarioId); return; }
    measuresModalTitle.textContent = `Edit Measures for ${scenario.name}`;
    modalMeasuresList.innerHTML = '';
    const measuresToEdit = JSON.parse(JSON.stringify(scenario.measures));
    measuresToEdit.forEach(measure => { modalMeasuresList.appendChild(createMeasureBlockElement(measure)); });
    measuresModal.classList.add('active');
}
window.closeMeasuresModal = function() {
    currentEditingScenarioId = null;
    measuresModal.classList.remove('active');
}
window.saveAndCloseMeasuresModal = function() {
    if (!currentEditingScenarioId) { console.log("Save cancelled: No scenario ID being edited."); closeMeasuresModal(); return; }
    const scenarioIndex = scenariosDataStore.findIndex(s => s.id === currentEditingScenarioId);
    if (scenarioIndex === -1) { console.error("Scenario to save not found in store:", currentEditingScenarioId); closeMeasuresModal(); return; }
    console.log(`Saving measures for scenario ID: ${currentEditingScenarioId}, Index: ${scenarioIndex}`);
    const updatedMeasures = [];
    const measureBlocksInModal = modalMeasuresList.querySelectorAll('.measure-block');
    console.log(`Found ${measureBlocksInModal.length} measure blocks in modal.`);
    measureBlocksInModal.forEach((block, index) => {
         try {
             const nameInput = block.querySelector('.measure-name-input');
             const name = nameInput ? nameInput.value.trim() || `Measure ${index + 1}` : `Measure ${index + 1}`;
             const reductionEl = block.querySelector('.measure-reduction');
             const reduction = reductionEl ? parseFloat(reductionEl.value) || 0 : 0;
             const permanentEl = block.querySelector('.measure-permanent');
             const isPermanent = permanentEl ? permanentEl.value === 'yes' : false;
             const lifecycleInput = block.querySelector('.measure-lifecycle');
             let lifecycle = 1;
             if (isPermanent) { lifecycle = 99; } else if (lifecycleInput) { lifecycle = parseInt(lifecycleInput.value) || 1; }
             lifecycle = Math.max(1, lifecycle);
             const instantEl = block.querySelector('.measure-instant');
             const isInstant = instantEl ? instantEl.value === 'yes' : true;
             const rampInput = block.querySelector('.measure-ramp');
             let rampYears = 1;
             if (!isInstant && rampInput) { rampYears = parseInt(rampInput.value) || 1; }
             rampYears = Math.max(1, rampYears);
             const startYearEl = block.querySelector('.measure-start-year');
             const startYear = startYearEl ? parseInt(startYearEl.value) || (parseInt(baselineYearInput.value) || 1990) : (parseInt(baselineYearInput.value) || 1990);
             const scopeEl = block.querySelector('.measure-scope');
             const scope = scopeEl ? scopeEl.value : 'Scope 1';
             const capexEl = block.querySelector('.measure-capex');
             const capex = capexEl ? parseFloat(capexEl.value) || 0 : 0;
             const opexEl = block.querySelector('.measure-opex');
             const opex = opexEl ? parseFloat(opexEl.value) || 0 : 0;
             const measureData = { id: block.id || `measure-${Date.now()}-${index}`, name, reduction, isPermanent, lifecycle, isInstant, rampYears, startYear, scope, capex, opex };
             console.log(`Read measure ${index + 1}:`, measureData);
             if (measureData.reduction > 0 && measureData.reduction <= 100 && measureData.lifecycle > 0 && measureData.startYear >= (parseInt(baselineYearInput.value) || 1990) && measureData.startYear <= 2050) {
                 updatedMeasures.push(measureData);
             } else { console.warn("Skipping invalid measure data during modal save:", measureData); }
         } catch (error) { console.error(`Error reading data for measure block ${index}:`, error, block); }
    });
    scenariosDataStore[scenarioIndex].measures = updatedMeasures;
    console.log("Updated scenariosDataStore:", JSON.stringify(scenariosDataStore));
    const scenarioBlockOnPage = document.getElementById(currentEditingScenarioId);
    if (scenarioBlockOnPage) { const countElement = scenarioBlockOnPage.querySelector('.text-xs'); if (countElement) { countElement.textContent = `${updatedMeasures.length} measure(s)`; } }
    closeMeasuresModal();
    if (isToolInitialized) { console.log("Triggering recalculation after saving measures..."); debouncedCalculateAllData(); }
}

// --- Calculation & Data ---
function calculateAllData() {
     if (!isToolInitialized) return;
     console.log("[calculateAllData] Starting calculation...");
     const totalBaselineEmissions = baselineData.scope1 + baselineData.scope2;
     const baselineYear = parseInt(baselineYearInput.value) || new Date().getFullYear();
     const isSBTiAligned = sbtiCheckbox.checked;
     const manualTargetReduction = Math.max(0, Math.min(100, parseFloat(targetReductionInput.value))) / 100 || 0;
     const endYear = 2050;
     const nearTermTargetYear = baselineYear + 10;
     const years = []; const bauEmissions = []; const targetEmissions = [];
     let sbtiNearTermLevel = null;
     let sbtiLongTermLevel = null;

     if (totalBaselineEmissions <= 0 || baselineYear > endYear || baselineYear < 2015) { console.error("[calculateAllData] Invalid baseline inputs. Clearing charts."); updateTrajectoryChart(years, bauEmissions, targetEmissions, [], null, null); updateMaccChart([], 0); updateWedgeChart(years, []); return; }
     let useSBTiLogic = isSBTiAligned;
     if (isSBTiAligned && nearTermTargetYear > 2050) { console.warn(`[calculateAllData] SBTi alignment selected, but Near-Term Target Year (${nearTermTargetYear}) is beyond 2050. Reverting to manual target.`); sbtiCheckbox.checked = false; targetReductionInput.disabled = false; sbtiNote.classList.add('hidden'); useSBTiLogic = false; }

     // Calculate BAU
     let currentBauEmissions = totalBaselineEmissions;
     for (let year = baselineYear; year <= endYear; year++) {
         years.push(year);
         if (year === baselineYear) { bauEmissions.push(currentBauEmissions); }
         else { let applicableGrowthRate = 0; if (year <= 2030) { applicableGrowthRate = growthRates.p1 / 100; } else if (year <= 2040) { applicableGrowthRate = growthRates.p2 / 100; } else { applicableGrowthRate = growthRates.p3 / 100; } const annualIncrease = totalBaselineEmissions * applicableGrowthRate; currentBauEmissions += annualIncrease; bauEmissions.push(Math.max(0, currentBauEmissions)); }
     }

     // Calculate Target Path
     if (useSBTiLogic) {
         sbtiNearTermLevel = totalBaselineEmissions * (1 - 0.42); sbtiLongTermLevel = totalBaselineEmissions * (1 - 0.90); console.log(`[calculateAllData] SBTi Targets: Near-Term Year=${nearTermTargetYear}, Level=${sbtiNearTermLevel}, 2050 Level=${sbtiLongTermLevel}`);
         for (let i = 0; i < years.length; i++) { const year = years[i]; if (year === baselineYear) { targetEmissions.push(totalBaselineEmissions); } else if (year <= nearTermTargetYear) { const yearsToNearTerm = nearTermTargetYear - baselineYear; const progressRatio = yearsToNearTerm > 0 ? Math.max(0, Math.min(1, (year - baselineYear) / yearsToNearTerm)) : 1; const linearTarget = totalBaselineEmissions + (sbtiNearTermLevel - totalBaselineEmissions) * progressRatio; targetEmissions.push(Math.max(0, linearTarget)); } else { const yearsTo2050 = endYear - nearTermTargetYear; const nearTermIndex = years.indexOf(nearTermTargetYear); const startLevel = (nearTermIndex !== -1 && targetEmissions[nearTermIndex] !== undefined) ? targetEmissions[nearTermIndex] : sbtiNearTermLevel; const progressRatio = yearsTo2050 > 0 ? Math.max(0, Math.min(1, (year - nearTermTargetYear) / yearsTo2050)) : 1; const linearTarget = startLevel + (sbtiLongTermLevel - startLevel) * progressRatio; targetEmissions.push(Math.max(0, linearTarget)); } }
     } else {
         console.log(`[calculateAllData] Using Manual Target Reduction: ${manualTargetReduction * 100}%`); const targetEmission2050 = totalBaselineEmissions * (1 - manualTargetReduction); const finalTarget = Math.max(0, targetEmission2050);
         for (let i = 0; i < years.length; i++) { const year = years[i]; if (year === baselineYear) { targetEmissions.push(totalBaselineEmissions); } else { const yearsTotal = endYear - baselineYear; const progressRatio = yearsTotal > 0 ? Math.max(0, Math.min(1,(year - baselineYear) / yearsTotal)) : 1; const linearTarget = totalBaselineEmissions + (finalTarget - totalBaselineEmissions) * progressRatio; targetEmissions.push(Math.max(0, linearTarget)); } }
     }

     // Calculate Scenarios & Wedge Data
     const scenariosData = getAllScenariosData();
     const scenarioTrajectories = [];
     const wedgeDatasets = []; // For Wedge Chart

     if (scenariosData.length > 0) {
         // --- Scenario Trajectory Calculation ---
         // (This part calculates the main trajectory lines for the first chart)
         scenariosData.forEach((scenario, scenarioIndex) => {
            const scenarioEmissionValues = [];
            for (let i = 0; i < years.length; i++) {
                const currentYear = years[i];
                const currentBau = bauEmissions[i];
                let totalYearlyReductionForScenario = 0;

                scenario.measures.forEach((measure) => {
                    const endMeasureYear = measure.startYear + measure.lifecycle - 1;
                    let absoluteAnnualAbatement = 0;
                    if (currentYear >= measure.startYear && currentYear <= endMeasureYear) {
                        const yrsIn = currentYear - measure.startYear + 1;
                        const rampYears = Math.max(1, measure.rampYears || 1);
                        const rampFactor = Math.min(1, yrsIn / rampYears);
                        const effectiveReductionPercent = (measure.reduction / 100) * rampFactor;
                        let relevantBaseline = 0;
                        if (measure.scope === 'Scope 1') { relevantBaseline = baselineData.scope1 || 0; }
                        else if (measure.scope === 'Scope 2') { relevantBaseline = baselineData.scope2 || 0; }
                        absoluteAnnualAbatement = (relevantBaseline > 1e-9 ? relevantBaseline : 0) * effectiveReductionPercent;
                    }
                    totalYearlyReductionForScenario += absoluteAnnualAbatement;
                });
                scenarioEmissionValues.push(Math.max(0, currentBau - totalYearlyReductionForScenario));
            }
            scenarioTrajectories.push({ name: scenario.name, color: scenario.color, data: scenarioEmissionValues });
         });

         // --- Wedge Data Calculation (Uses only the FIRST scenario) ---
         const firstScenario = scenariosData[0];
         wedgeScenarioInfo.textContent = `Abatement breakdown for scenario: "${firstScenario.name}"`;

         // Prepare wedge datasets
         firstScenario.measures.forEach((measure, measureIndex) => {
             wedgeDatasets.push({
                 label: measure.name, data: [],
                 backgroundColor: `${wedgeColors[measureIndex % wedgeColors.length]}B3`, // Add alpha
                 borderColor: wedgeColors[measureIndex % wedgeColors.length],
                 borderWidth: 0.5, pointRadius: 0, fill: true, order: measureIndex // Ensure order for stacking
             });
         });

         // Calculate cumulative annual abatement per measure per year
         for (let i = 0; i < years.length; i++) {
             const currentYear = years[i];
             let cumulativeAbatementForYearStack = 0; // Tracks the top of the stack for the current year

             firstScenario.measures.forEach((measure, measureIndex) => {
                 const endMeasureYear = measure.startYear + measure.lifecycle - 1;
                 let absoluteAnnualAbatement = 0;

                 if (currentYear >= measure.startYear && currentYear <= endMeasureYear) {
                     const yrsIn = currentYear - measure.startYear + 1;
                     const rampYears = Math.max(1, measure.rampYears || 1);
                     const rampFactor = Math.min(1, yrsIn / rampYears);
                     const effectiveReductionPercent = (measure.reduction / 100) * rampFactor;
                     let relevantBaseline = 0;
                     if (measure.scope === 'Scope 1') { relevantBaseline = baselineData.scope1 || 0; }
                     else if (measure.scope === 'Scope 2') { relevantBaseline = baselineData.scope2 || 0; }
                     absoluteAnnualAbatement = (relevantBaseline > 1e-9 ? relevantBaseline : 0) * effectiveReductionPercent;
                 }

                 cumulativeAbatementForYearStack += absoluteAnnualAbatement; // Add this measure's contribution

                 if (wedgeDatasets[measureIndex]) {
                     // Push the cumulative value *up to this measure* for stacking
                     wedgeDatasets[measureIndex].data.push(cumulativeAbatementForYearStack);
                 }
             });
         }
     } else {
         wedgeScenarioInfo.textContent = "Add a scenario and measures to see abatement wedges.";
     }

     // Update Trajectory Chart (before MACC/Wedge)
     updateTrajectoryChart(years, bauEmissions, targetEmissions, scenarioTrajectories, useSBTiLogic ? sbtiNearTermLevel : null, useSBTiLogic ? sbtiLongTermLevel : null);

     // ****** NEW MACC Data Calculation Block ******
     // --- Calculate MACC Data for the selected year ---
     const selectedMaccYear = parseInt(maccYearSelect.value) || baselineYear + 1;
     let processedMaccData = []; // Keep this for intermediate calculation
     let maccChartDataPoints = []; // NEW: For the stepped line chart

     if (scenariosDataStore.length > 0 && scenariosDataStore[0].measures.length > 0) {
          const firstScenario = scenariosDataStore[0];
          maccScenarioInfo.textContent = `Analysis based on measures in scenario: "${firstScenario.name}" for year ${selectedMaccYear}`;

          // 1. Calculate MAC and Abatement for each measure
          processedMaccData = firstScenario.measures.map(measure => {
              const lifecycle = measure.lifecycle;
              const reductionPercent = measure.reduction / 100;
              let relevantBaseline = 0;
              if (measure.scope === 'Scope 1') { relevantBaseline = baselineData.scope1 || 0; }
              else if (measure.scope === 'Scope 2') { relevantBaseline = baselineData.scope2 || 0; }
              const validBaseline = relevantBaseline > 1e-9 ? relevantBaseline : 1e-9;

              // Use the consistent variable name here (fix from previous step)
              let annualAbatementForSelectedYear = 0;
              const endMeasureYear = measure.startYear + measure.lifecycle - 1;
              if (selectedMaccYear >= measure.startYear && selectedMaccYear <= endMeasureYear) {
                    const yrsIn = selectedMaccYear - measure.startYear + 1;
                    const rampYears = Math.max(1, measure.rampYears || 1);
                    const rampFactor = Math.min(1, yrsIn / rampYears);
                    const effectiveReductionPercent = reductionPercent * rampFactor;
                    annualAbatementForSelectedYear = validBaseline * effectiveReductionPercent;
              }

              const annualizedCapex = (lifecycle > 0) ? measure.capex / lifecycle : measure.capex;
              const annualizedCost = annualizedCapex + measure.opex;
              const mac = (annualAbatementForSelectedYear > 1e-9) ? annualizedCost / annualAbatementForSelectedYear : Infinity;

              if (annualAbatementForSelectedYear <= 1e-9 || !isFinite(mac) || !isFinite(annualizedCost)) return null;

              // Return the fully processed measure data including the calculated values
              return { ...measure, annualAbatementForSelectedYear, annualizedCost, mac };
          }).filter(m => m !== null);

          // 2. Sort measures by MAC (ascending)
          processedMaccData.sort((a, b) => a.mac - b.mac);

          // 3. Generate data points for the stepped line chart
          let cumulativeAbatement = 0;
          maccChartDataPoints.push({ x: 0, y: 0, measureData: null }); // Start point at origin

          processedMaccData.forEach(measure => {
              const abatement = measure.annualAbatementForSelectedYear;
              const mac = measure.mac;

              // Add point at the *start* of this measure's abatement contribution
              // Use the MAC of the *current* measure for the vertical step *before* adding its abatement
              if (maccChartDataPoints.length > 0) {
                 maccChartDataPoints.push({
                     x: cumulativeAbatement,
                     y: mac, // Y value jumps to the MAC of the current measure
                     measureData: measure // Associate measure data with the start of its step
                 });
              }

              // Update cumulative abatement *after* defining the start point
              cumulativeAbatement += abatement;

              // Add point at the *end* of this measure's abatement contribution (same MAC)
              maccChartDataPoints.push({
                  x: cumulativeAbatement,
                  y: mac,
                  measureData: measure // Also associate with the end for tooltip consistency
              });
          });

     } else {
          maccScenarioInfo.textContent = "Add measures to the first scenario to see MACC analysis.";
     }

     // Pass the NEW data structure to the update function
     updateMaccChart(maccChartDataPoints, selectedMaccYear); // Use maccChartDataPoints
     // ****** END NEW MACC Data Calculation Block ******

     // Update Wedge Chart (after all calculations)
     updateWedgeChart(years, wedgeDatasets);
}


function getAllScenariosData() {
    console.log("[getAllScenariosData] Reading from scenariosDataStore:", JSON.stringify(scenariosDataStore));
    return JSON.parse(JSON.stringify(scenariosDataStore)); // Return a deep copy
}

// --- Chart Update Functions ---
function updateTrajectoryChart(years, bauData, targetData, scenarioTrajectories, nearTermTargetLevel, longTermTargetLevel) {
    if (!trajectoryCtx) { console.error("Trajectory Chart context not found!"); return; }
    if (trajectoryChartInstance) { trajectoryChartInstance.destroy(); }

    // Create a deep copy of the base config to modify
    const newChartConfig = JSON.parse(JSON.stringify(baseTrajectoryChartConfig));

    newChartConfig.data.labels = years;
    newChartConfig.data.datasets[0].data = bauData; // BAU (index 0)
    newChartConfig.data.datasets[1].data = targetData; // Target Path (index 1)

    // Update horizontal target lines based on calculated levels
    const showSBTiLines = nearTermTargetLevel !== null && longTermTargetLevel !== null;
    console.log(`[updateTrajectoryChart] showSBTiLines = ${showSBTiLines}`);

    // Update dataset 2 (Near-Term Level)
    newChartConfig.data.datasets[2].data = showSBTiLines ? years.map(() => nearTermTargetLevel) : [];
    newChartConfig.data.datasets[2].hidden = !showSBTiLines; // Set hidden status

    // Update dataset 3 (Long-Term Level)
    newChartConfig.data.datasets[3].data = showSBTiLines ? years.map(() => longTermTargetLevel) : [];
    newChartConfig.data.datasets[3].hidden = !showSBTiLines; // Set hidden status

    // Remove any existing scenario datasets (beyond the first 4 base ones)
    newChartConfig.data.datasets = newChartConfig.data.datasets.slice(0, 4);

    // Add scenario datasets (start from index 4 now)
    scenarioTrajectories.forEach((scenario, index) => {
        newChartConfig.data.datasets.push({
            label: scenario.name,
            data: scenario.data,
            borderColor: scenario.color,
            backgroundColor: `${scenario.color}33`,
            tension: 0.1,
            borderWidth: 2.5,
            pointBackgroundColor: scenario.color,
            pointRadius: 3,
            pointHoverRadius: 6,
            fill: false,
            order: 3 // Keep order consistent relative to base lines
        });
    });

     // Use the standard legend filter based on the 'hidden' property
     newChartConfig.options.plugins.legend.labels.filter = function(legendItem, chartData) {
           const dataset = chartData.datasets[legendItem.datasetIndex];
           return dataset && !dataset.hidden;
     };
     // Tooltip filter remains the same (exclude datasets 2 and 3 by index)
      newChartConfig.options.plugins.tooltip.filter = function(tooltipItem) {
           return tooltipItem.datasetIndex !== 2 && tooltipItem.datasetIndex !== 3;
     };


    console.log("[updateTrajectoryChart] Final datasets count:", newChartConfig.data.datasets.length);
    console.log("[updateTrajectoryChart] Final datasets config (Hidden Status):", JSON.stringify(newChartConfig.data.datasets.map(ds => ({label: ds.label, hidden: ds.hidden}))));

    try {
        trajectoryChartInstance = new Chart(trajectoryCtx, newChartConfig);
         console.log("[updateTrajectoryChart] Trajectory chart updated.");
    } catch(error) {
         console.error("[updateTrajectoryChart] Error creating trajectory chart:", error);
    }
}

// ****** NEW updateMaccChart function ******
function updateMaccChart(maccDataPoints, selectedYear) { // Now expects data points {x, y, measureData}
    if (!maccCtx) { console.error("MACC Chart context (maccCtx) not found!"); return; }
    if (maccChartInstance) { maccChartInstance.destroy(); }
    console.log(`[updateMaccChart - Stepped] Updating MACC for year ${selectedYear} with point count:`, maccDataPoints.length);

    // Use a deep copy of the NEW base config
    const newChartConfig = JSON.parse(JSON.stringify(baseMaccChartConfig));

    if (maccDataPoints.length <= 1) { // Need more than just the origin point
        console.log("[updateMaccChart - Stepped] No valid measure data points to plot.");
         maccScenarioInfo.textContent = `No valid measures found for MACC analysis in ${selectedYear}.`;
         newChartConfig.data.datasets[0].data = []; // Clear data
    } else {
        newChartConfig.data.datasets[0].data = maccDataPoints; // Assign the structured points
         const scenarioName = scenariosDataStore.length > 0 ? scenariosDataStore[0].name : "Scenario 1";
         // Ensure scenario info text is updated correctly (it should be set in calculateAllData already)
         if (maccScenarioInfo.textContent.includes("Add measures")) { // Update if default text is still there
            maccScenarioInfo.textContent = `Analysis based on measures in scenario: "${scenarioName}" for year ${selectedYear}`;
         }
    }

    // Update axis labels dynamically
    newChartConfig.options.scales.x.title.text = `Cumulative Annual Abatement (tCO2eq/yr) - Year ${selectedYear}`;
    newChartConfig.options.scales.y.title.text = 'Marginal Abatement Cost ($/tCO2eq)';

    console.log("[updateMaccChart - Stepped] Final Chart Config Data:", JSON.stringify(newChartConfig.data));

    try {
        maccChartInstance = new Chart(maccCtx, newChartConfig);
        console.log("[updateMaccChart - Stepped] New MACC chart instance created successfully.");
    } catch (error) {
        console.error("[updateMaccChart - Stepped] Error creating MACC chart:", error);
        maccScenarioInfo.textContent = "Error displaying MACC chart. Check console for details.";
    }
}
// ****** END NEW updateMaccChart function ******


function updateWedgeChart(years, wedgeDatasets) {
     if (!wedgeCtx) { console.error("Wedge Chart context (wedgeCtx) not found!"); return; }
     if (wedgeChartInstance) { wedgeChartInstance.destroy(); }
     console.log("[updateWedgeChart] Updating Wedge chart with dataset count:", wedgeDatasets.length);

     const newChartConfig = JSON.parse(JSON.stringify(baseWedgeChartConfig));
     newChartConfig.data.labels = years;
     newChartConfig.data.datasets = wedgeDatasets; // Assign the calculated datasets

     // Update info text based on whether there's data
     if (wedgeDatasets.length === 0) {
         wedgeScenarioInfo.textContent = "Add measures to the first scenario to see abatement wedges.";
     } else {
         const scenarioName = scenariosDataStore.length > 0 ? scenariosDataStore[0].name : "Scenario 1";
          // Ensure scenario info text is updated correctly (it should be set in calculateAllData already)
          if (wedgeScenarioInfo.textContent.includes("Add a scenario")) {
            wedgeScenarioInfo.textContent = `Abatement breakdown for scenario: "${scenarioName}"`;
          }
     }

     console.log("[updateWedgeChart] Final Wedge Chart Config Data:", JSON.stringify(newChartConfig.data));

     try {
         wedgeChartInstance = new Chart(wedgeCtx, newChartConfig);
         console.log("[updateWedgeChart] New Wedge chart instance created successfully.");
     } catch (error) {
         console.error("[updateWedgeChart] Error creating Wedge chart:", error);
         wedgeScenarioInfo.textContent = "Error displaying Abatement Wedges chart. Check console for details.";
     }
 }


// --- Event Listeners & Debounce ---
function debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }
const debouncedCalculateAllData = debounce(calculateAllData, 350);

// --- Scenario & Measure Management ---
function addScenario() {
    const scenarioId = `scenario-${Date.now()}`; const scenarioCount = scenariosDataStore.length + 1; const defaultScenarioName = `Scenario ${scenarioCount}`; const color = scenarioColors[scenarioColorIndex % scenarioColors.length]; scenarioColorIndex++;
    const newScenarioData = { id: scenarioId, name: defaultScenarioName, color: color, measures: [] }; scenariosDataStore.push(newScenarioData);
    const scenarioBlock = createScenarioBlockElement(newScenarioData); scenariosListContainer.appendChild(scenarioBlock);
    // Don't recalculate immediately, wait for measures
    if(isToolInitialized) {
        // Only update trajectory chart if needed (e.g., to show a new empty scenario line)
        // Or just let the next measure addition trigger the full calc
         console.log("Scenario added, recalculation will happen on measure edit/save.");
         // Optionally trigger a light update if you want the line immediately
         // calculateAllData(); // Or a lighter version just for trajectory
    }
}
function createScenarioBlockElement(scenarioData) {
     const scenarioBlock = document.createElement('div'); scenarioBlock.classList.add('scenario-block'); scenarioBlock.id = scenarioData.id; scenarioBlock.dataset.color = scenarioData.color;
     scenarioBlock.innerHTML = `<div class="flex justify-between items-center mb-3"><input type="text" value="${scenarioData.name}" placeholder="Scenario Name" class="scenario-name-input name-input flex-grow mr-3 text-lg" oninput="updateScenarioName('${scenarioData.id}', this.value)"><div class="flex items-center gap-2"><button type="button" class="edit-btn text-sm" onclick="openMeasuresModal('${scenarioData.id}')">Edit Measures</button><button type="button" class="remove-btn" onclick="deleteScenario('${scenarioData.id}')">Delete</button></div></div><p class="text-xs text-gray-500">${scenarioData.measures.length} measure(s)</p>`;
     return scenarioBlock;
}
// *** Make sure onclick functions are globally accessible ***
window.updateScenarioName = updateScenarioName;
window.deleteScenario = deleteScenario;
window.openMeasuresModal = openMeasuresModal;
window.removeMeasureInModal = removeMeasureInModal;
window.toggleLifecycleInput = toggleLifecycleInput;
window.toggleRampYearsInput = toggleRampYearsInput;
window.switchTab = switchTab;
window.showHomePage = showHomePage;
window.openBaselineModal = openBaselineModal;
window.closeBaselineModal = closeBaselineModal;
window.saveBaselineModal = saveBaselineModal;
window.openGrowthRateModal = openGrowthRateModal;
window.closeGrowthRateModal = closeGrowthRateModal;
window.saveGrowthRateModal = saveGrowthRateModal;
window.closeMeasuresModal = closeMeasuresModal;
window.saveAndCloseMeasuresModal = saveAndCloseMeasuresModal;


function updateScenarioName(scenarioId, newName) {
    console.log(`Updating name for ${scenarioId} to ${newName}`); // Debug
    const scenario = scenariosDataStore.find(s => s.id === scenarioId);
    if (scenario) {
        scenario.name = newName.trim() || "Unnamed Scenario";
        if (scenariosDataStore.length > 0 && scenariosDataStore[0].id === scenarioId) {
             maccScenarioInfo.textContent = `Analysis based on measures in scenario: "${scenario.name}"`;
             wedgeScenarioInfo.textContent = `Abatement breakdown for scenario: "${scenario.name}"`; // Update wedge info too
        }
        if (trajectoryChartInstance) {
            const datasetIndex = scenariosDataStore.findIndex(s => s.id === scenarioId);
            // Index 0,1 are BAU/Target, 2,3 are SBTi lines. Scenarios start at 4.
            const chartDatasetIndex = datasetIndex + 4;
            if (datasetIndex !== -1 && trajectoryChartInstance.data.datasets[chartDatasetIndex]) {
                trajectoryChartInstance.data.datasets[chartDatasetIndex].label = scenario.name;
                trajectoryChartInstance.update('none'); // Use 'none' for no animation
            } else {
                 console.warn(`Could not find dataset index ${chartDatasetIndex} to update name.`);
            }
        }
         // Also update MACC/Wedge info text if it's the first scenario
         if (scenariosDataStore.length > 0 && scenariosDataStore[0].id === scenarioId) {
             const selectedMaccYear = parseInt(maccYearSelect.value) || (parseInt(baselineYearInput.value) || new Date().getFullYear()) + 1;
             maccScenarioInfo.textContent = `Analysis based on measures in scenario: "${scenario.name}" for year ${selectedMaccYear}`;
             wedgeScenarioInfo.textContent = `Abatement breakdown for scenario: "${scenario.name}"`;
         }

    } else {
         console.warn(`Could not find scenario ${scenarioId} to update name.`);
    }
}
function deleteScenario(scenarioId) {
    console.log(`Deleting scenario ${scenarioId}`); // Debug
    const scenarioIndex = scenariosDataStore.findIndex(s => s.id === scenarioId);
    scenariosDataStore = scenariosDataStore.filter(s => s.id !== scenarioId);
    const scenarioBlock = document.getElementById(scenarioId);
    if (scenarioBlock) scenarioBlock.remove();
    // If the first scenario was deleted, clear MACC/Wedge info
    if(scenarioIndex === 0) {
         maccScenarioInfo.textContent = "Add measures to the first scenario to see MACC analysis.";
         wedgeScenarioInfo.textContent = "Add measures to the first scenario to see abatement wedges.";
    }
    if(isToolInitialized) calculateAllData(); // Recalculate
}

// *** Updated createMeasureBlockElement with Ramp-up ***
function createMeasureBlockElement(measureData = {}) {
    const measureId = measureData.id || `measure-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const measureBlock = document.createElement('div');
    measureBlock.classList.add('measure-block');
    measureBlock.id = measureId;

    const currentBaselineYear = parseInt(baselineYearInput.value) || new Date().getFullYear();
    const name = measureData.name || `New Measure`;
    const reduction = measureData.reduction || 5;
    const isPermanent = measureData.isPermanent || false;
    const lifecycle = measureData.lifecycle || 10;
    const isInstant = measureData.isInstant === undefined ? true : measureData.isInstant; // Default to instant
    const rampYears = measureData.rampYears || 1;
    const startYear = measureData.startYear || (currentBaselineYear + 1);
    const scope = measureData.scope || 'Scope 1';
    const capex = measureData.capex || 100000;
    const opex = measureData.opex || 5000;

    measureBlock.innerHTML = `
        <div class="flex justify-between items-center mb-3">
             <input type="text" value="${name}" placeholder="Measure Name" class="measure-name-input name-input flex-grow mr-2 text-sm">
             <button type="button" class="remove-btn text-xs" onclick="removeMeasureInModal('${measureId}')">Remove</button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2"> <div>
                <label class="block text-xs font-medium text-gray-600">Reduction (%)</label>
                <input type="number" value="${reduction}" min="0" max="100" step="0.1" class="measure-reduction w-full">
            </div>
             <div>
                <label class="block text-xs font-medium text-gray-600">Scope</label>
                <select class="measure-scope w-full">
                    <option value="Scope 1" ${scope === 'Scope 1' ? 'selected' : ''}>Scope 1</option>
                    <option value="Scope 2" ${scope === 'Scope 2' ? 'selected' : ''}>Scope 2</option>
                </select>
            </div>
             <div>
                <label class="block text-xs font-medium text-gray-600">Start Year</label>
                <input type="number" value="${startYear}" min="${currentBaselineYear}" max="2050" class="measure-start-year w-full">
            </div>
             <div>
                <label class="block text-xs font-medium text-gray-600">Permanent?</label>
                <select class="measure-permanent w-full" onchange="toggleLifecycleInput(this, '${measureId}')">
                    <option value="no" ${!isPermanent ? 'selected' : ''}>No</option>
                    <option value="yes" ${isPermanent ? 'selected' : ''}>Yes</option>
                </select>
            </div>
             <div class="lifecycle-input-container ${isPermanent ? 'hidden' : ''}">
                <label class="block text-xs font-medium text-gray-600">Lifecycle (yrs)</label>
                <input type="number" value="${lifecycle}" min="1" class="measure-lifecycle w-full">
            </div>
             <div>
                <label class="block text-xs font-medium text-gray-600">Instant Effect?</label>
                <select class="measure-instant w-full" onchange="toggleRampYearsInput(this, '${measureId}')">
                    <option value="yes" ${isInstant ? 'selected' : ''}>Yes</option>
                    <option value="no" ${!isInstant ? 'selected' : ''}>No</option>
                </select>
            </div>
             <div class="ramp-years-input-container ${isInstant ? 'hidden' : ''}">
                <label class="block text-xs font-medium text-gray-600">Ramp-up (yrs)</label>
                <input type="number" value="${rampYears}" min="1" step="1" class="measure-ramp w-full">
            </div>
             <div>
                <label class="block text-xs font-medium text-gray-600">CAPEX ($)</label>
                <input type="number" value="${capex}" min="0" step="1000" class="measure-capex w-full">
            </div>
             <div>
                <label class="block text-xs font-medium text-gray-600">OPEX ($/yr)</label>
                <input type="number" value="${opex}" min="0" step="100" class="measure-opex w-full">
            </div>
        </div>
    `;
    return measureBlock;
}


function addMeasureInModal() {
    if (!currentEditingScenarioId) return;
    const newMeasureBlock = createMeasureBlockElement();
    modalMeasuresList.appendChild(newMeasureBlock);
    // Scroll the container to the bottom to show the new measure
    modalMeasuresList.scrollTop = modalMeasuresList.scrollHeight;
}
modalAddMeasureBtn.addEventListener('click', addMeasureInModal);
function removeMeasureInModal(measureId) {
    const measureBlock = document.getElementById(measureId); if (measureBlock) { measureBlock.remove(); console.log(`Removed measure block ${measureId} from modal DOM.`); } else { console.warn(`Could not find measure block with ID ${measureId} to remove from modal.`); }
}
function toggleLifecycleInput(selectElement, measureId) {
    const measureBlock = document.getElementById(measureId); if (!measureBlock) return; const lifecycleContainer = measureBlock.querySelector('.lifecycle-input-container'); if (selectElement.value === 'yes') { lifecycleContainer.classList.add('hidden'); } else { lifecycleContainer.classList.remove('hidden'); }
}
// ** New function to toggle ramp-up input visibility **
function toggleRampYearsInput(selectElement, measureId) {
     const measureBlock = document.getElementById(measureId);
     if (!measureBlock) return;
     const rampYearsContainer = measureBlock.querySelector('.ramp-years-input-container');
     if (selectElement.value === 'yes') { // Instant effect = Yes
         rampYearsContainer.classList.add('hidden');
     } else { // Instant effect = No
         rampYearsContainer.classList.remove('hidden');
     }
 }


// --- Tab Switching Logic ---
function switchTab(tabId) {
    activeTab = tabId;
    // Hide all content
    tabContentDashboard.classList.add('hidden');
    tabContentMacc.classList.add('hidden');
    tabContentWedges.classList.add('hidden');
    // Deactivate all buttons
    tabBtnDashboard.classList.remove('active');
    tabBtnMacc.classList.remove('active');
    tabBtnWedges.classList.remove('active');

    // Activate selected tab
    if (tabId === 'dashboard') {
        tabContentDashboard.classList.remove('hidden');
        tabBtnDashboard.classList.add('active');
    } else if (tabId === 'macc') {
        tabContentMacc.classList.remove('hidden');
        tabBtnMacc.classList.add('active');
         // Trigger calculation when tab becomes active to ensure MACC year is correct
         if (isToolInitialized) {
             console.log("MACC tab activated, recalculating...");
             debouncedCalculateAllData();
         }
    } else if (tabId === 'wedges') {
        tabContentWedges.classList.remove('hidden');
        tabBtnWedges.classList.add('active');
         // Trigger calculation might not be strictly necessary unless data changes often
         // but doesn't hurt if debounced
         if (isToolInitialized) {
             console.log("Wedge tab activated, recalculating...");
             debouncedCalculateAllData();
         }
    }
}

// --- Page Navigation Logic ---
function showPage(pageIdToShow) {
    console.log(`[showPage] Attempting to show: ${pageIdToShow}`);
    const pageToHideId = (pageIdToShow === 'tool-section') ? 'home-section' : 'tool-section';
    const pageToHide = document.getElementById(pageToHideId);
    const pageToShow = document.getElementById(pageIdToShow);

    if (!pageToHide || !pageToShow) {
        console.error(`[showPage] Could not find elements for page transition.`);
        return;
    }

    // Start fading out the current page
    pageToHide.classList.add('fade-out');

    // After fade out duration, hide old page and show new page
    setTimeout(() => {
        pageToHide.classList.add('hidden'); // Use display:none
        pageToHide.classList.remove('opacity-100', 'visible'); // Ensure fully hidden if classes were added
        pageToHide.classList.remove('fade-out'); // Clean up class

        pageToShow.classList.remove('hidden'); // Make new page take up space
        pageToShow.classList.remove('opacity-0', 'invisible'); // Ensure ready to be shown

        // Use rAF to ensure display change is rendered before adding active class for fade-in
        requestAnimationFrame(() => {
            pageToShow.classList.add('active'); // This class should control opacity: 1, visibility: visible
            // Scroll tool section into view smoothly if needed
            if (pageIdToShow === 'tool-section') {
                 pageToShow.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                 window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll home to top smoothly
            }
        });

        console.log(`[showPage] Now showing: ${pageIdToShow}`);

    }, 500); // Match the CSS transition duration (0.5s)
}

function showHomePage() {
    showPage('home-section');
}


// --- Tool Initialization Function ---
function initializeTool() {
     if (isToolInitialized) {
         console.log("[initializeTool] Tool already initialized.");
         return; // Only run once
     }
     console.log("[initializeTool] Initializing tool...");

     // Set initial displays based on defaults before first calculation
     saveBaselineModal(); // Initialize baseline display based on modal defaults
     updateGrowthRateDisplay(); // Initialize growth display based on defaults
     targetReductionInput.disabled = sbtiCheckbox.checked;
     sbtiNote.classList.toggle('hidden', !sbtiCheckbox.checked);
     populateMaccYearSelector(); // Populate year selector

     // Add the default scenario immediately if none exist
     if (scenariosDataStore.length === 0) {
         addScenario(); // Adds the scenario block, but doesn't calculate yet
     } else {
         // If data was somehow pre-loaded, render existing scenarios
         scenariosListContainer.innerHTML = '';
         scenariosDataStore.forEach(sc => { scenariosListContainer.appendChild(createScenarioBlockElement(sc)); });
     }

     // Attach listeners for elements *inside* the tool section now
     if(addScenarioBtn) { addScenarioBtn.addEventListener('click', addScenario); } else { console.error("Add Scenario button not found during initialization!"); }
     baselineYearInput.addEventListener('input', () => { updateGrowthRateDisplay(); populateMaccYearSelector(); debouncedCalculateAllData(); }); // Update year selector on baseline change
     targetReductionInput.addEventListener('input', debouncedCalculateAllData);
     sbtiCheckbox.addEventListener('change', () => { targetReductionInput.disabled = sbtiCheckbox.checked; sbtiNote.classList.toggle('hidden', !sbtiCheckbox.checked); debouncedCalculateAllData(); });
     maccYearSelect.addEventListener('change', debouncedCalculateAllData); // Recalculate MACC on year change

     isToolInitialized = true; // Set flag after setup but before first calc

     // Perform the initial calculation after setup
     calculateAllData();

     console.log("[initializeTool] Initialization complete.");
}

// --- MACC Year Selector Population ---
function populateMaccYearSelector() {
    const startYear = parseInt(baselineYearInput.value) || new Date().getFullYear();
    const endYear = 2050;
    const currentSelectedValue = maccYearSelect.value; // Remember current selection
    let valueExists = false;
    maccYearSelect.innerHTML = ''; // Clear existing options

    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        maccYearSelect.appendChild(option);
        if (year == currentSelectedValue) {
            valueExists = true; // Mark if the previous selection is still valid
        }
    }

    // Reselect previous value if still valid, otherwise select a sensible default (e.g., 2030 or startYear + 1)
    if (valueExists) {
        maccYearSelect.value = currentSelectedValue;
    } else {
        maccYearSelect.value = Math.min(endYear, Math.max(startYear + 1, 2030)); // Default selection logic
    }
}


// --- Home Page Interaction & Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Page loaded. Tool inactive.");
    // Start with home section visible, tool hidden and transparent
    homeSection.classList.remove('hidden');
    homeSection.classList.add('active'); // Make home visible
    toolSection.classList.add('hidden', 'opacity-0'); // Keep tool hidden and transparent
    toolSection.classList.remove('active');

    // Set initial displays based on defaults (before tool init)
    baselineDisplay.textContent = `${(baselineData.scope1 + baselineData.scope2).toFixed(0)} tCO2eq`;
    updateGrowthRateDisplay();
    targetReductionInput.disabled = sbtiCheckbox.checked;
    sbtiNote.classList.toggle('hidden', !sbtiCheckbox.checked);
    populateMaccYearSelector(); // Populate MACC year selector initially

    // ** Attach the home button listener here **
     if (tryToolBtn) {
         tryToolBtn.addEventListener('click', () => {
             console.log("[tryToolBtn] Clicked!");
             showPage('tool-section'); // Switch page using fade
             // Initialize the tool *after* the page is shown and fade is complete
             // Use setTimeout to ensure the DOM is ready after transition
             setTimeout(() => {
                // requestAnimationFrame might be too soon, stick with timeout matching transition
                initializeTool();
             }, 500); // Match the fade transition duration

         });
         console.log("Event listener attached to tryToolBtn.");
     } else {
         console.error("tryToolBtn not found!");
     }

    // Attach other listeners that need the DOM ready but don't trigger calc immediately
     baselineYearInput.addEventListener('input', () => {
         updateGrowthRateDisplay();
         populateMaccYearSelector(); // Update MACC year options if baseline year changes
         if (isToolInitialized) debouncedCalculateAllData();
     });
     targetReductionInput.addEventListener('input', () => {
         if (isToolInitialized) debouncedCalculateAllData();
     });
     sbtiCheckbox.addEventListener('change', () => {
         targetReductionInput.disabled = sbtiCheckbox.checked;
         sbtiNote.classList.toggle('hidden', !sbtiCheckbox.checked);
         if (isToolInitialized) debouncedCalculateAllData();
     });
     maccYearSelect.addEventListener('change', () => { // Add listener for MACC year select
         if (isToolInitialized) debouncedCalculateAllData();
     });
     // addScenarioBtn listener is added during initializeTool

}); // End DOMContentLoaded


 // --- Background Animation ---
 homeSection.addEventListener('mousemove', (e) => {
    // Only run animation if home section is visible
    if (homeSection.classList.contains('active')) {
        const { clientX, clientY } = e;
        const { offsetWidth, offsetHeight } = homeSection;
        // Calculate percentage relative to the element itself
        const rect = homeSection.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const xPercent = (x / offsetWidth) * 100;
        const yPercent = (y / offsetHeight) * 100;
        homeSection.style.setProperty('--x', `${xPercent}%`);
        homeSection.style.setProperty('--y', `${yPercent}%`);
    }
});
