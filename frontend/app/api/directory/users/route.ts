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
  const userId = searchParams.get('user_id');
  const groupName = searchParams.get('group_name');

  try {
    const response = await fetch(`${API_URL}/v1/users${userId ? `?user_id=${userId}` : groupName ? `?group_name=${groupName}` : ''}`, {
      headers: {
        'x-api-key': API_KEY!,
      },
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users', details: error }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    const body = await request.json();
  
    try {
      const response = await fetch(`${API_URL}/v1/admin/users`, {
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
      return NextResponse.json({ error: 'Failed to create user group', details: error }, { status: 500 });
    }
  }
  
  export async function DELETE(request: NextRequest) {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const groupName = searchParams.get('group_name');
  
    try {
      const response = await fetch(`${API_URL}/v1/admin/users?user_id=${userId}&group_name=${groupName}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': API_KEY!,
        },
      });
      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: 'Failed to delete user group', details: error }, { status: 500 });
    }
  } 