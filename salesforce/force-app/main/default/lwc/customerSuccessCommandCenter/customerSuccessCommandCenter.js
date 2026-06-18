import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getCommandCenterData from '@salesforce/apex/CustomerSuccessDashboardController.getCommandCenterData';
import { formatCurrencyShort, formatPercent, reduceError, titleCaseLabel } from 'c/dashboardUtils';

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

const DRILLDOWNS = [
    { key: 'atRisk', label: 'At-Risk Drilldown', targetTab: 'AtRiskDrilldown_Page', publicPage: 'at-risk-drilldown' },
    { key: 'expansion', label: 'Expansion Pipeline', targetTab: 'ExpansionPipeline_Page', publicPage: 'expansion-pipeline' },
    { key: 'retention', label: 'Retention Cohorts', targetTab: 'RetentionCohorts_Page', publicPage: 'retention-cohorts' }
];

const WINDOW_LIMITS = {
    '30d': 30,
    '60d': 60,
    '90d': 90,
    ytd: 365
};

export default class CustomerSuccessCommandCenter extends NavigationMixin(LightningElement) {
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

    get headerActions() {
        return DRILLDOWNS.map((item) => ({
            ...item,
            stateLabel: this.isExperienceSite ? 'Open page' : 'Open tab'
        }));
    }

    get filteredAccounts() {
        const limit = WINDOW_LIMITS[this.filters.timeWindow] || 90;
        return this.accounts.filter((account) => {
            if (this.filters.portfolio !== 'all' && account.portfolio !== this.filters.portfolio) {
                return false;
            }
            if (this.filters.segment !== 'all' && account.segment !== this.filters.segment) {
                return false;
            }
            if (this.filters.riskBand !== 'all' && account.riskBand !== this.filters.riskBand) {
                return false;
            }
            if (this.filters.region !== 'all' && account.region !== this.filters.region) {
                return false;
            }
            return (account.snapshotAgeDays || 0) <= limit;
        });
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
        return this.filteredAccounts.filter((account) => ['watch', 'at-risk', 'critical'].includes(account.riskBand)).length;
    }

    get topRegionLabel() {
        const counts = new Map();
        this.filteredAccounts.forEach((account) => {
            counts.set(account.region, (counts.get(account.region) || 0) + 1);
        });
        const top = Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0];
        return top ? `${titleCaseLabel(top[0])} lead region` : 'No region selected';
    }

    get activeFilterSummary() {
        if (!this.activeFilterPills.length) {
            return 'All portfolios, segments, regions, and risk bands are in view.';
        }
        return `${this.activeFilterPills.length} scoped filters applied to this dashboard view.`;
    }

    get distinctRegions() {
        return new Set(this.filteredAccounts.map((account) => account.region)).size;
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
        const revenue = this.filteredAccounts.reduce((sum, account) => sum + Number(account.arr || 0), 0);
        return [
            { key: 'active-risk', label: 'Active risk queue', value: `${this.activeRiskCount} accounts` },
            { key: 'top-region', label: 'Coverage pulse', value: this.topRegionLabel },
            { key: 'revenue', label: 'Revenue in scope', value: formatCurrencyShort(revenue) }
        ];
    }

    get kpiCards() {
        const accounts = this.filteredAccounts;
        const totalArr = accounts.reduce((sum, account) => sum + Number(account.arr || 0), 0);
        const totalCustomers = accounts.length;
        const avgHealth = totalCustomers ? accounts.reduce((sum, account) => sum + Number(account.healthScore || 0), 0) / totalCustomers : 0;
        const atRiskArr = accounts
            .filter((account) => ['at-risk', 'critical'].includes(account.riskBand))
            .reduce((sum, account) => sum + Number(account.arr || 0), 0);
        const expansionPipeline = accounts.reduce((sum, account) => sum + Number(account.expansionPipeline || 0), 0);

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
        const avgQueueHealth = attention.length
            ? attention.reduce((sum, account) => sum + Number(account.healthScore || 0), 0) / attention.length
            : 0;
        const renewalExposure = attention
            .filter((account) => ['Jul 2026', 'Aug 2026', 'Sep 2026'].includes(account.renewalMonth))
            .reduce((sum, account) => sum + Number(account.arr || 0), 0);

        return [
            { key: 'attention', label: 'Needs Attention', value: `${attention.length}`, detail: 'Watch, at-risk, and critical accounts', toneClass: 'tone-warning' },
            { key: 'critical', label: 'Critical Accounts', value: `${critical.length}`, detail: 'Immediate executive review recommended', toneClass: 'tone-negative' },
            { key: 'queue-health', label: 'Avg Queue Health', value: avgQueueHealth ? formatPercent(avgQueueHealth) : '0%', detail: 'Health score across the risk queue', toneClass: 'tone-neutral' },
            { key: 'renewal', label: '90-Day Renewal Exposure', value: formatCurrencyShort(renewalExposure), detail: 'Revenue renewing this quarter within the queue', toneClass: 'tone-negative' }
        ];
    }

    get riskExposureSegments() {
        const total = this.filteredAccounts.reduce((sum, account) => sum + Number(account.arr || 0), 0) || 1;
        return ['healthy', 'watch', 'at-risk', 'critical'].map((key) => {
            const value = this.filteredAccounts
                .filter((account) => account.riskBand === key)
                .reduce((sum, account) => sum + Number(account.arr || 0), 0);
            const percent = (value / total) * 100;
            const config = RISK_CONFIG[key];
            return {
                key,
                label: config.label,
                displayValue: formatCurrencyShort(value),
                percentLabel: `${percent.toFixed(0)}%`,
                barStyle: `width:${Math.max(percent, value > 0 ? 8 : 0)}%; background:${config.color};`,
                markerStyle: `background:${config.color};`,
                railStyle: `background:${config.accent};`
            };
        });
    }

    get healthMixSegments() {
        const total = this.filteredAccounts.length || 1;
        let cursor = 0;
        return ['healthy', 'watch', 'at-risk'].map((key) => {
            const count = this.filteredAccounts.filter((account) => account.healthBucket === key).length;
            const percent = (count / total) * 100;
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
        const avgHealth = this.filteredAccounts.length
            ? this.filteredAccounts.reduce((sum, account) => sum + Number(account.healthScore || 0), 0) / this.filteredAccounts.length
            : 0;
        return avgHealth ? formatPercent(avgHealth) : '0%';
    }

    get ownerAttentionRows() {
        const grouped = new Map();
        const queue = this.filteredAccounts.filter((account) => ['watch', 'at-risk', 'critical'].includes(account.riskBand));
        const maxArr = queue.reduce((max, account) => Math.max(max, Number(account.arr || 0)), 0) || 1;

        queue.forEach((account) => {
            const current = grouped.get(account.csm) || { key: account.csm, owner: account.csm, arr: 0, critical: 0, accounts: 0 };
            current.arr += Number(account.arr || 0);
            current.accounts += 1;
            if (account.riskBand === 'critical') {
                current.critical += 1;
            }
            grouped.set(account.csm, current);
        });

        return Array.from(grouped.values())
            .sort((left, right) => right.arr - left.arr)
            .map((row) => ({
                ...row,
                arrLabel: formatCurrencyShort(row.arr),
                criticalLabel: row.critical ? `${row.critical} critical` : 'No criticals',
                meterStyle: `width:${Math.max((row.arr / maxArr) * 100, 12)}%;`
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

    handleDrilldown(event) {
        const target = DRILLDOWNS.find((item) => item.key === event.currentTarget.dataset.key);
        if (!target) {
            return;
        }
        if (this.isExperienceSite) {
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.set('page', target.publicPage);
            window.location.assign(nextUrl.toString());
            return;
        }
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                apiName: target.targetTab
            }
        });
    }

    get isExperienceSite() {
        if (typeof window === 'undefined') {
            return false;
        }
        return window.location.hostname.includes('.my.site.com');
    }

    queueWeight(account) {
        const riskWeight = { critical: 4, 'at-risk': 3, watch: 2, healthy: 1 };
        return riskWeight[account.riskBand] * 1000000 + Number(account.arr || 0) - Number(account.healthScore || 0) * 1000;
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
