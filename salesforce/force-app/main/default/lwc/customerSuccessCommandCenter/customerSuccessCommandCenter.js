import { LightningElement } from 'lwc';
import getCommandCenterData from '@salesforce/apex/CustomerSuccessDashboardController.getCommandCenterData';
import {
    applyFieldFilters,
    asNumber,
    averageBy,
    barStyle,
    countWhere,
    formatCurrencyShort,
    formatPercent,
    groupRows,
    meterStyle,
    percentLabel,
    percentOf,
    reduceError,
    sumBy,
    titleCaseLabel,
    uniqueCount
} from 'c/dashboardUtils';

const FILTER_OPTIONS = {
    portfolio: [
        { label: 'All portfolios', value: 'all' },
        { label: 'Enterprise', value: 'enterprise' },
        { label: 'Commercial', value: 'commercial' },
        { label: 'Digital Native', value: 'digital-native' }
    ],
    segment: [
        { label: 'All segments', value: 'all' },
        { label: 'Strategic', value: 'strategic' },
        { label: 'Growth', value: 'growth' },
        { label: 'Scaled', value: 'scaled' }
    ],
    riskBand: [
        { label: 'All risk bands', value: 'all' },
        { label: 'Healthy', value: 'healthy' },
        { label: 'Watch', value: 'watch' },
        { label: 'At Risk', value: 'at-risk' },
        { label: 'Critical', value: 'critical' }
    ],
    region: [
        { label: 'All regions', value: 'all' },
        { label: 'North America', value: 'north-america' },
        { label: 'EMEA', value: 'emea' },
        { label: 'APJ', value: 'apj' },
        { label: 'LATAM', value: 'latam' }
    ],
    timeWindow: [
        { label: '30 days', value: '30d' },
        { label: '60 days', value: '60d' },
        { label: '90 days', value: '90d' },
        { label: 'Year to date', value: 'ytd' }
    ]
};

const RISK_CONFIG = {
    healthy: { label: 'Healthy', color: '#16A34A', accent: '#DCFCE7' },
    watch: { label: 'Watch', color: '#F59E0B', accent: '#FEF3C7' },
    'at-risk': { label: 'At Risk', color: '#F97316', accent: '#FED7AA' },
    critical: { label: 'Critical', color: '#DC2626', accent: '#FEE2E2' }
};

const HEALTH_CONFIG = {
    healthy: { label: 'Healthy', color: '#16A34A' },
    watch: { label: 'Watch', color: '#F59E0B' },
    'at-risk': { label: 'At Risk', color: '#DC2626' }
};

const WINDOW_LIMITS = {
    '30d': 30,
    '60d': 60,
    '90d': 90,
    ytd: 365
};

export default class CustomerSuccessCommandCenter extends LightningElement {
    filters = {
        portfolio: 'all',
        segment: 'all',
        riskBand: 'all',
        region: 'all',
        timeWindow: '90d'
    };

    accounts = [];
    dataMode = 'demo';
    statusMessage = '';
    isLoading = true;
    errorMessage = '';

    portfolioOptions = FILTER_OPTIONS.portfolio;
    segmentOptions = FILTER_OPTIONS.segment;
    riskBandOptions = FILTER_OPTIONS.riskBand;
    regionOptions = FILTER_OPTIONS.region;
    timeWindowOptions = FILTER_OPTIONS.timeWindow;

    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            const response = await getCommandCenterData();
            this.accounts = response?.accounts || [];
            this.dataMode = response?.dataMode || 'demo';
            this.statusMessage = response?.message || '';
        } catch (error) {
            this.accounts = [];
            this.dataMode = 'error';
            this.errorMessage = reduceError(error);
        } finally {
            this.isLoading = false;
        }
    }

    get filteredAccounts() {
        const limit = WINDOW_LIMITS[this.filters.timeWindow] || 90;
        return this.accounts.filter(
            (account) =>
                applyFieldFilters(account, this.filters, {
                    portfolio: 'portfolio',
                    segment: 'segment',
                    riskBand: 'riskBand',
                    region: 'region'
                }) && asNumber(account.snapshotAgeDays) <= limit
        );
    }

    get activeFilterPills() {
        return Object.entries(this.filters)
            .filter(([key, value]) => key !== 'timeWindow' && value !== 'all')
            .map(([key, value]) => ({
                key,
                label: `${this.filterLabel(key)}: ${titleCaseLabel(value)}`
            }));
    }

    get pageSubtitle() {
        return `${this.filteredAccounts.length} accounts in view across ${this.distinctRegions} regions`;
    }

    get activeRiskCount() {
        return countWhere(this.filteredAccounts, (account) => ['watch', 'at-risk', 'critical'].includes(account.riskBand));
    }

    get topRegionLabel() {
        const top = groupRows(
            this.filteredAccounts,
            'region',
            (region) => ({ key: region, region, count: 0 }),
            (current) => {
                current.count += 1;
            }
        ).sort((left, right) => right.count - left.count)[0];
        return top ? `${titleCaseLabel(top.region)} lead region` : 'No region selected';
    }

    get activeFilterSummary() {
        if (!this.activeFilterPills.length) {
            return 'All portfolios, segments, regions, and risk bands are in view.';
        }
        return `${this.activeFilterPills.length} scoped filters applied to this dashboard view.`;
    }

    get distinctRegions() {
        return uniqueCount(this.filteredAccounts, 'region');
    }

    get summaryBadge() {
        const labels = {
            sample: 'CSV sample snapshot',
            demo: 'Demo fallback snapshot',
            error: 'Data unavailable'
        };
        return labels[this.dataMode] || 'Dashboard data';
    }

    get headerStats() {
        const revenue = sumBy(this.filteredAccounts, 'arr');
        return [
            { key: 'active-risk', label: 'Active risk queue', value: `${this.activeRiskCount} accounts` },
            { key: 'top-region', label: 'Coverage pulse', value: this.topRegionLabel },
            { key: 'revenue', label: 'Revenue in scope', value: formatCurrencyShort(revenue) }
        ];
    }

    get kpiCards() {
        const accounts = this.filteredAccounts;
        const totalArr = sumBy(accounts, 'arr');
        const totalCustomers = accounts.length;
        const avgHealth = averageBy(accounts, 'healthScore');
        const atRiskArr = accounts
            .filter((account) => ['at-risk', 'critical'].includes(account.riskBand))
            .reduce((sum, account) => sum + asNumber(account.arr), 0);
        const expansionPipeline = sumBy(accounts, 'expansionPipeline');

        return [
            { key: 'arr', label: 'Current ARR', value: formatCurrencyShort(totalArr), hint: 'Portfolio revenue in view', accentClass: 'accent-structural' },
            { key: 'customers', label: 'Customers', value: `${totalCustomers}`, hint: 'Accounts in filtered snapshot', accentClass: 'accent-neutral' },
            { key: 'health', label: 'Health Score', value: avgHealth ? formatPercent(avgHealth) : '0%', hint: 'Average health across the queue', accentClass: 'accent-positive' },
            { key: 'risk-arr', label: 'At-Risk ARR', value: formatCurrencyShort(atRiskArr), hint: 'Critical and at-risk exposure', accentClass: 'accent-negative' },
            { key: 'pipeline', label: 'Expansion Pipeline', value: formatCurrencyShort(expansionPipeline), hint: 'Open qualified growth opportunities', accentClass: 'accent-chart' }
        ];
    }

    get healthRiskCards() {
        const attention = this.filteredAccounts.filter((account) => ['watch', 'at-risk', 'critical'].includes(account.riskBand));
        const critical = this.filteredAccounts.filter((account) => account.riskBand === 'critical');
        const avgQueueHealth = averageBy(attention, 'healthScore');
        const renewalExposure = attention
            .filter((account) => ['Jul 2026', 'Aug 2026', 'Sep 2026'].includes(account.renewalMonth))
            .reduce((sum, account) => sum + asNumber(account.arr), 0);

        return [
            { key: 'attention', label: 'Needs Attention', value: `${attention.length}`, detail: 'Watch, at-risk, and critical accounts', toneClass: 'tone-warning' },
            { key: 'critical', label: 'Critical Accounts', value: `${critical.length}`, detail: 'Immediate executive review recommended', toneClass: 'tone-negative' },
            { key: 'queue-health', label: 'Avg Queue Health', value: avgQueueHealth ? formatPercent(avgQueueHealth) : '0%', detail: 'Health score across the risk queue', toneClass: 'tone-neutral' },
            { key: 'renewal', label: '90-Day Renewal Exposure', value: formatCurrencyShort(renewalExposure), detail: 'Revenue renewing this quarter within the queue', toneClass: 'tone-negative' }
        ];
    }

    get riskExposureSegments() {
        const total = sumBy(this.filteredAccounts, 'arr') || 1;
        return ['healthy', 'watch', 'at-risk', 'critical'].map((key) => {
            const value = this.filteredAccounts
                .filter((account) => account.riskBand === key)
                .reduce((sum, account) => sum + asNumber(account.arr), 0);
            const percent = percentOf(value, total);
            const config = RISK_CONFIG[key];
            return {
                key,
                label: config.label,
                displayValue: formatCurrencyShort(value),
                percentLabel: percentLabel(value, total),
                barStyle: barStyle(percent, config.color, 8, value > 0),
                markerStyle: `background:${config.color};`,
                railStyle: `background:${config.accent};`
            };
        });
    }

    get healthMixSegments() {
        const total = this.filteredAccounts.length || 1;
        let cursor = 0;
        return ['healthy', 'watch', 'at-risk'].map((key) => {
            const count = countWhere(this.filteredAccounts, (account) => account.healthBucket === key);
            const percent = percentOf(count, total);
            const start = cursor;
            cursor += percent;
            const end = cursor;
            const config = HEALTH_CONFIG[key];
            return {
                key,
                label: config.label,
                count,
                percentLabel: `${percent.toFixed(0)}%`,
                swatchStyle: `background:${config.color};`,
                gradientSlice: `${config.color} ${start}% ${end}%`
            };
        });
    }

    get healthMixRingStyle() {
        return `background: conic-gradient(${this.healthMixSegments.map((segment) => segment.gradientSlice).join(', ')});`;
    }

    get healthMixCenterLabel() {
        const avgHealth = averageBy(this.filteredAccounts, 'healthScore');
        return avgHealth ? formatPercent(avgHealth) : '0%';
    }

    get ownerAttentionRows() {
        const queue = this.filteredAccounts.filter((account) => ['watch', 'at-risk', 'critical'].includes(account.riskBand));
        const rows = groupRows(
            queue,
            'csm',
            (owner) => ({ key: owner, owner, arr: 0, critical: 0, accounts: 0 }),
            (current, account) => {
                current.arr += asNumber(account.arr);
                current.accounts += 1;
                if (account.riskBand === 'critical') {
                    current.critical += 1;
                }
            }
        ).sort((left, right) => right.arr - left.arr);
        const maxArr = rows.reduce((max, row) => Math.max(max, row.arr), 0) || 1;

        return rows.map((row) => ({
            ...row,
            arrLabel: formatCurrencyShort(row.arr),
            criticalLabel: row.critical ? `${row.critical} critical` : 'No criticals',
            meterStyle: meterStyle(row.arr, maxArr)
        }));
    }

    get priorityQueueRows() {
        return this.filteredAccounts
            .filter((account) => ['at-risk', 'critical', 'watch'].includes(account.riskBand))
            .sort((left, right) => this.queueWeight(right) - this.queueWeight(left))
            .slice(0, 7)
            .map((account) => ({
                ...account,
                riskLabel: RISK_CONFIG[account.riskBand].label,
                riskPillStyle: `background:${RISK_CONFIG[account.riskBand].accent}; color:${RISK_CONFIG[account.riskBand].color};`,
                arrLabel: formatCurrencyShort(account.arr),
                pipelineLabel: formatCurrencyShort(account.expansionPipeline),
                freshnessLabel: `${account.snapshotAgeDays}d old`
            }));
    }

    get noData() {
        return !this.isLoading && this.filteredAccounts.length === 0;
    }

    get showStatus() {
        return !this.errorMessage && !!this.statusMessage;
    }

    handleFilterChange(event) {
        const { name, value } = event.target;
        this.filters = { ...this.filters, [name]: value };
    }

    handleResetFilters() {
        this.filters = {
            portfolio: 'all',
            segment: 'all',
            riskBand: 'all',
            region: 'all',
            timeWindow: '90d'
        };
    }

    handleRemoveFilter(event) {
        const filterName = event.currentTarget.dataset.filter;
        this.filters = { ...this.filters, [filterName]: 'all' };
    }

    queueWeight(account) {
        const riskWeight = { critical: 4, 'at-risk': 3, watch: 2, healthy: 1 };
        return riskWeight[account.riskBand] * 1000000 + asNumber(account.arr) - asNumber(account.healthScore) * 1000;
    }

    filterLabel(key) {
        const labels = {
            portfolio: 'Portfolio',
            segment: 'Segment',
            riskBand: 'Risk',
            region: 'Region'
        };
        return labels[key] || key;
    }
}
