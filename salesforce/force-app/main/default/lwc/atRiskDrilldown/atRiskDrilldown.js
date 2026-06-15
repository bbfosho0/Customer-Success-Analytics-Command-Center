import { LightningElement } from 'lwc';
import getAtRiskData from '@salesforce/apex/CustomerSuccessDashboardController.getAtRiskData';
import { formatCurrencyShort, reduceError, titleCaseLabel } from 'c/dashboardUtils';

const REGION_OPTIONS = [
    { label: 'All regions', value: 'all' },
    { label: 'North America', value: 'north-america' },
    { label: 'EMEA', value: 'emea' },
    { label: 'APJ', value: 'apj' },
    { label: 'LATAM', value: 'latam' }
];

const SEVERITY_OPTIONS = [
    { label: 'All severities', value: 'all' },
    { label: 'Critical only', value: 'critical' },
    { label: 'At-Risk and Critical', value: 'elevated' },
    { label: 'Watch and above', value: 'watch-plus' }
];

const OWNER_OPTIONS = [
    { label: 'All owners', value: 'all' },
    { label: 'Jules Lau', value: 'Jules Lau' },
    { label: 'Mina Patel', value: 'Mina Patel' },
    { label: 'Amara Singh', value: 'Amara Singh' },
    { label: 'Avery Gomez', value: 'Avery Gomez' }
];

const RISK_STYLES = {
    critical: { label: 'Critical', color: '#DC2626', accent: '#FEE2E2' },
    'at-risk': { label: 'At Risk', color: '#F97316', accent: '#FED7AA' },
    watch: { label: 'Watch', color: '#F59E0B', accent: '#FEF3C7' }
};

export default class AtRiskDrilldown extends LightningElement {
    filters = {
        region: 'all',
        severity: 'elevated',
        owner: 'all'
    };

    accounts = [];
    dataMode = 'demo';
    statusMessage = '';
    isLoading = true;
    errorMessage = '';

    regionOptions = REGION_OPTIONS;
    severityOptions = SEVERITY_OPTIONS;
    ownerOptions = OWNER_OPTIONS;

    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        this.isLoading = true;
        this.errorMessage = '';
        try {
            const response = await getAtRiskData();
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
        return this.accounts.filter((account) => {
            if (!['critical', 'at-risk', 'watch'].includes(account.riskBand)) {
                return false;
            }
            if (this.filters.region !== 'all' && account.region !== this.filters.region) {
                return false;
            }
            if (this.filters.owner !== 'all' && account.csm !== this.filters.owner) {
                return false;
            }
            if (this.filters.severity === 'critical' && account.riskBand !== 'critical') {
                return false;
            }
            if (this.filters.severity === 'elevated' && !['critical', 'at-risk'].includes(account.riskBand)) {
                return false;
            }
            return !(this.filters.severity === 'watch-plus' && !['critical', 'at-risk', 'watch'].includes(account.riskBand));
        });
    }

    get summaryBadge() {
        return `${this.filteredAccounts.length} accounts in scope`;
    }

    get filterSummary() {
        return `${titleCaseLabel(this.filters.severity)} severity across ${titleCaseLabel(this.filters.region)} coverage.`;
    }

    get heroStats() {
        const totalArr = this.filteredAccounts.reduce((sum, account) => sum + Number(account.arr || 0), 0);
        const critical = this.filteredAccounts.filter((account) => account.riskBand === 'critical').length;
        const owners = new Set(this.filteredAccounts.map((account) => account.csm)).size;
        return [
            { key: 'arr', label: 'At-risk ARR', value: formatCurrencyShort(totalArr) },
            { key: 'critical', label: 'Critical accounts', value: `${critical}` },
            { key: 'owners', label: 'Owners engaged', value: `${owners}` }
        ];
    }

    get kpis() {
        const totalArr = this.filteredAccounts.reduce((sum, account) => sum + Number(account.arr || 0), 0);
        const criticalArr = this.filteredAccounts
            .filter((account) => account.riskBand === 'critical')
            .reduce((sum, account) => sum + Number(account.arr || 0), 0);
        const avgDays = this.filteredAccounts.length
            ? Math.round(this.filteredAccounts.reduce((sum, account) => sum + Number(account.lastTouchDays || 0), 0) / this.filteredAccounts.length)
            : 0;

        return [
            { key: 'exposure', label: 'Total Exposure', value: formatCurrencyShort(totalArr), hint: 'Revenue represented in the queue', accentClass: 'accent-negative' },
            { key: 'critical-arr', label: 'Critical ARR', value: formatCurrencyShort(criticalArr), hint: 'Immediate intervention required', accentClass: 'accent-alert' },
            {
                key: 'renewals',
                label: 'Quarterly Renewals',
                value: `${this.filteredAccounts.filter((account) => ['Jul 2026', 'Aug 2026', 'Sep 2026'].includes(account.renewalMonth)).length}`,
                hint: 'Accounts renewing this quarter',
                accentClass: 'accent-structural'
            },
            { key: 'latency', label: 'Avg Days Since Touch', value: `${avgDays}`, hint: 'Elapsed time since last direct engagement', accentClass: 'accent-warning' }
        ];
    }

    get riskBandRows() {
        const totalArr = this.filteredAccounts.reduce((sum, account) => sum + Number(account.arr || 0), 0) || 1;
        return ['critical', 'at-risk', 'watch'].map((key) => {
            const value = this.filteredAccounts
                .filter((account) => account.riskBand === key)
                .reduce((sum, account) => sum + Number(account.arr || 0), 0);
            const percent = (value / totalArr) * 100;
            return {
                key,
                label: RISK_STYLES[key].label,
                valueLabel: formatCurrencyShort(value),
                percentLabel: `${percent.toFixed(0)}%`,
                dotStyle: `background:${RISK_STYLES[key].color};`,
                barStyle: `width:${Math.max(percent, value ? 10 : 0)}%; background:${RISK_STYLES[key].color};`
            };
        });
    }

    get driverRows() {
        const grouped = new Map();
        const totalArr = this.filteredAccounts.reduce((sum, account) => sum + Number(account.arr || 0), 0) || 1;
        this.filteredAccounts.forEach((account) => {
            const current = grouped.get(account.primaryRisk) || { key: account.primaryRisk, label: account.primaryRisk, accounts: 0, arr: 0 };
            current.accounts += 1;
            current.arr += Number(account.arr || 0);
            grouped.set(account.primaryRisk, current);
        });
        return Array.from(grouped.values())
            .sort((left, right) => right.arr - left.arr)
            .slice(0, 5)
            .map((row) => ({
                ...row,
                arrLabel: formatCurrencyShort(row.arr),
                shareLabel: `${Math.round((row.arr / totalArr) * 100)}% of exposure`
            }));
    }

    get queueRows() {
        return [...this.filteredAccounts]
            .sort((left, right) => this.queueWeight(right) - this.queueWeight(left))
            .map((account) => ({
                ...account,
                owner: account.csm,
                risk: account.riskBand,
                regionLabel: titleCaseLabel(account.region),
                riskLabel: RISK_STYLES[account.riskBand].label,
                arrLabel: formatCurrencyShort(account.arr),
                lastTouchLabel: `${account.lastTouchDays}d since touch`,
                pillStyle: `background:${RISK_STYLES[account.riskBand].accent}; color:${RISK_STYLES[account.riskBand].color};`
            }));
    }

    get ownerRows() {
        const grouped = new Map();
        const maxArr = this.filteredAccounts.reduce((max, account) => Math.max(max, Number(account.arr || 0)), 0) || 1;
        this.filteredAccounts.forEach((account) => {
            const current = grouped.get(account.csm) || { key: account.csm, owner: account.csm, accounts: 0, arr: 0, critical: 0 };
            current.accounts += 1;
            current.arr += Number(account.arr || 0);
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

    get showStatus() {
        return !this.errorMessage && !!this.statusMessage;
    }

    handleFilterChange(event) {
        const { name, value } = event.target;
        this.filters = { ...this.filters, [name]: value };
    }

    queueWeight(account) {
        const riskWeight = { critical: 3, 'at-risk': 2, watch: 1 };
        return riskWeight[account.riskBand] * 1000000 + Number(account.arr || 0);
    }
}
