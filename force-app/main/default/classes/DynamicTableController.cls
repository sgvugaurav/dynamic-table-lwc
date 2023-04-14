/**
 * Controller class for TableContainer and TableWrapper LWC components
 * Test Class - DynamicTableController_Test
 * @author Gaurav Kumar
 * @since  11 April 2023
 */
public with sharing class DynamicTableController {
    /**
     * This method is used to fetch records of an SObject
     * Please use this method to retrieve record of 'Custom_Account__c', 'Custom_Contact__c', 'Custom_Case__c', 'Custom_Contract__c' only.
     * Otherwise it may through exception.
     * @param objectName API name of the SObject that's records to be retrieved
     * @param fields     API name of fields that's values should be retrieved
     * @return           `List<SObject>`
     * @exception        AuraHandledException
     */
    @AuraEnabled
    public static List<SObject> getData(String objectName, List<String> fields) {
        List<SObject> objList = new List<SObject>();
        try {
            if (!String.isBlank(objectName) && fields != null) {
                String query = String.escapeSingleQuotes('SELECT ' + String.join(fields, ',') + ',Parent_Account__r.Status__c FROM ' + objectName);
                objList.addAll(Database.query(query));
            }
        }
        catch (Exception ex) {
            throw new AuraHandledException('Object API Name or One of the merge field name is incorrect. Make sure that the SObject and its fields exists.');
        }
        return objList;
    }

    /**
     * This method is used to insert or update SObjects
     * @param objectName API Name of the SObject that's records to be saved
     * @param fields     A map that contains field -> value for the specified SObject
     * @return           `List<SObject>`
     */
    @AuraEnabled
    public static List<SObject> saveData(String objectName, List<Map<String, Object>> records, Map<String, String> fieldTypes) {
        try {
            List<SObject> objList = new List<SObject>();
            Database.UpsertResult[] result;
            if (!String.isBlank(objectName) && records != null && fieldTypes != null) {
                Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
                for (Map<String, Object> record : records) {
                    SObject obj = globalDescribe.get(objectName).newSObject();
                    for (String field : record.keySet()) {
                        if (record.get(field) != null) {
                            if ('datetime'.equalsIgnoreCase(fieldTypes.get(field)?.toLowerCase())) {
                                Datetime dt = Datetime.valueOf(((String) record.get(field)).replace('T', ' ').substringBefore('.').replace('Z', ''));
                                obj.put(field, dt);
                            }
                            else if ('date'.equalsIgnoreCase(fieldTypes.get(field)?.toLowerCase())) {
                                Date d = Date.valueOf((String) record.get(field));
                                obj.put(field, d);
                            }
                            else {
                                obj.put(field, (String)record.get(field));
                            }
                        }
                    }
                    objList.add(obj);
                }

                Schema.DescribeSObjectResult describeResult = globalDescribe.get(objectName).getDescribe();
                if (describeResult.isUpdateable() && describeResult.isCreateable()) {
                    result =  Database.upsert(objList);
                }
            }
            return getCreatedRecords(result, objectName, new List<String>(fieldTypes.keySet()));
        }
        catch (Exception ex) {
            throw new AuraHandledException('Object API Name or One of the merge field name is incorrect. Make sure that the SObject and its fields exists.');
        }
    }

    @TestVisible
    private static List<SObject> getCreatedRecords(List<Database.UpsertResult> result, String objectName, List<String> fields) {
        try {
            Set<Id> createdRecordIds = new Set<Id>();
            for (Database.UpsertResult r : result) {
                if (r.isCreated()) {
                    createdRecordIds.add(r.getId());
                }
            }
            String query = String.escapeSingleQuotes('SELECT ' + String.join(fields, ',') + ',Parent_Account__r.Status__c FROM ' + objectName + ' WHERE ID IN :createdRecordIds');
            return Database.query(query);
        }
        catch (Exception ex) {
            throw new AuraHandledException('Error fetching created records');
        }
    }
}