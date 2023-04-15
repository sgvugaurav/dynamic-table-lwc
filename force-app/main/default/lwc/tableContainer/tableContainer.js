import { LightningElement } from 'lwc';

export default class TableContainer extends LightningElement {
    customAccount = 'Custom_Account__c';
    customContact = 'Custom_Contact__c';
    customCase = 'Custom_Case__c';
    customContract = 'Custom_Contract__c';
    accountFields = [
        {'label': 'Account Name','fieldName': 'Name', 'type': 'name', 'editable':'true', 'required': 'true'},
        {'label': 'Rating','fieldName': 'Rating__c', 'type': 'picklist', 'editable':'true'},
        {'label': 'DateTime','fieldName': 'DateTime__c', 'type': 'datetime', 'editable':'true'},
        {'label': 'Industry','fieldName': 'Industry__c', 'type': 'picklist', 'editable':'true'}
    ];
    contactFields = [
        {'label': 'Contact Name','fieldName': 'Name', 'type': 'name', 'editable':'true', 'required': 'true'},
        {'label': 'Date','fieldName': 'Date__c', 'type': 'date', 'editable':'true'},
        {'label': 'Pronounce','fieldName': 'Pronouns__c', 'type': 'picklist', 'editable':'true'}
    ];
    caseFields = [
        {'label': 'Case Number','fieldName': 'Name', 'type': 'name', 'editable':'false'},
        {'label': 'Datetime','fieldName': 'Datetime__c', 'type': 'datetime', 'editable':'true'},
        {'label': 'Description','fieldName': 'Description__c', 'type': 'text', 'editable':'true'},
        {'label': 'Status','fieldName': 'Status__c', 'type': 'picklist', 'editable':'true'}
    ];
    contractFields = [
        {'label': 'Contract Number','fieldName': 'Name', 'type': 'name', 'editable':'false'},
        {'label': 'Activated Date','fieldName': 'Activated_Date__c', 'type': 'datetime', 'editable':'true'},
        {'label': 'Description','fieldName': 'Description__c', 'type': 'text', 'editable':'true'},
        {'label': 'Status','fieldName': 'Status__c', 'type': 'picklist', 'editable':'true'}
    ];
}