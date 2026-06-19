import { LightningElement } from 'lwc';

const PAGE_ALIASES = {
    'command-center': 'command-center',
    'at-risk-drilldown': 'at-risk-drilldown',
    'expansion-pipeline': 'expansion-pipeline',
    'retention-cohorts': 'retention-cohorts'
};

const NAV_ITEMS = [
    { page: 'command-center', label: 'Command Center' },
    { page: 'at-risk-drilldown', label: 'At-Risk Drilldown' },
    { page: 'expansion-pipeline', label: 'Expansion Pipeline' },
    { page: 'retention-cohorts', label: 'Retention Cohorts' }
];

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

    renderedCallback() {
        this.queueDocumentTitleUpdate();
    }

    handlePopState = () => {
        this.syncPageFromUrl();
    };

    handleNavClick(event) {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const requestedPage = event.currentTarget.dataset.page;
        if (!PAGE_ALIASES[requestedPage]) {
            return;
        }

        event.preventDefault();
        this.navigateToPage(requestedPage);
    }

    syncPageFromUrl() {
        if (typeof window === 'undefined') {
            return;
        }
        const requestedPage = new URL(window.location.href).searchParams.get('page');
        this.currentPage = PAGE_ALIASES[requestedPage] || 'command-center';
        this.updateDocumentTitle();
    }

    navigateToPage(page) {
        if (typeof window === 'undefined') {
            return;
        }

        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('page', page);

        if (nextUrl.toString() !== window.location.href) {
            window.history.pushState({ page }, '', nextUrl.toString());
        }

        this.currentPage = page;
        this.updateDocumentTitle();
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }

    queueDocumentTitleUpdate() {
        if (typeof window === 'undefined') {
            return;
        }
        window.requestAnimationFrame(() => this.updateDocumentTitle());
    }

    updateDocumentTitle() {
        if (typeof document !== 'undefined') {
            document.title = this.pageTitle;
        }
    }

    get navItems() {
        return NAV_ITEMS.map((item) => {
            const isActive = item.page === this.currentPage;
            return {
                ...item,
                href: `?page=${item.page}`,
                className: isActive ? 'portfolio-shell__link portfolio-shell__link_active' : 'portfolio-shell__link',
                ariaCurrent: isActive ? 'page' : undefined
            };
        });
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
