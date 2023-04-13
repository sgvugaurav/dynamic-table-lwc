import { LightningElement, api } from 'lwc';

export default class TableCell extends LightningElement {
    /**
     * API name of the SObject
     */
    @api objectName;
    /**
     * It is a list of objects. Each object supposed to contains following properties
     * 1. fieldName
     * 2. type
     */
    @api field;
    /**
     * A single records that's field value should be shown in the table
     */
    @api record;
    /**
     * The type of the field
     */
    @api type;
    @api mode;
    value;

    connectedCallback() {
        this.value = this.record[this.field];
        if (!this.mode) {
            this.mode = 'view';
        }
    }

    get isText() {
        return this.type.toLowerCase() === 'text';
    }

    get isPicklist() {
        return this.type.toLowerCase() === 'picklist';
    }

    get isDate() {
        return this.type.toLowerCase() === 'date';
    }

    get isDateTime() {
        return this.type.toLowerCase() === 'datetime';
    }

    get isName() {
        return this.type.toLowerCase() === 'name';
    }

    get isEmail() {
        return this.type.toLowerCase() === 'email';
    }

    /**
     * TODO: Make sure to update the method whenever you need a new type of url
     */
    get url() {
        if (this.isName) {
            return '/' + this.record.Id;
        }
        return 'mailto:' + this.value;
    }

    get isClosed() {
        if (this.record.Id.startsWith('local')) {
            return false;
        }
        if (this.record.Parent_Account__r && this.record.Parent_Account__r.Status__c) {
            return this.record.Parent_Account__r.Status__c.toLowerCase() != 'open';  
        }

        return true;
    }

    get isViewMode() {
        if (this.isClosed) {
            return true;
        }
        return this.mode != 'edit';
    }
}