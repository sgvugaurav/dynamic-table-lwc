import { LightningElement, api, track } from 'lwc';
import getData from '@salesforce/apex/DynamicTableController.getData';
import saveData from '@salesforce/apex/DynamicTableController.saveData';
import LightningAlert from 'lightning/alert';
import LightningConfirm from 'lightning/confirm';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';

export default class TableWrapper extends LightningElement {
    @api label;
    @api objectName;
    @api fields;
    @api mode;
    @track records;
    @track headers;
    @track fieldList;
    // isLoading = false;
    dateFieldInfo = {};
    localIdPrefix = 'local';
    localSequence = 1;
    saveDisabled = false;
    changeList = [];

    connectedCallback() {
        if (!this.label) {
            this.label = "";
        }
        if (String(this.mode).toLocaleLowerCase() != "edit") {
            this.mode = "view";
        }
        this.headers = [];
        this.fieldList = [];
        this.dateFieldInfo.fields = []; //contains fields of date or datetime type
        this.dateFieldInfo.hasDateField = false; //By default it is considered that the record do have date(time) field
        this.fields.forEach(field => {
            this.headers.push(field.label); //Headers are used to make table header
            this.fieldList.push(field.fieldName);
            if (field.type === 'date' || field.type === 'datetime') { 
              this.dateFieldInfo.hasDateField = true; //dateFieldInfo is used to check if the date field contains todays date
              this.dateFieldInfo.fields.push(field.fieldName);
            }
        });
        // this.isLoading = true;
        getData({
            objectName: this.objectName,
            fields: this.fieldList
        }).then(data => {
            this.records = data;
            this.checkDate();
        }).catch(error => {
            console.log(error);
            LightningAlert.open({
                message: error.body.message,
                theme: 'error', 
                label: 'Error retrieving records'
            });
        })
        // .finally(() => {
        //     this.isLoading = false;
        // });
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
            if (result) {
                if (id.startsWith('local')) {
                    this.removeRecordWithId(id, this.records);
                    this.removeRecordWithId(id, this.changeList);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Entry removed',
                            variant: 'success'
                        })
                    );
                } else {
                    // this.isLoading = true;
                    deleteRecord(id)
                    .then(res => {
                        this.removeRecordWithId(id, this.records);
                        this.removeRecordWithId(id, this.changeList);
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
                    // .finally(() => {
                    //     this.isLoading = false;
                    // });
                }
            }
        })
        .catch(error => {
            console.log('Error while confirming delettion ', error);
        });
    }

    handleAddRow(event) {
        const newRecord = {};
        newRecord.Id = this.localIdPrefix + this.localSequence;
        this.fields.forEach(field => {
            newRecord[field.fieldName] = null;
        });
        newRecord.isToday = false;
        newRecord.styleClasses = 'slds-hint-parent';
        this.records.push(newRecord);
        this.changeList.push(newRecord);
        this.localSequence += 1;
    }

    handleCellValueChange(event) {
        const value = event.detail.value;
        const Id = event.currentTarget.dataset.id;
        const field = event.currentTarget.dataset.field;
        const type = event.currentTarget.dataset.type;
        const record = this.getRecordWithId(Id, this.records);
        record[field] = String(value);
        if(this.dateFieldInfo.hasDateField && (type === 'date' || type === 'datetime')) {
            const today = new Date();
            const date = new Date(value);
            if (today.getDate() === date.getDate() && today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear()) {
                record.isToday = true;
                record.styleClasses = 'slds-hint-parent green-background';
            } else {
                record.isToday = false;
                record.styleClasses = 'slds-hint-parent';
            }
        }
        if (this.getRecordWithId(Id, this.changeList) === null) {
            this.changeList.push(record);
        }
    }

    @api
    handleEditAndSave(event) {
        let promise = new Promise((resolve, reject) => {
            /**
             * Check is any required field's value is missing
             */
            if (!this.isDataValid()) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Required fields are missing',
                        variant: 'error'
                    })
                );
                return;
            }
            /**
             * Deletes the custom added fields and fields that are not editable from the record
             */
            const recordsToSave = structuredClone(this.changeList);
            recordsToSave.forEach(record => {
                if (String(record.Id).startsWith('local')) {
                    delete record.Id;
                }
                delete record.isToday;
                delete record.styleClasses;
                this.fields.forEach(f => {
                    if (String(f['editable']) === 'false') {
                        delete record[f.fieldName];
                    }
                });
            });
            const fieldTypes = {};
            this.fields.forEach(f => {
                fieldTypes[f.fieldName] = f.type;
            });
            // this.isLoading = true;
            console.log("Following records to be saved >> ", JSON.parse(JSON.stringify(recordsToSave)));
            saveData({
                objectName: this.objectName,
                records: recordsToSave,
                fieldTypes: fieldTypes
            })
            .then(data => {
                const newRecordList = [];
                this.records.forEach(r => {
                    if (!String(r.Id).startsWith(this.localIdPrefix)) {
                        newRecordList.push(r);
                    }
                });
                console.log("New record list >> ", newRecordList);
                this.records = [...newRecordList, ...data];
                this.changeList = [];
                this.checkDate();
                this.mode = 'view';
                // this.saveDisabled = true;
                resolve(structuredClone(data));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Record(s) Saved',
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                console.log('Error saving the record(s) ', error);
                reject(structuredClone(error));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error saving record(s)',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            })
            // .finally(() => {
            //     this.isLoading = false;
            // });
        });
        return promise;
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

    removeRecordWithId(Id, arr) {
        for(let i = 0;i < arr.length;i++) {
            if (arr[i].Id === Id) {
                arr.splice(i, 1);
            }
        }
    }

    getRecordWithId(Id, arr) {
        for (let i = 0; i < arr.length; i++) {
            const element = arr[i];
            if (element.Id === Id) {
                return element;
            }
        }
        return null;
    }

    isDataValid() {
        for (const record of this.changeList) {
            for (const field of this.fields) {
                if ((record[field.fieldName] === undefined || record[field.fieldName] === null || record[field.fieldName] === '') && String(field.required).toLowerCase() === 'true') {
                    return false;
                }
            }
        }

        return true;
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

    get recordsAvailable() {
        return this.records != undefined && this.records != null && this.records.length > 0;
    }
}