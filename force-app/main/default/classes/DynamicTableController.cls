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
    public static List<SObject> saveData(String objectName, List<Map<String, String>> records) {
        List<SObject> objList = new List<SObject>();
        try {
            if (!String.isBlank(objectName) && records != null) {
                Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
                for (Map<String, String> record : records) {
                    SObject obj = globalDescribe.get(objectName).newSObject();
                    for (String field : record.keySet()) {
                        obj.put(field, record.get(field));
                    }
                    objList.add(obj);
                }

                Schema.DescribeSObjectResult describeResult = globalDescribe.get(objectName).getDescribe();
                if (describeResult.isUpdateable() && describeResult.isCreateable()) {
                    Database.upsert(objList);
                }
            }
        }
        catch (Exception ex) {
            throw new AuraHandledException('Object API Name or One of the merge field name is incorrect. Make sure that the SObject and its fields exists.');
        }
        return objList;
    }
}