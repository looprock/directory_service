# API

This is the api for directory_service. It used terraform/opentofu to create the main components:
- dynamodb tables
- api gateway
- lambda

Though there are many dependencies it also sets up. 

**Note:** This is pretty crumby setup/code. I'm a little embarrassed tbh but also don't have a lot of time and energy for cleanup so in that vein I'm not going to let the perfect be the enemy of the good. Your mileage may vary.

# Known issues

TF needs to be run twice to complete the initial setup. Probably an issue with a complete lack of depends_on statements.

# Configuration

There isn't much to configure. You should be able to run it without any variables to get a general setup. If you want to use a custom domain you can update the empy variables in _variables.tf.

# Outputs

## API URL

You will get the URL from the output when you run terraform, similar to:

```
12:49:55.503 STDOUT terraform: admin_api_key = <sensitive>
12:49:55.503 STDOUT terraform: api_url = "https://ikoikoia.execute-api.us-east-1.amazonaws.com/multi-tenant"
12:49:55.504 STDOUT terraform: dynamodb_tables = {
12:49:55.504 STDOUT terraform:   "group_permissions" = "group-permissions"
12:49:55.504 STDOUT terraform:   "user_groups" = "user-groups"
12:49:55.504 STDOUT terraform: }
12:49:55.504 STDOUT terraform: public_api_key = <sensitive>
```

## API Keys

You can get the api keys via:

```
AWS_PROFILE=re-shared aws apigateway get-api-keys \
    --include-values \
    --query "items[?name.starts_with(@, 'directory-service')].{Name:name,Value:value}" \
    --output table
```
This will generate output similar to below (minus the info in the values column):

```
------------------------------------------------------------------------------
|                                 GetApiKeys                                 |
+-------------------------------+--------------------------------------------+
|             Name              |                   Value                    |
+-------------------------------+--------------------------------------------+
|  directory-service-public-key |  dnmDP6MVcQiHwI8h0L1MVah6QPUUwUdO4RPGMeZn0 |
|  directory-service-admin-key  |  US0uA9L2fpZS4c4EAt5Y4IWPdJq0inrEpw2vos4Ht |
|  directory-service-key        |  hO3cz5kmGseioOFLY9zm8xxxNtb6rJKQoWP0dyxgI |
+-------------------------------+--------------------------------------------+
```

* directory-service-public-key - you can use this key for read-only operations
* directory-service-admin-key - use this key for write operations and the frontend service
* directory-service-key - don't use. This is for internal service use

# Examples

```
export DIR_SVC_API_BASE_URL="https://ikoikoia.execute-api.us-east-1.amazonaws.com/global"
export ADMIN_DIR_SVC_API_KEY='US0uA9L2fpZS4c4EAt5Y4IWPdJq0inrEpw2vos4Ht'
export PUBLIC_DIR_SVC_API_KEY='dnmDP6MVcQiHwI8h0L1MVah6QPUUwUdO4RPGMeZn0'

# create a lookup reference showing product_managers can approve production pipelines
curl -X POST "${DIR_SVC_API_BASE_URL}/v1/admin/permissions" \
-H "x-api-key: ${ADMIN_DIR_SVC_API_KEY}" \
-H "Content-Type: application/json" \
-d '{
    "group_name": "product_managers",
    "service": "api-shared-pipeline",
    "action": "ProductionApproval"
}'

# trusted devs can do any action against a pipeline
curl -X POST "${DIR_SVC_API_BASE_URL}/v1/admin/permissions" \
-H "x-api-key: ${ADMIN_DIR_SVC_API_KEY}" \
-H "Content-Type: application/json" \
-d '{
    "group_name": "trusted_devs",
    "service": "api-shared-pipeline",
    "action": "all"
}'

# john is a member of platform engineers
curl -X POST "${DIR_SVC_API_BASE_URL}/v1/admin/users" \
-H "x-api-key: ${ADMIN_DIR_SVC_API_KEY}" \
-H "Content-Type: application/json" \
-d '{
    "user_id": "john@my.com",
    "group_name": "platform_engineers"
}'

# platform engineers can be reached on slack at '#platform_eng'
curl -X POST "${DIR_SVC_API_BASE_URL}/v1/admin/contacts" \
-H "x-api-key: ${ADMIN_DIR_SVC_API_KEY}" \
-H "Content-Type: application/json" \
-d '{
    "target": "platform_engineers",
    "type": "slack",
    "data": "#platform_eng"
}'

# platform engineers can be reached on pagerDuty at 'usaa-platform-eng'
curl -X POST "${DIR_SVC_API_BASE_URL}/v1/admin/contacts" \
-H "x-api-key: ${ADMIN_DIR_SVC_API_KEY}" \
-H "Content-Type: application/json" \
-d '{
    "target": "platform_engineers",
    "type": "pagerduty",
    "data": "usaa-platform-eng"
}'

# list all project_manager permissions
curl -s -X GET "${DIR_SVC_API_BASE_URL}/v1/permissions?group_name=product_managers" \
-H "x-api-key: ${PUBLIC_DIR_SVC_API_KEY}" | jq '.'

# list all permissions for service api-shared-pipeline
curl -s -X GET "${DIR_SVC_API_BASE_URL}/v1/permissions?service=api-shared-pipeline" \
-H "x-api-key: ${PUBLIC_DIR_SVC_API_KEY}" | jq '.'

# list everyone in the platform_engineers group
curl -s -X GET "${DIR_SVC_API_BASE_URL}/v1/users?group_name=platform_engineers" \
-H "x-api-key: ${PUBLIC_DIR_SVC_API_KEY}" | jq '.'

# list all the contact information for platfrom_engineers
curl -s "${DIR_SVC_API_BASE_URL}/v1/contacts?target=platform_engineers" \
-H "x-api-key: ${PUBLIC_DIR_SVC_API_KEY}" | jq '.'

# delete permission for platform_engineers to do production approvals on service api-shared-pipeline
curl -X DELETE "${DIR_SVC_API_BASE_URL}/v1/admin/permissions?group_name=platform_engineers&service_action=api-shared-pipeline%23ProductionApproval" -H "x-api-key: ${ADMIN_DIR_SVC_API_KEY}"

# give platform_engineers godmode permissions (they will bascially show up on all permissions lists)
curl -X POST "${DIR_SVC_API_BASE_URL}/v1/admin/permissions" \
-H "x-api-key: ${ADMIN_DIR_SVC_API_KEY}" \
-H "Content-Type: application/json" \
-d '{
    "group_name": "platform_engineers",
    "service": "all",
    "action": "all"
}'

# grant admin@my.com full management access to the frontend
curl -X POST "${DIR_SVC_API_BASE_URL}/v1/admin/users" \
-H "x-api-key: ${ADMIN_DIR_SVC_API_KEY}" \
-H "Content-Type: application/json" \
-d '{
    "user_id": "admin@my.com",
    "group_name": "directory_service_admins"
}'
```