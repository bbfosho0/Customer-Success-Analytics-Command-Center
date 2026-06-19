import { LightningElement } from 'lwc';
import getRetentionCohortsData from '@salesforce/apex/CustomerSuccessDashboardController.getRetentionCohortsData';
import {
    asNumber,
    averageBy,
    barStyle,
    formatMillions,
    groupRows,
    matchesFilter,
    meterStyle,
    reduceError,
    sumBy,
    titleCaseLabel
} from 'c/dashboardUtils';

const SEGMENT_OPTIONS = [
    { label: 'All segments', value: 'all' },
    { label: 'Strategic', value: 'strategic' },
    { label: 'Growth', value: 'growth' },
    { label: 'Scaled', value: 'scaled' }
];

const WINDOW_OPTIONS = [
    { label: '6 months', value: '6m' },
    { label: '12 months', value: '12m' }
];

const REGION_OPTIONS = [
    { label: 'All regions', value: 'all' },
    { label: 'North America', value: 'north-america' },
    { label: 'EMEA', value: 'emea' },
    { label: 'APJ', value: 'apj' }
];

export default class RetentionCohorts extends LightningElement {
    filters = {
        segment: 'all',
        window: '6m',
        region: 'all'
    };

    cohorts = [];
    dataMode = 'demo';
    statusMessage = '';
    isLoading = true;
    errorMessage = '';

    segmentOptions = SEGMENT_OPTIONS;
    windowOptions = WINDOW_OPTIONS;
    regionOptions = REGION_OPTIONS;

    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        this.isLoading = true;
        this.errorMessage = '';
        try {
            const response = await getRetentionCohortsData();
            this.cohorts = response?.cohorts || [];
            this.dataMode = response?.dataMode || 'demo';
            this.statusMessage = response?.message || '';
        } catch (error) {
            this.cohorts = [];
            this.dataMode = 'error';
            this.errorMessage = reduceError(error);
        } finally {
            this.isLoading = false;
        }
    }

    get filteredCohorts() {
        return this.cohorts.filter((cohort) => {
            if (!matchesFilter(cohort.segment, this.filters.segment)) {
                return false;
            }
            if (!matchesFilter(cohort.region, this.filters.region)) {
                return false;
            }
            return !(this.filters.window === '6m' && cohort.window !== '6m');
        });
    }

    get summaryBadge() {
        return `${this.filteredCohorts.length} cohorts in scope`;
    }

    get filterSummary() {
        return `${this.filters.window === '6m' ? 'Recent' : 'Longer-term'} retention view across ${titleCaseLabel(this.filters.segment)} segments.`;
    }

    get heroStats() {
        const avgMonth6 = averageBy(this.filteredCohorts, 'month6');
        const totalCustomers = sumBy(this.filteredCohorts, 'customers');
        const avgLtv = averageBy(this.filteredCohorts, 'ltv');
        return [
            { key: 'month6', label: 'Avg month 6 retention', value: `${Math.round(avgMonth6)}%` },
            { key: 'customers', label: 'Customers tracked', value: `${totalCustomers}` },
            { key: 'ltv', label: 'Average LTV', value: formatMillions(avgLtv) }
        ];
    }

    get kpis() {
        const avgMonth3 = this.averageMetric('month3');
        const avgMonth6 = this.averageMetric('month6');
        const avgLtv = this.averageMetric('ltv');
        const totalArr = sumBy(this.filteredCohorts, 'arr');
        return [
            { key: 'month3', label: 'Month 3 Retention', value: `${Math.round(avgMonth3)}%`, hint: 'Early retention health', accentClass: 'accent-chart' },
            { key: 'month6', label: 'Month 6 Retention', value: `${Math.round(avgMonth6)}%`, hint: 'Medium-term durability', accentClass: 'accent-positive' },
            { key: 'ltv', label: 'Avg LTV', value: formatMillions(avgLtv), hint: 'Blended lifetime value', accentClass: 'accent-structural' },
            { key: 'arr', label: 'ARR In Cohorts', value: formatMillions(totalArr), hint: 'Revenue represented in view', accentClass: 'accent-warning' }
        ];
    }

    get retentionRows() {
        return [
            { key: 'm1', label: 'Month 1', value: 100 },
            { key: 'm3', label: 'Month 3', value: this.averageMetric('month3') },
            { key: 'm6', label: 'Month 6', value: this.averageMetric('month6') }
        ].map((row) => ({
            ...row,
            valueLabel: `${Math.round(row.value)}%`,
            percentLabel: `${Math.round(row.value)}%`,
            dotStyle: `background:${row.key === 'm6' ? '#0B1F3A' : row.key === 'm3' ? '#4FB6D3' : '#16A34A'};`,
            barStyle: barStyle(row.value, row.key === 'm6' ? '#0B1F3A' : row.key === 'm3' ? '#4FB6D3' : '#16A34A', 10, !!row.value)
        }));
    }

    get segmentRows() {
        return groupRows(
            this.filteredCohorts,
            'segment',
            (segment) => ({ key: segment, label: titleCaseLabel(segment), month6: 0, ltv: 0, arr: 0, count: 0 }),
            (current, cohort) => {
                current.month6 += asNumber(cohort.month6);
                current.ltv += asNumber(cohort.ltv);
                current.arr += asNumber(cohort.arr);
                current.count += 1;
            }
        ).map((row) => ({
            ...row,
            retentionLabel: `${Math.round(row.month6 / row.count)}% month 6 retention`,
            ltvLabel: formatMillions(row.ltv / row.count),
            arrLabel: `${row.arr.toFixed(1)}M ARR`
        }));
    }

    get tableRows() {
        return this.filteredCohorts.map((cohort) => ({
            ...cohort,
            regionLabel: titleCaseLabel(cohort.region),
            segmentLabel: titleCaseLabel(cohort.segment),
            windowLabel: cohort.window === '6m' ? 'Recent window' : 'Full-year view',
            month3Label: `${cohort.month3}%`,
            month6Label: `${cohort.month6}%`,
            ltvLabel: formatMillions(cohort.ltv)
        }));
    }

    get regionRows() {
        const rows = groupRows(
            this.filteredCohorts,
            'region',
            (region) => ({ key: region, regionLabel: titleCaseLabel(region), cohorts: 0, arr: 0, month6: 0 }),
            (current, cohort) => {
                current.cohorts += 1;
                current.arr += asNumber(cohort.arr);
                current.month6 += asNumber(cohort.month6);
            }
        );
        const maxArr = rows.reduce((max, row) => Math.max(max, row.arr), 0) || 1;
        return rows.map((row) => ({
            ...row,
            arrLabel: formatMillions(row.arr),
            retentionLabel: `${Math.round(row.month6 / row.cohorts)}% month 6`,
            meterStyle: meterStyle(row.arr, maxArr)
        }));
    }

    get showStatus() {
        return !this.errorMessage && !!this.statusMessage;
    }

    averageMetric(key) {
        return averageBy(this.filteredCohorts, key);
    }

    handleFilterChange(event) {
        const { name, value } = event.target;
        this.filters = { ...this.filters, [name]: value };
    }
}
