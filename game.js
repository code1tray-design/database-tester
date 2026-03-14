// VIKSIT BHARAT - Skill to Scale | ADVANCED Startup Simulator Engine

// Game State
const state = {
    currentRound: 1,
    totalRounds: 18,
    cash: 1000000,
    revenue: 0,
    profit: 0,
    marketShare: 5,
    esgScore: 5.0,
    reputationScore: 5, // 1-10
    moraleScore: 5, // 1-10
    investorScore: 5,
    riskScore: 3,
    timerSeconds: 90,
    timerInterval: null,
    startTime: Date.now(),
    history: [],
    hiddenEffects: {
        ignoredESG: false,
        ignoredFraud: false,
        poorGovernance: false,
        calamityHit: false
    },
    randomCalamityRound: Math.floor(Math.random() * (7 - 4 + 1)) + 4, // Random between 4-7
    startupName: localStorage.getItem('studentName') ? `${localStorage.getItem('studentName')}'s Startup` : "My Startup"
};

// UI Elements
const els = {
    round: document.getElementById('current-round'),
    scenarioType: document.getElementById('scenario-type'),
    scenarioText: document.getElementById('scenario-text'),
    options: document.getElementById('options-container'),
    valCash: document.getElementById('val-cash'),
    valRevenue: document.getElementById('val-revenue'),
    valProfit: document.getElementById('val-profit'),
    valMarket: document.getElementById('val-market'),
    valEsg: document.getElementById('val-esg'),
    valReputation: document.getElementById('val-reputation'),
    valMorale: document.getElementById('val-morale'),
    valInvestor: document.getElementById('val-investor'),
    valRisk: document.getElementById('val-risk'),
    timerFill: document.getElementById('timer-fill'),
    feedbackOverlay: document.getElementById('feedback-overlay'),
    fbBadge: document.getElementById('fb-badge'),
    fbTitle: document.getElementById('fb-title'),
    fbText: document.getElementById('fb-text'),
    fbImpact: document.getElementById('fb-impact'),
    fbContinue: document.getElementById('fb-continue'),
    overlay: document.getElementById('result-overlay'),
    resBadge: document.getElementById('res-badge'),
    resTitle: document.getElementById('res-title'),
    resSummary: document.getElementById('res-summary'),
    resMetrics: document.getElementById('res-metrics'),
    trendBars: document.getElementById('trend-bars'),
    registrationOverlay: document.getElementById('registration-overlay'),
    registrationForm: document.getElementById('startup-registration-form'),
    regName: document.getElementById('reg-student-name'),
    regRoll: document.getElementById('reg-roll-number')
};

// Helper: Format Currency
function fmtCurr(val) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

// Update UI Metrics
function updateUI(changes = {}) {
    // Global Constraints Check: Bankruptcy/High Risk impacts
    if (state.cash < 0) {
        state.investorScore = Math.max(1, state.investorScore - 1);
        state.reputationScore = Math.max(1, state.reputationScore - 1);
    }
    if (state.riskScore >= 8) {
        state.investorScore = Math.max(1, state.investorScore - 2);
    }
    if (state.cash < -500000) {
        state.moraleScore = Math.max(1, state.moraleScore - 2);
    }

    els.valCash.textContent = fmtCurr(state.cash);
    els.valRevenue.textContent = fmtCurr(state.revenue);
    els.valProfit.textContent = fmtCurr(state.profit);
    els.valMarket.textContent = `${state.marketShare}%`;
    els.valEsg.textContent = state.esgScore.toFixed(1);
    
    // Status Mappings
    const mapScore = (score, high, med, low, tarnished) => {
        if (score >= 8) return high;
        if (score >= 6) return med;
        if (score >= 4) return low;
        return tarnished;
    };

    els.valReputation.textContent = mapScore(state.reputationScore, "Excellent", "Good", "Neutral", "Tarnished");
    els.valMorale.textContent = mapScore(state.moraleScore, "Inspired", "Positive", "Stable", "Low");
    els.valInvestor.textContent = mapScore(state.investorScore, "Very High", "High", "Medium", "Low");
    els.valRisk.textContent = mapScore(state.riskScore, "Critical", "High", "Moderate", "Low");

    // Pulse effect
    Object.keys(changes).forEach(key => {
        const item = document.getElementById(`metric-${key}`);
        if (item) {
            item.classList.remove('pulse');
            void item.offsetWidth; 
            item.classList.add('pulse');
            const changeEl = document.getElementById(`change-${key}`);
            if (changeEl) {
                const val = changes[key];
                changeEl.textContent = val > 0 ? `+${val}` : val;
                changeEl.className = `metric-change ${val > 0 ? 'positive' : 'negative'}`;
                setTimeout(() => changeEl.textContent = '', 2000);
            }
        }
    });

    // Add trend bar group
    const group = document.createElement('div');
    group.style.flex = "1";
    group.style.display = "flex";
    group.style.flexDirection = "column";
    group.style.justifyContent = "flex-end";
    group.style.gap = "2px";
    group.style.height = "100%";

    const createBar = (val, max, color) => {
        const bar = document.createElement('div');
        bar.style.width = "100%";
        bar.style.height = `${Math.max(2, Math.min(100, (val / max) * 100))}%`;
        bar.style.background = color;
        bar.style.borderRadius = "2px";
        bar.style.transition = "height 0.3s ease";
        return bar;
    };

    group.appendChild(createBar(state.revenue, 5000000, "var(--primary-color)"));
    group.appendChild(createBar(state.esgScore, 10, "#27ae60"));
    group.appendChild(createBar(state.marketShare, 50, "#4834d4"));
    els.trendBars.appendChild(group);
}

// Game Logic: Dynamic Rounds
const getRounds = () => {
    let rounds = [
        {
            type: "Startup Idea Selection",
            text: "Select your core industry for Viksit Bharat. Each has different starting dynamics.",
            options: [
                { text: "Agri-Tech: Smart Farming Solutions", changes: { cash: -200000, marketShare: 2, esgScore: 1, investorScore: 1 }, feedback: "Agri-tech is vital for food security. Your investment builds long-term assets and ESG value." },
                { text: "Fin-Tech: Rural Digital Banking", changes: { cash: -300000, marketShare: 4, riskScore: 2, investorScore: 2 }, feedback: "Fin-tech has high growth but higher regulatory risks. Market share grows, but watch your risk index." },
                { text: "Clean-Tech: Solar Micro-grids", changes: { cash: -400000, esgScore: 3, investorScore: 3 }, feedback: "Clean energy attracts top-tier investors! Boosts ESG and Investor Confidence significantly." }
            ]
        },
        {
            type: "Funding Strategy",
            text: "You need initial capital. How will you raise your first round?",
            options: [
                { text: "Bootstrapping: Use savings", changes: { cash: 500000, riskScore: -1, investorScore: 1 }, feedback: "Bootstrapping keeps you in control and shows commitment to future investors." },
                { text: "Angel Investors: 10% equity", changes: { cash: 1500000, investorScore: 3, riskScore: 1 }, feedback: "Equity provides a cash cushion but dilutes ownership. Growth expectations are now higher." },
                { text: "Government Grant", changes: { cash: 1000000, esgScore: 1, investorScore: 2 }, feedback: "Leveraging 'Startup India' adds sovereign credibility to your brand and non-dilutive capital." }
            ]
        },
        {
            type: "Team Hiring",
            text: "You need to build your core team. What is your priority?",
            options: [
                { text: "Hire Top-tier Talent", changes: { cash: -500000, moraleScore: 3, revenue: 100000 }, feedback: "Top talent is an expensive 'Asset' that drives revenue but increases your monthly 'Burn Rate'." },
                { text: "Hire Passionate Freshers", changes: { cash: -150000, moraleScore: 1, riskScore: 2 }, feedback: "Lower costs help with 'Runway', but lack of experience increases operational risk." },
                { text: "Outsource Development", changes: { cash: -200000, riskScore: 3, revenue: 150000 }, feedback: "Outsourcing is a 'Variable Cost' that speeds up launch, but you lose control over IP." }
            ]
        }
    ];

    // INSERT RANDOM CALAMITY BETWEEN 4-7
    const calamities = [
        {
            type: "🌪 CALAMITY: Natural Disaster",
            text: "A flash flood has damaged your primary manufacturing facility. Production is halted.",
            options: [
                { text: "Insurance claim", changes: { cash: 100000, revenue: -100000, riskScore: 1 }, feedback: "Insurance provides liquidity but the 'Opportunity Cost' of delayed production is high." },
                { text: "Repair quickly", changes: { cash: -200000, moraleScore: 1 }, feedback: "Fast repairs maintain revenue flow but hit your 'Cash Reserves' hard." },
                { text: "Ignore damage", changes: { revenue: -400000, marketShare: -5, riskScore: 4 }, feedback: "Ignoring infrastructure damage leads to 'Capacity Loss' and major market share erosion." }
            ]
        },
        {
            type: "🚛 CALAMITY: Transport Strike",
            text: "A national transport strike has collapsed your supply chain. Raw materials are stuck.",
            options: [
                { text: "Import materials", changes: { profit: -100000, cash: -200000 }, feedback: "Importing via air is a 'High-Cost Emergency' that protects revenue at the expense of 'Net Margin'." },
                { text: "Delay orders", changes: { reputationScore: -2, marketShare: -2 }, feedback: "Failing to deliver on contracts creates 'Reputational Risk' and allows competitors to step in." },
                { text: "Find local suppliers", changes: { marketShare: 1, profit: -50000, cash: -100000 }, feedback: "Localizing your supply chain builds 'Operational Resilience', even if it costs more initially." }
            ]
        },
        {
            type: "🔥 CALAMITY: Factory Fire",
            text: "A fire in the warehouse has destroyed 30% of your finished goods inventory.",
            options: [
                { text: "Insurance claim", changes: { cash: 300000, revenue: -200000 }, feedback: "Liquidity recovered, but you've lost 'Market Momentum' due to stock-outs." },
                { text: "Emergency repair", changes: { cash: -200000, moraleScore: -1 }, feedback: "Repairs are necessary 'CapEx', but the sudden cash drain increases bankruptcy risk." },
                { text: "Shift to outsource", changes: { profit: -150000, riskScore: 2 }, feedback: "Outsourcing production maintains supply but your 'Gross Margin' drops significantly." }
            ]
        }
    ];
    
    // Add Calamity Round
    const selectedCalamity = calamities[Math.floor(Math.random() * calamities.length)];
    rounds.splice(state.randomCalamityRound - 1, 0, selectedCalamity);

    // Remaining standard rounds
    rounds = rounds.concat([
        {
            type: "Accounting Challenge",
            text: "SKILL TASK: Production cost is ₹120, Selling price is ₹200. You sold 5,000 units. Calculate Profit.",
            isAccounting: true,
            options: [
                { text: "₹4,00,000", changes: { profit: 400000, investorScore: 2, hidden: { poorGovernance: false } }, feedback: "CORRECT! Accurate reporting builds high 'Investor Trust'. (200-120)*5000 = 4L." },
                { text: "₹3,00,000", changes: { profit: 200000, investorScore: -1, hidden: { poorGovernance: true } }, feedback: "WRONG. Inaccurate accounting leads to 'Audit Risks' and can destroy Investor Confidence later." },
                { text: "₹2,00,000", changes: { profit: 100000, investorScore: -2, hidden: { poorGovernance: true } }, feedback: "WRONG. Poor 'Internal Controls' are a red flag for regulators and VCs." }
            ]
        },
        {
            type: "ESG Policy",
            text: "Sustainability is key for Viksit Bharat. What's your first green initiative?",
            options: [
                { text: "Zero-Waste Packaging", changes: { cash: -100000, esgScore: 3, reputationScore: 2, hidden: { ignoredESG: false } }, feedback: "Strategic ESG investment builds 'Brand Equity' and future-proofs your business." },
                { text: "Standard Packaging", changes: { cash: 0, esgScore: -1, hidden: { ignoredESG: true } }, feedback: "Choosing cost over ethics is a 'Long-term Liability' that may lead to funding rejection." },
                { text: "Recycled Materials", changes: { cash: -50000, esgScore: 1, reputationScore: 1 }, feedback: "A balanced approach to CSR without over-extending your startup's budget." }
            ]
        },
        {
            type: "Market Expansion",
            text: "You are growing! Where do you expand next?",
            options: [
                { text: "Tier 2 & 3 Cities", changes: { cash: -300000, revenue: 150000, marketShare: 3 }, feedback: "Bharat is where the real growth is. Lower competition helps you build a 'Market Moat'." },
                { text: "International Export", changes: { cash: -600000, revenue: 300000, reputationScore: 3, riskScore: 3 }, feedback: "Going Global! Boosts prestige but introduces 'Currency Exchange Risk'." },
                { text: "D2C Online", changes: { cash: -150000, revenue: 100000, marketShare: 2 }, feedback: "The 'Asset-Light' model improves your 'Net Margin' and provides direct customer data." }
            ]
        },
        {
            type: "THEFT / FRAUD ROUND",
            text: "Accounts manager has been manipulating records. How do you handle this?",
            options: [
                { text: "Full Internal Audit", changes: { cash: -100000, riskScore: -4, investorScore: 2, hidden: { ignoredFraud: false } }, feedback: "Good governance! Cleaning up your 'Books' prevents 'Forensic Audit' issues later." },
                { text: "Ignore issue", changes: { cash: 50000, riskScore: 5, investorScore: -3, reputationScore: -2, hidden: { ignoredFraud: true } }, feedback: "Dangerous move. 'Governance Failure' will destroy your reputation if it leaks." },
                { text: "Report fraud", changes: { reputationScore: 4, investorScore: 3, moraleScore: -3 }, feedback: "Strong leadership! You've set a 'Zero Tolerance' policy, building massive Investor Trust." }
            ]
        },
        {
            type: "MARKET SHOCK: Slowdown",
            text: "Economic slowdown has reduced consumer spending by 25%.",
            options: [
                { text: "Reduce production", changes: { riskScore: -1, revenue: -100000 }, feedback: "Defensive strategy protects your 'Inventory Liquidity' but slows growth." },
                { text: "Increase marketing", changes: { cash: -100000, revenue: 200000 }, feedback: "Aggressive counter-cyclical marketing can gain 'Market Share' while others retreat." },
                { text: "Lower prices", changes: { marketShare: 2, profit: -100000 }, feedback: "Price cuts maintain volume but hurt your 'Unit Economics' and profitability." }
            ]
        },
        {
            type: "COMPETITOR ATTACK",
            text: "A large corporation launches a clone of your product at 20% lower price.",
            options: [
                { text: "Cut Prices", changes: { profit: -100000, marketShare: 2, riskScore: 2 }, feedback: "A 'Price War' is a race to the bottom. Your 'Operating Margin' will suffer." },
                { text: "Improve Quality", changes: { cash: -200000, marketShare: 3, reputationScore: 2 }, feedback: "Value-based strategy builds 'Customer Lifetime Value' instead of chasing price." },
                { text: "Defensive Marketing", changes: { cash: -300000, reputationScore: 3, marketShare: 1 }, feedback: "Protecting your 'Brand Equity' ensures loyalty despite cheaper alternatives." }
            ]
        },
        {
            type: "Government Regulation",
            text: "New data privacy laws are introduced. Compliance will be expensive.",
            options: [
                { text: "Full Compliance", changes: { cash: -300000, riskScore: -3, investorScore: 2 }, feedback: "Regulatory compliance is a 'License to Operate'. Prevents future 'Penalty Liabilities'." },
                { text: "Basic Compliance", changes: { cash: -100000, riskScore: 1 }, feedback: "Cutting corners on legal compliance leaves you open to massive regulatory fines." },
                { text: "Lobby for Extensions", changes: { cash: -50000, riskScore: 4, reputationScore: -1 }, feedback: "Delaying creates a 'Compliance Debt' that will eventually come due with interest." }
            ]
        },
        {
            type: "Supply Chain Crisis",
            text: "Raw material prices have spiked by 40% due to global tensions.",
            options: [
                { text: "Absorb the Cost", changes: { profit: -200000, moraleScore: 1, reputationScore: 2 }, feedback: "Protects brand loyalty, but your 'Net Profit Margin' takes a major hit." },
                { text: "Pass to Customers", changes: { revenue: 100000, marketShare: -2, reputationScore: -1 }, feedback: "Raising prices can cause 'Churn' if customers find cheaper substitutes." },
                { text: "Optimize Production", changes: { cash: -100000, riskScore: 2, revenue: 50000 }, feedback: "Process innovation can give you a long-term cost advantage over competitors." }
            ]
        },
        {
            type: "Investor Negotiation",
            text: "A major VC offers ₹1 Crore for 30% equity. They demand an ESG audit.",
            options: [
                { 
                    text: "Accept Offer", 
                    get changes() {
                        if (state.hiddenEffects.ignoredESG) {
                            return { cash: -1000000, investorScore: -5, reputationScore: -5, riskScore: 5, text: "Funding REJECTED!", feedback: "CRITICAL FAIL: Due to ignoring ESG in Round 6, the VC found major liabilities. Valuation crashed and you had to pay audit penalties." };
                        }
                        return { cash: 10000000, investorScore: 5, riskScore: -2, reputationScore: 2, feedback: "SUCCESS! Your clean ESG record proved sustainability. You have a huge 'Cash Runway'." };
                    }
                },
                { text: "Reject & Bootstrap", changes: { cash: -200000, riskScore: 1, investorScore: -2 }, feedback: "Avoiding 'Dilution' keeps control, but your growth will be slower and riskier without institutional backing." },
                { text: "Counter-offer", changes: { cash: 4000000, investorScore: 1, marketShare: 1, riskScore: 1 }, feedback: "Good negotiation. Balanced 'Capital Structure' maintains more equity but you have less 'Dry Powder' for scale." }
            ]
        },
        {
            type: "MARKET BOOM",
            text: "The Indian economy is surging! Demand has tripled.",
            options: [
                { text: "Scale Production", changes: { profit: 500000, cash: -200000, riskScore: 2 }, feedback: "Maximizing 'Capacity Utilization' prints money, but watch out for 'Over-trading'." },
                { text: "Focus on Quality", changes: { reputationScore: 3, esgScore: 2, investorScore: 1 }, feedback: "Building 'Intangible Assets' creates a 'Market Moat' of trust for the long term." },
                { text: "Raise Prices", changes: { profit: 700000, reputationScore: -2, marketShare: -1 }, feedback: "Short-term profit maximization increases ROE but might alienate your base." }
            ]
        },
        {
            type: "National Policy: EV Subsidy",
            text: "Government announces a massive subsidy for green tech startups.",
            options: [
                { text: "Apply for Subsidy", changes: { cash: 500000, esgScore: 1 }, feedback: "Direct boost! Government subsidies are 'Other Income' that lower your break-even point." },
                { text: "Expand Assets", changes: { marketShare: 4, cash: 200000, investorScore: 2 }, feedback: "Investing in 'CapEx' to build 'Fixed Assets' is a smart move for future scale." },
                { text: "Ignore Policy", changes: { cash: 0 }, feedback: "Missing out on incentives is an 'Opportunity Cost' in a competitive market." }
            ]
        },
        {
            type: "Scale Nationally",
            text: "How do you scale your startup across the entire country?",
            options: [
                { text: "Franchise Model", changes: { revenue: 400000, cash: 100000, riskScore: 3 }, feedback: "Asset-light expansion is great for growth but difficult for quality control." },
                { text: "Owned Stores", changes: { cash: -800000, revenue: 300000, reputationScore: 2, moraleScore: 2 }, feedback: "Capital-intensive growth requires massive outlay but keeps 100% of 'Net Margin'." },
                { text: "Digital Only", changes: { revenue: 200000, profit: 100000, riskScore: -1 }, feedback: "E-commerce play has best scalability and lowest 'Overhead Costs'." }
            ]
        },
        {
            type: "IPO Decision",
            text: "Your startup is a sensation. Do you go public (IPO)?",
            options: [
                { 
                    text: "Launch IPO", 
                    get changes() {
                        if (state.hiddenEffects.ignoredFraud || state.hiddenEffects.poorGovernance) {
                            return { cash: -5000000, reputationScore: -8, investorScore: -8, text: "IPO REJECTED & SEBI FINED!", feedback: "CRITICAL FAILURE: Regulators found the fraud you covered up in Round 9. Massive legal fines and permanent ban from capital markets." };
                        }
                        return { cash: 20000000, reputationScore: 5, investorScore: 5, marketShare: 5, feedback: "LEGENDARY! Strong governance led to a 10x over-subscribed IPO. You are a national icon." };
                    }
                },
                { text: "Stay Private", changes: { cash: -500000, profit: 200000, moraleScore: 4 }, feedback: "Choosing control over capital avoids public listing costs but limits employee liquidity." },
                { text: "Acquisition", changes: { cash: 15000000, reputationScore: -2, investorScore: -3, text: "Exit Successful but Brand Lost" }, feedback: "A 'Successful Exit' turns your equity into liquid cash, but you've sold your vision to a conglomerate." }
            ]
        },
        {
            type: "Investor Interview",
            text: "DYNAMIC INTERVIEW: The lead investor asks about your journey.",
            get interview() {
                if (state.hiddenEffects.ignoredESG) return "Why did you prioritize cost over environmental ethics earlier in your journey?";
                if (state.riskScore > 7) return "Your risk index is dangerously high. How do you justify this to shareholders?";
                if (state.profit < 0) return "You are still burning cash. When will this startup reach profitability?";
                return "What is your vision for contributing to a 'Viksit Bharat' by 2047?";
            },
            options: [
                { text: "Focus on Social Impact", changes: { esgScore: 5, reputationScore: 3 }, feedback: "Triple Bottom Line accounting (People, Planet, Profit) is the future of India." },
                { text: "Focus on Financial Growth", changes: { profit: 1000000, investorScore: 2 }, feedback: "Showing that a startup can be self-sustaining generates massive shareholder value." },
                { text: "Focus on Innovation", changes: { reputationScore: 5, marketShare: 2 }, feedback: "Technological sovereignty is key to the Viksit Bharat mission." }
            ]
        }
    ]);

    return rounds;
};

// Timer Logic
function startTimer() {
    state.timerSeconds = 90;
    clearInterval(state.timerInterval);
    els.timerFill.style.width = '100%';
    state.timerInterval = setInterval(() => {
        state.timerSeconds--;
        els.timerFill.style.width = `${(state.timerSeconds / 90) * 100}%`;
        if (state.timerSeconds <= 0) {
            clearInterval(state.timerInterval);
            handleDecision(0); 
        }
    }, 1000);
}

// Handle Decision
function handleDecision(index) {
    const roundData = getRounds()[state.currentRound - 1];
    const option = roundData.options[index];
    const changes = (typeof option.changes === 'function' || Object.getOwnPropertyDescriptor(option, 'changes')?.get) 
        ? option.changes : option.changes;

    if (changes.hidden) Object.assign(state.hiddenEffects, changes.hidden);
    if (changes.text) alert(changes.text);

    Object.keys(changes).forEach(key => {
        if (['investorScore', 'riskScore', 'reputationScore', 'moraleScore'].includes(key)) {
            state[key] = Math.max(1, Math.min(10, state[key] + changes[key]));
        } else if (state[key] !== undefined) {
            state[key] += changes[key];
        }
    });

    state.history.push({ round: state.currentRound, type: roundData.type, decision: option.text });
    updateUI(changes);
    showFeedback(option.feedback || "Decision processed.");
}

function showFeedback(text) {
    els.fbText.textContent = text;
    const roundData = getRounds()[state.currentRound - 1];
    const option = roundData.options.find(o => o.feedback === text);
    let impactHtml = "<strong>Impact Summary:</strong><ul style='margin-top:5px; padding-left:20px;'>";
    if (option) {
        const changes = (typeof option.changes === 'function' || Object.getOwnPropertyDescriptor(option, 'changes')?.get) 
            ? option.changes : option.changes;
        Object.keys(changes).forEach(key => {
            if (typeof changes[key] === 'number') {
                const val = changes[key];
                impactHtml += `<li>${key.charAt(0).toUpperCase() + key.slice(1)}: ${val > 0 ? "+" : ""}${val}</li>`;
            }
        });
    }
    impactHtml += "</ul>";
    els.fbImpact.innerHTML = impactHtml;
    els.feedbackOverlay.style.display = 'flex';
}

els.fbContinue.onclick = () => {
    els.feedbackOverlay.style.display = 'none';
    if (state.currentRound < state.totalRounds) {
        state.currentRound++;
        renderRound();
    } else {
        showFinalSubmit();
    }
};

function showFinalSubmit() {
    clearInterval(state.timerInterval);
    els.scenarioType.textContent = "FINAL REPORT";
    els.scenarioText.textContent = "Simulation complete. Review your company's performance and submit your results to the board.";
    els.options.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.style.width = '100%';
    btn.style.padding = '25px';
    btn.innerHTML = "🚀 Submit Final Report & View Results";
    btn.onclick = () => {
        btn.disabled = true;
        btn.textContent = "Submitting to Cloud...";
        
        // Final score calculation with higher penalties for risk and bankruptcy
        const finalScore = Math.round(
            (state.profit / 10000) * 0.4 + (state.marketShare * 10) + (state.esgScore * 5) + 
            (state.investorScore * 8) + (state.reputationScore * 6) + (state.moraleScore * 4) - (state.riskScore * 15)
        );

        let ranking = "Future Unicorn";
        if (state.riskScore >= 9 || state.cash < -1000000) {
            ranking = "Bankruptcy";
            // If bankrupt, automatically crash reputation and investor scores in the final result
            state.reputationScore = 1;
            state.investorScore = 1;
        }
        else if (finalScore < 100) ranking = "Struggling";
        else if (finalScore < 300) ranking = "Promising MSME";
        else if (finalScore < 600) ranking = "Successful Brand";
        
        saveToCloud(finalScore, ranking, () => endGame(finalScore, ranking));
    };
    els.options.appendChild(btn);
}

function renderRound() {
    const roundData = getRounds()[state.currentRound - 1];
    els.round.textContent = state.currentRound;
    els.scenarioType.textContent = roundData.type;
    els.scenarioText.textContent = roundData.interview || roundData.text;
    els.options.innerHTML = '';
    roundData.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="option-label">Option ${String.fromCharCode(65 + i)}</span><span class="option-text">${opt.text}</span>`;
        btn.onclick = () => handleDecision(i);
        els.options.appendChild(btn);
    });
    startTimer();
}

function endGame(score, ranking) {
    let badge = "🦄", summary = "Exceptional growth and high ESG. Viksit Bharat needs you!";
    if (ranking === "Bankruptcy") { badge = "💥"; summary = "Excessive risk or negative cash flow led to collapse."; }
    else if (ranking === "Struggling") { badge = "⚠"; summary = "Lack of focus on governance made it a difficult journey."; }
    else if (ranking === "Promising MSME") { badge = "📈"; summary = "A solid backbone of the Indian economy."; }
    else if (ranking === "Successful Brand") { badge = "🚀"; summary = "Impressive scale and public trust. A true success."; }

    els.resBadge.textContent = badge;
    els.resTitle.textContent = ranking;
    els.resSummary.textContent = summary;
    els.resMetrics.innerHTML = `
        <div class="metric-card">
            <div class="metric-card-label">FINAL SCORE</div>
            <div class="metric-card-value" style="color: var(--primary-color);">${score}</div>
        </div>
        <div class="metric-card">
            <div class="metric-card-label">TOTAL PROFIT</div>
            <div class="metric-card-value">${fmtCurr(state.profit)}</div>
        </div>`;
    els.overlay.style.display = 'flex';
}

function saveToCloud(score, ranking, callback) {
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyuZeirN1escCDW9_7zjLPYdoIh8ilRISbrkhe5dFmU9aJ8skvGdfN-MwKFjcPqvXdspQ/exec";
    const timeSec = Math.floor((Date.now() - state.startTime) / 1000);
    const data = {
        type: "test",
        studentName: localStorage.getItem('studentName') || "Unknown",
        rollNumber: localStorage.getItem('rollNumber') || "N/A",
        testName: "Viksit Bharat Simulator",
        score,
        duration: `${Math.floor(timeSec / 60)}m ${timeSec % 60}s`,
        percentage: ranking,
        cash: state.cash,
        marketShare: state.marketShare,
        esgScore: state.esgScore,
        investorScore: state.investorScore
    };
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(data) });
    setTimeout(() => { if (callback) callback(); }, 1200);
}

window.onload = () => {
    // Pre-fill if already logged in
    const savedName = localStorage.getItem('studentName');
    const savedRoll = localStorage.getItem('rollNumber');
    
    if (savedName) els.regName.value = savedName;
    if (savedRoll) els.regRoll.value = savedRoll;

    // Handle Registration
    els.registrationForm.onsubmit = (e) => {
        e.preventDefault();
        
        // Save to state and localStorage
        const name = els.regName.value.trim();
        const roll = els.regRoll.value.trim();
        
        localStorage.setItem('studentName', name);
        localStorage.setItem('rollNumber', roll);
        state.startupName = `${name}'s Startup`;
        
        // Hide overlay and start game
        els.registrationOverlay.style.display = 'none';
        document.getElementById('startup-name').textContent = state.startupName;
        state.startTime = Date.now(); // Reset start time
        updateUI();
        renderRound();
    };
};
