'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Contact, DirectoryService } from '@/lib/api';

const sanitizeInput = (value: string): string => {
  return value.replace(/[^a-zA-Z0-9_\-#@.]/g, '');
};

export default function ContactsPage() {
  const { data: session } = useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({
    target: '',
    type: '',
    data: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    target: string;
    type: string;
  }>({
    isOpen: false,
    target: '',
    type: ''
  });
  const [sortConfig, setSortConfig] = useState<{
    key: 'target' | 'type' | 'data' | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc'
  });

  useEffect(() => {
    if (session) {
      loadContacts();
    }
  }, [session]);

  const loadContacts = async () => {
    try {
      const data = await DirectoryService.getContacts();
      setContacts(data);
      setError(null);
    } catch (err) {
      setError('Failed to load contacts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await DirectoryService.createContact(newContact);
      setNewContact({ target: '', type: '', data: '' });
      await loadContacts();
      setError(null);
    } catch (err) {
      setError('Failed to create contact');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (target: string, type: string) => {
    setDeleteConfirm({
      isOpen: true,
      target,
      type
    });
  };

  const handleDeleteContact = async () => {
    setLoading(true);
    try {
      await DirectoryService.deleteContact(deleteConfirm.target, deleteConfirm.type);
      await loadContacts();
      setError(null);
    } catch (err) {
      setError('Failed to delete contact');
      console.error(err);
    } finally {
      setLoading(false);
      setDeleteConfirm({ isOpen: false, target: '', type: '' });
    }
  };

  const handleSort = (key: 'target' | 'type' | 'data') => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortedContacts = () => {
    if (!sortConfig.key) return contacts;

    return [...contacts].sort((a, b) => {
      if (!sortConfig.key) return 0;
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  if (!session) {
    return (
      <div className="text-center mt-12">
        <p className="text-lg">Please sign in to view contacts</p>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full">
      <div className="w-full py-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Contacts</h1>
          
          {/* Create Contact Form */}
          <div className="bg-gray-200 shadow rounded-lg p-6 mb-12">
            <h2 className="text-xl font-semibold mb-4">Create Contact</h2>
            <form onSubmit={handleCreateContact} className="grid grid-cols-[120px,1fr] gap-4 items-center max-w-2xl">
              <label className="text-sm font-medium">Target</label>
              <input
                type="text"
                value={newContact.target}
                onChange={(e) => setNewContact({...newContact, target: sanitizeInput(e.target.value)})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                required
              />
              <label className="text-sm font-medium">Type</label>
              <select
                value={newContact.type}
                onChange={(e) => setNewContact({...newContact, type: e.target.value})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                required
              >
                <option value="">Select type...</option>
                <option value="email">Email</option>
                <option value="pagerduty">PagerDuty</option>
                <option value="slack">Slack</option>
              </select>
              <label className="text-sm font-medium">Data</label>
              <input
                type="text"
                value={newContact.data}
                onChange={(e) => setNewContact({...newContact, data: sanitizeInput(e.target.value)})}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                required
              />
              <div className="col-span-2 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading ? 'Creating...' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="h-px my-12 bg-gray-400" />

          {/* Contacts List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-8 text-gray-500">Current Contacts</h2>
              {loading ? (
                <p className="text-gray-500">Loading contacts...</p>
              ) : contacts.length === 0 ? (
                <p className="text-gray-500">No contacts found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '400px' }} />
                      <col style={{ width: '200px' }} />
                      <col style={{ width: '400px' }} />
                      <col style={{ width: '200px' }} />
                    </colgroup>
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-16 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('target')}
                            className="flex items-center justify-center w-full mx-auto"
                          >
                            <span className="mx-auto flex items-center">
                              Target
                              {sortConfig.key === 'target' && (
                                <span className="ml-1">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </span>
                          </button>
                        </th>
                        <th scope="col" className="px-16 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('type')}
                            className="flex items-center justify-center w-full mx-auto"
                          >
                            <span className="mx-auto flex items-center">
                              Type
                              {sortConfig.key === 'type' && (
                                <span className="ml-1">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </span>
                          </button>
                        </th>
                        <th scope="col" className="px-16 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('data')}
                            className="flex items-center justify-center w-full mx-auto"
                          >
                            <span className="mx-auto flex items-center">
                              Data
                              {sortConfig.key === 'data' && (
                                <span className="ml-1">
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </span>
                          </button>
                        </th>
                        <th scope="col" className="px-16 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getSortedContacts().map((contact) => (
                        <tr 
                          key={`${contact.target}-${contact.type}`}
                          className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                        >
                          <td className="px-16 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{contact.target}</td>
                          <td className="px-16 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{contact.type}</td>
                          <td className="px-16 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{contact.data}</td>
                          <td className="px-16 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            <button
                              onClick={() => confirmDelete(contact.target, contact.type)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Add Confirmation Dialog */}
          {deleteConfirm.isOpen && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete this contact? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: false, target: '', type: '' })}
                    className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteContact}
                    className="px-4 py-2 text-sm font-medium text-gray-900 bg-red-200 rounded-md hover:bg-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 