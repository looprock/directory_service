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
  const target = searchParams.get('target');

  try {
    const response = await fetch(`${API_URL}/v1/contacts${target ? `?target=${target}` : ''}`, {
      headers: {
        'x-api-key': API_KEY!,
      },
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts', details: error }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    const body = await request.json();
    console.log('Contact creation request body:', body);
  
    try {
      const response = await fetch(`${API_URL}/v1/admin/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY!
        },
        body: JSON.stringify({
          ...body,
          created_by: session.user?.email
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        return NextResponse.json(errorData, { status: response.status });
      }
      
      const data = await response.json();
      console.log('Contact creation response:', data);
      return NextResponse.json(data);
    } catch (error) {
      console.error('Contact creation error:', error);
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
    }
  }
  
  export async function DELETE(request: NextRequest) {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    console.log('DELETE handler called with URL:', request.url);
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target');
    const type = searchParams.get('type');
  
    if (!target || !type) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
  
    try {
      const response = await fetch(`${API_URL}/v1/admin/contacts?target=${target}&type=${type}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY!
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Contact deletion error response:', errorData);
        return NextResponse.json(errorData, { status: response.status });
      }
      
      const data = await response.json();
      console.log('Contact deletion response:', data);
      return NextResponse.json(data);
    } catch (error) {
      console.error('Contact deletion error:', error);
      return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
    }
  } 