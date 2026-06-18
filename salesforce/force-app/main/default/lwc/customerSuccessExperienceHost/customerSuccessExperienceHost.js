import { LightningElement } from 'lwc';

const PAGE_ALIASES = {
    'command-center': 'command-center',
    'at-risk-drilldown': 'at-risk-drilldown',
    'expansion-pipeline': 'expansion-pipeline',
    'retention-cohorts': 'retention-cohorts'
};

export default class CustomerSuccessExperienceHost extends LightningElement {
    currentPage = 'command-center';

    connectedCallback() {
        if (typeof window === 'undefined') {
            return;
        }
        this.syncPageFromUrl();
        window.addEventListener('popstate', this.handlePopState);
    }

    disconnectedCallback() {
        if (typeof window === 'undefined') {
            return;
        }
        window.removeEventListener('popstate', this.handlePopState);
    }

    handlePopState = () => {
        this.syncPageFromUrl();
    };

    syncPageFromUrl() {
        if (typeof window === 'undefined') {
            return;
        }
        const requestedPage = new URL(window.location.href).searchParams.get('page');
        this.currentPage = PAGE_ALIASES[requestedPage] || 'command-center';
        if (typeof document !== 'undefined') {
            document.title = this.pageTitle;
        }
    }

    get isCommandCenter() {
        return this.currentPage === 'command-center';
    }

    get isAtRisk() {
        return this.currentPage === 'at-risk-drilldown';
    }

    get isExpansionPipeline() {
        return this.currentPage === 'expansion-pipeline';
    }

    get isRetentionCohorts() {
        return this.currentPage === 'retention-cohorts';
    }

    get pageTitle() {
        const titles = {
            'command-center': 'Customer Success Portfolio | Command Center',
            'at-risk-drilldown': 'Customer Success Portfolio | At-Risk Drilldown',
            'expansion-pipeline': 'Customer Success Portfolio | Expansion Pipeline',
            'retention-cohorts': 'Customer Success Portfolio | Retention Cohorts'
        };
        return titles[this.currentPage] || titles['command-center'];
    }
}
