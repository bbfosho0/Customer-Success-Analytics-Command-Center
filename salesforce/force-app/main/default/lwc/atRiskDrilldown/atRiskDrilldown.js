import { LightningElement } from 'lwc';
import getAtRiskData from '@salesforce/apex/CustomerSuccessDashboardController.getAtRiskData';
import {
    asNumber,
    averageBy,
    barStyle,
    buildSelectOptions,
    countWhere,
    formatCurrencyShort,
    groupRows,
    matchesFilter,
    meterStyle,
    percentLabel,
    percentOf,
    reduceError,
    sumBy,
    titleCaseLabel,
    uniqueCount
} from 'c/dashboardUtils';

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
    ownerOptions = [{ label: 'All owners', value: 'all' }];

    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        this.isLoading = true;
        this.errorMessage = '';
        try {
            const response = await getAtRiskData();
            this.accounts = response?.accounts || [];
            this.ownerOptions = buildSelectOptions(this.accounts, 'csm', 'All owners');
            this.syncOwnerFilter();
            this.dataMode = response?.dataMode || 'demo';
            this.statusMessage = response?.message || '';
        } catch (error) {
            this.accounts = [];
            this.ownerOptions = [{ label: 'All owners', value: 'all' }];
            this.syncOwnerFilter();
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
            if (!matchesFilter(account.region, this.filters.region)) {
                return false;
            }
            if (!matchesFilter(account.csm, this.filters.owner)) {
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
        const totalArr = sumBy(this.filteredAccounts, 'arr');
        const critical = countWhere(this.filteredAccounts, (account) => account.riskBand === 'critical');
        const owners = uniqueCount(this.filteredAccounts, 'csm');
        return [
            { key: 'arr', label: 'At-risk ARR', value: formatCurrencyShort(totalArr) },
            { key: 'critical', label: 'Critical accounts', value: `${critical}` },
            { key: 'owners', label: 'Owners engaged', value: `${owners}` }
        ];
    }

    get kpis() {
        const totalArr = sumBy(this.filteredAccounts, 'arr');
        const criticalArr = this.filteredAccounts
            .filter((account) => account.riskBand === 'critical')
            .reduce((sum, account) => sum + asNumber(account.arr), 0);
        const avgDays = Math.round(averageBy(this.filteredAccounts, 'lastTouchDays'));

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
        const totalArr = sumBy(this.filteredAccounts, 'arr') || 1;
        return ['critical', 'at-risk', 'watch'].map((key) => {
            const value = this.filteredAccounts
                .filter((account) => account.riskBand === key)
                .reduce((sum, account) => sum + asNumber(account.arr), 0);
            const percent = percentOf(value, totalArr);
            return {
                key,
                label: RISK_STYLES[key].label,
                valueLabel: formatCurrencyShort(value),
                percentLabel: percentLabel(value, totalArr),
                dotStyle: `background:${RISK_STYLES[key].color};`,
                barStyle: barStyle(percent, RISK_STYLES[key].color, 10, !!value)
            };
        });
    }

    get driverRows() {
        const totalArr = sumBy(this.filteredAccounts, 'arr') || 1;
        return groupRows(
            this.filteredAccounts,
            'primaryRisk',
            (driver) => ({ key: driver, label: driver, accounts: 0, arr: 0 }),
            (current, account) => {
                current.accounts += 1;
                current.arr += asNumber(account.arr);
            }
        )
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
        const rows = groupRows(
            this.filteredAccounts,
            'csm',
            (owner) => ({ key: owner, owner, accounts: 0, arr: 0, critical: 0 }),
            (current, account) => {
                current.accounts += 1;
                current.arr += asNumber(account.arr);
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

    queueWeight(account) {
        const riskWeight = { critical: 3, 'at-risk': 2, watch: 1 };
        return riskWeight[account.riskBand] * 1000000 + asNumber(account.arr);
    }
}
