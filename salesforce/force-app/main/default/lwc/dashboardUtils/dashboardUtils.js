export function formatCurrencyShort(value) {
    const numeric = Number(value || 0);
    if (numeric >= 1000000) {
        return `$${(numeric / 1000000).toFixed(1)}M`;
    }

    return `$${Math.round(numeric / 1000)}K`;
}

export function formatPercent(value) {
    return `${Number(value || 0).toFixed(0)}%`;
}

export function formatMillions(value) {
    return `$${Number(value || 0).toFixed(1)}M`;
}

export function titleCaseLabel(value) {
    if (!value || value === 'all') {
        return 'All';
    }

    return value
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export function reduceError(error) {
    if (!error) {
        return 'Unknown error';
    }

    if (Array.isArray(error.body)) {
        return error.body.map((entry) => entry.message).join(', ');
    }

    if (error.body && typeof error.body.message === 'string') {
        return error.body.message;
    }

    if (typeof error.message === 'string') {
        return error.message;
    }

    return 'Unknown error';
}
