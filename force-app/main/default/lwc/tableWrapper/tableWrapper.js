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
    @track records;
    @track headers;
    @track fieldList;
    isLoading = false;
    dateFieldInfo = {};
    mode = 'view';
    localIdPrefix = 'local';
    localSequence = 1;
    saveDisabled = false;
    changeList = [];

    connectedCallback() {
        if (!this.label) {
            this.label = "";
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
        this.isLoading = true;
        getData({
            objectName: this.objectName,
            fields: this.fieldList
        }).then(data => {
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
                    console.log('Records lenght before removing => ',this.records.length);
                    this.removeRecordWithId(id, this.records);
                    console.log('Records lenght after removing => ',this.records.length);
                    this.removeRecordWithId(id, this.changeList);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Entry removed',
                            variant: 'success'
                        })
                    );
                } else {
                    this.isLoading = true;
                    deleteRecord(id)
                    .then(res => {
                        console.log(res);
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
        // console.log('Records lengh before adding row >> ', this.records.length);
        // console.log('ChangeList lenght before adding row >> ', this.changeList.length);
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
        // console.log(newRecord);
        // console.log('Records lengh after adding row >> ', this.records.length);
        // console.log('ChangeList lenght after adding row >> ', this.changeList.length);
    }

    handleCellValueChange(event) {
        const value = event.detail.value;
        const Id = event.currentTarget.dataset.id;
        const field = event.currentTarget.dataset.field;
        const type = event.currentTarget.dataset.type;
        const record = this.getRecordWithId(Id, this.records);
        console.log('UnChanged Records List',JSON.parse(JSON.stringify(this.records)));
        record[field] = value;
        console.log('Changed Records List',JSON.parse(JSON.stringify(this.records)));
        console.log('Cell Value: ', value);
        console.log('Record Id: ', Id);
        console.log('Changed Field: ', field);
        console.log('Field Type: ', type);
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
        console.log('Size of changeList after cell value change', this.changeList.length);
        console.log('Changed Record List',this.changeList);
    }

    handelEditAndSave(event) {
        const label = event.target.label;
        if (label === 'Edit' && this.mode != 'edit') {
            this.mode = 'edit';
        }
        else {
            // console.log('Record Set while save >> ', JSON.parse(JSON.stringify(this.recordChangeSet)));
            // const recordList = [...this.recordChangeSet];
            // console.log('List representation of recordSet ', JSON.parse(JSON.stringify(recordList)));
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
             * Deletes the custom added fields from the record
             */
            const recordsToSave = structuredClone(this.changeList);
            recordsToSave.forEach(record => {
                if (String(record.Id).startsWith('local')) {
                    delete record.Id;
                }
                delete record.isToday;
                delete record.styleClasses;
            });
            console.log('Records to be saved >> ', recordsToSave);
            const fieldTypes = {};
            this.fields.forEach(f => {
                fieldTypes[f.fieldName] = f.type;
            });
            console.log('Field Types ', fieldTypes);
            this.isLoading = true;
            saveData({
                objectName: this.objectName,
                records: recordsToSave,
                fieldTypes: fieldTypes
            })
            .then(data => {
                console.log('New Data >> ', data);
                console.log('Existing records >> ', JSON.parse(JSON.stringify(this.records)));
                // const newRecordList = [];
                // this.records.forEach(r => {
                //     if (r.Id != undefined && r.Id != null && !String(r.Id).startsWith('local')) {
                //         newRecordList.push(r);
                //     }
                // });
                // data.forEach(d => {
                //     newRecordList.push(d);
                // });
                // console.log('New Record List >> ', newRecordList);
                // this.recordMap.clear();
                // this.recordChangeSet.clear();
                // this.changeList = [];
                // this.records = null;
                // this.records = newRecordList;
                this.records.forEach(r => {
                    if (String(r.Id).startsWith('local')) {
                        console.log('Record found with id >> ', r.Id);
                        this.removeRecordWithId(r.Id, this.records);
                        console.log('Updated list >> ', this.records);
                    }
                });
                console.log('Records  ');
                // this.records = [...this.records, ...data];
                // this.clearRecordsWithNoId();
                this.records = [...this.records, ...data];
                this.changeList = [];
                console.log('Record List after update >> ', this.records);
                console.log('Record size after update >> ', this.records.length);
                this.checkDate();
                this.mode = 'view';
                this.saveDisabled = true;
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
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error saving record(s)',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
                console.log(this.records);
            })
            .finally(() => {
                this.isLoading = false;
                console.log(this.records);
            });
        }
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

    // removeRecordWithId(Id) {
    //     for(let i = 0;i < this.records.length;i++) {
    //         if (this.records[i].Id === Id) {
    //             this.records.splice(i, 1);
    //         }
    //     }
    // }

    removeRecordWithId(Id, arr) {
        for(let i = 0;i < arr.length;i++) {
            if (arr[i].Id === Id) {
                arr.splice(i, 1);
            }
        }
    }

    clearRecordsWithNoId() {
        for (let i = 0; i < this.records.length; i++) {
            const element = this.records[i];
            if (element.Id == undefined || element.Id == null) {
                this.records.splice(i, 1);
                i--;
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
            console.log(JSON.parse(JSON.stringify(record)));
            console.log(JSON.parse(JSON.stringify(this.fields)));
            for (const field of this.fields) {
                console.log(field);
                if ((record[field.fieldName] === undefined || record[field.fieldName] === null || record[field.fieldName] === '') && String(field.required).toLowerCase() === 'true') {
                    console.log('Invalid data');
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