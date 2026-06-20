import { LightningElement } from 'lwc';
import getExpansionPipelineData from '@salesforce/apex/CustomerSuccessDashboardController.getExpansionPipelineData';
import {
    asNumber,
    barStyle,
    buildSelectOptions,
    countWhere,
    formatCurrencyShort,
    groupRows,
    matchesFilter,
    meterStyle,
    percentOf,
    reduceError,
    sortByNumber,
    sumBy,
    titleCaseLabel
} from 'c/dashboardUtils';

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
    ownerOptions = [{ label: 'All owners', value: 'all' }];

    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        this.isLoading = true;
        this.errorMessage = '';
        try {
            const response = await getExpansionPipelineData();
            this.opportunities = response?.opportunities || [];
            this.ownerOptions = buildSelectOptions(this.opportunities, 'owner', 'All owners');
            this.syncOwnerFilter();
            this.dataMode = response?.dataMode || 'demo';
            this.statusMessage = response?.message || '';
        } catch (error) {
            this.opportunities = [];
            this.ownerOptions = [{ label: 'All owners', value: 'all' }];
            this.syncOwnerFilter();
            this.dataMode = 'error';
            this.errorMessage = reduceError(error);
        } finally {
            this.isLoading = false;
        }
    }

    get filteredOpportunities() {
        return this.opportunities.filter(
            (opportunity) =>
                matchesFilter(opportunity.region, this.filters.region) &&
                matchesFilter(opportunity.stage, this.filters.stage) &&
                matchesFilter(opportunity.owner, this.filters.owner)
        );
    }

    get summaryBadge() {
        return `${this.filteredOpportunities.length} opportunities in scope`;
    }

    get filterSummary() {
        return `${titleCaseLabel(this.filters.region)} pipeline across ${this.filters.stage === 'all' ? 'all stages' : this.filters.stage}.`;
    }

    get heroStats() {
        const weighted = sumBy(this.filteredOpportunities, 'weighted');
        const ready = countWhere(this.filteredOpportunities, (opportunity) => opportunity.readiness === 'Ready');
        const commit = countWhere(this.filteredOpportunities, (opportunity) => opportunity.stage === 'Commit');
        return [
            { key: 'weighted', label: 'Weighted pipeline', value: formatCurrencyShort(weighted) },
            { key: 'ready', label: 'Ready accounts', value: `${ready}` },
            { key: 'commit', label: 'Commit stage', value: `${commit}` }
        ];
    }

    get kpis() {
        const weighted = sumBy(this.filteredOpportunities, 'weighted');
        const averageDeal = this.filteredOpportunities.length ? weighted / this.filteredOpportunities.length : 0;
        const blocked = countWhere(this.filteredOpportunities, (opportunity) => opportunity.readiness === 'Blocked');
        const lateQuarter = countWhere(this.filteredOpportunities, (opportunity) => ['Jul 2026', 'Aug 2026', 'Sep 2026'].includes(opportunity.closeWindow));
        return [
            { key: 'weighted', label: 'Weighted Pipeline', value: formatCurrencyShort(weighted), hint: 'In-scope revenue opportunity', accentClass: 'accent-structural' },
            { key: 'average', label: 'Avg Weighted Deal', value: formatCurrencyShort(averageDeal), hint: 'Average opportunity size', accentClass: 'accent-chart' },
            { key: 'blocked', label: 'Blocked Expansions', value: `${blocked}`, hint: 'Need recovery or sponsor action', accentClass: 'accent-negative' },
            { key: 'quarter', label: 'This-Quarter Close', value: `${lateQuarter}`, hint: 'Targeting current quarter', accentClass: 'accent-positive' }
        ];
    }

    get readinessRows() {
        const total = sumBy(this.filteredOpportunities, 'weighted') || 1;
        return ['Ready', 'Priming', 'Blocked'].map((label) => {
            const value = this.filteredOpportunities
                .filter((opportunity) => opportunity.readiness === label)
                .reduce((sum, opportunity) => sum + asNumber(opportunity.weighted), 0);
            const percent = percentOf(value, total);
            return {
                key: label,
                label,
                valueLabel: formatCurrencyShort(value),
                percentLabel: `${percent.toFixed(0)}%`,
                dotStyle: `background:${READINESS_COLORS[label].color};`,
                barStyle: barStyle(percent, READINESS_COLORS[label].color, 10, !!value)
            };
        });
    }

    get stageRows() {
        const total = sumBy(this.filteredOpportunities, 'weighted') || 1;
        return Object.keys(STAGE_COLORS).map((stage) => {
            const value = this.filteredOpportunities
                .filter((opportunity) => opportunity.stage === stage)
                .reduce((sum, opportunity) => sum + asNumber(opportunity.weighted), 0);
            const count = countWhere(this.filteredOpportunities, (opportunity) => opportunity.stage === stage);
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
        return sortByNumber(this.filteredOpportunities, 'weighted')
            .map((opportunity) => ({
                ...opportunity,
                regionLabel: titleCaseLabel(opportunity.region),
                readinessLabel: opportunity.readiness,
                weightedLabel: formatCurrencyShort(opportunity.weighted),
                pillStyle: `background:${STAGE_COLORS[opportunity.stage].accent}; color:${STAGE_COLORS[opportunity.stage].color};`
            }));
    }

    get ownerRows() {
        const rows = groupRows(
            this.filteredOpportunities,
            'owner',
            (owner) => ({ key: owner, owner, count: 0, weighted: 0, ready: 0 }),
            (current, opportunity) => {
                current.count += 1;
                current.weighted += asNumber(opportunity.weighted);
                if (opportunity.readiness === 'Ready') {
                    current.ready += 1;
                }
            }
        ).sort((left, right) => right.weighted - left.weighted);
        const maxWeighted = rows.reduce((max, row) => Math.max(max, row.weighted), 0) || 1;
        return rows.map((row) => ({
            ...row,
            weightedLabel: formatCurrencyShort(row.weighted),
            readinessLabel: row.ready ? `${row.ready} ready` : 'No ready deals',
            meterStyle: meterStyle(row.weighted, maxWeighted)
        }));
    }

    get showStatus() {
        return !this.errorMessage && !!this.statusMessage;
    }

    handleFilterChange(event) {
        const { name, value } = event.target;
        this.filters = { ...this.filters, [name]: value };
    }

    syncOwnerFilter() {
        const ownerIsAvailable = this.ownerOptions.some((option) => option.value === this.filters.owner);
        if (!ownerIsAvailable) {
            this.filters = { ...this.filters, owner: 'all' };
        }
    }
}
