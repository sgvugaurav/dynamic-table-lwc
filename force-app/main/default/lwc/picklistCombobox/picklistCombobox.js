import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import { LightningElement, api, wire } from 'lwc';

export default class PicklistCombobox extends LightningElement {
    @api objectName;
    @api picklistField;
    @api value;
    @api disabled;
    @api required;
    typeId;
    field;
    options;

    @wire(getObjectInfo, {objectApiName: '$objectName'})
    wiredObjectInfo({data, error}) {
        if(data) {
            this.typeId = data.defaultRecordTypeId;
            console.log(this.objectName);
            console.log(this.picklistField);
            this.field = {
                "fieldApiName": this.picklistField,
                "objectApiName": this.objectName
            };
        }
        else if(error) {
            console.log(error);
        }
    }

    @wire(getPicklistValues, {recordTypeId: '$typeId', fieldApiName: "$field"})
    wiredPicklistValeus({data, error}) {
        if (data) {
            this.options = data.values;
        }
        else if(error) {
            console.log('Error while fetching picklist values');
            console.log(error);
        }
    }

    get isRequired() {
        return String(this.required).toLocaleLowerCase() === 'true';
    }
}