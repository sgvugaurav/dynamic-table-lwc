import getData from '@salesforce/apex/DynamicTableController.getData';
import { LightningElement, api, track } from 'lwc';
import LightningAlert from 'lightning/alert';

export default class TableWrapper extends LightningElement {
    @api label;
    @api objectName;
    @api fields;
    @track records;
    @track headers;
    @track fieldList;
    isLoading = false;
    dateFieldInfo = {};

    connectedCallback() {
        if (!this.label) {
            this.label = "";
        }
        this.headers = [];
        this.fieldList = [];
        this.dateFieldInfo.fields = [];
        this.dateFieldInfo.hasDateField = false;
        this.fields.forEach(field => {
            this.headers.push(field.label); //Headers are used to make table header
            this.fieldList.push(field.fieldName);
            if (field.type === 'date' || field.type === 'datetime') { 
              this.dateFieldInfo.hasDateField = true; //dateFieldInfo is used to check if the date field contains todays date
              this.dateFieldInfo.fields.push(field.fieldName);
            }
        });
        console.log(this.objectName);
        console.log(this.fieldList);
        this.isLoading = true;
        getData({
            objectName: this.objectName,
            fields: this.fieldList
        }).then(data => {
            console.log(data);
            console.log(JSON.parse(JSON.stringify(data)));
            this.records = data;
            this.checkDate();
        }).catch(error => {
            console.log(error);
            console.log(JSON.parse(JSON.stringify(error)));
            LightningAlert.open({
                message: error.body.message,
                theme: 'error', 
                label: 'Error retrieving records'
            });
        }).finally(() => {
            this.isLoading = false;
        });
    }

    handleDelete(event) {
        console.log(event.detail);
        console.log(event.target);
        console.log(event.currentTarget.dataset);
    }

    checkDate() {
        this.records.forEach(record => {
            record.isToday = false;
            record.styleClasses = 'slds-hint-parent';
            if (this.dateFieldInfo.hasDateField) {
                const today = new Date();
                this.dateFieldInfo.fields.forEach(field => {
                    const date = new Date(record[field]);
                    if (!record.isToday && today.getDate() === date.getDate() && today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear()) {
                        record.isToday = true;
                        record.styleClasses = 'slds-hint-parent green-background';
                    }
                });
            }
        });
    }

}