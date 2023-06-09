/**
 * This is a test class for DynamicTableController class.
 * @author Gaurav Kumar
 * @since  11 April 2023
 */
@IsTest
public with sharing class DynamicTableController_Test {
    @testSetup
    private static void testSetup() {
        Account a = new Account(Name='Test Account', Status__c='Open');
        insert a;
        List<SObject> recordList = new List<SObject>();
        for (Integer i = 0; i < 200; i++) {
            recordList.add(new Custom_Account__c(Name='Test Account ' + (i + 1), Rating__c='Hot', DateTime__c= DateTime.now(), Industry__c='Education', Parent_Account__c=a.Id));
        }
        for (Integer i = 0; i < 200; i++) {
            recordList.add(new Custom_Contact__c(Name='Test Contact ' + (i + 1), Date__c=Date.today(), Pronouns__c='He/Him', Parent_Account__c=a.Id));
        }
        for (Integer i = 0; i < 200; i++) {
            recordList.add(new Custom_Case__c(Datetime__c=DateTime.now(), Description__c='This is case discription',Status__c='New', Parent_Account__c=a.Id));
        }
        for (Integer i = 0; i < 200; i++) {
            recordList.add(new Custom_Contract__c(Activated_Date__c=DateTime.now(), Description__c='This is contract discription',Status__c='Activated', Parent_Account__c=a.Id));
        }
        insert recordList;
    }

    @IsTest
    static void testGetDataWithValidInput(){
        String accountName = 'Custom_Account__c';
        List<String> fields = new List<String>{'Name', 'Rating__c', 'DateTime__c', 'Industry__c'};
        Test.startTest();
            List<Custom_Account__c> accountList = DynamicTableController.getData(accountName, fields);
        Test.stopTest();
        System.assertEquals(200, accountList.size(), 'There should have been 200 records in the Custom_Account__c SObject');
    }

    @IsTest
    static void testGetDataWithInvalidInput(){
        String accountName = 'Custom_Contact__c';
        List<String> fields = new List<String>{'Name', 'Rating__c', 'DateTime__c', 'Industry__c'};
        Test.startTest();
            try {
                DynamicTableController.getData(accountName, fields);
            }
            catch (Exception e) {
                System.assertEquals(true, e.getMessage().contains('Script-thrown'), 'Error message must contain Script-Thrown Error');
            }
        Test.stopTest();
    }

    @isTest
    private static void testSaveData() {
        List<Map<String, Object>> recordList = new List<Map<String, Object>>();
        String dateString = '2023-04-14T04:53:00.000Z';
        Datetime dt = Datetime.valueOf(dateString.replace('T', ' ').substringBefore('.').replace('Z', ''));
        Map<String, String> fieldTypes = new Map<String, String>{
            'Name' => 'String',
            'Rating__c' => 'String',
            'DateTime__c' => 'datetime'
        };
        recordList.add(new Map<String, Object>{
            'Name' => 'Test Account',
            'Rating__c' => 'Hot',
            'DateTime__c' => dt
        });
        Test.startTest();
            try {
                DynamicTableController.saveData('Custom_Account__c', recordList, fieldTypes);
            }
            catch (Exception ex) {
                System.assertEquals(true, ex.getMessage().contains('Script-thrown'), 'Error message must contain Script-Thrown Error');
            }
        Test.stopTest();
        List<Custom_Account__c> c = [SELECT Id FROM Custom_Account__c];
        System.assertEquals(200, c.size(), 'There should be 1 record in the Custom_Account__c SObject');
    }

    @isTest
    private static void testSaveDataForError() {
        List<Map<String, Object>> recordList = new List<Map<String, Object>>();
        Map<String, String> fieldTypes = new Map<String, String>{
            'Name' => 'String',
            'Rating__c' => 'String',
            'DateTime__c' => 'datetime'
        };
        String dateString = '2023-04-14T04:53:00.000Z';
        recordList.add(new Map<String, Object>{
            'Name' => 'Test Account',
            'Rating__c' => 'Hot',
            'DateTime__c' => dateString
        });
        Test.startTest();
            DynamicTableController.saveData('Custom_Account__c', recordList, fieldTypes);
        Test.stopTest();
        List<Custom_Account__c> allAccounts = [SELECT Id FROM Custom_Account__c];
        System.assertEquals(201, allAccounts.size(), 'The total number of records must be 201');
    }

    @isTest
    private static void testSaveDataForUpdatingRecord() {
        List<Map<String, Object>> recordList = new List<Map<String, Object>>();
        Map<String, String> fieldTypes = new Map<String, String>{
            'Name' => 'String',
            'Rating__c' => 'String',
            'DateTime__c' => 'datetime'
        };
        List<Custom_Account__c> accList = [SELECT Id, Name, Rating__c, DateTime__c, Industry__c FROM Custom_Account__c WHERE Name = 'Test Account 1'];
        accList[0].Name = 'Updated Account Name';
        recordList.add(new Map<String, Object> {
            'Id' => accList[0].Id,
            'Name' => accList[0].Name,
            'Rating__c' => accList[0].Rating__c,
            'DateTime__c' => '2023-04-14T04:53:00.000Z'
        });
        Test.startTest();
            List<SObject> createdRecords = DynamicTableController.saveData('Custom_Account__c', recordList, fieldTypes);
        Test.stopTest();
        System.assertEquals(0, createdRecords.size(), 'The length of createdRecords should be 0 as records has been updated instead of creating');
        List<Custom_Account__c> aList = [SELECT Id, Name, Rating__c, DateTime__c, Industry__c FROM Custom_Account__c WHERE Name = 'Updated Account Name'];
        List<Custom_Account__c> allAccounts = [SELECT Id FROM Custom_Account__c];
        System.assert(aList.size() == accList.size(), 'Size must be equal');
        System.assert(aList[0].Id == accList[0].Id, 'The Id must match');
        System.assertEquals(200, allAccounts.size(), 'There must be a total of 200 records.');
    }

    @IsTest
    static void testSaveDataForInsertAndUpdateTogether(){
        List<Map<String, Object>> recordList = new List<Map<String, Object>>();
        Map<String, String> fieldTypes = new Map<String, String>{
            'Name' => 'String',
            'Rating__c' => 'String',
            'DateTime__c' => 'datetime'
        };
        List<Custom_Account__c> accList = [SELECT Id, Name, Rating__c, DateTime__c, Industry__c FROM Custom_Account__c WHERE Name = 'Test Account 1'];
        accList[0].Name = 'Updated Account Name';
        recordList.add(new Map<String, Object> {
            'Id' => accList[0].Id,
            'Name' => accList[0].Name,
            'Rating__c' => accList[0].Rating__c,
            'DateTime__c' => '2023-04-14T04:53:00.000Z'
        });
        String dateString = '2023-04-14T04:53:00.000Z';
        recordList.add(new Map<String, Object>{
            'Name' => 'Test Account',
            'Rating__c' => 'Hot',
            'DateTime__c' => dateString
        });
        Test.startTest();
            DynamicTableController.saveData('Custom_Account__c', recordList, fieldTypes);
        Test.stopTest();
        List<Custom_Account__c> aList = [SELECT Id, Name, Rating__c, DateTime__c, Industry__c FROM Custom_Account__c WHERE Name = 'Updated Account Name'];
        List<Custom_Account__c> allAccounts = [SELECT Id FROM Custom_Account__c];
        System.assert(aList.size() == accList.size(), 'Size must be equal');
        System.assert(aList[0].Id == accList[0].Id, 'The Id must match');
        System.assertEquals(201, allAccounts.size(), 'The total number of records must be 201');
    }

    @isTest
    private static void testSaveDataForSObjectWithAutonumberField() {
        List<Map<String, Object>> recordList = new List<Map<String, Object>>();
        Map<String, String> fieldTypes = new Map<String, String>{
            'Name' => 'String',
            'Description__c' => 'String',
            'Datetime__c' => 'datetime'
        };
        List<Custom_Case__c> accList = [SELECT Id, Name,Datetime__c, Description__c FROM Custom_Case__c ORDER BY Id];
        String description =accList[0].Description__c;
        recordList.add(new Map<String, Object> {
            'Id' => accList[0].Id,
            'Datetime__c' => '2023-04-15T04:53:00.000Z',
            'Description__c' => 'Description in test class'
        });
        Test.startTest();
            try {
                DynamicTableController.saveData('Custom_Case__c', recordList, fieldTypes);
            } catch (Exception e) {
                List<Custom_Case__c> cases = [SELECT Id, Name,Datetime__c, Description__c FROM Custom_Case__c ORDER BY Id];
                System.assertEquals(description, cases[0].Description__c, 'Error occured while saving the record');
            }
        Test.stopTest();
        List<Custom_Case__c> caseList = [SELECT Id, Name,Datetime__c, Description__c FROM Custom_Case__c ORDER BY Id];
        System.assertEquals('Description in test class', caseList[0].Description__c, 'Description must have been updated');
    }
}