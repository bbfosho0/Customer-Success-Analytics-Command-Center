@IsTest
private class CustomerSuccessDashboardControllerTest {
    @IsTest
    static void returnsNonEmptyResponsesFromStaticResourceSampleData() {
        Test.startTest();
        CustomerSuccessDashboardController.CommandCenterResponse commandCenter = CustomerSuccessDashboardController.getCommandCenterData();
        CustomerSuccessDashboardController.AtRiskResponse atRisk = CustomerSuccessDashboardController.getAtRiskData();
        CustomerSuccessDashboardController.ExpansionResponse expansion = CustomerSuccessDashboardController.getExpansionPipelineData();
        CustomerSuccessDashboardController.RetentionResponse retention = CustomerSuccessDashboardController.getRetentionCohortsData();
        Test.stopTest();

        System.assertEquals('sample', commandCenter.dataMode);
        System.assertEquals(false, commandCenter.isFallback);
        System.assert(commandCenter.message.contains('Packaged sample data'), 'Command center should identify the packaged sample-data runtime.');
        System.assert(commandCenter.accounts.size() > 0, 'Command center should return packaged sample accounts.');
        System.assertNotEquals(null, commandCenter.accounts[0].accountName, 'Command center account rows should be mapped.');
        System.assertNotEquals(null, commandCenter.accounts[0].sourceMode, 'Command center account rows should identify their source mode.');

        System.assertEquals('sample', atRisk.dataMode);
        System.assert(atRisk.accounts.size() > 0, 'At-risk page should return packaged sample accounts.');
        System.assertNotEquals(null, atRisk.accounts[0].primaryRisk, 'At-risk rows should include risk drivers.');

        System.assertEquals('sample', expansion.dataMode);
        System.assert(expansion.opportunities.size() > 0, 'Expansion page should return packaged sample opportunities.');
        System.assertNotEquals(null, expansion.opportunities[0].stage, 'Expansion rows should include stage labels.');

        System.assertEquals('sample', retention.dataMode);
        System.assert(retention.cohorts.size() > 0, 'Retention page should return packaged sample cohorts.');
        System.assertNotEquals(null, retention.cohorts[0].cohortLabel, 'Retention rows should include cohort labels.');
    }

    @IsTest
    static void cachesParsedPayloadPerTransaction() {
        CustomerSuccessDashboardController.payloadCache = null;

        Test.startTest();
        CustomerSuccessDashboardController.getCommandCenterData();
        Test.stopTest();

        System.assertNotEquals(null, CustomerSuccessDashboardController.payloadCache, 'Payload cache should be populated after the first read.');
    }

    @IsTest
    static void rejectsMissingDatasetsWithClearMessage() {
        CustomerSuccessDashboardController.payloadCache = null;
        CustomerSuccessDashboardController.payloadBodyOverride = '{"datasets":{"customer360":[]}}';

        try {
            CustomerSuccessDashboardController.getCommandCenterData();
            System.assert(false, 'Missing sample datasets should fail before returning dashboard data.');
        } catch (AuraHandledException error) {
            System.assert(
                CustomerSuccessDashboardController.lastPayloadError.contains('customer360') ||
                    CustomerSuccessDashboardController.lastPayloadError.contains('churnRiskAccounts'),
                'Error should name the malformed or missing sample dataset.'
            );
        } finally {
            CustomerSuccessDashboardController.payloadBodyOverride = null;
            CustomerSuccessDashboardController.payloadCache = null;
            CustomerSuccessDashboardController.lastPayloadError = null;
        }
    }

    @IsTest
    static void rejectsNonObjectRowsWithClearMessage() {
        CustomerSuccessDashboardController.payloadCache = null;
        CustomerSuccessDashboardController.payloadBodyOverride =
            '{"datasets":{' +
            '"customer360":["bad-row"],' +
            '"churnRiskAccounts":[{}],' +
            '"expansionOpportunities":[{}],' +
            '"retentionCohorts":[{}]' +
            '}}';

        try {
            CustomerSuccessDashboardController.getCommandCenterData();
            System.assert(false, 'Malformed sample rows should fail before returning dashboard data.');
        } catch (AuraHandledException error) {
            System.assert(
                CustomerSuccessDashboardController.lastPayloadError.contains('customer360'),
                'Error should name the dataset with the malformed row.'
            );
        } finally {
            CustomerSuccessDashboardController.payloadBodyOverride = null;
            CustomerSuccessDashboardController.payloadCache = null;
            CustomerSuccessDashboardController.lastPayloadError = null;
        }
    }
}
