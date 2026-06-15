import { LightningElement } from 'lwc';
import getExpansionPipelineData from '@salesforce/apex/CustomerSuccessDashboardController.getExpansionPipelineData';
import { formatCurrencyShort, reduceError, titleCaseLabel } from 'c/dashboardUtils';

const REGION_OPTIONS = [
    { label: 'All regions', value: 'all' },
    { label: 'North America', value: 'north-america' },
    { label: 'EMEA', value: 'emea' },
    { label: 'APJ', value: 'apj' },
    { label: 'LATAM', value: 'latam' }
];

const STAGE_OPTIONS = [
    { label: 'All stages', value: 'all' },
    { label: 'Qualified', value: 'Qualified' },
    { label: 'Solution Review', value: 'Solution Review' },
    { label: 'Proposal', value: 'Proposal' },
    { label: 'Commit', value: 'Commit' }
];

const OWNER_OPTIONS = [
    { label: 'All owners', value: 'all' },
    { label: 'Avery Gomez', value: 'Avery Gomez' },
    { label: 'Mina Patel', value: 'Mina Patel' },
    { label: 'Jules Lau', value: 'Jules Lau' },
    { label: 'Amara Singh', value: 'Amara Singh' }
];

const STAGE_COLORS = {
    Qualified: { color: '#4FB6D3', accent: '#DBF1F8' },
    'Solution Review': { color: '#2563EB', accent: '#DBEAFE' },
    Proposal: { color: '#0B1F3A', accent: '#E2E8F0' },
    Commit: { color: '#16A34A', accent: '#DCFCE7' }
};

const READINESS_COLORS = {
    Ready: { color: '#16A34A' },
    Priming: { color: '#F59E0B' },
    Blocked: { color: '#DC2626' }
};

export default class ExpansionPipeline extends LightningElement {
    filters = {
        region: 'all',
        stage: 'all',
        owner: 'all'
    };

    opportunities = [];
    dataMode = 'demo';
    statusMessage = '';
    isLoading = true;
    errorMessage = '';

    regionOptions = REGION_OPTIONS;
    stageOptions = STAGE_OPTIONS;
    ownerOptions = OWNER_OPTIONS;

    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        this.isLoading = true;
        this.errorMessage = '';
        try {
            const response = await getExpansionPipelineData();
            this.opportunities = response?.opportunities || [];
            this.dataMode = response?.dataMode || 'demo';
            this.statusMessage = response?.message || '';
        } catch (error) {
            this.opportunities = [];
            this.dataMode = 'error';
            this.errorMessage = reduceError(error);
        } finally {
            this.isLoading = false;
        }
    }

    get filteredOpportunities() {
        return this.opportunities.filter((opportunity) => {
            if (this.filters.region !== 'all' && opportunity.region !== this.filters.region) {
                return false;
            }
            if (this.filters.stage !== 'all' && opportunity.stage !== this.filters.stage) {
                return false;
            }
            return !(this.filters.owner !== 'all' && opportunity.owner !== this.filters.owner);
        });
    }

    get summaryBadge() {
        return `${this.filteredOpportunities.length} opportunities in scope`;
    }

    get filterSummary() {
        return `${titleCaseLabel(this.filters.region)} pipeline across ${this.filters.stage === 'all' ? 'all stages' : this.filters.stage}.`;
    }

    get heroStats() {
        const weighted = this.filteredOpportunities.reduce((sum, opportunity) => sum + Number(opportunity.weighted || 0), 0);
        const ready = this.filteredOpportunities.filter((opportunity) => opportunity.readiness === 'Ready').length;
        const commit = this.filteredOpportunities.filter((opportunity) => opportunity.stage === 'Commit').length;
        return [
            { key: 'weighted', label: 'Weighted pipeline', value: formatCurrencyShort(weighted) },
            { key: 'ready', label: 'Ready accounts', value: `${ready}` },
            { key: 'commit', label: 'Commit stage', value: `${commit}` }
        ];
    }

    get kpis() {
        const weighted = this.filteredOpportunities.reduce((sum, opportunity) => sum + Number(opportunity.weighted || 0), 0);
        const averageDeal = this.filteredOpportunities.length ? weighted / this.filteredOpportunities.length : 0;
        const blocked = this.filteredOpportunities.filter((opportunity) => opportunity.readiness === 'Blocked').length;
        const lateQuarter = this.filteredOpportunities.filter((opportunity) => ['Jul 2026', 'Aug 2026', 'Sep 2026'].includes(opportunity.closeWindow)).length;
        return [
            { key: 'weighted', label: 'Weighted Pipeline', value: formatCurrencyShort(weighted), hint: 'In-scope revenue opportunity', accentClass: 'accent-structural' },
            { key: 'average', label: 'Avg Weighted Deal', value: formatCurrencyShort(averageDeal), hint: 'Average opportunity size', accentClass: 'accent-chart' },
            { key: 'blocked', label: 'Blocked Expansions', value: `${blocked}`, hint: 'Need recovery or sponsor action', accentClass: 'accent-negative' },
            { key: 'quarter', label: 'This-Quarter Close', value: `${lateQuarter}`, hint: 'Targeting current quarter', accentClass: 'accent-positive' }
        ];
    }

    get readinessRows() {
        const total = this.filteredOpportunities.reduce((sum, opportunity) => sum + Number(opportunity.weighted || 0), 0) || 1;
        return ['Ready', 'Priming', 'Blocked'].map((label) => {
            const value = this.filteredOpportunities
                .filter((opportunity) => opportunity.readiness === label)
                .reduce((sum, opportunity) => sum + Number(opportunity.weighted || 0), 0);
            const percent = (value / total) * 100;
            return {
                key: label,
                label,
                valueLabel: formatCurrencyShort(value),
                percentLabel: `${percent.toFixed(0)}%`,
                dotStyle: `background:${READINESS_COLORS[label].color};`,
                barStyle: `width:${Math.max(percent, value ? 10 : 0)}%; background:${READINESS_COLORS[label].color};`
            };
        });
    }

    get stageRows() {
        const total = this.filteredOpportunities.reduce((sum, opportunity) => sum + Number(opportunity.weighted || 0), 0) || 1;
        return Object.keys(STAGE_COLORS).map((stage) => {
            const value = this.filteredOpportunities
                .filter((opportunity) => opportunity.stage === stage)
                .reduce((sum, opportunity) => sum + Number(opportunity.weighted || 0), 0);
            const count = this.filteredOpportunities.filter((opportunity) => opportunity.stage === stage).length;
            return {
                key: stage,
                label: stage,
                count,
                valueLabel: formatCurrencyShort(value),
                shareLabel: `${Math.round((value / total) * 100)}% of pipeline`
            };
        });
    }

    get queueRows() {
        return [...this.filteredOpportunities]
            .sort((left, right) => Number(right.weighted || 0) - Number(left.weighted || 0))
            .map((opportunity) => ({
                ...opportunity,
                regionLabel: titleCaseLabel(opportunity.region),
                readinessLabel: opportunity.readiness,
                weightedLabel: formatCurrencyShort(opportunity.weighted),
                pillStyle: `background:${STAGE_COLORS[opportunity.stage].accent}; color:${STAGE_COLORS[opportunity.stage].color};`
            }));
    }

    get ownerRows() {
        const grouped = new Map();
        const maxWeighted = this.filteredOpportunities.reduce((max, opportunity) => Math.max(max, Number(opportunity.weighted || 0)), 0) || 1;
        this.filteredOpportunities.forEach((opportunity) => {
            const current = grouped.get(opportunity.owner) || { key: opportunity.owner, owner: opportunity.owner, count: 0, weighted: 0, ready: 0 };
            current.count += 1;
            current.weighted += Number(opportunity.weighted || 0);
            if (opportunity.readiness === 'Ready') {
                current.ready += 1;
            }
            grouped.set(opportunity.owner, current);
        });
        return Array.from(grouped.values())
            .sort((left, right) => right.weighted - left.weighted)
            .map((row) => ({
                ...row,
                weightedLabel: formatCurrencyShort(row.weighted),
                readinessLabel: row.ready ? `${row.ready} ready` : 'No ready deals',
                meterStyle: `width:${Math.max((row.weighted / maxWeighted) * 100, 12)}%;`
            }));
    }

    get showStatus() {
        return !this.errorMessage && !!this.statusMessage;
    }

    handleFilterChange(event) {
        const { name, value } = event.target;
        this.filters = { ...this.filters, [name]: value };
    }
}
