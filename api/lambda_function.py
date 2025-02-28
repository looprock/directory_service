import json
import os
from typing import Dict, List, Optional

import boto3
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

logger = Logger()
tracer = Tracer()
dynamodb = boto3.resource('dynamodb')

# Table names will be set via environment variables
GROUP_PERMISSIONS_TABLE = os.environ.get('GROUP_PERMISSIONS_TABLE', 'group-permissions')
USER_GROUPS_TABLE = os.environ.get('USER_GROUPS_TABLE', 'user-groups')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key'
}

def handle_request(http_method: str, path: str, event: Dict) -> Dict:
    """Handle incoming API Gateway requests"""
    # Extract path parts, removing empty strings
    path_parts = [p for p in path.split('/') if p]
    
    # Validate path has at least v1 prefix
    if not path_parts or path_parts[0] != 'v1':
        return {
            'statusCode': 404,
            'headers': CORS_HEADERS,  # Add CORS headers
            'body': json.dumps({'error': 'Invalid path - must start with /v1'})
        }
    
    # Remove v1 prefix
    path_parts = path_parts[1:]
    
    # Handle documentation endpoint
    if path_parts and path_parts[0] == 'docs':
        if http_method == 'GET':
            docs_response = generate_openapi_docs()
            docs_response['headers'] = CORS_HEADERS  # Add CORS headers
            return docs_response
    
    # Handle admin routes
    if path_parts and path_parts[0] == 'admin':
        if len(path_parts) < 2:
            return {
                'statusCode': 404,
                'headers': CORS_HEADERS,  # Add CORS headers
                'body': json.dumps({'error': 'Invalid admin path'})
            }
        admin_response = handle_admin_route(path_parts[1], http_method, event)
        admin_response['headers'] = CORS_HEADERS  # Add CORS headers
        return admin_response
    
    # Handle public routes
    if not path_parts:
        return {
            'statusCode': 404,
            'headers': CORS_HEADERS,  # Add CORS headers
            'body': json.dumps({'error': 'Invalid path'})
        }
        
    if path_parts[0] == 'permissions':
        if http_method == 'GET':
            return get_permissions(event.get('queryStringParameters'))
    elif path_parts[0] == 'users':
        if http_method == 'GET':
            params = event.get('queryStringParameters', {})
            if params is None:
                params = {}
            response = get_user_groups(params)
            response['headers'] = CORS_HEADERS  # Add CORS headers
            return response
    elif path_parts[0] == 'contacts':
        if http_method == 'GET':
            contacts_response = get_contact(event.get('queryStringParameters'))
            contacts_response['headers'] = CORS_HEADERS  # Add CORS headers
            return contacts_response
            
    return {
        'statusCode': 404,
        'headers': CORS_HEADERS,  # Add CORS headers
        'body': json.dumps({'error': 'Invalid path or method'})
    }

@tracer.capture_lambda_handler
@logger.inject_lambda_context
def lambda_handler(event: Dict, context: LambdaContext) -> Dict:
    """
    Main Lambda handler for the Directory Service
    """
    # Handle OPTIONS requests first
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': ''
        }
    
    try:
        http_method = event['httpMethod']
        path = event['path']
        
        # Common response headers
        headers = {
            'Content-Type': 'application/json',
            'X-API-Version': os.environ.get('API_VERSION', '1.0.0')
        }
        
        response = handle_request(http_method, path, event)
        response['headers'] = {**response.get('headers', {}), **headers}
        
        # Ensure CORS headers are added to the response
        if 'headers' not in response:
            response['headers'] = {}
        response['headers'].update(CORS_HEADERS)
        
        return response
        
    except Exception as e:
        logger.exception('Error processing request')
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }

def handle_admin_route(path: str, http_method: str, event: Dict) -> Dict:
    """Handle admin routes that require API key"""
    if path == 'permissions':
        if http_method == 'POST':
            return create_permission(json.loads(event['body']))
        elif http_method == 'DELETE':
            return delete_permission(event['queryStringParameters'])
    elif path == 'users':
        if http_method == 'POST':
            return assign_user_to_group(json.loads(event['body']))
        elif http_method == 'DELETE':
            return remove_user_from_group(event['queryStringParameters'])
    elif path == 'contacts':
        if http_method == 'POST':
            return create_contact(json.loads(event['body']))
        elif http_method == 'DELETE':
            return delete_contact(event['queryStringParameters'])
    
    return {
        'statusCode': 400,
        'body': json.dumps({'error': 'Invalid admin path or method'})
    }

def create_permission(body: Dict) -> Dict:
    """Create a new permission for a group"""
    table = dynamodb.Table(GROUP_PERMISSIONS_TABLE)
    
    try:
        table.put_item(
            Item={
                'group_name': body['group_name'],
                'service_action': f"{body['service']}#{body['action']}",
                'service': body['service'],
                'action': body['action']
            },
            ConditionExpression='attribute_not_exists(group_name) AND attribute_not_exists(service_action)'
        )
        return {
            'statusCode': 201,
            'body': json.dumps({'message': 'Permission created successfully'})
        }
    except boto3.client('dynamodb').exceptions.ConditionalCheckFailedException:
        return {
            'statusCode': 409,
            'body': json.dumps({'error': 'Permission already exists'})
        }
    except Exception as e:
        logger.error(f"Error creating permission: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_permissions(params: Optional[Dict]) -> Dict:
    """Get permissions based on query parameters"""
    table = dynamodb.Table(GROUP_PERMISSIONS_TABLE)

    try:
        if not params:
            # Return all permissions
            response = table.scan()
            return {
                'statusCode': 200,
                'body': json.dumps(response['Items'])
            }

        if 'group_name' in params:
            response = table.query(
                KeyConditionExpression='group_name = :group_name',
                ExpressionAttributeValues={':group_name': params['group_name']}
            )
        elif 'action' in params and 'service' in params:
            responses = []
            service_action = f"{params['service']}#{params['action']}"
            service_action_all = f"{params['service']}#all"
            all_services_action = f"all#{params['action']}"
            all_all = f"all#all"
            
            # Query for exact match
            exact_match = table.query(
                IndexName='ServiceActionIndex',
                KeyConditionExpression='service_action = :service_action',
                ExpressionAttributeValues={
                    ':service_action': service_action
                }
            )
            responses.extend(exact_match.get('Items', []))

            # Query for service entries with action='all'
            exact_match = table.query(
                IndexName='ServiceActionIndex',
                KeyConditionExpression='service_action = :service_action',
                ExpressionAttributeValues={
                    ':service_action': service_action_all
                }
            )
            responses.extend(exact_match.get('Items', []))
            
            # Query for action entservice='all'
            all_service = table.scan(
                FilterExpression='service = :all_service',
                ExpressionAttributeValues={
                    ':all_service': all_services_action
                }
            )
            responses.extend(all_service.get('Items', []))
            
            # Query for service_action='all#all'
            all_action = table.query(
                IndexName='ServiceActionIndex',
                KeyConditionExpression='service_action = :all_action',
                ExpressionAttributeValues={
                    ':all_action': all_all
                }
            )
            responses.extend(all_action.get('Items', []))
            
            # Remove duplicates based on group_name
            seen = set()
            unique_responses = []
            for item in responses:
                if item['group_name'] not in seen:
                    seen.add(item['group_name'])
                    unique_responses.append(item)
            
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps(unique_responses)
            }

        elif 'service' in params:
            responses = []

            # Query for specific service
            service_match = table.query(
                IndexName='ServiceIndex',
                KeyConditionExpression='service = :service',
                ExpressionAttributeValues={':service': params['service']}
            )
            responses.extend(service_match.get('Items', []))

            # Query for service='all'
            all_service = table.scan(
                FilterExpression='service = :all_service',
                ExpressionAttributeValues={
                    ':all_service': 'all'
                }
            )
            responses.extend(all_service.get('Items', []))

            # Remove duplicates based on group_name
            seen = set()
            unique_responses = []
            for item in responses:
                if item['group_name'] not in seen:
                    seen.add(item['group_name'])
                    unique_responses.append(item)

            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps(unique_responses)
            }

        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid query parameters. Use group_name, service_action with service, or service'})
            }

        return {
            'statusCode': 200,
            'body': json.dumps(response['Items'])
        }
    except Exception as e:
        logger.error(f"Error getting permissions: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }

def delete_permission(params: Optional[Dict]) -> Dict:
    """Delete a permission for a group"""
    if not params or 'group_name' not in params or 'service_action' not in params:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'group_name and service_action are required'})
        }

    table = dynamodb.Table(GROUP_PERMISSIONS_TABLE)

    try:
        # Use delete_item with ReturnValues to check if item existed
        response = table.delete_item(
            Key={
                'group_name': params['group_name'],
                'service_action': params['service_action']
            },
            ReturnValues='ALL_OLD'  # This will return the deleted item if it existed
        )

        # Check if an item was actually deleted
        if 'Attributes' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Permission not found'})
            }

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Permission deleted successfully'})
        }
    except Exception as e:
        logger.error(f"Error deleting permission: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def assign_user_to_group(body: Dict) -> Dict:
    """Assign a user to a group"""
    table = dynamodb.Table(USER_GROUPS_TABLE)
    
    try:
        table.put_item(
            Item={
                'user_id': body['user_id'],
                'group_name': body['group_name']
            },
            ConditionExpression='attribute_not_exists(user_id) AND attribute_not_exists(group_name)'
        )
        return {
            'statusCode': 201,
            'body': json.dumps({'message': 'User assigned to group successfully'})
        }
    except boto3.client('dynamodb').exceptions.ConditionalCheckFailedException:
        return {
            'statusCode': 409,
            'body': json.dumps({'error': 'User is already assigned to this group'})
        }
    except Exception as e:
        logger.error(f"Error assigning user to group: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_user_groups(params: Optional[Dict]) -> Dict:
    """Get groups for a user"""
    table = dynamodb.Table(USER_GROUPS_TABLE)
    
    try:
        if params is None:
            params = {}
            
        if not params:
            # Return all users and their groups
            response = table.scan()
            items = response.get('Items', [])  # Use get() with default empty list
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,  # Add CORS headers
                'body': json.dumps(items)
            }
        
        if 'user_id' in params:
            response = table.query(
                KeyConditionExpression='user_id = :user_id',
                ExpressionAttributeValues={':user_id': params['user_id']}
            )
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps(response.get('Items', []))
            }
        elif 'group_name' in params:
            return get_users_by_group(params)
        else:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Invalid parameters'})
            }
            
    except Exception as e:
        logger.error(f"Error getting user groups: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }

def remove_user_from_group(params: Optional[Dict]) -> Dict:
    """Remove a user from a group"""
    if not params or 'user_id' not in params or 'group_name' not in params:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'user_id and group_name are required'})
        }
    
    table = dynamodb.Table(USER_GROUPS_TABLE)
    
    try:
        table.delete_item(
            Key={
                'user_id': params['user_id'],
                'group_name': params['group_name']
            }
        )
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'User removed from group successfully'})
        }
    except Exception as e:
        logger.error(f"Error removing user from group: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_permissions_by_service_action(params: Optional[Dict]) -> Dict:
    """Get permissions by service_action"""
    if not params or 'service_action' not in params:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'service_action is required'})
        }
    
    table = dynamodb.Table(GROUP_PERMISSIONS_TABLE)
    service_action = params['service_action']
    
    try:
        response = table.query(
            IndexName='ServiceActionIndex',
            KeyConditionExpression='service_action = :service_action',
            ExpressionAttributeValues={':service_action': service_action}
        )
        return {
            'statusCode': 200,
            'body': json.dumps(response['Items'])
        }
    except Exception as e:
        logger.error(f"Error getting permissions by service_action: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_permissions_by_service(params: Optional[Dict]) -> Dict:
    """Get permissions by service"""
    if not params or 'service' not in params:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'service is required'})
        }
    
    table = dynamodb.Table(GROUP_PERMISSIONS_TABLE)
    service = params['service']
    
    try:
        response = table.query(
            IndexName='ServiceIndex',
            KeyConditionExpression='service = :service',
            ExpressionAttributeValues={':service': service}
        )
        return {
            'statusCode': 200,
            'body': json.dumps(response['Items'])
        }
    except Exception as e:
        logger.error(f"Error getting permissions by service: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_users_by_group(params: Optional[Dict]) -> Dict:
    """Get users by group name"""
    if not params or 'group_name' not in params:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'group_name is required'})
        }
    
    table = dynamodb.Table(USER_GROUPS_TABLE)
    group_name = params['group_name']
    
    try:
        response = table.query(
            IndexName='GroupNameIndex',
            KeyConditionExpression='group_name = :group_name',
            ExpressionAttributeValues={':group_name': group_name}
        )
        return {
            'statusCode': 200,
            'body': json.dumps(response['Items'])
        }
    except Exception as e:
        logger.error(f"Error getting users by group: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def create_contact(body: Dict) -> Dict:
    """Create or update contact information"""
    table = dynamodb.Table(os.environ['CONTACT_INFO_TABLE'])
    
    try:
        table.put_item(
            Item={
                'target': body['target'],
                'type': body['type'],
                'data': body['data']
            },
            ConditionExpression='attribute_not_exists(target) AND attribute_not_exists(#type)',
            ExpressionAttributeNames={
                '#type': 'type'
            }
        )
        return {
            'statusCode': 201,
            'body': json.dumps({'message': 'Contact information created successfully'})
        }
    except boto3.client('dynamodb').exceptions.ConditionalCheckFailedException:
        return {
            'statusCode': 409,
            'body': json.dumps({'error': 'Contact information already exists for this target and type'})
        }
    except Exception as e:
        logger.error(f"Error creating contact information: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_contact(params: Optional[Dict]) -> Dict:
    """Get contact information by target"""
    table = dynamodb.Table(os.environ['CONTACT_INFO_TABLE'])
    
    try:
        if not params or 'target' not in params:
            # Return all contacts
            response = table.scan()
            return {
                'statusCode': 200,
                'body': json.dumps(response['Items'])
            }
        
        target = params['target']
        if 'type' in params:
            # Query for specific target and type
            response = table.get_item(
                Key={
                    'target': target,
                    'type': params['type']
                }
            )
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': 'Contact information not found'})
                }
            # Return single item as a list
            return {
                'statusCode': 200,
                'body': json.dumps([response['Item']])
            }
        else:
            # Query all types for target
            response = table.query(
                KeyConditionExpression='target = :target',
                ExpressionAttributeValues={':target': target}
            )
            if not response['Items']:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': 'Contact information not found'})
                }
            return {
                'statusCode': 200,
                'body': json.dumps(response['Items'])
            }
    except Exception as e:
        logger.error(f"Error getting contact information: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def delete_contact(params: Optional[Dict]) -> Dict:
    """Delete contact information"""
    if not params or 'target' not in params or 'type' not in params:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'target and type are required'})
        }
    
    table = dynamodb.Table(os.environ['CONTACT_INFO_TABLE'])
    
    try:
        table.delete_item(
            Key={
                'target': params['target'],
                'type': params['type']
            }
        )
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Contact information deleted successfully'})
        }
    except Exception as e:
        logger.error(f"Error deleting contact information: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def generate_openapi_docs() -> Dict:
    """Generate OpenAPI documentation"""
    openapi_spec = {
        "openapi": "3.0.0",
        "info": {
            "title": "Directory Service API",
            "version": "1.0.0",
            "description": "A serverless directory service for managing user groups, permissions, and contact information"
        },
        "servers": [
            {
                "url": "{baseUrl}/v1",
                "variables": {
                    "baseUrl": {
                        "default": "https://api.example.com"  # This will be replaced dynamically
                    }
                }
            }
        ],
        "components": {
            "securitySchemes": {
                "apiKeyAuth": {
                    "type": "apiKey",
                    "in": "header",
                    "name": "x-api-key"
                }
            }
        },
        "paths": {
            "/permissions": {
                "get": {
                    "summary": "Get permissions",
                    "security": [{"apiKeyAuth": []}],
                    "parameters": [
                        {
                            "name": "group_name",
                            "in": "query",
                            "schema": {"type": "string"},
                            "description": "Filter by group name"
                        },
                        {
                            "name": "service_action",
                            "in": "query",
                            "schema": {"type": "string"},
                            "description": "Filter by service action"
                        },
                        {
                            "name": "service",
                            "in": "query",
                            "schema": {"type": "string"},
                            "description": "Filter by service"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Successful response",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "group_name": {"type": "string"},
                                                "service": {"type": "string"},
                                                "action": {"type": "string"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/admin/permissions": {
                "post": {
                    "summary": "Create permission",
                    "security": [{"apiKeyAuth": []}],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "group_name": {"type": "string"},
                                        "service": {"type": "string"},
                                        "action": {"type": "string"}
                                    },
                                    "required": ["group_name", "service", "action"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Permission created successfully"
                        }
                    }
                }
            }
            # Add other endpoints similarly...
        }
    }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps(openapi_spec)
    } 