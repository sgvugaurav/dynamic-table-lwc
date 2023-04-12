import { LightningElement, api } from 'lwc';

export default class TableCell extends LightningElement {
    @api objectName
    @api field
    @api record
    @api type
    value;

    connectedCallback() {
        this.value = this.record[this.field];
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

    get isDisabled() {
        return this.record.Parent_Account__r.Status__c.toLowerCase() != 'open';
    }
}