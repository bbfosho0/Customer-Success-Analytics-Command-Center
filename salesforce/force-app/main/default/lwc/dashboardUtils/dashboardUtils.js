export const ALL_VALUE = 'all';

export function asNumber(value) {
    return Number(value || 0);
}

export function formatCurrencyShort(value) {
    const numeric = asNumber(value);
    if (numeric >= 1000000) {
        return `$${(numeric / 1000000).toFixed(1)}M`;
    }

    return `$${Math.round(numeric / 1000)}K`;
}

export function formatPercent(value) {
    return `${asNumber(value).toFixed(0)}%`;
}

export function formatMillions(value) {
    return `$${asNumber(value).toFixed(1)}M`;
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

export function matchesFilter(actual, selected) {
    return selected === ALL_VALUE || actual === selected;
}

export function sumBy(rows, selector) {
    return (rows || []).reduce((sum, row) => sum + asNumber(resolveValue(row, selector)), 0);
}

export function averageBy(rows, selector) {
    const safeRows = rows || [];
    return safeRows.length ? sumBy(safeRows, selector) / safeRows.length : 0;
}

export function uniqueCount(rows, selector) {
    return new Set((rows || []).map((row) => resolveValue(row, selector))).size;
}

export function countWhere(rows, predicate) {
    return (rows || []).filter(predicate).length;
}

export function percentOf(value, total) {
    const denominator = asNumber(total);
    return denominator ? (asNumber(value) / denominator) * 100 : 0;
}

export function percentLabel(value, total) {
    return `${percentOf(value, total).toFixed(0)}%`;
}

export function barStyle(percent, color, minimumWhenPresent = 10, hasValue = true) {
    const width = Math.max(asNumber(percent), hasValue ? minimumWhenPresent : 0);
    return `width:${width}%; background:${color};`;
}

export function meterStyle(value, maxValue, minimum = 12) {
    return `width:${Math.max(percentOf(value, maxValue), minimum)}%;`;
}

export function groupRows(rows, keySelector, createInitial, reducer) {
    const grouped = new Map();
    (rows || []).forEach((row) => {
        const key = resolveValue(row, keySelector);
        const current = grouped.get(key) || createInitial(key, row);
        reducer(current, row);
        grouped.set(key, current);
    });
    return Array.from(grouped.values());
}

export function sortByNumber(rows, selector, direction = 'desc') {
    const multiplier = direction === 'asc' ? 1 : -1;
    return [...(rows || [])].sort((left, right) => (asNumber(resolveValue(left, selector)) - asNumber(resolveValue(right, selector))) * multiplier);
}

export function applyFieldFilters(row, filters, fieldMap) {
    return Object.entries(fieldMap).every(([filterName, fieldName]) => matchesFilter(row[fieldName], filters[filterName]));
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

function resolveValue(row, selector) {
    if (typeof selector === 'function') {
        return selector(row);
    }
    return row?.[selector];
}
