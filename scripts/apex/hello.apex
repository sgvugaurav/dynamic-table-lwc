List<SObject> recordList = new List<SObject>();
for (Integer i = 0; i < 5; i++) {
    recordList.add(new Custom_Account__c(Name='Test Account ' + (i + 1), Rating__c='Hot', DateTime__c= DateTime.now(), Industry__c='Education', Parent_Account__c='0010l00001YhuoQAAR'));
}
for (Integer i = 0; i < 5; i++) {
    recordList.add(new Custom_Contact__c(Name='Test Contact ' + (i + 1), Date__c=Date.today(), Pronouns__c='He/Him', Parent_Account__c='0010l00001YhuoQAAR'));
}
for (Integer i = 0; i < 5; i++) {
    recordList.add(new Custom_Case__c(Datetime__c=DateTime.now(), Description__c='This is case discription',Status__c='New', Parent_Account__c='0010l00001YhuoQAAR'));
}
for (Integer i = 0; i < 5; i++) {
    recordList.add(new Custom_Contract__c(Activated_Date__c=DateTime.now(), Description__c='This is contract discription',Status__c='Activated', Parent_Account__c='0010l00001YhuoQAAR'));
}
insert recordList;

insert new Custom_Account__c(Name='Test Account 5', Rating__c='Hot', DateTime__c= DateTime.now(), Industry__c='Banking');