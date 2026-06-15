public with sharing class CustomerSuccessDashboardController {
    private static final String STATIC_RESOURCE_NAME = 'CustomerSuccessDashboardSampleData';
    private static final String SAMPLE_MESSAGE = 'Packaged sample data derived from the repo CSV datasets is powering this dashboard app.';

    @TestVisible private static SamplePayload payloadCache;

    @AuraEnabled(cacheable=true)
    public static CommandCenterResponse getCommandCenterData() {
        SamplePayload payload = loadPayload();
        CommandCenterResponse response = new CommandCenterResponse();
        response.isFallback = false;
        response.dataMode = 'sample';
        response.message = SAMPLE_MESSAGE;
        response.accounts = payload.commandCenterAccounts;
        return response;
    }

    @AuraEnabled(cacheable=true)
    public static AtRiskResponse getAtRiskData() {
        SamplePayload payload = loadPayload();
        AtRiskResponse response = new AtRiskResponse();
        response.isFallback = false;
        response.dataMode = 'sample';
        response.message = SAMPLE_MESSAGE;
        response.accounts = payload.atRiskAccounts;
        return response;
    }

    @AuraEnabled(cacheable=true)
    public static ExpansionResponse getExpansionPipelineData() {
        SamplePayload payload = loadPayload();
        ExpansionResponse response = new ExpansionResponse();
        response.isFallback = false;
        response.dataMode = 'sample';
        response.message = SAMPLE_MESSAGE;
        response.opportunities = payload.expansionOpportunities;
        return response;
    }

    @AuraEnabled(cacheable=true)
    public static RetentionResponse getRetentionCohortsData() {
        SamplePayload payload = loadPayload();
        RetentionResponse response = new RetentionResponse();
        response.isFallback = false;
        response.dataMode = 'sample';
        response.message = SAMPLE_MESSAGE;
        response.cohorts = payload.retentionCohorts;
        return response;
    }

    private static SamplePayload loadPayload() {
        if (payloadCache != null) {
            return payloadCache;
        }

        List<StaticResource> resources = [
            SELECT Body
            FROM StaticResource
            WHERE Name = :STATIC_RESOURCE_NAME
            LIMIT 1
        ];
        if (resources.isEmpty()) {
            throw new AuraHandledException('Dashboard sample data static resource is missing: ' + STATIC_RESOURCE_NAME);
        }

        try {
            Map<String, Object> root = (Map<String, Object>) JSON.deserializeUntyped(resources[0].Body.toString());
            Map<String, Object> datasets = (Map<String, Object>) root.get('datasets');
            if (datasets == null) {
                throw new AuraHandledException('Dashboard sample payload is missing the datasets collection.');
            }

            SamplePayload payload = new SamplePayload();
            payload.commandCenterAccounts = mapAccountRows((List<Object>) datasets.get('customer360'));
            payload.atRiskAccounts = mapAccountRows((List<Object>) datasets.get('churnRiskAccounts'));
            payload.expansionOpportunities = mapOpportunityRows((List<Object>) datasets.get('expansionOpportunities'));
            payload.retentionCohorts = mapCohortRows((List<Object>) datasets.get('retentionCohorts'));
            payloadCache = payload;
            return payload;
        } catch (Exception error) {
            throw new AuraHandledException('Unable to parse packaged dashboard sample data: ' + error.getMessage());
        }
    }

    private static List<AccountRow> mapAccountRows(List<Object> rawRows) {
        List<AccountRow> rows = new List<AccountRow>();
        if (rawRows == null) {
            return rows;
        }

        for (Object rawRow : rawRows) {
            Map<String, Object> row = (Map<String, Object>) rawRow;
            AccountRow mapped = new AccountRow();
            mapped.id = stringValue(row.get('id'));
            mapped.accountName = stringValue(row.get('accountName'));
            mapped.csm = stringValue(row.get('csm'));
            mapped.portfolio = stringValue(row.get('portfolio'));
            mapped.segment = stringValue(row.get('segment'));
            mapped.region = stringValue(row.get('region'));
            mapped.riskBand = stringValue(row.get('riskBand'));
            mapped.healthBucket = stringValue(row.get('healthBucket'));
            mapped.primaryRisk = stringValue(row.get('primaryRisk'));
            mapped.arr = decimalValue(row.get('arr'));
            mapped.expansionPipeline = decimalValue(row.get('expansionPipeline'));
            mapped.healthScore = integerValue(row.get('healthScore'));
            mapped.openCases = integerValue(row.get('openCases'));
            mapped.renewalMonth = stringValue(row.get('renewalMonth'));
            mapped.lastTouchDays = integerValue(row.get('lastTouchDays'));
            mapped.snapshotAgeDays = integerValue(row.get('snapshotAgeDays'));
            mapped.nextStep = stringValue(row.get('nextStep'));
            mapped.sourceMode = 'sample';
            rows.add(mapped);
        }

        return rows;
    }

    private static List<OpportunityRow> mapOpportunityRows(List<Object> rawRows) {
        List<OpportunityRow> rows = new List<OpportunityRow>();
        if (rawRows == null) {
            return rows;
        }

        for (Object rawRow : rawRows) {
            Map<String, Object> row = (Map<String, Object>) rawRow;
            OpportunityRow mapped = new OpportunityRow();
            mapped.id = stringValue(row.get('id'));
            mapped.accountId = stringValue(row.get('accountId'));
            mapped.accountName = stringValue(row.get('accountName'));
            mapped.owner = stringValue(row.get('owner'));
            mapped.region = stringValue(row.get('region'));
            mapped.stage = stringValue(row.get('stage'));
            mapped.weighted = decimalValue(row.get('weighted'));
            mapped.readiness = stringValue(row.get('readiness'));
            mapped.useCase = stringValue(row.get('useCase'));
            mapped.closeWindow = stringValue(row.get('closeWindow'));
            mapped.sourceMode = 'sample';
            rows.add(mapped);
        }

        return rows;
    }

    private static List<CohortRow> mapCohortRows(List<Object> rawRows) {
        List<CohortRow> rows = new List<CohortRow>();
        if (rawRows == null) {
            return rows;
        }

        for (Object rawRow : rawRows) {
            Map<String, Object> row = (Map<String, Object>) rawRow;
            CohortRow mapped = new CohortRow();
            mapped.id = stringValue(row.get('id'));
            mapped.cohortLabel = stringValue(row.get('cohortLabel'));
            mapped.segment = stringValue(row.get('segment'));
            mapped.region = stringValue(row.get('region'));
            mapped.customers = integerValue(row.get('customers'));
            mapped.month3 = integerValue(row.get('month3'));
            mapped.month6 = integerValue(row.get('month6'));
            mapped.ltv = decimalValue(row.get('ltv'));
            mapped.arr = decimalValue(row.get('arr'));
            mapped.window = stringValue(row.get('window'));
            rows.add(mapped);
        }

        return rows;
    }

    private static Decimal decimalValue(Object value) {
        if (value == null) {
            return null;
        }
        return Decimal.valueOf(String.valueOf(value));
    }

    private static Integer integerValue(Object value) {
        Decimal numeric = decimalValue(value);
        return numeric == null ? null : Integer.valueOf(Math.round(numeric));
    }

    private static String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private class SamplePayload {
        List<AccountRow> commandCenterAccounts;
        List<AccountRow> atRiskAccounts;
        List<OpportunityRow> expansionOpportunities;
        List<CohortRow> retentionCohorts;
    }

    public class CommandCenterResponse {
        @AuraEnabled public Boolean isFallback;
        @AuraEnabled public String dataMode;
        @AuraEnabled public String message;
        @AuraEnabled public List<AccountRow> accounts;
    }

    public class AtRiskResponse {
        @AuraEnabled public Boolean isFallback;
        @AuraEnabled public String dataMode;
        @AuraEnabled public String message;
        @AuraEnabled public List<AccountRow> accounts;
    }

    public class ExpansionResponse {
        @AuraEnabled public Boolean isFallback;
        @AuraEnabled public String dataMode;
        @AuraEnabled public String message;
        @AuraEnabled public List<OpportunityRow> opportunities;
    }

    public class RetentionResponse {
        @AuraEnabled public Boolean isFallback;
        @AuraEnabled public String dataMode;
        @AuraEnabled public String message;
        @AuraEnabled public List<CohortRow> cohorts;
    }

    public class AccountRow {
        @AuraEnabled public String id;
        @AuraEnabled public String accountName;
        @AuraEnabled public String csm;
        @AuraEnabled public String portfolio;
        @AuraEnabled public String segment;
        @AuraEnabled public String region;
        @AuraEnabled public String riskBand;
        @AuraEnabled public String healthBucket;
        @AuraEnabled public String primaryRisk;
        @AuraEnabled public Decimal arr;
        @AuraEnabled public Decimal expansionPipeline;
        @AuraEnabled public Integer healthScore;
        @AuraEnabled public Integer openCases;
        @AuraEnabled public String renewalMonth;
        @AuraEnabled public Integer lastTouchDays;
        @AuraEnabled public Integer snapshotAgeDays;
        @AuraEnabled public String nextStep;
        @AuraEnabled public String sourceMode;
    }

    public class OpportunityRow {
        @AuraEnabled public String id;
        @AuraEnabled public String accountId;
        @AuraEnabled public String accountName;
        @AuraEnabled public String owner;
        @AuraEnabled public String region;
        @AuraEnabled public String stage;
        @AuraEnabled public Decimal weighted;
        @AuraEnabled public String readiness;
        @AuraEnabled public String useCase;
        @AuraEnabled public String closeWindow;
        @AuraEnabled public String sourceMode;
    }

    public class CohortRow {
        @AuraEnabled public String id;
        @AuraEnabled public String cohortLabel;
        @AuraEnabled public String segment;
        @AuraEnabled public String region;
        @AuraEnabled public Integer customers;
        @AuraEnabled public Integer month3;
        @AuraEnabled public Integer month6;
        @AuraEnabled public Decimal ltv;
        @AuraEnabled public Decimal arr;
        @AuraEnabled public String window;
    }
}
