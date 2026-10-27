import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import {
  auth,
  db,
  googleSignIn,
  logout,
  getAccessToken,
  handleFirestoreError,
  OperationType
} from '../services/firebase';
import {
  GoogleContact,
  fetchGoogleContacts,
  createGoogleContact,
  deleteGoogleContact,
  CreateContactInput
} from '../services/contacts';
import { DestructiveActionModal } from './DestructiveActionModal';
import {
  Users,
  UserPlus,
  Trash2,
  Send,
  Sparkles,
  Search,
  RefreshCw,
  LogOut,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  BookmarkCheck,
  Play,
  Database
} from 'lucide-react';

interface SavedMessage {
  id: string;
  userId: string;
  recipientName: string;
  recipientEmail?: string;
  originalText: string;
  aslGloss: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactsPanelProps {
  currentUser: User | null;
  onSendToTranslator: (text: string, recipientName: string) => void;
  onFingerspellName: (name: string) => void;
  onPlayGloss: (gloss: string) => void;
}

export const ContactsPanel: React.FC<ContactsPanelProps> = ({
  currentUser,
  onSendToTranslator,
  onFingerspellName,
  onPlayGloss
}) => {
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Firestore Saved Messages
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'contacts' | 'saved'>('contacts');

  // Add Contact Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGivenName, setNewGivenName] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Confirmation Modals (Mandatory for Workspace mutations)
  const [pendingDeleteContact, setPendingDeleteContact] = useState<GoogleContact | null>(null);
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [isDeletingContact, setIsDeletingContact] = useState(false);

  // Fetch Google Contacts
  const loadContacts = async () => {
    const token = await getAccessToken();
    if (!token) return;

    setIsTransacting(true);
    setIsLoadingContacts(true);
    setErrorMessage(null);
    try {
      const list = await fetchGoogleContacts(token);
      setContacts(list);
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
      setErrorMessage(err.message || 'Failed to load Google Contacts.');
    } finally {
      setIsLoadingContacts(false);
      setIsTransacting(false);
    }
  };

  const [isTransacting, setIsTransacting] = useState(false);

  // Auth State and Initial Load
  useEffect(() => {
    if (currentUser) {
      loadContacts();

      // Listen to Firestore saved messages
      const messagesPath = `users/${currentUser.uid}/savedMessages`;
      const unsubscribe = onSnapshot(
        collection(db, 'users', currentUser.uid, 'savedMessages'),
        snapshot => {
          const msgs: SavedMessage[] = [];
          snapshot.forEach(docSnap => {
            msgs.push(docSnap.data() as SavedMessage);
          });
          setSavedMessages(msgs);
        },
        error => {
          handleFirestoreError(error, OperationType.GET, messagesPath);
        }
      );

      return () => unsubscribe();
    } else {
      setContacts([]);
      setSavedMessages([]);
    }
  }, [currentUser]);

  // Handle Google Login
  const handleLogin = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        // Save user profile in Firestore
        const userDocRef = doc(db, 'users', result.user.uid);
        const now = new Date().toISOString();
        await setDoc(
          userDocRef,
          {
            userId: result.user.uid,
            displayName: result.user.displayName || 'POLYGLOT User',
            email: result.user.email || '',
            photoURL: result.user.photoURL || '',
            createdAt: now,
            updatedAt: now
          },
          { merge: true }
        );
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setErrorMessage(err.message || 'Google Sign-In failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Create Contact Handler with Explicit Confirmation
  const handleConfirmCreateContact = async () => {
    const token = await getAccessToken();
    if (!token) {
      setErrorMessage('Missing access token. Please sign in again.');
      return;
    }

    if (!newGivenName.trim()) {
      setErrorMessage('Please enter a name for the new contact.');
      return;
    }

    setIsCreatingContact(true);
    setErrorMessage(null);
    try {
      const created = await createGoogleContact(token, {
        givenName: newGivenName.trim(),
        familyName: newFamilyName.trim() || undefined,
        email: newEmail.trim() || undefined,
        phone: newPhone.trim() || undefined
      });

      setContacts(prev => [created, ...prev]);
      setIsAddModalOpen(false);
      setNewGivenName('');
      setNewFamilyName('');
      setNewEmail('');
      setNewPhone('');
    } catch (err: any) {
      console.error('Error creating contact:', err);
      setErrorMessage(err.message || 'Failed to create Google Contact.');
    } finally {
      setIsCreatingContact(false);
    }
  };

  // Delete Contact Handler with Explicit Confirmation
  const handleConfirmDeleteContact = async () => {
    if (!pendingDeleteContact) return;
    const token = await getAccessToken();
    if (!token) return;

    setIsDeletingContact(true);
    try {
      await deleteGoogleContact(token, pendingDeleteContact.resourceName);
      setContacts(prev => prev.filter(c => c.resourceName !== pendingDeleteContact.resourceName));
      setPendingDeleteContact(null);
    } catch (err: any) {
      console.error('Error deleting contact:', err);
      setErrorMessage(err.message || 'Failed to delete contact.');
    } finally {
      setIsDeletingContact(false);
    }
  };

  // Delete Saved Message from Firestore
  const handleDeleteSavedMessage = async (msgId: string) => {
    if (!currentUser) return;
    const path = `users/${currentUser.uid}/savedMessages/${msgId}`;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'savedMessages', msgId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const filteredContacts = contacts.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  // Render Unauthenticated State
  if (!currentUser) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Users className="w-7 h-7" />
        </div>
        <div className="max-w-sm space-y-1.5">
          <h2 className="text-base font-bold text-white tracking-tight">
            Connect Google Contacts
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Link your Google account to access Contacts, fingerspell contact names with the 3D avatar, and save ASL greetings in Firebase.
          </p>
        </div>

        {/* Official Google Sign-In Styled Button */}
        <button
          onClick={handleLogin}
          disabled={isSigningIn}
          className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
        </button>

        {errorMessage && (
          <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 px-3 py-1.5 rounded-lg">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  // Render Authenticated State
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'User'}
              className="w-9 h-9 rounded-full border border-indigo-500/40"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              {currentUser.displayName?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <h2 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
              {currentUser.displayName || 'Google Account'}
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded font-normal flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
              {currentUser.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400">
            <Database className="w-3 h-3 text-indigo-400" />
            <span>Firestore Synced</span>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 transition-colors"
            title="Sign out of Google"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub Tabs: Contacts vs Saved ASL Messages */}
      <div className="px-4 pt-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('contacts')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'contacts'
                ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Google Contacts ({contacts.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('saved')}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'saved'
                ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Saved ASL Messages ({savedMessages.length})</span>
          </button>
        </div>

        {activeSubTab === 'contacts' && (
          <div className="flex items-center gap-1.5 pb-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Contact</span>
            </button>
            <button
              onClick={loadContacts}
              disabled={isLoadingContacts}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Google Contacts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingContacts ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="p-4 space-y-3">
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* TAB 1: GOOGLE CONTACTS */}
        {activeSubTab === 'contacts' && (
          <>
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contacts by name, email, or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Contacts List */}
            {isLoadingContacts ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Loading Google Contacts...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <p>No contacts found.</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold"
                >
                  Create your first contact
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {filteredContacts.map(contact => (
                  <div
                    key={contact.resourceName}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {contact.photoUrl ? (
                        <img
                          src={contact.photoUrl}
                          alt={contact.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-800 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {contact.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          {contact.email && (
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <Mail className="w-2.5 h-2.5 text-slate-500" />
                              {contact.email}
                            </span>
                          )}
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-slate-500" />
                              {contact.phone}
                            </span>
                          )}
                          {contact.organization && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Building className="w-2.5 h-2.5 text-slate-500" />
                              {contact.organization}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for Contact */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Fingerspell Name on Avatar */}
                      <button
                        onClick={() => onFingerspellName(contact.givenName || contact.name)}
                        className="px-2 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-[11px] font-mono font-medium transition-colors cursor-pointer"
                        title={`Fingerspell "${contact.givenName || contact.name}" with 3D avatar`}
                      >
                        #{contact.givenName?.toUpperCase().slice(0, 8)}
                      </button>

                      {/* Compose ASL Message for Contact */}
                      <button
                        onClick={() => {
                          const greeting = `Hello ${contact.givenName || contact.name}! Nice to meet you. How are you today?`;
                          onSendToTranslator(greeting, contact.name);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 transition-colors cursor-pointer"
                        title={`Compose ASL greeting for ${contact.name}`}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Contact (Triggers Confirmation Dialog) */}
                      <button
                        onClick={() => setPendingDeleteContact(contact)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                        title={`Delete ${contact.name} from Google Contacts`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 2: SAVED ASL MESSAGES (FIRESTORE) */}
        {activeSubTab === 'saved' && (
          <div className="space-y-2">
            {savedMessages.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                <BookmarkCheck className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p>No saved ASL contact messages yet.</p>
                <p className="text-[11px] text-slate-500">
                  Translate a message in the translator panel and click "Save to Firestore" to keep a permanent history.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {savedMessages.map(msg => (
                  <div
                    key={msg.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          To: {msg.recipientName}
                        </span>
                        {msg.category && (
                          <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded font-mono">
                            {msg.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300">"{msg.originalText}"</p>
                      <p className="text-[11px] font-mono text-indigo-400">
                        GLOSS: {msg.aslGloss}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onPlayGloss(msg.aslGloss)}
                        className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                        title="Replay this ASL translation with 3D avatar"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSavedMessage(msg.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                        title="Delete from Firestore"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Contact Modal with Form */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                Add New Google Contact
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newGivenName}
                    onChange={e => setNewGivenName(e.target.value)}
                    placeholder="e.g. Antony"
                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium">Last Name</label>
                  <input
                    type="text"
                    value={newFamilyName}
                    onChange={e => setNewFamilyName(e.target.value)}
                    placeholder="e.g. Miller"
                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium">Phone Number</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="+1 (555) 012-3456"
                  className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300">
              This action will save the contact to your official Google Contacts via the People API with permissions granted.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateContact}
                disabled={isCreatingContact || !newGivenName.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md cursor-pointer"
              >
                {isCreatingContact ? 'Creating...' : 'Save to Google Contacts'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Destructive Action Confirmation Modal for Contact Deletion */}
      <DestructiveActionModal
        isOpen={!!pendingDeleteContact}
        onClose={() => setPendingDeleteContact(null)}
        onConfirm={handleConfirmDeleteContact}
        title="Delete Google Contact"
        description={`Are you sure you want to permanently delete "${pendingDeleteContact?.name}" from your Google Contacts? This action cannot be undone.`}
        confirmLabel="Delete Contact"
        isDestructive={true}
        isLoading={isDeletingContact}
      />
    </div>
  );
};
