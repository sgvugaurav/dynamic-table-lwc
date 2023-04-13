import getData from '@salesforce/apex/DynamicTableController.getData';
import { LightningElement, api, track } from 'lwc';
import LightningAlert from 'lightning/alert';
import LightningConfirm from 'lightning/confirm';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';

export default class TableWrapper extends LightningElement {
    @api label;
    @api objectName;
    @api fields;
    @track records;
    @track headers;
    @track fieldList;
    isLoading = false;
    dateFieldInfo = {};
    mode = 'view';
    localSequence = 1;
    saveDisabled = false;
    recordMap = new Map();
    recordChangeSet = new Set();

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
            this.records.forEach(r => {
                this.recordMap.set(r.Id, r);
            });
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
        if (this.isDisabled) {
            return;
        }
        const id = event.currentTarget.dataset.id;
        LightningConfirm.open({
            message: 'You are about to delete a record. Are you sure, you want to perform the action?',
            theme: 'info'
        })
        .then(result => {
            console.log(result);
            if (result) {
                if (id.startsWith('local')) {
                    this.removeRecordWithId(id);
                    this.recordMap.delete(id);
                } else {
                    this.isLoading = true;
                    deleteRecord(id)
                    .then(res => {
                        console.log(res);
                        this.removeRecordWithId(id);
                        this.recordMap.delete(id);
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Record deleted',
                                variant: 'success'
                            })
                        );
                    })
                    .catch(error => {
                        console.log('Error deleting the record ', error);
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error deleting record',
                                message: error.body.message,
                                variant: 'error'
                            })
                        );
                    })
                    .finally(() => {
                        this.isLoading = false;
                    });
                }
            }
        })
        .catch(error => {
            console.log('Error while confirming delettion ', error);
        });
    }

    handleAddRow(event) {
        const newRecord = {};
        newRecord.Id = 'local' + this.localSequence;
        this.localSequence += 1;
        this.fieldList.forEach(field => {
            newRecord[field] = null;
        });
        this.records.push(newRecord);
        this.recordMap.set(newRecord.Id, newRecord);
        console.log(newRecord);
    }

    handelEditAndSave(event) {
        if (this.mode != 'edit') {
            this.mode = 'edit';
        }
        else {
            this.mode = 'view';
            this.saveDisabled = true;
        }
    }

    handleCellValueChange(event) {
        console.log('Id: ' + event.currentTarget.dataset.id + ' field: ' + event.currentTarget.dataset.field);
        console.log(event.detail.value);
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

    removeRecordWithId(Id) {
        for(let i = 0;i < this.records.length;i++) {
            if (this.records[i].Id === Id) {
                this.records.splice(i, 1);
            }
        }
    }

    get isDisabled() {
        return this.mode !== 'edit';
    }

    get btnLabel() {
        if (this.mode != 'edit') {
            return 'Edit';
        } else {
            return 'Save';
        }
    }
}