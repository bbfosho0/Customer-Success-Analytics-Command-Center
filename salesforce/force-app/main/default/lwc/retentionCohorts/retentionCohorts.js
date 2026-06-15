import { LightningElement } from 'lwc';
import getRetentionCohortsData from '@salesforce/apex/CustomerSuccessDashboardController.getRetentionCohortsData';
import { formatMillions, reduceError, titleCaseLabel } from 'c/dashboardUtils';

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
            if (this.filters.segment !== 'all' && cohort.segment !== this.filters.segment) {
                return false;
            }
            if (this.filters.region !== 'all' && cohort.region !== this.filters.region) {
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
        const avgMonth6 = this.filteredCohorts.length
            ? this.filteredCohorts.reduce((sum, cohort) => sum + Number(cohort.month6 || 0), 0) / this.filteredCohorts.length
            : 0;
        const totalCustomers = this.filteredCohorts.reduce((sum, cohort) => sum + Number(cohort.customers || 0), 0);
        const avgLtv = this.filteredCohorts.length
            ? this.filteredCohorts.reduce((sum, cohort) => sum + Number(cohort.ltv || 0), 0) / this.filteredCohorts.length
            : 0;
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
        const totalArr = this.filteredCohorts.reduce((sum, cohort) => sum + Number(cohort.arr || 0), 0);
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
            barStyle: `width:${Math.max(row.value, row.value ? 10 : 0)}%; background:${row.key === 'm6' ? '#0B1F3A' : row.key === 'm3' ? '#4FB6D3' : '#16A34A'};`
        }));
    }

    get segmentRows() {
        const grouped = new Map();
        this.filteredCohorts.forEach((cohort) => {
            const current = grouped.get(cohort.segment) || { key: cohort.segment, label: titleCaseLabel(cohort.segment), month6: 0, ltv: 0, arr: 0, count: 0 };
            current.month6 += Number(cohort.month6 || 0);
            current.ltv += Number(cohort.ltv || 0);
            current.arr += Number(cohort.arr || 0);
            current.count += 1;
            grouped.set(cohort.segment, current);
        });
        return Array.from(grouped.values()).map((row) => ({
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
        const grouped = new Map();
        const maxArr = this.filteredCohorts.reduce((max, cohort) => Math.max(max, Number(cohort.arr || 0)), 0) || 1;
        this.filteredCohorts.forEach((cohort) => {
            const current = grouped.get(cohort.region) || { key: cohort.region, regionLabel: titleCaseLabel(cohort.region), cohorts: 0, arr: 0, month6: 0 };
            current.cohorts += 1;
            current.arr += Number(cohort.arr || 0);
            current.month6 += Number(cohort.month6 || 0);
            grouped.set(cohort.region, current);
        });
        return Array.from(grouped.values()).map((row) => ({
            ...row,
            arrLabel: formatMillions(row.arr),
            retentionLabel: `${Math.round(row.month6 / row.cohorts)}% month 6`,
            meterStyle: `width:${Math.max((row.arr / maxArr) * 100, 12)}%;`
        }));
    }

    get showStatus() {
        return !this.errorMessage && !!this.statusMessage;
    }

    averageMetric(key) {
        return this.filteredCohorts.length
            ? this.filteredCohorts.reduce((sum, cohort) => sum + Number(cohort[key] || 0), 0) / this.filteredCohorts.length
            : 0;
    }

    handleFilterChange(event) {
        const { name, value } = event.target;
        this.filters = { ...this.filters, [name]: value };
    }
}
