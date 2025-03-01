# directory_service

In order to facilitate routing of approvals I built a directory service. The directory service is a thin overlay of AWS Lambda and API Gateway managing data in DynamoDB. It’s designed to be both simple and flexible. The main point of interaction is intended to be the API, however there is also a user interface designed for humans to manage the data. It’s designed to be conceptually similar to tags, allowing for arbitrary one to many or many to many relationships.

Access to the API is restricted via two API keys, a public key which allows GET requests and an admin key which allows POST and DELETE requests. The frontend uses google for authentication but also requires you to be a full or group admin in the directory service itself.

## Groups

Groups (or User Groups) are just collections of people. You can either assign a user to an existing group by selecting the group from the dropdown, or you can create a new group by entering a unique name into the Group Name field. You can also add contact information for a new group directly from this screen.

![Alt text](img/groups.jpg?raw=true "Groups interface")

## Contacts

While contact entries can be arbitrary, the intent currently is to use them to tie together users or groups to notification methods.

![Alt text](img/contacts.jpg?raw=true "Contacts interface")

## Permissions

Permissions are tied to groups and query-able by a service and an action. The keyword “all” is special and will match on any query; think of it as a wildcard query. Permissions also have a special field service_action which is a composite key used with the DELETE and GET methods to ensure you’re interacting with the correct thing.

![Alt text](img/permissions.jpg?raw=true "Permissions interface")

# Directory Service Administration

- Service Admins - allowed to do all the things
- Group admins - allowed to manage members of any groups they’re members of

If you’re a global admin, you will have access to the admin management interface giving you the ability to add new global and group admins.

![Alt text](img/admin.jpg?raw=true "Admin interface")
