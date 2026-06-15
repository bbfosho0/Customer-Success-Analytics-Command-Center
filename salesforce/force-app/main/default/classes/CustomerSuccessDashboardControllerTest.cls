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
        System.assert(commandCenter.accounts.size() > 0, 'Command center should return packaged sample accounts.');

        System.assertEquals('sample', atRisk.dataMode);
        System.assert(atRisk.accounts.size() > 0, 'At-risk page should return packaged sample accounts.');

        System.assertEquals('sample', expansion.dataMode);
        System.assert(expansion.opportunities.size() > 0, 'Expansion page should return packaged sample opportunities.');

        System.assertEquals('sample', retention.dataMode);
        System.assert(retention.cohorts.size() > 0, 'Retention page should return packaged sample cohorts.');
    }

    @IsTest
    static void cachesParsedPayloadPerTransaction() {
        CustomerSuccessDashboardController.payloadCache = null;

        Test.startTest();
        CustomerSuccessDashboardController.getCommandCenterData();
        Test.stopTest();

        System.assertNotEquals(null, CustomerSuccessDashboardController.payloadCache, 'Payload cache should be populated after the first read.');
    }
}
