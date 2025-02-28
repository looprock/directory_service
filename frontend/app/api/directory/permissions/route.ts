import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

const API_URL = process.env.API_URL;
const API_KEY = process.env.ADMIN_API_KEY;

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupName = searchParams.get('group_name');
  const service = searchParams.get('service');
  const serviceAction = searchParams.get('service_action');

  try {
    let queryString = '';
    if (groupName) queryString = `?group_name=${groupName}`;
    else if (service) queryString = `?service=${service}`;
    else if (serviceAction) queryString = `?service_action=${serviceAction}`;

    const response = await fetch(`${API_URL}/v1/permissions${queryString}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY!,
      },
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Permission fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  try {
    const response = await fetch(`${API_URL}/v1/admin/permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY!,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create permission', details: error }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  console.log('DELETE handler called with URL:', request.url);
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupName = searchParams.get('group_name');
  const serviceAction = searchParams.get('service_action');

  if (!groupName || !serviceAction) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${API_URL}/v1/admin/permissions?group_name=${encodeURIComponent(groupName)}&service_action=${encodeURIComponent(serviceAction)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY!
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Permission deletion error response:', errorData);
      return NextResponse.json(errorData, { status: response.status });
    }
    
    const data = await response.json();
    console.log('Permission deletion response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Permission deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete permission' }, { status: 500 });
  }
} 